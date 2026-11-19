'use client';

/**
 * ====================================================================
 * VISTA: BARRA LATERAL DE NAVEGACIÓN DEL EMPLEADO (View Component)
 * ====================================================================
 *
 * Propósito:
 * Menú lateral exclusivo para el rol de usuario/empleado:
 * accesos directos a ventas, catálogo e historial diario del turno.
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
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

const userNavData = [
  { id: 'caja', link: '/dashboard?tab=caja', label: 'Terminal de Cobro', icon: ShoppingCart },
  { id: 'catalogo', link: '/dashboard?tab=catalogo', label: 'Catálogo de Productos', icon: Package },
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
    <nav
      aria-label="Navegación de punto de venta"
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
              Mostrador POS
            </span>
          </div>
        </div>
        <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground border border-border/80">
          v1.0
        </span>
      </div>

      {/* Nav links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground-subtle">
          Operaciones
        </p>

        {userNavData.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === currentTab;

          return (
            <Link
              key={item.id}
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

      {/* Footer */}
      <div className="p-3 border-t border-border/80 space-y-1">
        {esAdmin && (
          <Link
            href="/admin"
            onClick={() => onNavigate?.()}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground-secondary hover:bg-muted/80 hover:text-foreground transition-colors"
          >
            <ArrowsLeftRight className="h-4 w-4 text-primary" weight="regular" />
            <span>Volver a Administración</span>
          </Link>
        )}

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
