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
 * Esto asegura que tanto el Middleware de Next.js como los Server Components
 * compartan el mismo estado de autenticación sin discrepancias de hidratación.
 */

import { createBrowserClient } from '@supabase/ssr';

/**
 * Crea o reutiliza una instancia singleton del cliente Supabase en el navegador.
 * 
 * @returns Instancia configurada del cliente Supabase con persistencia en cookies.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!
  );
}

