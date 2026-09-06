'use client';

import React from 'react';
import {
  Container,
  Title,
  Text,
  Grid,
  Card,
  Group,
  Button,
  Table,
  Badge,
  Stack,
  Alert,
  Paper,
} from '@mantine/core';
import {
  IconChartBar,
  IconAlertTriangle,
  IconUsers,
  IconCheck,
  IconRefresh,
  IconShieldCheck,
  IconBox,
} from '@tabler/icons-react';
import { useAdminDashboardController } from '@/controllers/adminDashboardController';
import classes from './AdminDashboardView.module.css';

interface AdminDashboardViewProps {
  controller: ReturnType<typeof useAdminDashboardController>;
}

export function AdminDashboardView({ controller }: AdminDashboardViewProps) {
  const { data, alertResolvedMsg, handleRestockAlert } = controller;

  return (
    <Container size="xl" py="lg">
      <Stack gap="lg">
        {/* Welcome Header */}
        <Group justify="space-between" align="center">
          <div>
            <Title order={2} className={classes.title}>
              Panel del Administrador
            </Title>
            <Text size="sm" className={classes.textDark}>
              Métricas globales de negocio, control de inventario y supervisión.
            </Text>
          </div>

          <Badge size="lg" radius="md" color="indigo" variant="filled">
            <Group gap={4}>
              <IconShieldCheck size={14} />
              Acceso Ejecutivo Total
            </Group>
          </Badge>
        </Group>

        {/* Action Alert */}
        {alertResolvedMsg && (
          <Alert
            icon={<IconCheck size={18} />}
            title="Acción Registrada"
            color="teal"
            variant="filled"
            radius="md"
          >
            {alertResolvedMsg}
          </Alert>
        )}

        {/* Executive KPI Cards */}
        <Grid>
          {data.kpiMetrics.map((kpi, idx) => (
            <Grid.Col key={idx} span={{ base: 12, sm: 6, md: 3 }}>
              <Card p="md" className={classes.card}>
                <Group justify="space-between">
                  <Text size="xs" fw={700} tt="uppercase" c="black">
                    {kpi.title}
                  </Text>
                  <IconChartBar size={18} color="#318482" />
                </Group>
                <Group align="flex-end" gap="xs" mt="md">
                  <Text size="xl" fw={800} c="black">
                    {kpi.value}
                  </Text>
                  {kpi.changePercentage && (
                    <Badge
                      color={kpi.status === 'positive' ? 'teal' : 'red'}
                      size="sm"
                      variant="light"
                    >
                      {kpi.changePercentage}
                    </Badge>
                  )}
                </Group>
              </Card>
            </Grid.Col>
          ))}
        </Grid>

        {/* Critical Stock Alerts Table */}
        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Card p="md" className={classes.card}>
              <Group justify="space-between" mb="md">
                <Group gap="xs">
                  <IconAlertTriangle size={20} color="#e63946" />
                  <Title order={4} className={classes.title}>
                    Alertas de Stock Crítico ({data.lowStockCount})
                  </Title>
                </Group>
              </Group>

              <Table verticalSpacing="sm" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ color: '#000' }}>Producto</Table.Th>
                    <Table.Th style={{ color: '#000' }}>Categoría</Table.Th>
                    <Table.Th style={{ color: '#000' }}>Stock Actual</Table.Th>
                    <Table.Th style={{ color: '#000' }}>Mínimo Deseado</Table.Th>
                    <Table.Th style={{ color: '#000' }}>Acción</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {data.stockAlerts.map((alert) => (
                    <Table.Tr key={alert.id}>
                      <Table.Td fw={700} style={{ color: '#000' }}>
                        {alert.productName}
                      </Table.Td>
                      <Table.Td style={{ color: '#000' }}>
                        <Badge variant="outline" color="dark">
                          {alert.category}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge color="red" variant="filled">
                          {alert.currentStock} un.
                        </Badge>
                      </Table.Td>
                      <Table.Td fw={600} style={{ color: '#000' }}>
                        {alert.minThreshold} un.
                      </Table.Td>
                      <Table.Td>
                        <Button
                          size="xs"
                          radius="md"
                          className={classes.actionButton}
                          onClick={() => handleRestockAlert(alert.id)}
                          leftSection={<IconRefresh size={12} />}
                        >
                          Reponer Stock
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Card>
          </Grid.Col>

          {/* System Control Card */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card p="md" className={classes.card}>
              <Group justify="space-between" mb="md">
                <Title order={4} className={classes.title}>
                  Control de Usuarios
                </Title>
                <IconUsers size={20} color="#318482" />
              </Group>

              <Stack gap="xs">
                <Paper p="xs" radius="md" style={{ backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.1)' }}>
                  <Group justify="space-between">
                    <div>
                      <Text size="xs" fw={700} c="black">
                        Octavio Riccardo (Dueño)
                      </Text>
                      <Text size="xs" c="dimmed">
                        Rol: Administrador Total
                      </Text>
                    </div>
                    <Badge color="indigo" size="xs">Admin</Badge>
                  </Group>
                </Paper>

                <Paper p="xs" radius="md" style={{ backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.1)' }}>
                  <Group justify="space-between">
                    <div>
                      <Text size="xs" fw={700} c="black">
                        Empleado Turno Mañana
                      </Text>
                      <Text size="xs" c="dimmed">
                        Rol: Cajero / Operador
                      </Text>
                    </div>
                    <Badge color="teal" size="xs">Usuario</Badge>
                  </Group>
                </Paper>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
}
