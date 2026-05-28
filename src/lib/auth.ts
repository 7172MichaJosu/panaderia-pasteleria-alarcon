import crypto from "crypto";
import { cookies } from "next/headers";
import { appConfig } from "./config";

const COOKIE_NAME = "panaderia_admin_session";

function sign(value: string) {
  return crypto.createHmac("sha256", appConfig.sessionSecret).update(value).digest("hex");
}

export function createSessionToken(username: string) {
  const payload = `${username}:${Date.now()}`;
  return `${payload}.${sign(payload)}`;
}

export function isValidSessionToken(token?: string) {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const [username] = payload.split(":");
  if (username !== appConfig.adminUser) return false;
  const expected = sign(payload);
  if (signature.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export function requireAdmin() {
  const token = cookies().get(COOKIE_NAME)?.value;
  return isValidSessionToken(token);
}

export function setAdminCookie(token: string) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
}

export function clearAdminCookie() {
  cookies().delete(COOKIE_NAME);
}

export const adminCookieName = COOKIE_NAME;
