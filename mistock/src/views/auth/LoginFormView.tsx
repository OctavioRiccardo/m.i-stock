'use client';

import React from 'react';
import {
  Paper,
  Title,
  Text,
  TextInput,
  PasswordInput,
  Checkbox,
  Button,
  Group,
  Stack,
  Alert,
  Anchor,
  Box,
  Badge,
  ThemeIcon,
} from '@mantine/core';
import { IconBox, IconMail, IconLock, IconAlertCircle, IconArrowRight } from '@tabler/icons-react';
import { useLoginController } from '@/controllers/authController';
import classes from './LoginFormView.module.css';

interface LoginFormViewProps {
  loginController: ReturnType<typeof useLoginController>;
}

export function LoginFormView({ loginController }: LoginFormViewProps) {
  const { form, loading, error, handleSubmit } = loginController;

  return (
    <Box className={classes.container}>
      <Box className={classes.glowWrapper}>
        {/* Card Component */}
        <Paper radius="lg" p="xl" withBorder className={classes.card}>
          {/* Header */}
          <Stack align="center" gap="xs" mb="lg">
            <Group gap="xs" align="center">
              <ThemeIcon
                size="xl"
                radius="md"
                className={classes.logoIcon}
              >
                <IconBox size={24} />
              </ThemeIcon>
              <Title order={2} className={classes.title}>
                miStock
              </Title>
            </Group>

            <Badge
              style={{ backgroundColor: '#318482', color: '#ffffff' }}
              size="sm"
              radius="xl"
              mt={4}
            >
              Control de Inventario
            </Badge>

            <Text size="sm" ta="center" mt={4} className={classes.subtitleText}>
              Ingresa tus credenciales para acceder a tu panel de control.
            </Text>
          </Stack>

          {/* Alert Message for Auth Errors */}
          {error && (
            <Alert
              icon={<IconAlertCircle size={18} />}
              title="Error de Autenticación"
              color="red"
              variant="light"
              mb="md"
              radius="md"
            >
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <TextInput
                label={<Text size="sm" fw={600} c="black">Correo Electrónico</Text>}
                placeholder="usuario@ejemplo.com"
                leftSection={<IconMail size={16} color="#318482" />}
                size="md"
                radius="md"
                classNames={{ input: classes.customInput }}
                required
                {...form.getInputProps('email')}
              />

              <PasswordInput
                label={<Text size="sm" fw={600} c="black">Contraseña</Text>}
                placeholder="••••••••"
                leftSection={<IconLock size={16} color="#318482" />}
                size="md"
                radius="md"
                classNames={{ input: classes.customInput, innerInput: classes.customInput }}
                required
                {...form.getInputProps('password')}
              />

              <Group justify="space-between" mt={4}>
                <Checkbox
                  label={<Text size="xs" c="black">Recordarme en este equipo</Text>}
                  size="xs"
                  styles={{
                    input: { cursor: 'pointer' },
                  }}
                  {...form.getInputProps('rememberMe', { type: 'checkbox' })}
                />
                <Anchor href="#" size="xs" c="black" fw={700} underline="hover">
                  ¿Olvidaste tu contraseña?
                </Anchor>
              </Group>

              <Button
                type="submit"
                fullWidth
                size="md"
                radius="md"
                loading={loading}
                rightSection={<IconArrowRight size={18} />}
                mt="xs"
                className={classes.submitButton}
              >
                Iniciar Sesión
              </Button>
            </Stack>
          </form>

          {/* Footer note */}
          <Text size="xs" ta="center" mt="xl" className={classes.subtitleText}>
            ¿No tienes una cuenta aún?{' '}
            <Anchor href="#" size="xs" c="black" fw={700} underline="hover">
              Contacta al administrador
            </Anchor>
          </Text>
        </Paper>
      </Box>
    </Box>
  );
}
