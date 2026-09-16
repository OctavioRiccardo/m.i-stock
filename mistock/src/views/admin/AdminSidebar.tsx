'use client';

import React, { useState } from 'react';
import { Title, Code, Text } from '@mantine/core';
import { IconBox, IconChartBar, IconAlertTriangle, IconUsers, IconSettings, IconLogout, IconSwitchHorizontal, IconShieldCheck, } from '@tabler/icons-react';
import { usePathname } from 'next/navigation';
import classes from './AdminSidebar.module.css';

const adminNavData = [
  { link: '/admin#', label: 'Métricas & KPIs', icon: IconChartBar },
  { link: '/admingestioninven#', label: 'Gestion Inventario', icon: IconBox },
  { link: '/', label: 'Gestión de Usuarios', icon: IconUsers },
  { link: '/', label: 'Inventario Global', icon: IconBox },
  { link: '/', label: 'Stock Crítico', icon: IconAlertTriangle },
  { link: '/', label: 'Configuración', icon: IconSettings },
];

interface AdminSidebarProps { onNavigate?: () => void; }

export function AdminSidebar({ onNavigate }: AdminSidebarProps = {}) {
  const pathname = usePathname();
  const activeLabel = pathname?.includes('admingestioninven')
    ? 'Gestion Inventario'
    : 'Métricas & KPIs';
  const [active, setActive] = useState(activeLabel);

  const handleLinkClick = (label: string) => { setActive(label); onNavigate?.(); };

  const links = adminNavData.map((item) => (
    <a className={classes.link} data-active={item.label === active || undefined} href={item.link} key={item.label} onClick={() => handleLinkClick(item.label)}>
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
                M.I Stock
              </Title>
            </div>
          </div>
          <Code className={classes.version}>v1.0</Code>
        </div>
        {links}
      </div>

      <div className={classes.footer}>
        <a href="/login" className={classes.link} onClick={() => onNavigate?.()}>
          <IconSwitchHorizontal className={classes.linkIcon} stroke={1.8} />
          <span>Cambiar de Rol</span>
        </a>
        <a href="/logout" className={classes.link} onClick={() => onNavigate?.()}>
          <IconLogout className={classes.linkIcon} stroke={1.8} />
          <span>Cerrar Sesión</span>
        </a>
      </div>
    </nav>
  );
}
