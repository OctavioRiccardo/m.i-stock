'use client';

/**
 * ====================================================================
 * VISTA: BARRA LATERAL DE NAVEGACIÓN DEL ADMINISTRADOR (View Component)
 * ====================================================================
 *
 * Propósito:
 * Proveer el menú de navegación principal para las secciones administrativas:
 * - Métricas (`/admin`)
 * - Gestión de Inventario (`/admingestioninven`)
 * - Inventario Global (`/admininventarioglobal`)
 * - Gestión de Usuarios (`/adminusuarios`)
 * - Configuración (`/adminconfiguracion`)
 * - Enlaces rápidos a Punto de Venta / Caja y cierre de sesión.
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChartBar,
  Package,
  Users,
  Stack,
  ClipboardText,
  Gear,
  SignOut,
  ArrowsLeftRight,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

const adminNavData = [
  { link: '/admin', label: 'Métricas', icon: ChartBar },
  { link: '/admingestioninven', label: 'Gestión de Inventario', icon: Package },
  { link: '/admininventarioglobal', label: 'Inventario Global', icon: Stack },
  { link: '/adminusuarios', label: 'Gestión de Usuarios', icon: Users },
  { link: '/adminauditoria', label: 'Auditoría', icon: ClipboardText },
  { link: '/adminconfiguracion', label: 'Configuración', icon: Gear },
];

interface AdminSidebarProps {
  onNavigate?: () => void;
  className?: string;
}

export function AdminSidebar({ onNavigate, className }: AdminSidebarProps = {}) {
  const pathname = usePathname();

  const activeItem = adminNavData.find((item) => {
    return pathname === item.link || (item.link !== '/admin' && pathname?.startsWith(item.link));
  });
  const activeLabel = activeItem ? activeItem.label : (pathname === '/admin' ? 'Métricas' : '');

  return (
    <nav
      aria-label="Navegación de administración"
      className={cn('flex flex-col h-full bg-background border-r border-border w-64', className)}
    >
      {/* Brand Header unificado */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-border/80">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_1px_2px_rgba(28,36,36,0.14)]">
            <Package className="h-5 w-5" weight="duotone" />
          </div>
          <div>
            <h1 className="text-[15px] font-bold text-foreground tracking-[-0.02em] leading-none">
              M.I Stock
            </h1>
            <span className="text-[11px] font-medium text-muted-foreground mt-0.5 block">
              Administración
            </span>
          </div>
        </div>
        <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground border border-border/80">
          v1.0
        </span>
      </div>

      {/* Nav Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground-subtle">
          Gestión
        </p>

        {adminNavData.map((item) => {
          const Icon = item.icon;
          const isActive = item.label === activeLabel;

          return (
            <Link
              key={item.label}
              href={item.link}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onNavigate?.()}
              className={cn(
                'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-[background-color,color] duration-150',
                isActive
                  ? 'bg-secondary text-secondary-foreground font-semibold'
                  : 'font-medium text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              )}
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-primary"
                />
              )}
              <Icon
                className={cn(
                  'h-[18px] w-[18px] shrink-0',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
                weight={isActive ? 'duotone' : 'regular'}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer User & Session */}
      <div className="p-3 border-t border-border/80 space-y-1">
        <Link
          href="/dashboard"
          onClick={() => onNavigate?.()}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground-secondary hover:bg-muted/80 hover:text-foreground transition-colors"
        >
          <ArrowsLeftRight className="h-4 w-4 text-primary" weight="regular" />
          <span>Punto de Venta / Caja</span>
        </Link>

        <Link
          href="/logout"
          onClick={() => onNavigate?.()}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
        >
          <SignOut className="h-4 w-4" weight="regular" />
          <span>Cerrar Sesión</span>
        </Link>
      </div>
    </nav>
  );
}
