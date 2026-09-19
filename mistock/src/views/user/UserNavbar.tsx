'use client';

/**
 * ====================================================================
 * VISTA: BARRA SUPERIOR DE NAVEGACIÓN DEL EMPLEADO (View Component)
 * ====================================================================
 * 
 * Propósito:
 * Encabezado horizontal para el espacio operativo de empleados/cajeros:
 * distintivo de 'Panel Empleado', acceso al catálogo y acción de cierre de sesión.
 */

import React from 'react';
import { Package, ShoppingCart, LogOut, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/**
 * Barra superior fija para el área de operaciones del empleado.
 */
export function UserNavbar() {
  return (
    <header className="h-14 border-b border-[#E8E6DF] bg-white sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2A7A78] text-white">
            <Package className="h-4 w-4" />
          </div>
          <h1 className="text-base font-bold text-[#1C2424]">miStock</h1>
          <Badge variant="default" className="gap-1">
            <UserCheck className="h-3 w-3" />
            <span>Panel Empleado</span>
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="secondary" size="sm" className="gap-1.5">
            <a href="/dashboard">
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>Ventas y Stock</span>
            </a>
          </Button>

          <Button asChild size="sm" className="gap-1.5">
            <a href="/logout">
              <LogOut className="h-3.5 w-3.5" />
              <span>Cerrar Sesión</span>
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
