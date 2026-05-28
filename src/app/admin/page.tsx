"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Order, OrderStatus, Product, ReportSummary } from "@/lib/types";

const statuses: OrderStatus[] = ["Registrado", "Confirmado", "En preparación", "En camino", "Listo para recoger", "Entregado", "Cancelado"];
const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL || "";
const businessName = process.env.NEXT_PUBLIC_BUSINESS_NAME || "Panadería Pastelería y fuente de soda Alarcón";
const businessAddress = process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || "Jr. Túpac Amaru s/n, esquina de la Plaza Principal, Pampa Cangallo, Ayacucho, Perú";
const logo = "/logo-alarcon.png";
const chartColors = ["#f59e0b", "#ea580c", "#84cc16", "#06b6d4", "#8b5cf6", "#22c55e", "#ef4444"];

type ProductForm = Omit<Product, "id" | "createdAt">;

const blankProduct: ProductForm = {
  name: "",
  description: "",
  category: "Panes",
  price: 0,
  stock: 0,
  imageUrl: "/productos/mi-producto.jpg",
  isActive: true
};

function isImageUrl(value?: string) {
  if (!value) return false;
  return /^(https?:\/\/|data:image\/|\/|.*\.(jpg|jpeg|png|webp|gif|svg)$)/i.test(value.trim());
}

function getBaseUrl() {
  if (configuredAppUrl) return configuredAppUrl.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

function absoluteImageUrl(value?: string) {
  if (!value) return "";
  if (value.startsWith("data:image/")) return "Imagen cargada en el sistema";
  if (value.startsWith("http")) return value;
  if (value.startsWith("/")) return `${getBaseUrl()}${value}`;
  return value;
}

function normalizeWhatsapp(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("51") && digits.length >= 11) return digits;
  if (digits.length === 9) return `51${digits}`;
  return digits;
}

function whatsappUrl(phone: string, text: string) {
  const params = new URLSearchParams({ text });
  return `https://wa.me/${normalizeWhatsapp(phone)}?${params.toString()}`;
}

function absoluteOrLocalImage(value?: string) {
  const url = absoluteImageUrl(value);
  return url && !url.startsWith("data:image/") ? url : "";
}

async function shareImageFile(imageUrl: string, text: string) {
  if (typeof navigator === "undefined" || !("share" in navigator)) return false;
  const url = absoluteOrLocalImage(imageUrl);
  if (!url) return false;

  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const extension = blob.type.includes("png") ? "png" : blob.type.includes("webp") ? "webp" : "jpg";
    const file = new File([blob], `producto-pedido.${extension}`, { type: blob.type || "image/jpeg" });
    const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
    if (nav.canShare && !nav.canShare({ files: [file] })) return false;
    await navigator.share({ title: businessName, text, files: [file] });
    return true;
  } catch {
    return false;
  }
}

