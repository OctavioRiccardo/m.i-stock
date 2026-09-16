'use client';

import React from 'react';
import { useUserDashboardController } from '@/controllers/userControllers/userDashboardController';
import { UserDashboardView } from '@/views/user/UserDashboardView';

export default function UserDashboardPage() {
  const controller = useUserDashboardController();

  return <UserDashboardView controller={controller} />;
}
