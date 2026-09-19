'use client';

/**
 * ====================================================================
 * RUTA: /admingestioninven (Gestión y Carga de Inventario)
 * ====================================================================
 * 
 * Rol en la Arquitectura (Next.js App Router + MVC):
 * Ensambla el controlador `useAdminInventarioController` con la vista
 * interactiva `AdminGestionInventario` (donde se cumple la regla de que
 * ningún producto existe sin categoría asignada).
 */

import React from 'react';
import { useAdminInventarioController } from '@/controllers/adminControllers/inventarioController';
import { AdminGestionInventario } from '@/views/admin/AdminGestionInventario';

export default function AdminGestionInventarioPage() {
  const controller = useAdminInventarioController();

  return <AdminGestionInventario controller={controller} />;
}

