/**
 * ====================================================================
 * PROXY DE SESIÓN / INTERCEPTOR DE PETICIONES
 * ====================================================================
 * 
 * Propósito:
 * Interceptar las solicitudes HTTP entrantes y delegar la validación y refresco
 * de cookies de sesión a `updateSession` de Supabase.
 * 
 * El matcher excluye rutas estáticas de Next.js (_next/static, _next/image),
 * favicons y archivos de medios para no incurrir en sobrecarga de red innecesaria.
 */

import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Función proxy que ejecuta la actualización de sesión antes de resolver la ruta.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Interceptar todas las rutas de la aplicación excepto:
     * - _next/static (archivos estáticos empaquetados)
     * - _next/image (endpoints de optimización de imágenes)
     * - favicon.ico (ícono de la pestaña del navegador)
     * - Extensiones de recursos multimedia (.svg, .png, .jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

