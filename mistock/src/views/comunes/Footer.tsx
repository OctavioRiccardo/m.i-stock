'use client';

import React from 'react';
import { Box, Container, Group, Text, Anchor } from '@mantine/core';
import { IconBox } from '@tabler/icons-react';
import classes from './Footer.module.css';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <Box component="footer" className={classes.footer} py="md">
      <Container size="lg">
        <Group justify="space-between" align="center" wrap="wrap" gap="md">
          {/* Brand & Tagline */}
          <Group gap="xs">
            <Box className={classes.logoBadge}>
              <IconBox size={16} />
            </Box>
            <Text fw={700} size="sm" c="#1C2424">
              miStock
            </Text>
          </Group>
          {/* Links & Copyright */}
          <Group gap="lg" wrap="wrap">
            <Text size="xs" c="#657373">
              &copy; {currentYear} miStock Inc. Todos los derechos reservados.
            </Text>
            <Group gap="md">
              <Anchor href="#" size="xs" c="#657373" underline="hover">
                Soporte
              </Anchor>
              <Anchor href="#" size="xs" c="#657373" underline="hover">
                Privacidad
              </Anchor>
              <Anchor href="#" size="xs" c="#657373" underline="hover">
                Términos
              </Anchor>
            </Group>
          </Group>
        </Group>
      </Container>
    </Box>
  );
}
