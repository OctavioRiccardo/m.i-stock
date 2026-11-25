/**
 * Normaliza la URL pública de Supabase eliminando sufijos accidentales
 * (`/rest/v1`, `/rest/v1/`) y barras finales sobrantes.
 */
export function normalizarSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  url = url.replace(/\/rest\/v1\/?$/i, '');
  url = url.replace(/\/+$/, '');
  return url;
}

/**
 * Resuelve la URL normalizada y la clave pública (anon o publishable) de Supabase.
 */
export function obtenerCredencialesSupabasePublicas(): { url: string; key: string } {
  const url = normalizarSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    ''
  ).trim();

  return { url, key };
}
