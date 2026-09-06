'use client';

import React from 'react';
import { useLoginController } from '@/controllers/authController';
import { LoginFormView } from '@/views/auth/LoginFormView';

export default function LoginPage() {
  const loginController = useLoginController();

  return <LoginFormView loginController={loginController} />;
}
