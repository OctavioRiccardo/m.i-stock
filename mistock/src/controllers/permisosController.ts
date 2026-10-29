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
 * - No Rol: Bloqueado a la espera de autorización.
 * 
 * Sincronización:
 * - Consulta el usuario autenticado en Supabase Auth (`auth.users`) y su fila en `public.usuario`.
 * - Redirige a `/login` si no existe ninguna sesión activa válida.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { RolUsuario } from '@/models/modelos_dominio/userModel';

const ROL_STORAGE_KEY = 'mistock_rol_activo';
const USUARIO_STORAGE_KEY = 'mistock_usuario_activo';

export function usePermisosController() {
  const router = useRouter();

  const [rol, setRol] = useState<RolUsuario>(() => {
    if (typeof window === 'undefined') return 'admin';
    const rolGuardado = window.localStorage.getItem(ROL_STORAGE_KEY) as RolUsuario | null;
    if (rolGuardado && ['admin', 'vendedor', 'no_rol'].includes(rolGuardado)) {
      return rolGuardado;
    }
    return 'admin';
  });

  const [nombreUsuario, setNombreUsuario] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(USUARIO_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.nombre) return parsed.nombre;
        }
      } catch {}
    }
    return 'Administrador';
  });

  const [emailUsuario, setEmailUsuario] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(USUARIO_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.email) return parsed.email;
        }
      } catch {}
    }
    return '';
  });

  const [cargando, setCargando] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    supabase.auth
      .getUser()
      .then(async ({ data: { user } }) => {
        if (!isMounted) return;

        if (user) {
          const email = user.email || '';
          setEmailUsuario(email);

          const { data: perfil } = await supabase
            .from('usuario')
            .select('nombre, rol')
            .eq('id_usuario', user.id)
            .maybeSingle();

          if (!isMounted) return;

          const rolReal: RolUsuario =
            (perfil?.rol as RolUsuario) ||
            (email.toLowerCase().startsWith('user@') ? 'vendedor' : 'admin');
          const nombreReal =
            perfil?.nombre ||
            user.user_metadata?.full_name ||
            email.split('@')[0] ||
            'Usuario';

          setNombreUsuario(nombreReal);
          setRol(rolReal);

          if (typeof window !== 'undefined') {
            window.localStorage.setItem(ROL_STORAGE_KEY, rolReal);
            window.localStorage.setItem(
              USUARIO_STORAGE_KEY,
              JSON.stringify({
                id: user.id,
                email,
                nombre: nombreReal,
                rol: rolReal,
              })
            );
          }
        } else if (typeof window !== 'undefined') {
          // Verificar si hay sesión local activa de colaborador
          const localUser = window.localStorage.getItem(USUARIO_STORAGE_KEY);
          if (!localUser) {
            setCargando(true);
            router.replace('/login');
          }
        }
      })
      .catch(() => {
        // Ignorar fallos de red transitorios si hay sesión local
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
