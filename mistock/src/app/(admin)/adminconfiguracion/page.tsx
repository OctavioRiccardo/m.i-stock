'use client';

/**
 * ====================================================================
 * RUTA: /adminconfiguracion (Configuración del Sistema - En Progreso)
 * ====================================================================
 */

import React from 'react';
import { EnProgresoView } from '@/views/admin/EnProgresoView';

export default function AdminConfiguracionPage() {
  return (
    <EnProgresoView
      seccion="Configuración"
      icono="configuracion"
    />
  );
}
