'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@mantine/form';
import { createClient } from '@/lib/supabase/client';
import { LoginFormValues } from '@/modelos/modelos_vista/authModel';

/*
 * Controlador para la autenticación de usuarios (Inicio de sesión).
 * Administra el estado del formulario, la validación de credenciales
 * mediante Supabase Auth y la redirección post-autenticación.
 */
export function useLoginController() {
  const router = useRouter();

  // Estado reactivo
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Configuración del formulario y validaciones declarativas
  const form = useForm<LoginFormValues>({
    initialValues: { email: '', password: '', rememberMe: false, },
    validate: { email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Correo electrónico no válido'), password: (value) => (value.length >= 6 ? null : 'La contraseña debe tener al menos 6 caracteres'), },
  });

  /**
   * Envía las credenciales a Supabase Auth y redirige al panel principal en caso de éxito.
   */
  const handleSubmit = async (values: LoginFormValues) => {
    setLoading(true); setError(null);

    try {
      const supabase = createClient(); const { data, error: authError } = await supabase.auth.signInWithPassword({ email: values.email, password: values.password, });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('Correo electrónico o contraseña incorrectos.');
        } else {
          setError(authError.message || 'Error al iniciar sesión.');
        }
        return;
      }

      if (data.session) {
        router.push('/admin');
        router.refresh();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error inesperado de conexión.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  /*
   * Limpia el mensaje de error activo.
   */
  const clearError = () => setError(null);
  return { form, loading, error, handleSubmit: form.onSubmit(handleSubmit), clearError, };
}

/*
 * Controlador para el cierre de sesión.
 * Invalida la sesión actual en Supabase Auth, limpia cookies
 * de sesión y redirige al usuario a la pantalla de login.
 * @param autoExecute Si es true, inicia el logout automáticamente al montar el componente.
 */
export function useLogoutController(autoExecute: boolean = true) {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(autoExecute);
  const [loggedOut, setLoggedOut] = useState<boolean>(false);

  const handleLogout = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setLoggedOut(true);
      router.push('/login');
      router.refresh();
    } catch (err: unknown) {
      console.error('Error al cerrar sesión:', err);
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
        const supabase = createClient();
        await supabase.auth.signOut();
        if (isMounted) {
          setLoggedOut(true);
          router.push('/login');
          router.refresh();
        }
      } catch (err: unknown) {
        console.error('Error al cerrar sesión:', err);
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

    return () => { isMounted = false; };
  }, [autoExecute, router]);

  return { loading, loggedOut, handleLogout, };
}

// Alias para retrocompatibilidad
export const useLogin = useLoginController;
