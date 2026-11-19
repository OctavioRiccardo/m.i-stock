'use client';

/**
 * ====================================================================
 * LAYOUT DE EMPLEADO / OPERADOR (Responsive POS Shell + RBAC Guard)
 * ====================================================================
 */

import React, { useState, Suspense } from 'react';
import { List, X, Package } from '@phosphor-icons/react';
import { UserSidebar } from '@/views/user/UserSidebar';
import { Footer } from '@/views/comunes/Footer';
import { usePermisosController } from '@/controllers/permisosController';
import { ModalAccesoRestringido } from '@/views/comunes/ModalAccesoRestringido';

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { esAdmin, esSinRol, cargando, cambiarRolSimulado } = usePermisosController();

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {!cargando && esSinRol && (
        <ModalAccesoRestringido
          tipo="sin_rol"
          onCambiarRolDev={cambiarRolSimulado}
        />
      )}

      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-64">
        <Suspense fallback={<div className="w-64 h-full bg-background border-r border-border" />}>
          <UserSidebar esAdmin={esAdmin} />
        </Suspense>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#1C2424]/45 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-background shadow-[0_12px_32px_rgba(28,36,36,0.20)] transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="absolute right-3 top-3.5 z-10 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <Suspense fallback={<div className="w-64 h-full bg-background" />}>
          <UserSidebar
            esAdmin={esAdmin}
            onNavigate={() => setMobileMenuOpen(false)}
          />
        </Suspense>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/95 backdrop-blur-sm px-4 lg:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg text-foreground hover:bg-muted transition-colors cursor-pointer"
              aria-label="Abrir menú"
            >
              <List className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Package className="h-4 w-4" weight="duotone" />
              </div>
              <span className="font-bold text-sm text-foreground tracking-tight">M.I Stock</span>
            </div>
          </div>
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground border border-primary/20">
            {esAdmin ? 'Admin en Caja' : 'Cajero / POS'}
          </span>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {cargando ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
              Iniciando terminal de caja...
            </div>
          ) : (
            children
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}
