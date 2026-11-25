import type { RolUsuario } from '@/models/modelos_dominio/userModel';

export const USUARIO_ACTIVO_STORAGE_KEY = 'mistock_usuario_activo';
export const USUARIO_ACTIVO_UPDATED_EVENT = 'mistock_usuario_updated';

export interface UsuarioActivoCache {
  id?: string;
  nombre?: string;
  email?: string;
  rol?: RolUsuario;
}

const ROLES_VALIDOS: ReadonlySet<string> = new Set(['admin', 'vendedor', 'no_rol']);

export function leerUsuarioActivoLocal(): UsuarioActivoCache | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(USUARIO_ACTIVO_STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    const obj = parsed as Record<string, unknown>;
    const id = typeof obj.id === 'string' && obj.id.trim() ? obj.id.trim() : undefined;
    const nombre =
      typeof obj.nombre === 'string' && obj.nombre.trim() ? obj.nombre.trim() : undefined;
    const email =
      typeof obj.email === 'string' && obj.email.trim() ? obj.email.trim() : undefined;
    const rol =
      typeof obj.rol === 'string' && ROLES_VALIDOS.has(obj.rol)
        ? (obj.rol as RolUsuario)
        : undefined;

    if (!id && !nombre && !email && !rol) return null;
    return { ...(id ? { id } : {}), nombre, email, rol };
  } catch (err) {
    console.warn('[usuarioActivoStorage] Error al leer usuario activo:', err);
    return null;
  }
}

export function obtenerNombreUsuarioActivoLocal(fallback: string = 'Administrador'): string {
  return leerUsuarioActivoLocal()?.nombre || fallback;
}

export function guardarUsuarioActivoLocal(
  datos: UsuarioActivoCache,
  options?: { notificar?: boolean }
): void {
  if (typeof window === 'undefined') return;
  const notificar = options?.notificar ?? true;

  try {
    window.localStorage.setItem(USUARIO_ACTIVO_STORAGE_KEY, JSON.stringify(datos));
    if (notificar) {
      window.dispatchEvent(new Event(USUARIO_ACTIVO_UPDATED_EVENT));
    }
  } catch (err) {
    console.warn('[usuarioActivoStorage] Error al guardar usuario activo:', err);
  }
}

export function limpiarUsuarioActivoLocal(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(USUARIO_ACTIVO_STORAGE_KEY);
  } catch (err) {
    console.warn('[usuarioActivoStorage] Error al limpiar usuario activo:', err);
  }
}

export function suscribirUsuarioActivo(handler: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(USUARIO_ACTIVO_UPDATED_EVENT, handler);
  return () => {
    window.removeEventListener(USUARIO_ACTIVO_UPDATED_EVENT, handler);
  };
}
