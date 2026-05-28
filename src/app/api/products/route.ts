import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { store } from "@/lib/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get("activeOnly") === "true";
  const products = await store.getProducts(activeOnly);
  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  if (!requireAdmin()) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }
  const body = await request.json();
  if (!body.name || !body.category || Number(body.price) < 0) {
    return NextResponse.json({ message: "Datos de producto incompletos" }, { status: 400 });
  }
  const product = await store.createProduct({
    name: body.name,
    description: body.description || "",
    category: body.category,
    price: Number(body.price),
    stock: Number(body.stock || 0),
    imageUrl: body.imageUrl || "🥐",
    isActive: body.isActive !== false
  });
  return NextResponse.json({ product });
}
