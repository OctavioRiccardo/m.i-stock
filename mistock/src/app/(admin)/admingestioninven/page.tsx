'use client';

import React from 'react';
import { useAdminInventarioController } from '@/controllers/adminControllers/inventarioController';
import { AdminGestionInventario } from '@/views/admin/AdminGestionInventario';

export default function AdminGestionInventarioPage() {
  const controller = useAdminInventarioController();

  return <AdminGestionInventario controller={controller} />;
}
