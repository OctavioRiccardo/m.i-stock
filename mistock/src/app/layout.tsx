import type { Metadata } from "next";
import { ColorSchemeScript, MantineProvider, createTheme } from "@mantine/core";
import "@mantine/core/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "miStock - Sistema de Gestión de Inventario",
  description: "Sistema integral de gestión de stock, ventas y clientes para negocios medianos",
};

const theme = createTheme({
  primaryColor: "indigo",
  fontFamily: "var(--font-geist-sans), sans-serif",
});

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" data-mantine-color-scheme="dark">
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
        <MantineProvider theme={theme} defaultColorScheme="dark">
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
