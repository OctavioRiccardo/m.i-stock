'use client';

import React from 'react';
import { Package, BarChart3, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AdminNavbar() {
  return (
    <header className="h-14 border-b border-[#E8E6DF] bg-white sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2A7A78] text-white">
            <Package className="h-4 w-4" />
          </div>
          <h1 className="text-base font-bold text-[#1C2424]">M.I Stock</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="secondary" size="sm" className="gap-1.5">
            <a href="/admin">
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Métricas & Reportes</span>
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
