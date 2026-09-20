'use client';

/**
 * ====================================================================
 * RUTA: /adminusuarios (Gestión de Usuarios - En Progreso)
 * ====================================================================
 */

import React from 'react';
import { EnProgresoView } from '@/views/admin/EnProgresoView';

export default function AdminUsuariosPage() {
  return (
    <EnProgresoView
      seccion="Gestión de Usuarios"
      icono="usuarios"
    />
  );
}
