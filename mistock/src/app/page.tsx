'use client';

import React from 'react';
import {
  AppShell,
  Group,
  Title,
  Text,
  Badge,
  Grid,
  Card,
  Button,
  Table,
  ActionIcon,
  ThemeIcon,
  RingProgress,
  Stack,
  Paper,
  Box,
} from '@mantine/core';
import {
  IconBox,
  IconCategory,
  IconShoppingCart,
  IconUsers,
  IconArrowUpRight,
  IconAlertTriangle,
  IconPlus,
  IconRefresh,
  IconCheck,
  IconChartBar,
} from '@tabler/icons-react';

export default function Home() {
  return (
    <AppShell
      header={{ height: 60 }}
      padding="md"
      style={{ backgroundColor: 'var(--mantine-color-dark-8)' }}
    >
      <AppShell.Header style={{ backgroundColor: 'var(--mantine-color-dark-7)', borderColor: 'var(--mantine-color-dark-5)' }}>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="xs">
            <ThemeIcon size="lg" radius="md" variant="gradient" gradient={{ from: 'indigo', to: 'cyan' }}>
              <IconBox size={20} />
            </ThemeIcon>
            <Title order={3} style={{ color: 'var(--mantine-color-white)' }}>
              miStock
            </Title>
            <Badge color="indigo" variant="light" size="sm">
              Mantine UI v7
            </Badge>
          </Group>

          <Group gap="xs">
            <Badge color="green" variant="dot" size="md">
              Supabase Conectado
            </Badge>
            <Button component="a" href="/login" size="xs" variant="outline" color="indigo">
              Iniciar Sesión
            </Button>
            <Button component="a" href="/logout" size="xs" variant="filled" style={{ backgroundColor: '#318482', color: '#ffffff' }}>
              Cerrar Sesión
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Stack gap="lg" mt="xs">
          {/* Welcome Banner */}
          <Paper p="xl" radius="md" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)', border: '1px solid var(--mantine-color-indigo-9)' }}>
            <Group justify="space-between" align="flex-start">
              <div>
                <Badge color="indigo" variant="filled" size="sm" mb="xs">
                  Panel del Propietario
                </Badge>
                <Title order={2} style={{ color: 'var(--mantine-color-white)' }}>
                  Gestión de Stock y Ventas
                </Title>
                <Text color="dimmed" size="sm" mt={4} style={{ maxWidth: 600 }}>
                  Bienvenido a miStock. Mantine UI v7 ha sido instalado y configurado correctamente para gestionar inventario, categorías, ventas y clientes de tu negocio.
                </Text>
              </div>

              <Group gap="xs">
                <Button size="sm" variant="filled" color="indigo" leftSection={<IconPlus size={16} />}>
                  Registrar Venta
                </Button>
              </Group>
            </Group>
          </Paper>

        </Stack>
      </AppShell.Main>
    </AppShell>
  );
}
