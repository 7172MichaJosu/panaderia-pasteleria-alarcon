import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  return NextResponse.json({ authenticated: requireAdmin() });
}
