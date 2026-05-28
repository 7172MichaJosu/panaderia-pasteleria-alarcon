import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { store } from "@/lib/store";
import { CartItem } from "@/lib/types";

export async function GET() {
  if (!requireAdmin()) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }
  const orders = await store.getOrders();
  return NextResponse.json({ orders });
}

export async function POST(request: Request) {
  const body = await request.json();
  const items: CartItem[] = body.items || [];

  if (!body.customerName || !body.phone || !body.address || items.length === 0) {
    return NextResponse.json({ message: "Completa nombres, celular, lugar y agrega productos." }, { status: 400 });
  }

  const order = await store.createOrder({
    customerName: body.customerName,
    phone: body.phone,
    address: body.address,
    orderType: body.orderType || "Pedido",
    paymentMethod: body.paymentMethod || "Efectivo",
    deliveryDate: body.deliveryDate || null,
    notes: body.notes || "",
    items
  });

  return NextResponse.json({ order });
}
