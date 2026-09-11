'use client';

import React from 'react';
import { AppShell, Burger, Group, Box, Title, Badge } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconShieldCheck } from '@tabler/icons-react';
import { AdminSidebar } from '@/views/admin/AdminSidebar';
import { Footer } from '@/views/common/Footer';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [opened, { toggle, close }] = useDisclosure();

  return (
    <AppShell
      header={{ height: { base: 60, sm: 0 } }}
      navbar={{
        width: 280,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="0"
      style={{ minHeight: '100vh', backgroundColor: '#dad7c3' }}
    >
      {/* Header superior para móvil con botón de hamburguesa */}
      <AppShell.Header
        hiddenFrom="sm"
        style={{
          backgroundColor: '#318482',
          borderBottom: '1px solid rgba(0, 0, 0, 0.15)',
        }}
      >
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger
              opened={opened}
              onClick={toggle}
              size="sm"
              color="#ffffff"
              aria-label="Abrir menú de navegación"
            />
            <Group gap="xs">
              <Box
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: '#ffffff',
                  color: '#318482',
                }}
              >
                <IconShieldCheck size={20} />
              </Box>
              <Title order={4} style={{ color: '#ffffff', fontWeight: 800 }}>
                miStock
              </Title>
              <Badge color="indigo" variant="filled" size="xs">
                Admin
              </Badge>
            </Group>
          </Group>
        </Group>
      </AppShell.Header>

      {/* Barra lateral de navegación */}
      <AppShell.Navbar
        style={{
          backgroundColor: '#318482',
          borderRight: '1px solid rgba(0, 0, 0, 0.15)',
        }}
      >
        <AdminSidebar onNavigate={close} />
      </AppShell.Navbar>

      {/* Contenedor principal con footer */}
      <AppShell.Main
        style={{
          backgroundColor: '#dad7c3',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <Box component="main" style={{ flex: 1, paddingBottom: 24 }}>
          {children}
        </Box>
        <Footer />
      </AppShell.Main>
    </AppShell>
  );
}
