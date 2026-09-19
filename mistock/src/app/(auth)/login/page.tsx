'use client';

/**
 * ====================================================================
 * RUTA: /login (Pantalla de Acceso / Autenticación)
 * ====================================================================
 * 
 * Rol en la Arquitectura (Next.js App Router + MVC):
 * Instancia el hook `useLoginController` y lo suministra a `LoginFormView`.
 */

import React from 'react';
import { useLoginController } from '@/controllers/authController';
import { LoginFormView } from '@/views/auth/LoginFormView';

export default function LoginPage() {
  const loginController = useLoginController();

  return <LoginFormView loginController={loginController} />;
}

