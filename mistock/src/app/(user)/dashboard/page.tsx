'use client';

/**
 * ====================================================================
 * RUTA: /dashboard (Punto de Venta / Panel del Empleado)
 * ====================================================================
 * 
 * Rol en la Arquitectura (Next.js App Router + MVC):
 * Ensambla el controlador `useUserDashboardController` con `UserDashboardView`,
 * habilitando la búsqueda rápida de artículos y el checkout ágil de ventas.
 */

import React from 'react';
import { useUserDashboardController } from '@/controllers/userControllers/userDashboardController';
import { UserDashboardView } from '@/views/user/UserDashboardView';

export default function UserDashboardPage() {
  const controller = useUserDashboardController();

  return <UserDashboardView controller={controller} />;
}

