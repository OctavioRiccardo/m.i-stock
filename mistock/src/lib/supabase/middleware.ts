/**
 * ====================================================================
 * MANEJADOR DE SESIÓN DE SUPABASE EN MIDDLEWARE
 * ====================================================================
 * 
 * Propósito:
 * Refrescar los tokens de autenticación de Supabase en cada petición HTTP entrante.
 * 
 * Buenas Prácticas de Seguridad Supabase:
 * - Se invoca `supabase.auth.getUser()` para validar criptográficamente el JWT
 *   contra la API de Supabase, evitando tokens falsificados o revocados.
 * - Sincroniza las cookies actualizadas tanto en la `request` entrante
 *   (para Server Components posteriores) como en la `response` saliente (hacia el navegador).
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Actualiza la sesión de Supabase si el token de acceso expiró o requiere refresco.
 * 
 * @param request Petición NextRequest entrante desde el cliente o navegador.
 * @returns NextResponse con las cookies de sesión refrescadas.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Actualiza las cookies en la solicitud para que los Server Components descendientes las lean
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

          // Clona la respuesta con la solicitud enriquecida
          supabaseResponse = NextResponse.next({
            request,
          });

          // Inyecta las cookies en la respuesta HTTP hacia el navegador
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Validación criptográfica y refresco del token de sesión en Supabase Auth
  await supabase.auth.getUser();

  return supabaseResponse;
}

