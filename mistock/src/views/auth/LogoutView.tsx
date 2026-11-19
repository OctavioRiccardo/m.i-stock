'use client';

/**
 * ====================================================================
 * VISTA: PANTALLA DE CIERRE DE SESIÓN (Patrón MVC - View)
 * ====================================================================
 * 
 * Propósito:
 * Mostrar una pantalla de transición con spinner y mensaje seguro mientras
 * el controlador `useLogoutController` invalida la sesión de Supabase Auth
 * y redirige automáticamente hacia `/login`.
 */

import React from 'react';
import { SignOut, CircleNotch } from '@phosphor-icons/react';
import { useLogoutController } from '@/controllers/authController';
import { Card, CardContent } from '@/components/ui/card';

interface LogoutViewProps {
  logoutController: ReturnType<typeof useLogoutController>;
}

export function LogoutView({ logoutController }: LogoutViewProps) {
  // El controlador ejecuta automáticamente la invalidación de cookies y la redirección
  const { loading } = logoutController;

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="text-center p-6 sm:p-8">
        <CardContent className="flex flex-col items-center justify-center p-0 space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary text-primary">
            <SignOut className="h-7 w-7" weight="duotone" />
          </div>

          <h1 className="text-xl font-bold text-foreground tracking-[-0.02em]">
            Cerrando sesión
          </h1>

          <p className="text-sm text-muted-foreground max-w-xs">
            Finalizando sesión en M.I Stock de forma segura...
          </p>

          <div className="pt-2">
            {loading && <CircleNotch className="h-6 w-6 animate-spin text-primary" aria-label="Cerrando sesión" />}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

