'use client';

/**
 * ====================================================================
 * RUTA: /adminusuarios (Gestión de Usuarios y Roles RBAC)
 * ====================================================================
 * 
 * Propósito:
 * Pantalla principal para la administración de colaboradores, control
 * de accesos y asignación de roles sincronizados con Supabase.
 */

import React from 'react';
import { useAdminUsuariosController } from '@/controllers/adminControllers/usuariosController';
import { AdminUsuariosView } from '@/views/admin/AdminUsuariosView';

export default function AdminUsuariosPage() {
  const controller = useAdminUsuariosController();

  return <AdminUsuariosView controller={controller} />;
}
