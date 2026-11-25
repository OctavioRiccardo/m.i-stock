import type { VentaRecientePOS } from '@/models/modelos_vista/dashboardModel';

export const VENTAS_STORAGE_KEY = 'mistock_ventas_historial_test_v1';
export const VENTAS_UPDATED_EVENT = 'mistock_ventas_updated';

export interface VentasHistorialStore {
  ventasDelDia: number;
  recaudacionDelDia: number;
  ventasRecientes: VentaRecientePOS[];
}

export const VENTAS_SERVER_SNAPSHOT: VentasHistorialStore = {
  ventasDelDia: 0,
  recaudacionDelDia: 0,
  ventasRecientes: [],
};

function esVentaRecienteValida(item: unknown): item is VentaRecientePOS {
  if (!item || typeof item !== 'object') return false;
  const candidate = item as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    candidate.id.length > 0 &&
    typeof candidate.montoTotal === 'number' &&
    Number.isFinite(candidate.montoTotal)
  );
}

export function recalcularVentasStore(ventas: VentaRecientePOS[]): VentasHistorialStore {
  const hoyStr = new Date().toLocaleDateString('es-AR');
  const hoyInicioTs = new Date().setHours(0, 0, 0, 0);

  const ventasDeHoy = ventas.filter((v) => {
    if (v.estado === 'cancelada') return false;
    if (v.fecha && v.fecha === hoyStr) return true;
    if (v.timestamp && v.timestamp >= hoyInicioTs) return true;
    return false;
  });

  return {
    ventasDelDia: ventasDeHoy.length,
    recaudacionDelDia: ventasDeHoy.reduce((acc, v) => acc + (v.montoTotal || 0), 0),
    ventasRecientes: ventas,
  };
}

export function inicializarVentasCliente(): VentasHistorialStore {
  if (typeof window === 'undefined') {
    return { ...VENTAS_SERVER_SNAPSHOT, ventasRecientes: [] };
  }

  try {
    const raw = window.localStorage.getItem(VENTAS_STORAGE_KEY);
    if (!raw) return { ...VENTAS_SERVER_SNAPSHOT, ventasRecientes: [] };

    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      'ventasRecientes' in parsed &&
      Array.isArray((parsed as { ventasRecientes: unknown }).ventasRecientes)
    ) {
      const validas = (parsed as { ventasRecientes: unknown[] }).ventasRecientes.filter(
        esVentaRecienteValida
      );
      return recalcularVentasStore(validas);
    }
  } catch (err) {
    console.warn('[ventasStorage] Error al leer caché local de ventas:', err);
  }

  return { ...VENTAS_SERVER_SNAPSHOT, ventasRecientes: [] };
}

export function guardarVentasCliente(
  store: VentasHistorialStore,
  options?: { notificar?: boolean }
): void {
  if (typeof window === 'undefined') return;
  const notificar = options?.notificar ?? true;

  try {
    window.localStorage.setItem(VENTAS_STORAGE_KEY, JSON.stringify(store));
    if (notificar) {
      window.dispatchEvent(new Event(VENTAS_UPDATED_EVENT));
    }
  } catch (err) {
    console.warn('[ventasStorage] Error al persistir caché local de ventas:', err);
  }
}

export function suscribirVentasStorage(handler: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  window.addEventListener('storage', handler);
  window.addEventListener(VENTAS_UPDATED_EVENT, handler);

  return () => {
    window.removeEventListener('storage', handler);
    window.removeEventListener(VENTAS_UPDATED_EVENT, handler);
  };
}
