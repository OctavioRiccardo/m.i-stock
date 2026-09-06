'use client';

import React from 'react';
import { useAdminDashboardController } from '@/controllers/adminDashboardController';
import { AdminDashboardView } from '@/views/admin/AdminDashboardView';

export default function AdminDashboardPage() {
  const controller = useAdminDashboardController();

  return <AdminDashboardView controller={controller} />;
}
