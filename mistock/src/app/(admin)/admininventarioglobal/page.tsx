'use client';

/**
 * ====================================================================
 * RUTA: /admininventarioglobal (Inventario Global - En Progreso)
 * ====================================================================
 */

import React from 'react';
import { EnProgresoView } from '@/views/admin/EnProgresoView';

export default function AdminInventarioGlobalPage() {
  return (
    <EnProgresoView
      seccion="Inventario Global"
      icono="inventario"
    />
  );
}
