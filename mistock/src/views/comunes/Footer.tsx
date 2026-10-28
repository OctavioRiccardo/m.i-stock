'use client';

/**
 * ====================================================================
 * COMPONENTE COMÚN: PIE DE PÁGINA (Footer)
 * ====================================================================
 * 
 * Propósito:
 * Pie de página global reutilizado en los layouts de administración y usuario.
 * Provee la marca M.I Stock y el copyright institucional dinámico.
 */

import React from 'react';
import { Package } from '@phosphor-icons/react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-[#E8E6DF] bg-white py-4 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand & Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2A7A78] text-white shadow-sm">
              <Package className="h-4 w-4" weight="duotone" />
            </div>
            <span className="text-sm font-bold text-[#1C2424]">M.I Stock</span>
          </div>

          {/* Copyright */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-[#657373]">
            <span>&copy; {currentYear} M.I Stock. Todos los derechos reservados.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
