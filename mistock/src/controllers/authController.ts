'use client';

/**
 * ====================================================================
 * CONTROLADOR DE AUTENTICACIÓN (Patrón MVC para React / Next.js)
 * ====================================================================
 * 
 * Propósito:
 * Encapsular la lógica de negocio y las interacciones con el backend
 * (Supabase Auth) para las operaciones de inicio y cierre de sesión,
 * garantizando que no existan cuentas ficticias ni contraseñas en texto
 * plano almacenadas en el navegador.
 * 
 * Rol en la Arquitectura:
 * - Actúa como intermediario entre las Vistas (LoginFormView, LogoutView)
 *   y los Servicios de Autenticación de Supabase.
 * - Administra el estado reactivo del formulario (valores, validaciones,
 *   estados de carga y mensajes de error amigables).
 * - Limpia la totalidad de cachés operativas al cerrar sesión.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LoginFormValues } from '@/models/modelos_vista/authModel';
import { RolUsuario } from '@/models/modelos_dominio/userModel';
import { LIMITES_TEXTO, esEmailValido } from '@/lib/validaciones';
import { inventarioService, INVENTARIO_STORAGE_KEY } from '@/services/inventarioService';

/**
 * Limpia todas las claves de sesión y cachés de datos en el navegador al cerrar sesión.
 */
export function limpiarSesionLocal() {
  inventarioService.limpiarCacheLocal();
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem('mistock_rol_activo');
      window.localStorage.removeItem('mistock_usuario_activo');
      window.localStorage.removeItem(INVENTARIO_STORAGE_KEY);
      window.localStorage.removeItem('mistock_usuarios_data_test_v1');
      window.localStorage.removeItem('mistock_ventas_historial_test_v1');
      window.localStorage.removeItem('mistock_sesion_caja_v1');
      window.localStorage.removeItem('mistock_configuracion_v1');
      window.localStorage.removeItem('mistock_configuracion_global_v1');
      window.localStorage.removeItem('mistock_ultimo_respaldo_csv');
    } catch {}
  }
}

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

    if (!esEmailValido(values.email)) {
      errors.email = 'Ingresa un correo electrónico con formato válido (ej. usuario@dominio.com)';
    }

    if (
      !values.password ||
      values.password.length < LIMITES_TEXTO.PASSWORD_MIN ||
      values.password.length > LIMITES_TEXTO.PASSWORD_MAX
    ) {
      errors.password = `La contraseña debe tener entre ${LIMITES_TEXTO.PASSWORD_MIN} y ${LIMITES_TEXTO.PASSWORD_MAX} caracteres`;
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

      // Autenticación estricta contra Supabase Auth (sin fallback local inseguro)
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: emailLower,
        password: values.password,
      });

      if (!authError && data.session) {
        // Consultar perfil, rol y estado activo en public.usuario
        const { data: usuarioData } = await supabase
          .from('usuario')
          .select('*')
          .eq('id_usuario', data.session.user.id)
          .maybeSingle();

        const perfil = usuarioData as { rol?: string; nombre?: string; activo?: boolean } | null;

        // Bloquear acceso si la cuenta fue desactivada por un administrador
        if (perfil?.activo === false) {
          await supabase.auth.signOut();
          limpiarSesionLocal();
          setError('Su cuenta de usuario se encuentra inactiva. Solicite su reactivación a un Administrador.');
          setLoading(false);
          return;
        }

        // Bloquear acceso si la cuenta no tiene rol asignado
        if (perfil?.rol === 'no_rol') {
          await supabase.auth.signOut();
          limpiarSesionLocal();
          setError(
            'Su cuenta no posee un rol asignado en el sistema. Solicite a un Administrador que active sus permisos desde Gestión de Usuarios.'
          );
          setLoading(false);
          return;
        }

        const rolAsignado: RolUsuario =
          perfil?.rol === 'vendedor'
            ? 'vendedor'
            : emailLower.startsWith('user@')
              ? 'vendedor'
              : 'admin';

        const nombreColaborador =
          perfil?.nombre ||
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
