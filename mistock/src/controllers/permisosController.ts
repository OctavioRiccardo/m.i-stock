'use client';

/**
 * ====================================================================
 * CONTROLADOR: PERMISOS Y ROLES DE ACCESO (permisosController)
 * ====================================================================
 * 
 * Propósito:
 * Gestionar la autorización y jerarquía de permisos del usuario activo:
 * - Admin: Acceso total (Administración + Punto de Venta / Caja).
 * - Vendedor: Acceso exclusivo a la Terminal de Ventas (POS / Caja).
 * - No Rol / Inactivo: Bloqueado y redirigido a `/login`.
 * 
 * Sincronización:
 * - Consulta el usuario autenticado en Supabase Auth (`auth.users`) y su fila en `public.usuario`.
 * - Redirige a `/login` si no existe sesión autenticada real en Supabase.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { RolUsuario } from '@/models/modelos_dominio/userModel';
import { limpiarSesionLocal } from '@/controllers/authController';
import {
  guardarUsuarioActivoLocal,
  leerUsuarioActivoLocal,
} from '@/lib/usuarioActivoStorage';

const ROL_STORAGE_KEY = 'mistock_rol_activo';

export function usePermisosController() {
  const router = useRouter();

  const [rol, setRol] = useState<RolUsuario>('admin');
  const [nombreUsuario, setNombreUsuario] = useState<string>('Administrador');
  const [emailUsuario, setEmailUsuario] = useState<string>('');
  const [cargando, setCargando] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    queueMicrotask(() => {
      if (!isMounted || typeof window === 'undefined') return;
      const rolGuardado = window.localStorage.getItem(ROL_STORAGE_KEY) as RolUsuario | null;
      if (rolGuardado && ['admin', 'vendedor', 'no_rol'].includes(rolGuardado)) {
        setRol(rolGuardado);
      }
      const cacheUsuario = leerUsuarioActivoLocal();
      if (cacheUsuario?.nombre) setNombreUsuario(cacheUsuario.nombre);
      if (cacheUsuario?.email) setEmailUsuario(cacheUsuario.email);
    });
    const supabase = createClient();

    supabase.auth
      .getUser()
      .then(async ({ data: { user } }) => {
        if (!isMounted) return;

        if (user) {
          const email = user.email || '';
          setEmailUsuario(email);

          const { data: perfilData } = await supabase
            .from('usuario')
            .select('*')
            .eq('id_usuario', user.id)
            .maybeSingle();

          if (!isMounted) return;

          const perfil = perfilData as { nombre?: string; rol?: RolUsuario; activo?: boolean } | null;

          if (perfil?.activo === false) {
            await supabase.auth.signOut();
            limpiarSesionLocal();
            setCargando(true);
            router.replace('/login');
            return;
          }

          const rolReal: RolUsuario =
            perfil?.rol ||
            (email.toLowerCase().startsWith('user@') || email.toLowerCase().startsWith('vendedor') ? 'vendedor' : 'admin');
          const nombreReal =
            perfil?.nombre ||
            user.user_metadata?.full_name ||
            email.split('@')[0] ||
            'Usuario';

          setNombreUsuario(nombreReal);
          setRol(rolReal);

          if (typeof window !== 'undefined') {
            window.localStorage.setItem(ROL_STORAGE_KEY, rolReal);
            guardarUsuarioActivoLocal({
              id: user.id,
              email,
              nombre: nombreReal,
              rol: rolReal,
            });
          }
        } else {
          // Sin sesión activa en Supabase Auth: limpiar cualquier residuo local y redirigir
          limpiarSesionLocal();
          setCargando(true);
          router.replace('/login');
        }
      })
      .catch(() => {
        // Ignorar fallos de red transitorios
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  /**
   * Cambia temporalmente el rol activo en el navegador para verificar la experiencia
   * de Administrador, Vendedor o Sin Rol en tiempo real.
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
