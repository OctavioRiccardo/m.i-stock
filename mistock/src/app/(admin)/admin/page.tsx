'use client';

/**
 * ====================================================================
 * RUTA: /admin (Panel de Control Principal)
 * ====================================================================
 * 
 * Rol en la Arquitectura (Next.js App Router + MVC):
 * Actúa como punto de entrada y ensamblador:
 * 1. Instancia el controlador administrativo `useAdminDashboardController`.
 * 2. Inyecta el controlador en `AdminDashboardView` para su renderizado declarativo.
 */

import React from 'react';
import { useAdminDashboardController } from '@/controllers/adminControllers/dashboardController';
import { AdminDashboardView } from '@/views/admin/AdminDashboardView';

export default function AdminDashboardPage() {
  const controller = useAdminDashboardController();

  return <AdminDashboardView controller={controller} />;
}

