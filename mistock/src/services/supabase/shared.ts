export const isUUID = (str: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export function esErrorTablaFaltante(
  error: { code?: string; message?: string } | null
): boolean {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    msg.includes('could not find the table') ||
    msg.includes('does not exist')
  );
}

export interface FetchResult<T> {
  ok: boolean;
  items: T[];
  migracionPendiente?: boolean;
  error?: string;
}

/**
 * Registra advertencias de operaciones Supabase sin interrumpir el flujo
 * ni ocultar fallos silenciosamente.
 */
export function registrarErrorSupabase(operacion: string, error: unknown): void {
  const detalle = error instanceof Error ? error.message : String(error ?? 'Error desconocido');
  console.warn(`[supabaseService:${operacion}] ${detalle}`);
}
