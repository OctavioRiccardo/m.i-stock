'use client';

import React from 'react';
import { useAdminDashboardController } from '@/controllers/adminControllers/dashboardController';
import { AdminDashboardView } from '@/views/admin/AdminDashboardView';

export default function AdminDashboardPage() {
  const controller = useAdminDashboardController();

  return <AdminDashboardView controller={controller} />;
}
