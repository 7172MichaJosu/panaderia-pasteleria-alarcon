export type Product = {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  imageUrl: string;
  isActive: boolean;
  createdAt?: string;
};

export type CartItem = {
  productId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  imageUrl?: string;
};

export type OrderStatus =
  | "Registrado"
  | "Confirmado"
  | "En preparación"
  | "En camino"
  | "Listo para recoger"
  | "Entregado"
  | "Cancelado";

export type OrderType = "Pedido" | "Reserva";

export type OrderNotification = {
  id: number;
  orderId: number;
  status: OrderStatus;
  channel: "WhatsApp";
  message: string;
  createdAt: string;
};

export type Order = {
  id: number;
  code: string;
  customerName: string;
  phone: string;
  address: string;
  orderType: OrderType;
  paymentMethod: string;
  deliveryDate: string | null;
  notes: string;
  status: OrderStatus;
  total: number;
  items: CartItem[];
  notifications?: OrderNotification[];
  createdAt: string;
};

export type ReportSummary = {
  todayTotal: number;
  weekTotal: number;
  monthTotal: number;
  totalOrders: number;
  byStatus: Array<{ name: string; value: number }>;
  byType: Array<{ name: string; value: number }>;
  dailySales: Array<{ name: string; total: number }>;
};
