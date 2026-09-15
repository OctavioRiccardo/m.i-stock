'use client';

import React from 'react';
import {
  Container,
  Title,
  Text,
  Grid,
  Card,
  Group,
  TextInput,
  Button,
  Table,
  Badge,
  Stack,
  Alert,
  Paper,
  ActionIcon,
} from '@mantine/core';
import {
  IconSearch,
  IconShoppingCart,
  IconBox,
  IconCheck,
  IconClock,
  IconPlus,
} from '@tabler/icons-react';
import { useUserDashboardController } from '@/controllers/userDashboardController';
import classes from './UserDashboardView.module.css';

interface UserDashboardViewProps {
  controller: ReturnType<typeof useUserDashboardController>;
}

export function UserDashboardView({ controller }: UserDashboardViewProps) {
  const {
    data,
    searchQuery,
    setSearchQuery,
    filteredProducts,
    saleSuccessMessage,
    handleQuickSale,
  } = controller;

  return (
    <Container size="xl" py="lg">
      <Stack gap="lg">
        {/* Welcome Header */}
        <Group justify="space-between" align="center">
          <div>
            <Title order={2} className={classes.title}>
              Panel del Empleado
            </Title>
            <Text size="sm" className={classes.textDark}>
              Consulta productos y registra ventas rápidas en el sistema.
            </Text>
          </div>

          <Badge size="lg" radius="md" style={{ backgroundColor: '#2A7A78', color: '#fff' }}>
            Operación Activa
          </Badge>
        </Group>

        {/* Success Alert */}
        {saleSuccessMessage && (
          <Alert
            icon={<IconCheck size={18} />}
            title="¡Venta Exitosa!"
            color="teal"
            variant="filled"
            radius="md"
          >
            {saleSuccessMessage}
          </Alert>
        )}

        {/* Quick Metrics */}
        <Grid>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Card p="md" className={classes.card}>
              <Group justify="space-between">
                <Text size="xs" fw={700} tt="uppercase" c="#657373">
                  Ventas del Día
                </Text>
                <IconShoppingCart size={20} color="#2A7A78" />
              </Group>
              <Text size="xl" fw={800} c="#1C2424" mt="xs">
                {data.dailySalesCount}
              </Text>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Card p="md" className={classes.card}>
              <Group justify="space-between">
                <Text size="xs" fw={700} tt="uppercase" c="#657373">
                  Recaudación Hoy
                </Text>
                <IconBox size={20} color="#2A7A78" />
              </Group>
              <Text size="xl" fw={800} c="#1C2424" mt="xs">
                ${data.dailyRevenue.toLocaleString('es-AR')}
              </Text>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Card p="md" className={classes.card}>
              <Group justify="space-between">
                <Text size="xs" fw={700} tt="uppercase" c="#657373">
                  Productos en Catálogo
                </Text>
                <IconBox size={20} color="#2A7A78" />
              </Group>
              <Text size="xl" fw={800} c="#1C2424" mt="xs">
                {data.totalProductsInStock} ítems
              </Text>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Quick Sale & Product Lookup Section */}
        <Grid>
          <Grid.Col span={{ base: 12, md: 7 }}>
            <Card p="md" className={classes.card}>
              <Group justify="space-between" mb="md">
                <Title order={4} className={classes.title}>
                  Catálogo y Registro Rápido
                </Title>
              </Group>

              <TextInput
                placeholder="Buscar por nombre o código de barra (ej. 779001)..."
                leftSection={<IconSearch size={16} color="#2A7A78" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.currentTarget.value)}
                mb="md"
                classNames={{ input: classes.searchInput }}
              />

              <Table.ScrollContainer minWidth={500}>
                <Table verticalSpacing="sm" highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ color: '#1C2424' }}>Producto</Table.Th>
                      <Table.Th style={{ color: '#1C2424' }}>Precio</Table.Th>
                      <Table.Th style={{ color: '#1C2424' }}>Stock</Table.Th>
                      <Table.Th style={{ color: '#1C2424' }}>Acción</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filteredProducts.map((prod) => (
                      <Table.Tr key={prod.id}>
                        <Table.Td fw={600} style={{ color: '#1C2424' }}>
                          {prod.name}
                          <Text size="xs" c="dimmed">
                            {prod.category} • Cod: {prod.code}
                          </Text>
                        </Table.Td>
                        <Table.Td fw={700} style={{ color: '#1C2424' }}>
                          ${prod.price.toLocaleString('es-AR')}
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={prod.stock > 10 ? 'teal' : 'red'}
                            variant="light"
                            size="sm"
                          >
                            {prod.stock} un.
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Button
                            size="xs"
                            radius="md"
                            className={classes.saleButton}
                            onClick={() => handleQuickSale(prod.id)}
                            leftSection={<IconPlus size={12} />}
                            disabled={prod.stock <= 0}
                          >
                            Vender
                          </Button>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            </Card>
          </Grid.Col>

          {/* Recent Sales Activity */}
          <Grid.Col span={{ base: 12, md: 5 }}>
            <Card p="md" className={classes.card}>
              <Group justify="space-between" mb="md">
                <Title order={4} className={classes.title}>
                  Ventas Recientes
                </Title>
                <IconClock size={18} color="#2A7A78" />
              </Group>

              <Stack gap="xs">
                {data.recentSales.map((sale) => (
                  <Paper
                    key={sale.id}
                    p="xs"
                    radius="md"
                    style={{ backgroundColor: '#ffffff', border: '1px solid #E8E6DF' }}
                  >
                    <Group justify="space-between">
                      <div>
                        <Text size="xs" fw={700} c="#1C2424">
                          {sale.id}
                        </Text>
                        <Text size="xs" c="dimmed">
                          Hora: {sale.time} • {sale.itemCount} ítem(s)
                        </Text>
                      </div>
                      <Text size="sm" fw={800} style={{ color: '#2A7A78' }}>
                        ${sale.totalAmount.toLocaleString('es-AR')}
                      </Text>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
}
