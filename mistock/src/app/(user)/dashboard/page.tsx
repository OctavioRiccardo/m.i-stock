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

import React, { Suspense } from 'react';
import { useUserDashboardController } from '@/controllers/userControllers/userDashboardController';
import { UserDashboardView } from '@/views/user/UserDashboardView';

function DashboardPOSContent() {
  const controller = useUserDashboardController();
  return <UserDashboardView controller={controller} />;
}

export default function UserDashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-[#657373]">Iniciando terminal POS...</div>}>
      <DashboardPOSContent />
    </Suspense>
  );
}

