'use client';

import React from 'react';
import { useAdminDashboardController } from '@/controllers/adminControllers/adminDashboardController';
import { AdminGestionInventario } from '@/views/admin/AdminGestionInventario';

export default function AdminGestionInventarioPage() {
  const controller = useAdminDashboardController();

  return <AdminGestionInventario controller={controller} />;
}
