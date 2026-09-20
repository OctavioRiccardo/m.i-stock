'use client';

/**
 * ====================================================================
 * RUTA: /adminstockcritico (Stock Crítico - En Progreso)
 * ====================================================================
 */

import React from 'react';
import { EnProgresoView } from '@/views/admin/EnProgresoView';

export default function AdminStockCriticoPage() {
  return (
    <EnProgresoView
      seccion="Stock Crítico"
      icono="stock"
    />
  );
}
