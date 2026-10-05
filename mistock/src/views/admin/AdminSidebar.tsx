'use client';

/**
 * ====================================================================
 * VISTA: BARRA LATERAL DE NAVEGACIÓN DEL ADMINISTRADOR (View Component)
 * ====================================================================
 * 
 * Propósito:
 * Proveer el menú de navegación principal para las secciones administrativas:
 * - Métricas & KPIs (`/adminmetricas#`)
 * - Gestión de Inventario & Alta (`/admingestioninven#`)
 * - Enlaces rápidos a cambio de rol y cierre de sesión.
 * 
 * Comportamiento Reactivo:
 * Detecta la ruta activa mediante `usePathname()` para destacar visualmente el enlace actual.
 * Acepta un callback `onNavigate` para cerrar automáticamente el drawer en dispositivos móviles.
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChartBar,
  Package,
  Users,
  Stack,
  Gear,
  SignOut,
  ArrowsLeftRight,
  ShieldCheck,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

/**
 * Estructura de elementos del menú de navegación de administración.
 */
const adminNavData = [
  { link: '/admin', label: 'Métricas & KPIs', icon: ChartBar },
  { link: '/admingestioninven', label: 'Gestión de Inventario', icon: Package },
  { link: '/adminusuarios', label: 'Gestión de Usuarios', icon: Users },
  { link: '/admininventarioglobal', label: 'Inventario Global', icon: Stack },
  { link: '/adminconfiguracion', label: 'Configuración', icon: Gear },
];

interface AdminSidebarProps {
  onNavigate?: () => void;
  className?: string;
}

export function AdminSidebar({ onNavigate, className }: AdminSidebarProps = {}) {
  const pathname = usePathname();

  // Detección dinámica de la ruta activa para aplicar los estilos visuales de Dub.co
  const activeItem = adminNavData.find((item) => {
    return pathname === item.link || (item.link !== '/admin' && pathname?.startsWith(item.link));
  });
  const activeLabel = activeItem ? activeItem.label : (pathname === '/admin' ? 'Métricas & KPIs' : '');



  return (
    <nav className={cn('flex flex-col h-full bg-white border-r border-[#E8E6DF] w-64', className)}>
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-[#E8E6DF]">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2A7A78] text-white shadow-sm">
            <ShieldCheck className="h-5 w-5" weight="duotone" />
          </div>
          <div>
            <h1 className="text-base font-bold text-[#1C2424] tracking-tight leading-none">
              M.I Stock
            </h1>
            <span className="text-[11px] font-medium text-[#657373]">Panel de Control</span>
          </div>
        </div>
        <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-[#657373] border border-gray-200">
          v1.0
        </span>
      </div>

      {/* Nav Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[#657373]">
          Administración
        </p>

        {adminNavData.map((item) => {
          const Icon = item.icon;
          const isActive = item.label === activeLabel;

          return (
            <Link
              key={item.label}
              href={item.link}
              onClick={() => onNavigate?.()}
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

      {/* Footer User & Session */}
      <div className="p-3 border-t border-[#E8E6DF] space-y-1">
        <Link
          href="/dashboard"
          onClick={() => onNavigate?.()}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#657373] hover:bg-black/5 hover:text-[#1C2424] transition-colors"
        >
          <ArrowsLeftRight className="h-4 w-4" weight="regular" />
          <span>Punto de Venta / Caja</span>
        </Link>

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
