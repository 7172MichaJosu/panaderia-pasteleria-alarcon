import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { CartItem, Order, OrderNotification, OrderStatus, Product, ReportSummary } from "./types";

type DemoState = {
  products: Product[];
  orders: Order[];
  productId: number;
  orderId: number;
  notificationId: number;
};

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "demo-store.json");

const initialProducts: Product[] = [
  {
    id: 1,
    name: "Pan francés",
    description: "Pan crocante recién horneado, ideal para el desayuno familiar.",
    category: "Panes",
    price: 0.4,
    stock: 300,
    imageUrl: "/productos/pan-frances.jpg",
    isActive: true,
    createdAt: "2026-01-01T08:00:00.000Z"
  },
  {
    id: 2,
    name: "Torta de chocolate",
    description: "Torta húmeda de chocolate con crema especial para cumpleaños y reuniones.",
    category: "Tortas",
    price: 55,
    stock: 12,
    imageUrl: "/productos/torta-chocolate.jpg",
    isActive: true,
    createdAt: "2026-01-01T08:05:00.000Z"
  },
  {
    id: 3,
    name: "Empanada de pollo",
    description: "Empanada horneada con relleno de pollo, verduras y sazón de casa.",
    category: "Pasteles",
    price: 3.5,
    stock: 60,
    imageUrl: "/productos/empanada-pollo.jpg",
    isActive: true,
    createdAt: "2026-01-01T08:10:00.000Z"
  },
  {
    id: 4,
    name: "Jugo especial",
    description: "Bebida natural preparada al momento para acompañar tus pedidos.",
    category: "Fuente de soda",
    price: 7,
    stock: 40,
    imageUrl: "/productos/jugo-especial.jpg",
    isActive: true,
    createdAt: "2026-01-01T08:15:00.000Z"
  },
  {
    id: 5,
    name: "Queque marmoleado",
    description: "Queque suave de vainilla y chocolate, ideal para compartir.",
    category: "Queques",
    price: 18,
    stock: 15,
    imageUrl: "/productos/queque-marmoleado.jpg",
    isActive: true,
    createdAt: "2026-01-01T08:20:00.000Z"
  }
];

function initialState(): DemoState {
  return {
    products: initialProducts,
    orders: [],
    productId: initialProducts.length + 1,
    orderId: 1,
    notificationId: 1
  };
}

async function ensureStateFile() {
  await mkdir(dataDir, { recursive: true });
  if (!existsSync(dataFile)) {
    await writeFile(dataFile, JSON.stringify(initialState(), null, 2), "utf8");
  }
}

async function readState(): Promise<DemoState> {
  await ensureStateFile();
  const raw = await readFile(dataFile, "utf8");
  const parsed = JSON.parse(raw) as Partial<DemoState>;
  return {
    products: parsed.products || initialProducts,
    orders: parsed.orders || [],
    productId: parsed.productId || ((parsed.products || initialProducts).length + 1),
    orderId: parsed.orderId || 1,
    notificationId: parsed.notificationId || 1
  };
}

async function writeState(state: DemoState) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dataFile, JSON.stringify(state, null, 2), "utf8");
}

function startOfToday() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

export const demoStore = {
  async getProducts(activeOnly = false) {
    const state = await readState();
    return state.products.filter((p) => (activeOnly ? p.isActive : true));
  },

  async createProduct(input: Omit<Product, "id" | "createdAt">) {
    const state = await readState();
    const product: Product = { ...input, id: state.productId, createdAt: new Date().toISOString() };
    state.productId += 1;
    state.products.unshift(product);
    await writeState(state);
    return product;
  },

  async updateProduct(id: number, input: Partial<Product>) {
    const state = await readState();
    state.products = state.products.map((p) => (p.id === id ? { ...p, ...input } : p));
    await writeState(state);
    return state.products.find((p) => p.id === id) || null;
  },

  async createOrder(input: Omit<Order, "id" | "code" | "status" | "createdAt" | "total" | "notifications"> & { items: CartItem[] }) {
    const state = await readState();
    const total = input.items.reduce((sum, item) => sum + item.subtotal, 0);
    const order: Order = {
      ...input,
      id: state.orderId,
      code: `PED-${Date.now().toString().slice(-6)}`,
      status: "Registrado",
      total,
      notifications: [],
      createdAt: new Date().toISOString()
    };
    state.orderId += 1;
    state.orders.unshift(order);

    // Descuenta stock de manera simple en modo demo local.
    for (const item of input.items) {
      state.products = state.products.map((p) =>
        p.id === item.productId ? { ...p, stock: Math.max(0, p.stock - item.quantity) } : p
      );
    }

    await writeState(state);
    return order;
  },

  async getOrders() {
    const state = await readState();
    return state.orders;
  },

  async updateOrderStatus(id: number, status: OrderStatus) {
    const state = await readState();
    state.orders = state.orders.map((o) => (o.id === id ? { ...o, status } : o));
    await writeState(state);
    return state.orders.find((o) => o.id === id) || null;
  },

  async addOrderNotification(id: number, status: OrderStatus, message: string) {
    const state = await readState();
    const order = state.orders.find((o) => o.id === id);
    if (!order) return null;

    const notification: OrderNotification = {
      id: state.notificationId,
      orderId: id,
      status,
      channel: "WhatsApp",
      message,
      createdAt: new Date().toISOString()
    };

    state.notificationId += 1;
    state.orders = state.orders.map((o) =>
      o.id === id ? { ...o, status, notifications: [notification, ...(o.notifications || [])] } : o
    );
    await writeState(state);
    return state.orders.find((o) => o.id === id) || null;
  },

  async getReports(): Promise<ReportSummary> {
    const state = await readState();
    const orders = state.orders;
    const today = new Date();
    const startDay = startOfToday();
    const startWeek = new Date(today);
    startWeek.setDate(today.getDate() - 6);
    const startMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const sumSince = (date: Date) =>
      orders.filter((o) => new Date(o.createdAt) >= date && o.status !== "Cancelado").reduce((s, o) => s + o.total, 0);

    const statuses: OrderStatus[] = ["Registrado", "Confirmado", "En preparación", "En camino", "Listo para recoger", "Entregado", "Cancelado"];

    const dailySales = Array.from({ length: 7 }).map((_, index) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - index));
      const label = d.toLocaleDateString("es-PE", { weekday: "short" });
      const total = orders
        .filter((o) => new Date(o.createdAt).toDateString() === d.toDateString() && o.status !== "Cancelado")
        .reduce((s, o) => s + o.total, 0);
      return { name: label, total };
    });

    return {
      todayTotal: sumSince(startDay),
      weekTotal: sumSince(startWeek),
      monthTotal: sumSince(startMonth),
      totalOrders: orders.length,
      byStatus: statuses.map((st) => ({ name: st, value: orders.filter((o) => o.status === st).length })),
      byType: ["Pedido", "Reserva"].map((type) => ({ name: type, value: orders.filter((o) => o.orderType === type).length })),
      dailySales
    };
  }
};
