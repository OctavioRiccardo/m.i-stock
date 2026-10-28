'use client';

/**
 * ====================================================================
 * CONTROLADOR DE AUTENTICACIÓN (Patrón MVC para React / Next.js)
 * ====================================================================
 * 
 * Propósito:
 * Encapsular la lógica de negocio y las interacciones con el backend
 * (Supabase Auth) para las operaciones de inicio y cierre de sesión.
 * 
 * Rol en la Arquitectura:
 * - Actúa como intermediario entre las Vistas (LoginFormView, LogoutView)
 *   y los Servicios de Autenticación de Supabase.
 * - Administra el estado reactivo del formulario (valores, validaciones,
 *   estados de carga y mensajes de error amigables).
 * - Centraliza la navegación post-autenticación manteniendo los componentes
 *   de vista como componentes puramente declarativos de presentación.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LoginFormValues } from '@/models/modelos_vista/authModel';
import { RolUsuario } from '@/models/modelos_dominio/userModel';

/**
 * Hook Controlador para el Formulario de Inicio de Sesión.
 */
export function useLoginController() {
  const router = useRouter();

  const [values, setValues] = useState<LoginFormValues>({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof LoginFormValues, string>>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const setFieldValue = <K extends keyof LoginFormValues>(field: K, value: LoginFormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const errors: Partial<Record<keyof LoginFormValues, string>> = {};

    if (!values.email || !/^\S+@\S+$/.test(values.email)) {
      errors.email = 'Correo electrónico no válido';
    }

    if (!values.password || values.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError(null);

    try {
      const emailLower = values.email.trim().toLowerCase();
      const supabase = createClient();

      // 1. Autenticación principal contra Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: emailLower,
        password: values.password,
      });

      if (!authError && data.session) {
        // Consultar el rol y nombre del usuario en public.usuario
        const { data: usuarioData } = await supabase
          .from('usuario')
          .select('rol, nombre')
          .eq('id_usuario', data.session.user.id)
          .maybeSingle();

        // Bloquear acceso si la cuenta no tiene rol asignado
        if (usuarioData?.rol === 'no_rol') {
          await supabase.auth.signOut();
          setError(
            'Su cuenta no posee un rol asignado en el sistema. Solicite a un Administrador que active sus permisos desde Gestión de Usuarios.'
          );
          setLoading(false);
          return;
        }

        const rolAsignado: RolUsuario =
          usuarioData?.rol === 'vendedor'
            ? 'vendedor'
            : emailLower.startsWith('user@')
            ? 'vendedor'
            : 'admin';

        const nombreColaborador =
          usuarioData?.nombre ||
          data.session.user.user_metadata?.full_name ||
          data.session.user.email?.split('@')[0] ||
          'Colaborador';

        if (typeof window !== 'undefined') {
          window.localStorage.setItem('mistock_rol_activo', rolAsignado);
          window.localStorage.setItem(
            'mistock_usuario_activo',
            JSON.stringify({
              id: data.session.user.id,
              email: data.session.user.email,
              nombre: nombreColaborador,
              rol: rolAsignado,
            })
          );
        }

        if (rolAsignado === 'vendedor') {
          router.push('/dashboard');
        } else {
          router.push('/admin');
        }
        router.refresh();
        return;
      }

      // 2. Fallback para colaboradores creados localmente desde el panel de Gestión de Usuarios
      if (typeof window !== 'undefined') {
        try {
          const storedUsersRaw = window.localStorage.getItem('mistock_usuarios_data_test_v1');
          const storedList = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];
          if (Array.isArray(storedList)) {
            const matchedUser = storedList.find(
              (u: {
                email?: string;
                password?: string;
                estado?: string;
                activo?: boolean;
                rol?: string;
                nombre?: string;
                nombreCompleto?: string;
                id?: string;
              }) => u.email && u.email.trim().toLowerCase() === emailLower && u.password
            );

            if (matchedUser) {
              if (matchedUser.password?.trim() !== values.password.trim()) {
                setError('Correo electrónico o contraseña incorrectos.');
                setLoading(false);
                return;
              }

              if (
                matchedUser.estado === 'inactivo' ||
                matchedUser.estado === 'suspendido' ||
                matchedUser.activo === false
              ) {
                setError('Su cuenta de usuario se encuentra suspendida o inactiva.');
                setLoading(false);
                return;
              }

              if (matchedUser.rol === 'no_rol') {
                setError(
                  'Su cuenta no posee un rol asignado en el sistema. Solicite a un Administrador que active sus permisos.'
                );
                setLoading(false);
                return;
              }

              const rolAsignado: RolUsuario = matchedUser.rol === 'admin' ? 'admin' : 'vendedor';
              const nombreColaborador =
                matchedUser.nombre ||
                matchedUser.nombreCompleto ||
                matchedUser.email?.split('@')[0] ||
                'Colaborador';

              window.localStorage.setItem('mistock_rol_activo', rolAsignado);
              window.localStorage.setItem(
                'mistock_usuario_activo',
                JSON.stringify({
                  id: matchedUser.id,
                  email: matchedUser.email,
                  nombre: nombreColaborador,
                  rol: rolAsignado,
                })
              );

              if (rolAsignado === 'vendedor') {
                router.push('/dashboard');
              } else {
                router.push('/admin');
              }
              router.refresh();
              return;
            }
          }
        } catch {}
      }

      // 3. Mostrar error amigable si las credenciales no coincidieron
      if (authError?.message.includes('Invalid login credentials')) {
        setError('Correo electrónico o contraseña incorrectos.');
      } else {
        setError(authError?.message || 'Error al iniciar sesión.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error inesperado de conexión.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    values,
    fieldErrors,
    setFieldValue,
    loading,
    error,
    handleSubmit,
    clearError,
  };
}

/**
 * Limpia las claves de sesión locales almacenadas en el navegador al cerrar sesión.
 */
function limpiarSesionLocal() {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem('mistock_rol_activo');
      window.localStorage.removeItem('mistock_usuario_activo');
    } catch {}
  }
}

/**
 * Hook Controlador para el Cierre de Sesión (Logout).
 */
export function useLogoutController(autoExecute: boolean = true) {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(autoExecute);
  const [loggedOut, setLoggedOut] = useState<boolean>(false);

  const handleLogout = useCallback(async () => {
    setLoading(true);
    try {
      limpiarSesionLocal();
      const supabase = createClient();
      await supabase.auth.signOut();
      setLoggedOut(true);
      router.push('/login');
      router.refresh();
    } catch (err: unknown) {
      console.error('Error al cerrar sesión en Supabase:', err);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!autoExecute) return;

    let isMounted = true;
    const performLogout = async () => {
      try {
        limpiarSesionLocal();
        const supabase = createClient();
        await supabase.auth.signOut();
        if (isMounted) {
          setLoggedOut(true);
          router.push('/login');
          router.refresh();
        }
      } catch (err: unknown) {
        console.error('Error al cerrar sesión automáticamente:', err);
        if (isMounted) {
          router.push('/login');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void performLogout();

    return () => {
      isMounted = false;
    };
  }, [autoExecute, router]);

  return {
    loading,
    loggedOut,
    handleLogout,
  };
}

export const useLogin = useLoginController;
