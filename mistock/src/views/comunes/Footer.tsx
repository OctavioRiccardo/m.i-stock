'use client';

/**
 * ====================================================================
 * COMPONENTE COMÚN: PIE DE PÁGINA (Footer)
 * ====================================================================
 */

import React from 'react';
import { Package } from '@phosphor-icons/react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border/80 bg-background py-4 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Brand & Logo unificado */}
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Package className="h-3.5 w-3.5" weight="duotone" />
            </div>
            <span className="text-xs font-bold text-foreground tracking-tight">M.I Stock</span>
          </div>

          {/* Copyright */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span>&copy; {currentYear} M.I Stock. Todos los derechos reservados.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
