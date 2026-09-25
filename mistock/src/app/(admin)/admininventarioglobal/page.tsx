'use client';

/**
 * ====================================================================
 * RUTA: /admininventarioglobal (Inventario Global por Categorías)
 * ====================================================================
 * 
 * Propósito:
 * Página principal para la consulta, exploración y auditoría del catálogo
 * global de productos organizado por familias de categorías.
 */

import React from 'react';
import { useAdminInventarioGlobalController } from '@/controllers/adminControllers/inventarioGlobalController';
import { AdminInventarioGlobalView } from '@/views/admin/AdminInventarioGlobalView';

export default function AdminInventarioGlobalPage() {
  const controller = useAdminInventarioGlobalController();

  return <AdminInventarioGlobalView controller={controller} />;
}
