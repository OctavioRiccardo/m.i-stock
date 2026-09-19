'use client';

/**
 * ====================================================================
 * RUTA: /logout (Ejecución de Cierre de Sesión)
 * ====================================================================
 * 
 * Rol en la Arquitectura (Next.js App Router + MVC):
 * Instancia `useLogoutController(true)` con auto-ejecución inmediata para
 * invalidar las cookies de Supabase y redirigir al login.
 */

import React from 'react';
import { useLogoutController } from '@/controllers/authController';
import { LogoutView } from '@/views/auth/LogoutView';

export default function LogoutPage() {
  const logoutController = useLogoutController(true);

  return <LogoutView logoutController={logoutController} />;
}

