'use client';

/**
 * ====================================================================
 * RUTA: /adminconfiguracion (Configuración General del Sistema)
 * ====================================================================
 * 
 * Implementación MVC:
 * - View: AdminConfiguracionView
 * - Controller: useAdminConfiguracionController
 * - Model: configuracionModel
 */

import React from 'react';
import { useAdminConfiguracionController } from '@/controllers/adminControllers/configuracionController';
import { AdminConfiguracionView } from '@/views/admin/AdminConfiguracionView';

export default function AdminConfiguracionPage() {
  const controller = useAdminConfiguracionController();
  return <AdminConfiguracionView controller={controller} />;
}
