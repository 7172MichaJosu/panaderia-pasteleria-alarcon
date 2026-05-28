import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { store } from "@/lib/store";
import { Product } from "@/lib/types";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!requireAdmin()) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }
  const body = await request.json();
  const patch: Partial<Product> = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.description !== undefined) patch.description = body.description;
  if (body.category !== undefined) patch.category = body.category;
  if (body.price !== undefined) patch.price = Number(body.price);
  if (body.stock !== undefined) patch.stock = Number(body.stock);
  if (body.imageUrl !== undefined) patch.imageUrl = body.imageUrl;
  if (body.isActive !== undefined) patch.isActive = Boolean(body.isActive);

  const product = await store.updateProduct(Number(params.id), patch);
  if (!product) return NextResponse.json({ message: "Producto no encontrado" }, { status: 404 });
  return NextResponse.json({ product });
}
