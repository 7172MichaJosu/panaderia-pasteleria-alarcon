"use client";

import { useEffect, useMemo, useState } from "react";
import { CartItem, Product } from "@/lib/types";

const businessWhatsapp = process.env.NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER || "51900987261";
const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL || "";
const businessName = process.env.NEXT_PUBLIC_BUSINESS_NAME || "Panadería Pastelería y fuente de soda Alarcón";
const businessAddress = process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || "Jr. Túpac Amaru s/n, esquina de la Plaza Principal, Pampa Cangallo, Ayacucho, Perú";
const logo = "/logo-alarcon.png";

type OrderForm = {
  customerName: string;
  phone: string;
  address: string;
  orderType: "Pedido" | "Reserva";
  paymentMethod: string;
  deliveryDate: string;
  notes: string;
};

type LastShare = {
  orderCode: string;
  text: string;
  imageUrl?: string;
};

const emptyForm: OrderForm = {
  customerName: "",
  phone: "",
  address: "",
  orderType: "Pedido",
  paymentMethod: "Efectivo",
  deliveryDate: "",
  notes: ""
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
  if (value.startsWith("data:image/")) return value;
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

async function shareImageFile(imageUrl: string, text: string) {
  if (typeof navigator === "undefined" || !("share" in navigator)) return false;
  const url = absoluteImageUrl(imageUrl);
  if (!url || url.startsWith("data:image/")) return false;

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
  return <div className={`grid h-full w-full place-items-center text-7xl ${className}`}>{src || "🥐"}</div>;
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [category, setCategory] = useState("Todos");
  const [form, setForm] = useState<OrderForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [lastShare, setLastShare] = useState<LastShare | null>(null);

  useEffect(() => {
    fetch("/api/products?activeOnly=true")
      .then((r) => r.json())
      .then((data) => setProducts(data.products || []))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => ["Todos", ...Array.from(new Set(products.map((p) => p.category)))], [products]);
  const filtered = category === "Todos" ? products : products.filter((p) => p.category === category);
  const total = cart.reduce((sum, item) => sum + item.subtotal, 0);

  function addToCart(product: Product) {
    setCart((current) => {
      const exists = current.find((item) => item.productId === product.id);
      if (exists) {
        return current.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unitPrice }
            : item
        );
      }
      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          quantity: 1,
          unitPrice: product.price,
          subtotal: product.price,
          imageUrl: product.imageUrl
        }
      ];
    });
  }

  function changeQty(productId: number, quantity: number) {
    if (quantity <= 0) {
      setCart((current) => current.filter((item) => item.productId !== productId));
      return;
    }
    setCart((current) =>
      current.map((item) =>
        item.productId === productId ? { ...item, quantity, subtotal: quantity * item.unitPrice } : item
      )
    );
  }

  function buildBusinessWhatsappText(orderCode: string) {
    const productLines = cart
      .map((item, index) => `${index + 1}. ✅ *${item.quantity} x ${item.name}*\n   💰 Subtotal: S/ ${item.subtotal.toFixed(2)}`)
      .join("\n\n");

    const paymentInstruction = form.paymentMethod === "Efectivo"
      ? "Pago seleccionado: efectivo al recibir o recoger el producto."
      : "IMPORTANTE: Solicitar al cliente la captura de pantalla del pago realizado.";

    return `🥐✨ *NUEVO ${form.orderType.toUpperCase()} ONLINE*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `🏪 *Negocio:* ${businessName}\n` +
      `🧾 *Código:* ${orderCode}\n` +
      `👤 *Cliente:* ${form.customerName}\n` +
      `📱 *WhatsApp:* ${form.phone}\n` +
      `📍 *Entrega/recojo:* ${form.address}\n` +
      `💳 *Método de pago:* ${form.paymentMethod}\n` +
      `📅 *Fecha y hora:* ${form.deliveryDate || "No especificada"}\n` +
      `📝 *Notas:* ${form.notes || "Sin notas"}\n\n` +
      `🛒 *Productos solicitados:*\n${productLines}\n\n` +
      `💵 *TOTAL:* S/ ${total.toFixed(2)}\n\n` +
      `📸 *Comprobante de pago:* ${paymentInstruction}\n\n` +
      `📌 *Dirección del local:*\n${businessAddress}\n\n` +
      `✅ Pedido registrado desde el sistema web.`;
  }

  async function submitOrder(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setLastShare(null);
    if (!cart.length) {
      setMessage("Agrega al menos un producto al carrito.");
      return;
    }

    setSending(true);
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, items: cart })
    });
    const data = await response.json();
    setSending(false);

    if (!response.ok) {
      setMessage(data.message || "No se pudo registrar el pedido.");
      return;
    }

    const text = buildBusinessWhatsappText(data.order.code);
    const firstImage = cart.find((item) => item.imageUrl)?.imageUrl;
    const waLink = whatsappUrl(businessWhatsapp, text);
    window.open(waLink, "_blank");

    setLastShare({ orderCode: data.order.code, text, imageUrl: firstImage });
    setCart([]);
    setForm(emptyForm);
    setMessage(`Pedido registrado correctamente: ${data.order.code}. Se abrió WhatsApp del negocio. Si deseas mandar también el JPG, usa el botón verde de compartir imagen.`);
  }

  async function shareLastImage() {
    if (!lastShare?.imageUrl) {
      setMessage("Este pedido no tiene imagen disponible para compartir.");
      return;
    }
    const ok = await shareImageFile(lastShare.imageUrl, lastShare.text);
    if (ok) {
      setMessage("Se abrió el selector para compartir el JPG con el mensaje. Elige WhatsApp y selecciona el contacto del negocio.");
    } else {
      setMessage("Tu navegador no permite adjuntar automáticamente JPG a WhatsApp. Abre WhatsApp y adjunta la imagen manualmente, o usa WhatsApp Cloud API para automatizarlo.");
    }
  }

  return (
    <main className="min-h-screen overflow-hidden text-stone-950">
      <header className="sticky top-0 z-30 border-b border-amber-200/60 bg-white/82 px-4 py-3 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <a href="#inicio" className="flex items-center gap-3">
            <img src={logo} alt="Logo Alarcón" className="h-16 w-16 rounded-2xl border border-amber-200 bg-white object-contain p-1 shadow-suave" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-amber-700">Tienda online</p>
              <h1 className="shine-text neon-title text-xl font-black leading-tight md:text-2xl">{businessName}</h1>
            </div>
          </a>
          <nav className="flex flex-wrap gap-2 text-sm font-black">
            <a href="#catalogo" className="rounded-full bg-white px-4 py-2 text-amber-900 shadow-sm hover-neon">Catálogo</a>
            <a href="#pedido" className="rounded-full bg-white px-4 py-2 text-amber-900 shadow-sm hover-neon">Pedido / reserva</a>
            <a href="/admin" className="rounded-full bg-amber-900 px-4 py-2 text-white shadow-sm hover-neon">Administrador</a>
          </nav>
        </div>
      </header>

      <section id="inicio" className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.08fr_0.92fr] md:items-center">
        <div className="dark-glass relative overflow-hidden rounded-[2.5rem] p-8 text-white md:p-12">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-yellow-300/20 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-72 w-72 rounded-full bg-green-400/15 blur-3xl" />
          <div className="relative">
            <p className="mb-4 inline-flex rounded-full border border-yellow-300/40 bg-white/10 px-4 py-2 text-sm font-black backdrop-blur pulse-soft">✅ Pedidos, reservas y avisos por WhatsApp</p>
            <h2 className="text-4xl font-black leading-tight md:text-6xl">Dulzura artesanal, pedidos rápidos y atención moderna.</h2>
            <p className="mt-5 max-w-2xl text-lg text-amber-50">Elige panes, tortas, pasteles o bebidas, registra tu pedido y confirma al WhatsApp del negocio en segundos.</p>
            <div className="mt-6 rounded-2xl border border-white/20 bg-white/10 p-4 text-sm font-bold text-amber-50">
              📍 {businessAddress}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#catalogo" className="rounded-2xl bg-white px-6 py-3 font-black text-amber-900 shadow">Ver productos</a>
              <a href="#pedido" className="rounded-2xl border border-white/60 px-6 py-3 font-black text-white">Hacer pedido</a>
            </div>
          </div>
        </div>

        <div className="glass-card hero-plaza floating rounded-[2.5rem] p-5 text-white">
          <div className="rounded-[2rem] bg-black/30 p-5 backdrop-blur-sm">
            <img src={logo} alt="Logo Alarcón" className="mx-auto h-72 w-full object-contain drop-shadow-2xl" />
            <p className="mt-4 text-center text-xl font-black">Panadería · Pastelería · Fuente de soda</p>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center text-stone-900">
            <div className="rounded-2xl bg-white/90 p-4 hover-neon"><b>{products.length}</b><span className="block text-xs font-bold text-stone-500">Productos</span></div>
            <div className="rounded-2xl bg-white/90 p-4 hover-neon"><b>S/ {total.toFixed(2)}</b><span className="block text-xs font-bold text-stone-500">Carrito</span></div>
            <div className="rounded-2xl bg-white/90 p-4 hover-neon"><b>{cart.length}</b><span className="block text-xs font-bold text-stone-500">Items</span></div>
          </div>
        </div>
      </section>

      <section id="catalogo" className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-black uppercase tracking-[0.25em] text-yellow-200 drop-shadow">Catálogo</p>
            <h2 className="text-3xl font-black text-white drop-shadow-lg md:text-4xl">Productos disponibles</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`whitespace-nowrap rounded-full px-4 py-2 font-black shadow-sm hover-neon ${cat === category ? "bg-amber-900 text-white" : "bg-white text-amber-900"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? <p className="font-bold text-white">Cargando productos...</p> : null}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => (
            <article key={product.id} className="group glass-card lift-card overflow-hidden rounded-[2rem]">
              <div className="h-56 overflow-hidden bg-gradient-to-br from-amber-100 to-orange-100">
                <ProductVisual src={product.imageUrl} name={product.name} className="transition duration-500 group-hover:scale-110" />
              </div>
              <div className="p-5">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">{product.category}</p>
                    <h3 className="text-xl font-black text-amber-950">{product.name}</h3>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-black text-amber-900">S/ {product.price.toFixed(2)}</span>
                </div>
                <p className="min-h-12 text-sm font-semibold text-stone-600">{product.description}</p>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-stone-600">Stock: {product.stock}</span>
                  <button onClick={() => addToCart(product)} className="btn-primary px-4 py-2">Agregar</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="pedido" className="mx-auto grid max-w-7xl gap-6 px-4 py-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="glass-card rounded-[2rem] p-6">
          <h2 className="text-2xl font-black text-amber-950">🛒 Carrito</h2>
          <div className="mt-4 space-y-3">
            {cart.length === 0 ? <p className="font-semibold text-stone-500">Todavía no agregaste productos.</p> : null}
            {cart.map((item) => (
              <div key={item.productId} className="rounded-2xl bg-amber-50 p-4 hover-neon">
                <div className="flex items-center justify-between gap-2">
                  <b>{item.name}</b>
                  <span className="font-black">S/ {item.subtotal.toFixed(2)}</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button type="button" onClick={() => changeQty(item.productId, item.quantity - 1)} className="h-8 w-8 rounded-full bg-white font-black">-</button>
                  <span className="w-8 text-center font-black">{item.quantity}</span>
                  <button type="button" onClick={() => changeQty(item.productId, item.quantity + 1)} className="h-8 w-8 rounded-full bg-white font-black">+</button>
                  <span className="ml-auto text-sm font-bold text-stone-500">S/ {item.unitPrice.toFixed(2)} c/u</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl bg-gradient-to-r from-amber-950 to-green-700 p-5 text-white shadow-suave">
            <p className="text-sm font-bold">Total a pagar</p>
            <p className="text-3xl font-black">S/ {total.toFixed(2)}</p>
          </div>
        </div>

        <form onSubmit={submitOrder} className="glass-card rounded-[2rem] p-6">
          <p className="font-black uppercase tracking-[0.25em] text-amber-700">Registro</p>
          <h2 className="text-2xl font-black text-amber-950">Datos para pedido o reserva</h2>
          <p className="mt-1 text-sm font-semibold text-stone-500">No se solicita DNI. Solo datos necesarios para coordinar el pedido.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="space-y-2 font-bold text-stone-700">
              <span>Nombres completos</span>
              <input required value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className="input-public" />
            </label>
            <label className="space-y-2 font-bold text-stone-700">
              <span>Celular / WhatsApp</span>
              <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-public" />
            </label>
            <label className="space-y-2 font-bold text-stone-700 md:col-span-2">
              <span>Dirección o lugar de entrega/recojo</span>
              <input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-public" />
            </label>
            <label className="space-y-2 font-bold text-stone-700">
              <span>Tipo</span>
              <select value={form.orderType} onChange={(e) => setForm({ ...form, orderType: e.target.value as "Pedido" | "Reserva" })} className="input-public">
                <option>Pedido</option>
                <option>Reserva</option>
              </select>
            </label>
            <label className="space-y-2 font-bold text-stone-700">
              <span>Método de pago</span>
              <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="input-public">
                <option>Efectivo</option>
                <option>Yape</option>
                <option>Plin</option>
                <option>Transferencia</option>
              </select>
            </label>
            <label className="space-y-2 font-bold text-stone-700 md:col-span-2">
              <span>Fecha y hora para reserva o entrega</span>
              <input type="datetime-local" value={form.deliveryDate} onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })} className="input-public" />
            </label>
            <label className="space-y-2 font-bold text-stone-700 md:col-span-2">
              <span>Notas adicionales</span>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-public min-h-28" />
            </label>
          </div>
          {message ? <p className="mt-4 rounded-2xl bg-amber-100 p-4 font-bold text-amber-900">{message}</p> : null}
          {lastShare?.imageUrl ? (
            <button type="button" onClick={shareLastImage} className="btn-green mt-4 w-full px-6 py-4 text-base">
              Compartir imagen JPG del producto por WhatsApp
            </button>
          ) : null}
          <button disabled={sending} className="btn-primary mt-5 w-full px-6 py-4 text-lg disabled:opacity-60">
            {sending ? "Registrando..." : "Registrar pedido y enviar al WhatsApp del negocio"}
          </button>
        </form>
      </section>

      <footer className="mt-10 bg-amber-950/95 px-4 py-8 text-center text-sm font-semibold text-amber-100 backdrop-blur">
        <img src={logo} alt="Logo Alarcón" className="mx-auto mb-3 h-16 w-16 rounded-2xl bg-white object-contain p-1" />
        <p className="font-black">{businessName}</p>
        <p>{businessAddress}</p>
      </footer>
    </main>
  );
}
