'use client';

import React from 'react';
import { Box, Group, Title, Badge, Button, Container } from '@mantine/core';
import { IconBox, IconChartBar, IconShieldCheck, IconLogout } from '@tabler/icons-react';
import classes from './AdminNavbar.module.css';

export function AdminNavbar() {
  return (
    <Box component="header" className={classes.header}>
      <Container size="xl" h="100%">
        <Group justify="space-between" align="center" h="100%">
          <Group gap="xs">
            <Box className={classes.logoBox}>
              <IconBox size={20} />
            </Box>
            <Title order={3} className={classes.brandTitle}>
              M.I Stock
            </Title>
          </Group>

          <Group gap="xs">
            <Button component="a" href="/admin" size="xs" variant="light" style={{ color: '#1C2424', backgroundColor: '#E2F1F0' }} leftSection={<IconChartBar size={14} />}>
              Métricas & Reportes
            </Button>
            <Button component="a" href="/logout" size="xs" variant="filled" className={classes.logoutBtn} leftSection={<IconLogout size={14} />}>
              Cerrar Sesión
            </Button>
          </Group>
        </Group>
      </Container>
    </Box>
  );
}
