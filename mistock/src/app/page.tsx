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
            <Button size="xs" variant="light" color="indigo" leftSection={<IconPlus size={14} />}>
              Nuevo Producto
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

          {/* Quick Metrics */}
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card padding="lg" radius="md" withBorder style={{ backgroundColor: 'var(--mantine-color-dark-7)', borderColor: 'var(--mantine-color-dark-5)' }}>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Productos en Stock
                  </Text>
                  <ThemeIcon color="indigo" variant="light" radius="md">
                    <IconBox size={18} />
                  </ThemeIcon>
                </Group>
                <Group align="flex-end" gap="xs" mt="md">
                  <Text size="xl" fw={700} style={{ fontSize: '1.8rem' }}>
                    0
                  </Text>
                  <Badge color="gray" size="sm">
                    Tabla: Producto
                  </Badge>
                </Group>
                <Text size="xs" c="dimmed" mt={4}>
                  Catálogo listo para operar
                </Text>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card padding="lg" radius="md" withBorder style={{ backgroundColor: 'var(--mantine-color-dark-7)', borderColor: 'var(--mantine-color-dark-5)' }}>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Categorías
                  </Text>
                  <ThemeIcon color="cyan" variant="light" radius="md">
                    <IconCategory size={18} />
                  </ThemeIcon>
                </Group>
                <Group align="flex-end" gap="xs" mt="md">
                  <Text size="xl" fw={700} style={{ fontSize: '1.8rem' }}>
                    0
                  </Text>
                  <Badge color="cyan" size="sm">
                    Tabla: Categoria
                  </Badge>
                </Group>
                <Text size="xs" c="dimmed" mt={4}>
                  Familia de productos
                </Text>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card padding="lg" radius="md" withBorder style={{ backgroundColor: 'var(--mantine-color-dark-7)', borderColor: 'var(--mantine-color-dark-5)' }}>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Ventas del Mes
                  </Text>
                  <ThemeIcon color="green" variant="light" radius="md">
                    <IconShoppingCart size={18} />
                  </ThemeIcon>
                </Group>
                <Group align="flex-end" gap="xs" mt="md">
                  <Text size="xl" fw={700} style={{ fontSize: '1.8rem' }}>
                    $0.00
                  </Text>
                  <Badge color="green" size="sm">
                    Tabla: Venta
                  </Badge>
                </Group>
                <Text size="xs" c="dimmed" mt={4}>
                  Reporte mensual activo
                </Text>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card padding="lg" radius="md" withBorder style={{ backgroundColor: 'var(--mantine-color-dark-7)', borderColor: 'var(--mantine-color-dark-5)' }}>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Clientes
                  </Text>
                  <ThemeIcon color="orange" variant="light" radius="md">
                    <IconUsers size={18} />
                  </ThemeIcon>
                </Group>
                <Group align="flex-end" gap="xs" mt="md">
                  <Text size="xl" fw={700} style={{ fontSize: '1.8rem' }}>
                    0
                  </Text>
                  <Badge color="orange" size="sm">
                    Tabla: cliente
                  </Badge>
                </Group>
                <Text size="xs" c="dimmed" mt={4}>
                  Padrón de compradores
                </Text>
              </Card>
            </Grid.Col>
          </Grid>

          {/* Core Modules Status */}
          <Grid>
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Paper p="md" radius="md" withBorder style={{ backgroundColor: 'var(--mantine-color-dark-7)', borderColor: 'var(--mantine-color-dark-5)' }}>
                <Group justify="space-between" mb="md">
                  <Title order={4}>Módulos Habilitados en miStock</Title>
                  <ActionIcon variant="light" color="indigo">
                    <IconRefresh size={16} />
                  </ActionIcon>
                </Group>

                <Table highlightOnHover withTableBorder verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Módulo</Table.Th>
                      <Table.Th>Tabla Supabase</Table.Th>
                      <Table.Th>Estado de UI</Table.Th>
                      <Table.Th>Acción</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    <Table.Tr>
                      <Table.Td fw={500}>📦 Gestión de Stock</Table.Td>
                      <Table.Td><Badge variant="outline" color="indigo">Producto</Badge></Table.Td>
                      <Table.Td><Badge color="green" size="sm" leftSection={<IconCheck size={12} />}>Listo (Mantine)</Badge></Table.Td>
                      <Table.Td><Button size="xs" variant="light" color="indigo">Ver Inventario</Button></Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td fw={500}>🏷️ Categorías</Table.Td>
                      <Table.Td><Badge variant="outline" color="cyan">Categoria</Badge></Table.Td>
                      <Table.Td><Badge color="green" size="sm" leftSection={<IconCheck size={12} />}>Listo (Mantine)</Badge></Table.Td>
                      <Table.Td><Button size="xs" variant="light" color="cyan">Crear Categoría</Button></Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td fw={500}>🔄 Movimientos Stock</Table.Td>
                      <Table.Td><Badge variant="outline" color="violet">MovimientoStock</Badge></Table.Td>
                      <Table.Td><Badge color="green" size="sm" leftSection={<IconCheck size={12} />}>Listo (Mantine)</Badge></Table.Td>
                      <Table.Td><Button size="xs" variant="light" color="violet">Historial</Button></Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td fw={500}>📊 Ventas del Mes</Table.Td>
                      <Table.Td><Badge variant="outline" color="green">Venta / DetalleVenta</Badge></Table.Td>
                      <Table.Td><Badge color="green" size="sm" leftSection={<IconCheck size={12} />}>Listo (Mantine)</Badge></Table.Td>
                      <Table.Td><Button size="xs" variant="light" color="green">Ver Reporte</Button></Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td fw={500}>👤 Clientes & Pagos</Table.Td>
                      <Table.Td><Badge variant="outline" color="orange">cliente / Pago</Badge></Table.Td>
                      <Table.Td><Badge color="green" size="sm" leftSection={<IconCheck size={12} />}>Listo (Mantine)</Badge></Table.Td>
                      <Table.Td><Button size="xs" variant="light" color="orange">Administrar</Button></Table.Td>
                    </Table.Tr>
                  </Table.Tbody>
                </Table>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper p="md" radius="md" withBorder style={{ backgroundColor: 'var(--mantine-color-dark-7)', borderColor: 'var(--mantine-color-dark-5)' }}>
                <Title order={4} mb="xs">Librerías de UI Instaladas</Title>
                <Text size="xs" c="dimmed" mb="md">
                  Mantine UI v7 está integrado con PostCSS y Next.js 16 App Router.
                </Text>

                <Stack gap="xs">
                  <Paper p="xs" radius="sm" withBorder style={{ backgroundColor: 'var(--mantine-color-dark-8)' }}>
                    <Text size="xs" fw={700} color="indigo">@mantine/core</Text>
                    <Text size="xs" c="dimmed">Componentes base, Grid, Card, AppShell, Table</Text>
                  </Paper>

                  <Paper p="xs" radius="sm" withBorder style={{ backgroundColor: 'var(--mantine-color-dark-8)' }}>
                    <Text size="xs" fw={700} color="cyan">@mantine/hooks & @mantine/form</Text>
                    <Text size="xs" c="dimmed">Hooks reactivos y validación de formularios</Text>
                  </Paper>

                  <Paper p="xs" radius="sm" withBorder style={{ backgroundColor: 'var(--mantine-color-dark-8)' }}>
                    <Text size="xs" fw={700} color="orange">@tabler/icons-react</Text>
                    <Text size="xs" c="dimmed">Iconografía moderna para interfaz de stock</Text>
                  </Paper>
                </Stack>
              </Paper>
            </Grid.Col>
          </Grid>
        </Stack>
      </AppShell.Main>
    </AppShell>
  );
}
