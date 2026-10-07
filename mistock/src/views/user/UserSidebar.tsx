'use client';

/**
 * ====================================================================
 * VISTA: BARRA LATERAL DE NAVEGACIÓN DEL EMPLEADO (View Component)
 * ====================================================================
 * 
 * Propósito:
 * Menú lateral exclusivo para el rol de usuario/empleado:
 * accesos directos a ventas, catálogo, historial diario y resumen de stock.
 */

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ShoppingCart,
  Package,
  Receipt,
  ArrowsLeftRight,
  SignOut,
  UserCheck,
  Tag,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

/**
 * Enlaces de navegación rápida para la operativa modular de ventas en mostrador.
 */
const userNavData = [
  { id: 'caja', link: '/dashboard?tab=caja', label: 'Terminal de Cobro', icon: ShoppingCart },
  { id: 'catalogo', link: '/dashboard?tab=catalogo', label: 'Catálogo de Productos', icon: Package },
  { id: 'precios', link: '/dashboard?tab=precios', label: 'Consultor de Precios', icon: Tag },
  { id: 'historial', link: '/dashboard?tab=historial', label: 'Historial del Día', icon: Receipt },
];

interface UserSidebarProps {
  onNavigate?: () => void;
  className?: string;
  esAdmin?: boolean;
}

export function UserSidebar({ onNavigate, className, esAdmin = false }: UserSidebarProps = {}) {
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get('tab') || 'caja';

  return (
    <nav className={cn('flex flex-col h-full bg-white border-r border-[#E8E6DF] w-64', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-[#E8E6DF]">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2A7A78] text-white shadow-sm">
            <UserCheck className="h-5 w-5" weight="duotone" />
          </div>
          <div>
            <h1 className="text-base font-bold text-[#1C2424] tracking-tight leading-none">
              M.I Stock
            </h1>
            <span className="text-[11px] font-medium text-[#657373]">Punto de Venta (POS)</span>
          </div>
        </div>
        <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-[#657373] border border-gray-200">
          v1.0
        </span>
      </div>

      {/* Nav links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[#657373]">
          Operaciones
        </p>

        {userNavData.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === currentTab;

          return (
            <Link
              key={item.id}
              href={item.link}
              onClick={() => {
                onNavigate?.();
              }}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-[#2A7A78] text-white shadow-sm'
                  : 'text-[#657373] hover:bg-black/5 hover:text-[#1C2424]'
              )}
            >
              <Icon
                className={cn('h-5 w-5 shrink-0', isActive ? 'text-white' : 'text-[#657373]')}
                weight={isActive ? 'duotone' : 'regular'}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[#E8E6DF] space-y-1">
        {/* Solo visible si el usuario activo tiene rol de Administrador */}
        {esAdmin && (
          <Link
            href="/admin"
            onClick={() => onNavigate?.()}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#657373] hover:bg-black/5 hover:text-[#1C2424] transition-colors"
          >
            <ArrowsLeftRight className="h-4 w-4" weight="regular" />
            <span>Volver a Administración</span>
          </Link>
        )}

        <Link
          href="/logout"
          onClick={() => onNavigate?.()}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <SignOut className="h-4 w-4" weight="regular" />
          <span>Cerrar Sesión</span>
        </Link>
      </div>
    </nav>
  );
}
