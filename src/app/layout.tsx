import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Panadería Pastelería y fuente de soda Alarcón",
  description: "Sistema profesional de pedidos, reservas, WhatsApp, reportes y administración.",
  manifest: "/manifest.json"
};

export const viewport: Viewport = {
  themeColor: "#78350f",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
