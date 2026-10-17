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
import { initialUsuarios } from '@/models/mock_data/usuariosMock';

/**
 * Hook Controlador para el Formulario de Inicio de Sesión.
 * 
 * Responsabilidades:
 * 1. Controlar el estado reactivo de los campos (email, password, rememberMe).
 * 2. Ejecutar validaciones locales antes de contactar con el backend.
 * 3. Enviar credenciales a Supabase Auth (`signInWithPassword`).
 * 4. Normalizar y traducir errores técnicos a mensajes comprensibles para el usuario.
 * 5. Dirigir al usuario autenticado hacia su panel correspondiente (/admin).
 * 
 * @returns {Object} Estado del formulario, handlers de cambio, validación y submit.
 */
export function useLoginController() {
  const router = useRouter();

  // Estado reactivo que almacena los valores ingresados por el usuario
  const [values, setValues] = useState<LoginFormValues>({
    email: '',
    password: '',
    rememberMe: false,
  });

  // Diccionario reactivo de errores por campo para retroalimentación visual inmediata
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof LoginFormValues, string>>>({});

  // Indicador de solicitud asíncrona en curso (deshabilita inputs y muestra spinners)
  const [loading, setLoading] = useState<boolean>(false);

  // Mensaje de error global (credenciales incorrectas, fallos de red, etc.)
  const [error, setError] = useState<string | null>(null);

  /**
   * Actualiza el valor de un campo específico y limpia su error asociado
   */
  const setFieldValue = <K extends keyof LoginFormValues>(field: K, value: LoginFormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  /**
   * Valida sintácticamente el formulario en el cliente antes del envío al servidor.
   * Evita llamadas de red innecesarias si los datos son inválidos.
   */
  const validate = (): boolean => {
    const errors: Partial<Record<keyof LoginFormValues, string>> = {};

    // Validación de formato de correo electrónico
    if (!values.email || !/^\S+@\S+$/.test(values.email)) {
      errors.email = 'Correo electrónico no válido';
    }

    // Validación de longitud mínima de contraseña
    if (!values.password || values.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Procesa el envío del formulario:
   * 1. Previene el refresco nativo del navegador.
   * 2. Comprueba las validaciones locales.
   * 3. Invoca `signInWithPassword` en el cliente Supabase.
   * 4. En caso de éxito, redirige al panel de administración y actualiza la sesión.
   */
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError(null);

    try {
      const emailLower = values.email.trim().toLowerCase();

      // 1. Comprobar si el usuario existe en la nómina del sistema (usuariosController) o en cuentas semilla
      if (typeof window !== 'undefined') {
        try {
          const storedUsersRaw = window.localStorage.getItem('mistock_usuarios_data_test_v1');
          const storedList = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];
          const userList = Array.isArray(storedList) && storedList.length > 0 ? storedList : initialUsuarios;
          const combinedUsers = [...userList, ...initialUsuarios];

          const matchedUser = combinedUsers.find(
            (u: { email?: string; estado?: string; activo?: boolean; rol?: string; nombre?: string; id?: string }) =>
              u.email && u.email.trim().toLowerCase() === emailLower
          );

          if (matchedUser) {
            if (matchedUser.estado === 'inactivo' || matchedUser.activo === false) {
              setError('Su cuenta de usuario se encuentra inactiva. Contacte al Administrador.');
              setLoading(false);
              return;
            }

            // Validar contraseña si el usuario tiene una asignada
            if (matchedUser.password && matchedUser.password.trim() !== values.password.trim()) {
              setError('Contraseña incorrecta. Verifique sus credenciales.');
              setLoading(false);
              return;
            }

            const rolAsignado = matchedUser.rol === 'vendedor' ? 'vendedor' : 'admin';
            window.localStorage.setItem('mistock_rol_activo', rolAsignado);
            window.localStorage.setItem(
              'mistock_usuario_activo',
              JSON.stringify({
                id: matchedUser.id,
                email: matchedUser.email,
                nombre: matchedUser.nombre || 'Administrador',
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
        } catch {}
      }

      // 2. Acceso directo de prueba para cuentas base de desarrollo
      if (
        (emailLower === 'admin@mistock.com' && values.password.length >= 6) ||
        (emailLower === 'admin@test.com' && values.password.length >= 6) ||
        (emailLower === 'octavio@mistock.com' && values.password.length >= 6) ||
        (emailLower === 'vendedor@mistock.com' && values.password.length >= 6) ||
        (emailLower === 'cajero@mistock.com' && values.password.length >= 6)
      ) {
        const esVendedor = emailLower.includes('vendedor') || emailLower.includes('cajero');
        const rolAsignado = esVendedor ? 'vendedor' : 'admin';
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('mistock_rol_activo', rolAsignado);
          window.localStorage.setItem(
            'mistock_usuario_activo',
            JSON.stringify({
              email: emailLower,
              nombre: esVendedor ? 'Cajero Turno' : 'Administrador Test',
              rol: rolAsignado,
            })
          );
        }
        if (esVendedor) {
          router.push('/dashboard');
        } else {
          router.push('/admin');
        }
        router.refresh();
        return;
      }

      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (authError) {
        // Traducción de mensajes técnicos de Supabase a mensajes amigables
        if (authError.message.includes('Invalid login credentials')) {
          setError('Correo electrónico o contraseña incorrectos.');
        } else {
          setError(authError.message || 'Error al iniciar sesión.');
        }
        return;
      }

      if (data.session) {
        // Consultar el rol del usuario en public.usuario para dirigirlo a su panel correspondiente
        const { data: usuarioData } = await supabase
          .from('usuario')
          .select('rol')
          .eq('id_usuario', data.session.user.id)
          .maybeSingle();

        if (usuarioData?.rol === 'vendedor') {
          router.push('/dashboard');
        } else {
          router.push('/admin');
        }
        router.refresh();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error inesperado de conexión.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Limpia manualmente el mensaje de error global
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
 * 
 * Responsabilidades:
 * 1. Invalidar la sesión JWT activa en Supabase Auth (`signOut`).
 * 2. Limpiar cookies y credenciales del navegador.
 * 3. Redirigir al usuario a la pantalla pública de login (`/login`).
 * 
 * @param {boolean} autoExecute - Si es true, ejecuta el cierre automáticamente al montar la vista.
 */
export function useLogoutController(autoExecute: boolean = true) {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(autoExecute);
  const [loggedOut, setLoggedOut] = useState<boolean>(false);

  /**
   * Ejecuta el cierre de sesión bajo demanda (ej: clic en un botón de la barra de navegación)
   */
  const handleLogout = useCallback(async () => {
    setLoading(true);
    try {
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

  /**
   * Efecto automático para vistas dedicadas de cierre de sesión (como /logout)
   */
  useEffect(() => {
    if (!autoExecute) return;

    let isMounted = true;
    const performLogout = async () => {
      try {
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

// Alias de retrocompatibilidad
export const useLogin = useLoginController;
