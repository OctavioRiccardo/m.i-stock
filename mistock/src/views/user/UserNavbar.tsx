'use client';

import React from 'react';
import { Box, Group, Title, Badge, Button, Container } from '@mantine/core';
import { IconBox, IconShoppingCart, IconLogout, IconUserCheck } from '@tabler/icons-react';
import classes from './UserNavbar.module.css';

export function UserNavbar() {
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
            <Badge color="teal" variant="filled" size="sm" radius="sm">
              <Group gap={4}>
                <IconUserCheck size={12} />
                Panel Empleado
              </Group>
            </Badge>
          </Group>

          {/* User Quick Actions */}
          <Group gap="sm">
            <Button
              component="a"
              href="/dashboard"
              size="xs"
              variant="light"
              style={{ color: '#000000', backgroundColor: '#e5e3cd' }}
              leftSection={<IconShoppingCart size={14} />}
            >
              Ventas y Stock
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
