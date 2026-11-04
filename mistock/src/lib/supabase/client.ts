/**
 * ====================================================================
 * CLIENTE SUPABASE PARA EL NAVEGADOR (Client Components)
 * ====================================================================
 * 
 * Propósito:
 * Instanciar el cliente de Supabase optimizado para ejecutarse en el navegador
 * dentro de Client Components ('use client') y controladores personalizados de React.
 * 
 * Sincronización SSR:
 * Utiliza `createBrowserClient` del paquete `@supabase/ssr`, el cual almacena
 * automáticamente los tokens JWT de sesión en las cookies del navegador.
 */

import { createBrowserClient } from '@supabase/ssr';

/**
 * Crea o reutiliza una instancia singleton del cliente Supabase en el navegador.
 * 
 * @returns Instancia configurada del cliente Supabase con persistencia en cookies.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )?.trim();

  if (!url || !key) {
    throw new Error(
      'Faltan las credenciales de conexión con Supabase (NEXT_PUBLIC_SUPABASE_URL o clave pública). Verifica las Variables de Entorno en el proyecto de Vercel y haz un Redeploy.'
    );
  }

  return createBrowserClient(url, key);
}
