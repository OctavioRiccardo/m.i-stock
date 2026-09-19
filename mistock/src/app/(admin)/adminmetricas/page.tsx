'use client';

/**
 * ====================================================================
 * RUTA: /adminmetricas (Métricas y Reportes de Rendimiento)
 * ====================================================================
 * 
 * Rol en la Arquitectura (Next.js App Router + MVC):
 * Provee la pantalla dedicada a métricas ejecutivas, enlazando
 * `useAdminDashboardController` con `AdminDashboardView`.
 */

import React from 'react';
import { useAdminDashboardController } from '@/controllers/adminControllers/dashboardController';
import { AdminDashboardView } from '@/views/admin/AdminDashboardView';

export default function AdminMetricasPage() {
  const controller = useAdminDashboardController();

  return <AdminDashboardView controller={controller} />;
}

