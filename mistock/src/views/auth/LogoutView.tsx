'use client';

import React from 'react';
import { Paper, Title, Text, Stack, Loader, ThemeIcon, Box } from '@mantine/core';
import { IconLogout } from '@tabler/icons-react';
import { useLogoutController } from '@/controllers/authController';
import classes from './LogoutView.module.css';

interface LogoutViewProps {
  logoutController: ReturnType<typeof useLogoutController>;
}

export function LogoutView({ logoutController }: LogoutViewProps) {
  const { loading } = logoutController;

  return (
    <Box className={classes.container}>
      <Paper radius="lg" p="xl" withBorder className={classes.card}>
        <Stack align="center" gap="md" py="lg">
          <ThemeIcon size="xxl" radius="xl" className={classes.iconWrapper}>
            <IconLogout size={32} />
          </ThemeIcon>

          <Title order={2} className={classes.title}>
            Cerrando Sesión
          </Title>

          <Text size="sm" className={classes.subtitleText}>
            Estamos finalizando tu sesión en miStock de forma segura...
          </Text>

          <Loader color="#318482" size="md" type="dots" mt="xs" />
        </Stack>
      </Paper>
    </Box>
  );
}
