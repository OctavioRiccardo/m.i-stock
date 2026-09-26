'use client';

/**
 * ====================================================================
 * LAYOUT DE EMPLEADO / OPERADOR (Responsive POS Shell + RBAC Guard)
 * ====================================================================
 * 
 * Propósito:
 * Proveer la estructura de diseño adaptativo para las terminales de ventas:
 * - Sidebar de escritorio con accesos a la operativa diaria.
 * - Drawer responsivo para tablets o teléfonos en línea de cajas.
 * - Validación de rol para restringir acceso si el usuario no tiene rol asignado.
 * - Integración con control de jerarquía (Admin operando en caja).
 */

import React, { useState } from 'react';
import { Menu, X, UserCheck } from 'lucide-react';
import { UserSidebar } from '@/views/user/UserSidebar';
import { Footer } from '@/views/comunes/Footer';
import { useRBAC } from '@/controllers/rbacController';
import { ModalAccesoRestringido } from '@/views/comunes/ModalAccesoRestringido';

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { esAdmin, esSinRol, cargando, cambiarRolSimulado } = useRBAC();

  return (
    <div className="min-h-screen bg-[#F8F7F2] text-[#1C2424] flex">
      {/* Si el usuario no tiene rol asignado, bloquea la operación de caja */}
      {!cargando && esSinRol && (
        <ModalAccesoRestringido
          tipo="sin_rol"
          onCambiarRolDev={cambiarRolSimulado}
        />
      )}

      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-64">
        <UserSidebar esAdmin={esAdmin} />
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl transition-transform duration-200 ease-in-out lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="absolute right-3 top-3 lg:hidden">
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1 rounded-md text-[#657373] hover:text-[#1C2424]"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <UserSidebar
          esAdmin={esAdmin}
          onNavigate={() => setMobileMenuOpen(false)}
        />
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[#E8E6DF] bg-white px-4 lg:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg text-[#1C2424] hover:bg-gray-100 transition-colors"
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2A7A78] text-white">
                <UserCheck className="h-4 w-4" />
              </div>
              <span className="font-bold text-sm text-[#1C2424]">M.I Stock</span>
            </div>
          </div>
          <span className="rounded-full bg-[#E2F1F0] px-2 py-0.5 text-xs font-semibold text-[#2A7A78] border border-[#2A7A78]/20">
            {esAdmin ? 'Admin en Caja' : 'Cajero / POS'}
          </span>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {cargando ? (
            <div className="flex items-center justify-center py-20 text-[#657373] text-sm">
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
