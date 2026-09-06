'use client';

import React from 'react';
import { Box, Group, Title, Badge, Button, Container } from '@mantine/core';
import { IconBox, IconChartBar, IconShieldCheck, IconUsers, IconLogout } from '@tabler/icons-react';
import classes from './AdminNavbar.module.css';

export function AdminNavbar() {
  return (
    <Box component="header" className={classes.header}>
      <Container size="xl" h="100%">
        <Group justify="space-between" align="center" h="100%">
          {/* Logo & Brand */}
          <Group gap="xs">
            <Box className={classes.logoBox}>
              <IconBox size={20} />
            </Box>
            <Title order={3} className={classes.brandTitle}>
              miStock
            </Title>
            <Badge color="indigo" variant="filled" size="sm" radius="sm">
              <Group gap={4}>
                <IconShieldCheck size={12} />
                Panel Administrador
              </Group>
            </Badge>
          </Group>

          {/* Admin Navigation */}
          <Group gap="xs">
            <Button
              component="a"
              href="/admin"
              size="xs"
              variant="light"
              style={{ color: '#000000', backgroundColor: '#e5e3cd' }}
              leftSection={<IconChartBar size={14} />}
            >
              Métricas & Reportes
            </Button>

            <Button
              component="a"
              href="/logout"
              size="xs"
              variant="filled"
              className={classes.logoutBtn}
              leftSection={<IconLogout size={14} />}
            >
              Cerrar Sesión
            </Button>
          </Group>
        </Group>
      </Container>
    </Box>
  );
}
