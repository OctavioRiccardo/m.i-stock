'use client';

/**
 * ====================================================================
 * RUTA: /adminauditoria (Auditoría Centralizada del Sistema)
 * ====================================================================
 *
 * Rol en la Arquitectura (Next.js App Router + MVC):
 * Ensambla `useAdminAuditoriaController` con `AdminAuditoriaView`.
 */

import React from 'react';
import { useAdminAuditoriaController } from '@/controllers/adminControllers/auditoriaController';
import { AdminAuditoriaView } from '@/views/admin/AdminAuditoriaView';

export default function AdminAuditoriaPage() {
  const controller = useAdminAuditoriaController();
  return <AdminAuditoriaView controller={controller} />;
}
