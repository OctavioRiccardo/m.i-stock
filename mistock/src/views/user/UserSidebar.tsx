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

import React, { useState } from 'react';
import {
  ShoppingCart,
  Package,
  Receipt,
  ListCheck,
  ArrowLeftRight,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Enlaces de navegación rápida para la operativa de ventas.
 */
const userNavData = [
  { link: '/dashboard', label: 'Ventas y Operación', icon: ShoppingCart },
  { link: '/dashboard#productos', label: 'Catálogo de Productos', icon: Package },
  { link: '/dashboard#historial', label: 'Historial del Día', icon: Receipt },
  { link: '/dashboard#resumen', label: 'Resumen de Stock', icon: ListCheck },
];


interface UserSidebarProps {
  onNavigate?: () => void;
  className?: string;
}

export function UserSidebar({ onNavigate, className }: UserSidebarProps = {}) {
  const [active, setActive] = useState('Ventas y Operación');

  return (
    <nav className={cn('flex flex-col h-full bg-white border-r border-[#E8E6DF] w-64', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-[#E8E6DF]">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2A7A78] text-white shadow-sm">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-[#1C2424] tracking-tight leading-none">
              miStock
            </h1>
            <span className="text-[11px] font-medium text-[#657373]">Panel Empleado</span>
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
          const isActive = item.label === active;

          return (
            <a
              key={item.label}
              href={item.link}
              onClick={() => {
                setActive(item.label);
                onNavigate?.();
              }}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-[#2A7A78] text-white shadow-sm'
                  : 'text-[#657373] hover:bg-black/5 hover:text-[#1C2424]'
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-[#657373]')} />
              <span>{item.label}</span>
            </a>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[#E8E6DF] space-y-1">
        <a
          href="/login"
          onClick={() => onNavigate?.()}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#657373] hover:bg-black/5 hover:text-[#1C2424] transition-colors"
        >
          <ArrowLeftRight className="h-4 w-4" />
          <span>Cambiar de Rol</span>
        </a>

        <a
          href="/logout"
          onClick={() => onNavigate?.()}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Cerrar Sesión</span>
        </a>
      </div>
    </nav>
  );
}
