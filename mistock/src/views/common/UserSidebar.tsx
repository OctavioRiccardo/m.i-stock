'use client';

import React, { useState } from 'react';
import { Box, Title, Code, Group, Badge, Text } from '@mantine/core';
import {
  IconBox,
  IconShoppingCart,
  IconReceipt2,
  IconListCheck,
  IconLogout,
  IconUserCheck,
  IconSwitchHorizontal,
} from '@tabler/icons-react';
import classes from './UserSidebar.module.css';

const userNavData = [
  { link: '/dashboard', label: 'Ventas y Operación', icon: IconShoppingCart },
  { link: '/dashboard#productos', label: 'Catálogo de Productos', icon: IconBox },
  { link: '/dashboard#historial', label: 'Historial del Día', icon: IconReceipt2 },
  { link: '/dashboard#resumen', label: 'Resumen de Stock', icon: IconListCheck },
];

export function UserSidebar() {
  const [active, setActive] = useState('Ventas y Operación');

  const links = userNavData.map((item) => (
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
              <IconBox size={20} />
            </div>
            <div>
              <Title order={4} className={classes.brandTitle}>
                miStock
              </Title>
              <Text size="xs" c="white" opacity={0.8}>
                Panel Empleado
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