function ProductVisual({ src, name, className = "" }: { src?: string; name: string; className?: string }) {
  if (isImageUrl(src)) {
    return <img src={src} alt={name} className={`h-full w-full object-cover ${className}`} />;
  }
  return <div className={`grid h-full w-full place-items-center text-4xl ${className}`}>{src || "🥐"}</div>;
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [login, setLogin] = useState({ username: "admin", password: "Admin123!" });
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reports, setReports] = useState<ReportSummary | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>(blankProduct);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<Record<number, OrderStatus>>({});
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((data) => {
        setAuthenticated(data.authenticated);
        if (data.authenticated) loadAdminData();
      })
      .finally(() => setChecking(false));
  }, []);

  async function loadAdminData() {
    const [productsRes, ordersRes, reportsRes] = await Promise.all([
      fetch("/api/products"),
      fetch("/api/orders"),
      fetch("/api/reports")
    ]);
    if (productsRes.ok) setProducts((await productsRes.json()).products || []);
    if (ordersRes.ok) {
      const data = await ordersRes.json();
      const loadedOrders: Order[] = data.orders || [];
      setOrders(loadedOrders);
      setSelectedStatuses((current) => {
        const next = { ...current };
        loadedOrders.forEach((order) => {
          next[order.id] = next[order.id] || order.status;
        });
        return next;
      });
    }
    if (reportsRes.ok) setReports((await reportsRes.json()).reports || null);
  }

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(login)
    });
    if (!res.ok) {
      const data = await res.json();
      setMessage(data.message || "No se pudo iniciar sesión");
      return;
    }
    setAuthenticated(true);
    loadAdminData();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
  }

  async function handleProductImage(file?: File) {
    if (!file) return;
    setUploading(true);
    setMessage("");
    const data = new FormData();
    data.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: data });
    const body = await res.json();
    setUploading(false);
    if (!res.ok) {
      setMessage(body.message || "No se pudo subir la imagen.");
      return;
    }
    setProductForm((current) => ({ ...current, imageUrl: body.url }));
    setMessage("Imagen cargada correctamente. Ahora guarda el producto.");
  }

  async function saveProduct(event: React.FormEvent) {
    event.preventDefault();
    const method = editingId ? "PATCH" : "POST";
    const url = editingId ? `/api/products/${editingId}` : "/api/products";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productForm)
    });
    if (!res.ok) {
      setMessage("No se pudo guardar el producto.");
      return;
    }
    setProductForm(blankProduct);
    setEditingId(null);
    setMessage("Producto guardado correctamente.");
    loadAdminData();
  }

  async function toggleProduct(product: Product) {
    await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !product.isActive })
    });
    loadAdminData();
  }

  function editProduct(product: Product) {
    setEditingId(product.id);
    setProductForm({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      stock: product.stock,
      imageUrl: product.imageUrl,
      isActive: product.isActive
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleStatusChange(order: Order, status: OrderStatus) {
    setSelectedStatuses((current) => ({ ...current, [order.id]: status }));
    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (!res.ok) {
      setMessage("No se pudo actualizar el estado del pedido.");
      return;
    }
    setMessage(`Estado guardado automáticamente: ${order.code} → ${status}`);
    loadAdminData();
  }

  function buildCustomerMessage(order: Order, status: OrderStatus) {
    const productLines = order.items
      .map((item, index) => `${index + 1}. ✅ *${item.quantity} x ${item.name}*`)
      .join("\n");

    const statusText: Record<OrderStatus, string> = {
      Registrado: "✅ Tu pedido fue registrado correctamente. Pronto confirmaremos la preparación.",
      Confirmado: "🟢 Tu pedido fue confirmado. Gracias por tu preferencia.",
      "En preparación": "👨‍🍳 Tu pedido ya está en preparación con mucho cariño.",
      "En camino": "🛵 Tu pedido está en camino. Por favor mantente atento a tu celular.",
      "Listo para recoger": "📦 Tu pedido está listo para recoger en nuestro local.",
      Entregado: "🎉 Tu pedido fue entregado. Gracias por comprar con nosotros.",
      Cancelado: "❌ Tu pedido fue cancelado. Para más información comunícate con el negocio."
    };

    const payMessage = order.paymentMethod === "Efectivo"
      ? "Si pagarás en efectivo, ten listo el monto indicado."
      : "Si ya realizaste el pago, por favor envía una captura de pantalla del comprobante.";

    return `🥐✨ *${businessName}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Hola *${order.customerName}* 👋\n\n` +
      `${statusText[status]}\n\n` +
      `🧾 *Código:* ${order.code}\n` +
      `📌 *Estado actual:* ${status}\n` +
      `📍 *Lugar:* ${order.address}\n` +
      `💳 *Pago:* ${order.paymentMethod}\n` +
      `💵 *Total:* S/ ${order.total.toFixed(2)}\n\n` +
      `🛒 *Detalle del pedido:*\n${productLines}\n\n` +
      `📸 *Comprobante:* ${payMessage}\n\n` +
      `🏪 *Dirección del local:*\n${businessAddress}\n\n` +
      `Gracias por elegirnos. 🙌`;
  }

  async function notifyCustomer(order: Order) {
    const status = selectedStatuses[order.id] || order.status;
    const text = buildCustomerMessage(order, status);

    // Abrimos una ventana de inmediato para evitar que el navegador bloquee el WhatsApp.
    const popup = window.open("about:blank", "_blank");

    const res = await fetch(`/api/orders/${order.id}/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, message: text })
    });
    if (!res.ok) {
      const data = await res.json();
      setMessage(data.message || "No se pudo registrar el aviso.");
      if (popup) popup.close();
      return;
    }

    const url = whatsappUrl(order.phone, text);
    if (popup) popup.location.href = url;
    else window.location.href = url;

    setMessage(`Aviso guardado en historial y WhatsApp abierto para ${order.customerName}.`);
    loadAdminData();
  }

  async function shareOrderImage(order: Order) {
    const status = selectedStatuses[order.id] || order.status;
    const text = buildCustomerMessage(order, status);
    const imageUrl = order.items.find((item) => item.imageUrl)?.imageUrl;
    if (!imageUrl) {
      setMessage("Este pedido no tiene imagen del producto para compartir.");
      return;
    }
    const ok = await shareImageFile(imageUrl, text);
    if (ok) {
      setMessage("Se abrió el selector para compartir el JPG con el mensaje. Elige WhatsApp y selecciona el cliente.");
    } else {
      setMessage("Tu navegador no permite adjuntar automáticamente JPG a WhatsApp. Usa el botón Enviar WhatsApp y adjunta la imagen manualmente, o usa WhatsApp Cloud API para automatizar archivos.");
    }
  }

  if (checking) return <main className="grid min-h-screen place-items-center bg-amber-50 font-bold">Verificando sesión...</main>;

  if (!authenticated) {
    return (
      <main className="grid min-h-screen place-items-center bg-gradient-to-br from-amber-100 via-orange-100 to-yellow-200 px-4">
        <form onSubmit={handleLogin} className="glass-card w-full max-w-md rounded-[2rem] p-8">
          <div className="mb-6 text-center">
            <img src={logo} alt="Logo Alarcón" className="mx-auto h-24 w-24 rounded-3xl bg-white object-contain p-2 shadow-suave" />
            <h1 className="shine-text mt-4 text-3xl font-black">Panel administrador</h1>
            <p className="text-stone-500">Ingresa con tu usuario y contraseña.</p>
          </div>
          <input placeholder="Usuario" value={login.username} onChange={(e) => setLogin({ ...login, username: e.target.value })} className="input-admin mb-3" />
          <input type="password" placeholder="Contraseña" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} className="input-admin mb-3" />
          {message ? <p className="mb-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{message}</p> : null}
          <button className="btn-primary w-full px-5 py-3">Entrar</button>
          <a href="/" className="mt-4 block text-center text-sm font-bold text-amber-900">Volver a la tienda</a>
        </form>
      </main>
    );
  }

  const stockChart = products.slice(0, 8).map((product) => ({ name: product.name.slice(0, 10), stock: product.stock }));

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-amber-200/60 bg-white/85 px-4 py-3 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo Alarcón" className="h-16 w-16 rounded-2xl bg-white object-contain p-1 shadow-suave" />
            <div>
              <p className="font-black uppercase tracking-[0.25em] text-amber-700">Administración</p>
              <h1 className="shine-text text-2xl font-black">Panel de control</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/" className="rounded-2xl bg-white px-4 py-2 font-bold text-amber-900 shadow hover-neon">Ver tienda</a>
            <button onClick={logout} className="rounded-2xl bg-amber-900 px-4 py-2 font-bold text-white hover-neon">Salir</button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6 md:grid-cols-4">
        <Metric title="Ventas hoy" value={`S/ ${(reports?.todayTotal || 0).toFixed(2)}`} icon="☀️" />
        <Metric title="Ventas semana" value={`S/ ${(reports?.weekTotal || 0).toFixed(2)}`} icon="📈" />
        <Metric title="Ventas mes" value={`S/ ${(reports?.monthTotal || 0).toFixed(2)}`} icon="🚀" />
        <Metric title="Pedidos" value={`${reports?.totalOrders || 0}`} icon="🧾" />
      </section>

      {message ? <section className="mx-auto max-w-7xl px-4"><p className="glass-card rounded-2xl p-4 font-bold text-amber-900">{message}</p></section> : null}

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={saveProduct} className="glass-card rounded-[2rem] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-black uppercase tracking-[0.2em] text-amber-700">Catálogo</p>
              <h2 className="shine-text text-2xl font-black">{editingId ? "Editar producto" : "Nuevo producto"}</h2>
            </div>
            <div className="h-24 w-28 overflow-hidden rounded-2xl bg-amber-100 shadow">
              <ProductVisual src={productForm.imageUrl} name={productForm.name || "Producto"} />
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Nombre del producto">
              <input required value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} className="input-admin" />
            </Field>
            <Field label="Categoría">
              <select required value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} className="input-admin">
                <option>Panes</option>
                <option>Tortas</option>
                <option>Pasteles</option>
                <option>Queques</option>
                <option>Fuente de soda</option>
                <option>Otros</option>
              </select>
            </Field>
            <Field label="Precio de venta S/">
              <input required type="number" min="0" step="0.1" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })} className="input-admin" />
            </Field>
            <Field label="Stock / cantidad disponible">
              <input required type="number" min="0" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })} className="input-admin" />
            </Field>
            <Field label="Seleccionar imagen JPG/PNG del producto" className="md:col-span-2">
              <div className="rounded-2xl border border-dashed border-amber-400 bg-amber-50 p-4 text-center hover-neon">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handleProductImage(e.target.files?.[0])}
                  className="w-full cursor-pointer rounded-xl bg-white p-3 font-bold"
                />
                <p className="mt-2 text-xs font-semibold text-stone-500">Funciona en laptop, PC, tablet o celular. Solo selecciona la foto y luego guarda el producto.</p>
                {uploading ? <p className="mt-2 font-black text-amber-800">Subiendo imagen...</p> : null}
                {productForm.imageUrl ? <p className="mt-2 break-all text-xs font-bold text-stone-500">Imagen actual: {productForm.imageUrl}</p> : null}
              </div>
            </Field>
            <Field label="Descripción" className="md:col-span-2">
              <textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} className="input-admin min-h-28" />
            </Field>
          </div>

          <label className="mt-4 flex items-center gap-2 font-black text-stone-700">
            <input type="checkbox" checked={productForm.isActive} onChange={(e) => setProductForm({ ...productForm, isActive: e.target.checked })} /> Producto activo
          </label>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn-primary px-5 py-3">Guardar producto</button>
            {editingId ? <button type="button" onClick={() => { setEditingId(null); setProductForm(blankProduct); }} className="rounded-2xl bg-stone-200 px-5 py-3 font-black">Cancelar</button> : null}
          </div>
        </form>

        <div className="glass-card rounded-[2rem] p-6">
          <h2 className="shine-text text-2xl font-black">Reportes gráficos</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <ChartCard title="Ventas por día" icon="📊">
              <ResponsiveContainer>
                <AreaChart data={reports?.dailySales || []}>
                  <defs>
                    <linearGradient id="ventas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.85} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.08} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fed7aa" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="total" stroke="#92400e" fill="url(#ventas)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Pedidos por estado" icon="🧭">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={reports?.byStatus || []} dataKey="value" nameKey="name" outerRadius={78} innerRadius={38} paddingAngle={4}>
                    {(reports?.byStatus || []).map((_, index) => <Cell key={index} fill={chartColors[index % chartColors.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Pedidos y reservas" icon="📦">
              <ResponsiveContainer>
                <BarChart data={reports?.byType || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fed7aa" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#ea580c" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Stock de productos" icon="🥖">
              <ResponsiveContainer>
                <LineChart data={stockChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fed7aa" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="stock" stroke="#16a34a" strokeWidth={4} dot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-12 lg:grid-cols-2">
        <div className="glass-card rounded-[2rem] p-6">
          <h2 className="mb-4 shine-text text-2xl font-black">Productos</h2>
          <div className="space-y-3">
            {products.map((product) => (
              <div key={product.id} className="flex flex-col gap-3 rounded-2xl bg-amber-50/90 p-4 lift-card md:flex-row md:items-center md:justify-between">
                <div className="flex gap-3">
                  <div className="h-16 w-16 overflow-hidden rounded-2xl bg-white">
                    <ProductVisual src={product.imageUrl} name={product.name} />
                  </div>
                  <div>
                    <b>{product.name}</b>
                    <p className="text-sm font-semibold text-stone-600">{product.category} · S/ {product.price.toFixed(2)} · Stock {product.stock}</p>
                    <p className="max-w-md truncate text-xs text-stone-500">{product.imageUrl}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => editProduct(product)} className="rounded-xl bg-white px-3 py-2 text-sm font-black shadow">Editar</button>
                  <button onClick={() => toggleProduct(product)} className={`rounded-xl px-3 py-2 text-sm font-black ${product.isActive ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>{product.isActive ? "Desactivar" : "Activar"}</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-[2rem] p-6">
          <h2 className="mb-4 shine-text text-2xl font-black">Pedidos y reservas</h2>
          <div className="space-y-4">
            {orders.length === 0 ? <p className="text-stone-500">Aún no hay pedidos registrados.</p> : null}
            {orders.map((order) => {
              const selectedStatus = selectedStatuses[order.id] || order.status;
              return (
                <div key={order.id} className="rounded-2xl bg-amber-50/90 p-4 lift-card">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <b>{order.code} · {order.customerName}</b>
                      <p className="text-sm font-semibold text-stone-600">Cel: {order.phone}</p>
                      <p className="text-sm font-semibold text-stone-600">{order.address}</p>
                      <p className="text-xs font-black text-amber-800">Estado actual: {order.status}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-sm font-black">S/ {order.total.toFixed(2)}</span>
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-stone-700">
                    {order.items.map((item) => (
                      <li key={`${order.id}-${item.productId}`} className="flex items-center gap-2">
                        <span className="h-10 w-10 overflow-hidden rounded-xl bg-white">
                          <ProductVisual src={item.imageUrl} name={item.name} />
                        </span>
                        <span>{item.quantity} x {item.name}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                    <select
                      value={selectedStatus}
                      onChange={(e) => handleStatusChange(order, e.target.value as OrderStatus)}
                      className="input-admin py-2"
                    >
                      {statuses.map((st) => <option key={st}>{st}</option>)}
                    </select>
                    <button onClick={() => notifyCustomer(order)} className="btn-green px-4 py-2">
                      Enviar WhatsApp
                    </button>
                    <button onClick={() => shareOrderImage(order)} className="rounded-xl bg-amber-900 px-4 py-2 font-black text-white shadow">
                      Compartir JPG
                    </button>
                  </div>
                  <p className="mt-2 text-xs font-semibold text-stone-500">Al cambiar el estado se guarda automáticamente. Al pulsar “Enviar WhatsApp”, el aviso queda registrado con fecha y hora.</p>
                  {order.notifications && order.notifications.length > 0 ? (
                    <div className="mt-3 rounded-xl bg-white/85 p-3">
                      <p className="text-xs font-black uppercase tracking-[0.15em] text-amber-700">Historial de avisos enviados</p>
                      <ul className="mt-2 space-y-2 text-xs font-semibold text-stone-600">
                        {order.notifications.map((note) => (
                          <li key={note.id} className="rounded-lg bg-amber-50 p-2">
                            <span className="font-black text-amber-900">📲 {note.status}</span> · {new Date(note.createdAt).toLocaleString("es-PE")}
                            <span className="mt-1 block text-stone-500">{note.message}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

function Metric({ title, value, icon }: { title: string; value: string; icon: string }) {
  return (
    <div className="glass-card group rounded-[1.5rem] p-5 hover-neon">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-stone-500">{title}</p>
        <span className="text-2xl transition group-hover:scale-125">{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-black text-amber-950">{value}</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-amber-100">
        <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-amber-900 to-yellow-400" />
      </div>
    </div>
  );
}

function ChartCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-amber-100 bg-white/85 p-4 shadow-sm hover-neon">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-black text-amber-950">{title}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="h-56 w-full">{children}</div>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`space-y-2 font-bold text-stone-700 ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}
