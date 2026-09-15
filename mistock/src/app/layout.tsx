import type { Metadata } from "next";
import { MantineProvider, createTheme } from "@mantine/core";
import "@mantine/core/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "miStock - Sistema de Gestión de Inventario",
  description: "Sistema integral de gestión de stock, ventas y clientes para negocios medianos",
};

const theme = createTheme({
  primaryColor: "emerald",
  colors: {
    emerald: [
      "#eef8f7",
      "#dcf0ef",
      "#b8e2df",
      "#8cd0cc",
      "#57b8b2",
      "#2a7a78",
      "#205e5d",
      "#1a4b4a",
      "#153d3c",
      "#0f2c2b",
    ],
  },
  primaryShade: 5,
  fontFamily: "var(--font-geist-sans), sans-serif",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-mantine-color-scheme="light" suppressHydrationWarning>
      <head />
      <body className="min-h-screen bg-[#F8F7F2] text-[#1C2424] font-sans antialiased">
        <MantineProvider theme={theme} defaultColorScheme="light">
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
