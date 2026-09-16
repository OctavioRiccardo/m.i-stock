'use client';

import React from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import { useLogoutController } from '@/controllers/authController';
import { Card, CardContent } from '@/components/ui/card';

interface LogoutViewProps {
  logoutController: ReturnType<typeof useLogoutController>;
}

export function LogoutView({ logoutController: _logoutController }: LogoutViewProps) {
  // logoutController handles the signout effect
  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="text-center p-6 sm:p-8">
        <CardContent className="flex flex-col items-center justify-center p-0 space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2A7A78] text-white shadow-md">
            <LogOut className="h-8 w-8" />
          </div>

          <h2 className="text-2xl font-bold text-[#1C2424] tracking-tight">
            Cerrando Sesión
          </h2>

          <p className="text-sm text-[#657373] max-w-xs">
            Estamos finalizando tu sesión en miStock de forma segura...
          </p>

          <div className="pt-2">
            <Loader2 className="h-6 w-6 animate-spin text-[#2A7A78]" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
