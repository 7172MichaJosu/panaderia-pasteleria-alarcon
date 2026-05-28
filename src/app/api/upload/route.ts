import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
const maxSize = 5 * 1024 * 1024;

function safeName(name: string) {
  const base = name
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
  return base || "producto";
}

function extensionFromType(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

export async function POST(request: Request) {
  if (!requireAdmin()) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Selecciona una imagen válida." }, { status: 400 });
    }

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ message: "Solo se permiten imágenes JPG, PNG o WEBP." }, { status: 400 });
    }

    if (file.size > maxSize) {
      return NextResponse.json({ message: "La imagen no debe superar 5 MB." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = extensionFromType(file.type);
    const filename = `${Date.now()}-${safeName(file.name)}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "productos");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);

    return NextResponse.json({ url: `/productos/${filename}` });
  } catch (error) {
    return NextResponse.json({ message: "No se pudo guardar la imagen. En producción usa almacenamiento externo como Supabase Storage o S3." }, { status: 500 });
  }
}
