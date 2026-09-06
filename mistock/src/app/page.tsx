'use client';

import React from 'react';
import AuthLayout from '@/app/(auth)/layout';
import LoginPage from '@/app/(auth)/login/page';

export default function Home() {
  return (
    <AuthLayout>
      <LoginPage />
    </AuthLayout>
  );
}
