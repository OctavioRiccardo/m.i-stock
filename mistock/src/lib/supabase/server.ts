/**
 * ====================================================================
 * CLIENTE SUPABASE PARA EL SERVIDOR (Server Components & Actions)
 * ====================================================================
 * 
 * Propósito:
 * Instanciar el cliente Supabase en entornos de ejecución de Node.js en el servidor
 * (Next.js Server Components, Route Handlers y Server Actions).
 * 
 * Manejo de Cookies en App Router:
 * - Lee las cookies entrantes mediante `cookies().getAll()`.
 * - La función `setAll` está envuelta en un bloque `try...catch` porque los Server Components
 *   de Next.js son de solo lectura y lanzan una excepción si intentan modificar cookies.
 *   Las actualizaciones de tokens son delegadas al Middleware.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function normalizarSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  url = url.replace(/\/rest\/v1\/?$/i, '');
  url = url.replace(/\/+$/, '');
  return url;
}

/**
 * Crea una instancia del cliente Supabase conectada al almacén de cookies de la petición actual.
 * 
 * @returns Instancia asíncrona del cliente Supabase para el servidor.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const url = normalizarSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )?.trim();

  if (!url || !key) {
    console.warn(
      '⚠️ [Supabase Server] Variables NEXT_PUBLIC_SUPABASE_URL o clave pública no encontradas en el entorno.'
    );
  }

  return createServerClient(
    url || 'https://placeholder.supabase.co',
    key || 'placeholder-anon-key',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Se ignora silenciosamente si fue invocado desde un Server Component de solo lectura.
            // La persistencia de la cookie refrescada se ejecuta en el Middleware.
          }
        },
      },
    }
  );
}
