'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@mantine/form';
import { createClient } from '@/lib/supabase/client';
import { LoginFormValues } from '@/models/authModel';

/**
 * ============================================================================
 * CONTROLADOR DE AUTENTICACIÓN (Login Controller)
 * ============================================================================
 * En React + TypeScript, un Controlador se implementa como un Custom Hook.
 * Su objetivo es separar 100% la LÓGICA de la VISTA:
 *
 * 1. Mantiene el ESTADO (cargando, errores, datos del formulario).
 * 2. Aplica VALIDACIONES de negocio.
 * 3. Se conecta a la BASE DE DATOS (Supabase Client).
 * 4. Controla la NAVEGACIÓN (Next.js Router).
 */

export function useLoginController() {
  const router = useRouter();

  // --------------------------------------------------------------------------
  // 1. ESTADO DEL CONTROLADOR (State)
  // --------------------------------------------------------------------------
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Formulario reactivo con Mantine Form y validaciones explícitas
  const form = useForm<LoginFormValues>({
    initialValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    validate: {
      email: (value) =>
        /^\S+@\S+$/.test(value) ? null : 'Correo electrónico no válido',
      password: (value) =>
        value.length >= 6 ? null : 'La contraseña debe tener al menos 6 caracteres',
    },
  });

  // --------------------------------------------------------------------------
  // 2. ACCIONES Y LÓGICA DE NEGOCIO (Handlers)
  // --------------------------------------------------------------------------

  /**
   * Procesa el envío del formulario de inicio de sesión.
   * Paso a Paso Didáctico:
   *  Paso A: Activar el indicador de carga y limpiar errores previos.
   *  Paso B: Llamar al cliente de Supabase Auth para validar credenciales.
   *  Paso C: Si falla, guardar mensaje de error accesible para la vista.
   *  Paso D: Si tiene éxito, redirigir al usuario al Dashboard '/'.
   */
  const handleSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    setError(null);

    try {
      // B. Inicializar cliente de Supabase
      const supabase = createClient();

      // Enviar solicitud de login
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      // C. Manejo de errores devueltos por Supabase
      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('Correo electrónico o contraseña incorrectos.');
        } else {
          setError(authError.message || 'Error al iniciar sesión.');
        }
        setLoading(false);
        return;
      }

      // D. Redirección exitosa
      if (data.session) {
        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || 'Error inesperado de conexión.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Permite a la vista limpiar manualmente el mensaje de error.
   */
  const clearError = () => setError(null);

  // --------------------------------------------------------------------------
  // 3. EXPOSICIÓN DE LA INTERFAZ AL COMPONENTE VISTA (Return Contract)
  // --------------------------------------------------------------------------
  return {
    form,
    loading,
    error,
    handleSubmit: form.onSubmit(handleSubmit),
    clearError,
  };
}

/**
 * CONTROLADOR DE LOGOUT (Cierre de Sesión)
 */
export function useLogoutController(autoExecute: boolean = true) {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [loggedOut, setLoggedOut] = useState<boolean>(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setLoggedOut(true);
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoExecute) {
      handleLogout();
    }
  }, [autoExecute]);

  return {
    loading,
    loggedOut,
    handleLogout,
  };
}

// Alias para retrocompatibilidad
export const useLogin = useLoginController;
