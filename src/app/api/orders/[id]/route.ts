import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { store } from "@/lib/store";
import { OrderStatus } from "@/lib/types";

const allowed: OrderStatus[] = ["Registrado", "Confirmado", "En preparación", "En camino", "Listo para recoger", "Entregado", "Cancelado"];

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!requireAdmin()) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }
  const body = await request.json();
  if (!allowed.includes(body.status)) {
    return NextResponse.json({ message: "Estado no válido" }, { status: 400 });
  }
  const order = await store.updateOrderStatus(Number(params.id), body.status);
  if (!order) return NextResponse.json({ message: "Pedido no encontrado" }, { status: 404 });
  return NextResponse.json({ order });
}
