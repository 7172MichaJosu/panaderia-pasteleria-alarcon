import { NextResponse } from "next/server";
import { appConfig } from "@/lib/config";
import { createSessionToken, setAdminCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  if (body.username !== appConfig.adminUser || body.password !== appConfig.adminPassword) {
    return NextResponse.json({ message: "Usuario o contraseña incorrectos" }, { status: 401 });
  }
  setAdminCookie(createSessionToken(body.username));
  return NextResponse.json({ ok: true });
}
