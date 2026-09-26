'use client';

/**
 * ====================================================================
 * CONTROLADOR: CONTROL DE ACCESO BASADO EN ROLES (RBAC Controller)
 * ====================================================================
 * 
 * Propósito:
 * Gestionar la autorización y jerarquía de permisos del usuario activo:
 * - Admin: Acceso total (Administración + Punto de Venta / Caja).
 * - Vendedor: Acceso exclusivo a la Terminal de Ventas (POS / Caja).
 * - No Rol: Bloqueado a la espera de autorización.
 * 
 * Sincronización:
 * - Consulta el usuario autenticado en Supabase Auth (`auth.users`) y su fila en `public.usuario`.
 * - Permite alternar el rol simulado en entorno de desarrollo/pruebas mediante `localStorage`.
 */

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RolUsuario } from '@/models/modelos_dominio/userModel';

const ROL_STORAGE_KEY = 'mistock_rol_activo';

export function useRBAC() {
  const [rol, setRol] = useState<RolUsuario>(() => {
    if (typeof window === 'undefined') return 'admin';
    const rolSimulado = window.localStorage.getItem(ROL_STORAGE_KEY) as RolUsuario | null;
    if (rolSimulado && ['admin', 'vendedor', 'no_rol'].includes(rolSimulado)) {
      return rolSimulado;
    }
    return 'admin';
  });

  const [nombreUsuario, setNombreUsuario] = useState<string>('Administrador');
  const [emailUsuario, setEmailUsuario] = useState<string>('admin@mistock.com');
  const [cargando] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    // Comprobar sesión de Supabase Auth
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!isMounted) return;

      if (user) {
        setEmailUsuario(user.email || '');

        const { data: perfil } = await supabase
          .from('usuario')
          .select('nombre, rol')
          .eq('id_usuario', user.id)
          .maybeSingle();

        if (!isMounted) return;

        if (perfil) {
          setNombreUsuario(perfil.nombre || user.email || 'Usuario');
          // Si no hay override de prueba en localStorage, aplicar el rol de BD
          const override = window.localStorage.getItem(ROL_STORAGE_KEY);
          if (!override) {
            setRol(perfil.rol as RolUsuario);
          }
        } else {
          const override = window.localStorage.getItem(ROL_STORAGE_KEY);
          if (!override) {
            setRol('no_rol');
          }
        }
      }
    }).catch(() => {
      // Ignorar errores silenciosamente en entorno offline
    });

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Cambia temporalmente el rol activo en el navegador para verificar la experiencia
   * de Administrador, Vendedor o Sin Rol en tiempo real sin salir del sistema.
   */
  const cambiarRolSimulado = (nuevoRol: RolUsuario) => {
    setRol(nuevoRol);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ROL_STORAGE_KEY, nuevoRol);
    }
  };

  const esAdmin = rol === 'admin';
  const esVendedor = rol === 'vendedor';
  const esSinRol = rol === 'no_rol';

  return {
    rol,
    esAdmin,
    esVendedor,
    esSinRol,
    cargando,
    nombreUsuario,
    emailUsuario,
    cambiarRolSimulado,
  };
}
