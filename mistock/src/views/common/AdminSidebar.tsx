'use client';

import React, { useState } from 'react';
import { Box, Title, Code, Text } from '@mantine/core';
import {
  IconBox,
  IconChartBar,
  IconAlertTriangle,
  IconUsers,
  IconSettings,
  IconLogout,
  IconSwitchHorizontal,
  IconShieldCheck,
} from '@tabler/icons-react';
import classes from './AdminSidebar.module.css';

const adminNavData = [
  { link: '/admin', label: 'Métricas & KPIs', icon: IconChartBar },
  { link: '/admin#alertas', label: 'Alertas de Stock Crítico', icon: IconAlertTriangle },
  { link: '/admin#usuarios', label: 'Gestión de Usuarios', icon: IconUsers },
  { link: '/admin#inventario', label: 'Inventario Global', icon: IconBox },
  { link: '/admin#ajustes', label: 'Configuración', icon: IconSettings },
];

export function AdminSidebar() {
  const [active, setActive] = useState('Métricas & KPIs');

  const links = adminNavData.map((item) => (
    <a
      className={classes.link}
      data-active={item.label === active || undefined}
      href={item.link}
      key={item.label}
      onClick={() => setActive(item.label)}
    >
      <item.icon className={classes.linkIcon} stroke={1.8} />
      <span>{item.label}</span>
    </a>
  ));

  return (
    <nav className={classes.navbar}>
      <div className={classes.navbarMain}>
        {/* Header */}
        <div className={classes.header}>
          <div className={classes.brandBox}>
            <div className={classes.brandLogo}>
              <IconShieldCheck size={22} />
            </div>
            <div>
              <Title order={4} className={classes.brandTitle}>
                miStock
              </Title>
              <Text size="xs" c="white" opacity={0.8}>
                Panel Administrador
              </Text>
            </div>
          </div>
          <Code className={classes.version}>v1.0</Code>
        </div>

        {/* Navigation Links */}
        {links}
      </div>

      {/* Footer */}
      <div className={classes.footer}>
        <a href="/login" className={classes.link}>
          <IconSwitchHorizontal className={classes.linkIcon} stroke={1.8} />
          <span>Cambiar de Rol</span>
        </a>

        <a href="/logout" className={classes.link}>
          <IconLogout className={classes.linkIcon} stroke={1.8} />
          <span>Cerrar Sesión</span>
        </a>
      </div>
    </nav>
  );
}
