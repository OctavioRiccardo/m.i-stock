import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "miStock - Sistema de Gestión de Inventario",
  description: "Sistema integral de gestión de stock, ventas y clientes para negocios medianos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head />
      <body className="min-h-screen bg-[#F8F7F2] text-[#1C2424] font-sans antialiased selection:bg-[#E2F1F0] selection:text-[#2A7A78]">
        {children}
      </body>
    </html>
  );
}
