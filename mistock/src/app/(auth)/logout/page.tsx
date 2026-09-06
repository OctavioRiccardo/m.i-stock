'use client';

import React from 'react';
import { useLogoutController } from '@/controllers/authController';
import { LogoutView } from '@/views/auth/LogoutView';

export default function LogoutPage() {
  const logoutController = useLogoutController(true);

  return <LogoutView logoutController={logoutController} />;
}
