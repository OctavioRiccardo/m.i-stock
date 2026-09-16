'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LoginFormValues } from '@/models/modelos_vista/authModel';

/**
 * Controlador para la autenticación de usuarios (Inicio de sesión).
 * Administra el estado del formulario, la validación de credenciales
 * mediante Supabase Auth y la redirección post-autenticación.
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

  /**
   * Envía las credenciales a Supabase Auth y redirige al panel principal en caso de éxito.
   */
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

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
 * Controlador para el cierre de sesión.
 * Invalida la sesión actual en Supabase Auth y redirige al usuario al login.
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
