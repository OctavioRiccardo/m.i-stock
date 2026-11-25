import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  VENTAS_STORAGE_KEY,
  VENTAS_UPDATED_EVENT,
  guardarVentasCliente,
  inicializarVentasCliente,
  recalcularVentasStore,
  suscribirVentasStorage,
} from '@/lib/ventasStorage';
import type { VentaRecientePOS } from '@/models/modelos_vista/dashboardModel';

function crearVentaDemo(overrides: Partial<VentaRecientePOS> = {}): VentaRecientePOS {
  return {
    id: 'vnt-1',
    fecha: new Date().toLocaleDateString('es-AR'),
    timestamp: Date.now(),
    hora: '10:30',
    montoTotal: 1500,
    metodoPago: 'efectivo',
    estado: 'completada',
    cantidadItems: 2,
    vendedor: 'Ana',
    items: [],
    ...overrides,
  };
}

describe('ventasStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('recalcularVentasStore suma ventas completadas de hoy y excluye canceladas', () => {
    const hoy = crearVentaDemo({ id: 'v1', montoTotal: 2000, estado: 'completada' });
    const canceladaHoy = crearVentaDemo({ id: 'v2', montoTotal: 5000, estado: 'cancelada' });
    const ayer = crearVentaDemo({
      id: 'v3',
      montoTotal: 9000,
      fecha: '01/01/2020',
      timestamp: Date.parse('2020-01-01T12:00:00Z'),
    });

    const store = recalcularVentasStore([hoy, canceladaHoy, ayer]);

    expect(store.ventasDelDia).toBe(1);
    expect(store.recaudacionDelDia).toBe(2000);
    expect(store.ventasRecientes).toHaveLength(3);
  });

  it('inicializarVentasCliente tolera JSON corrupto o formas inválidas sin lanzar excepción', () => {
    window.localStorage.setItem(VENTAS_STORAGE_KEY, '{json-roto');
    expect(inicializarVentasCliente().ventasRecientes).toEqual([]);

    window.localStorage.setItem(VENTAS_STORAGE_KEY, JSON.stringify({ ventasRecientes: 'no-array' }));
    expect(inicializarVentasCliente().ventasRecientes).toEqual([]);

    window.localStorage.setItem(VENTAS_STORAGE_KEY, JSON.stringify(null));
    expect(inicializarVentasCliente().ventasRecientes).toEqual([]);
  });

  it('inicializarVentasCliente filtra entradas sin estructura mínima válida', () => {
    const valida = crearVentaDemo({ id: 'v-ok', montoTotal: 3200 });
    window.localStorage.setItem(
      VENTAS_STORAGE_KEY,
      JSON.stringify({
        ventasRecientes: [valida, null, { sinId: true }, { id: 'v-sin-monto', montoTotal: 'NaN' }],
      })
    );

    const store = inicializarVentasCliente();
    expect(store.ventasRecientes).toHaveLength(1);
    expect(store.ventasRecientes[0].id).toBe('v-ok');
    expect(store.recaudacionDelDia).toBe(3200);
  });

  it('guardarVentasCliente persiste en localStorage y notifica solo cuando corresponde', () => {
    const handler = vi.fn();
    const desuscribir = suscribirVentasStorage(handler);

    const store = recalcularVentasStore([crearVentaDemo({ id: 'v-persistida', montoTotal: 4500 })]);

    guardarVentasCliente(store, { notificar: false });
    expect(handler).not.toHaveBeenCalled();
    expect(inicializarVentasCliente().ventasRecientes[0].id).toBe('v-persistida');

    guardarVentasCliente(store, { notificar: true });
    expect(handler).toHaveBeenCalledTimes(1);

    desuscribir();
    window.dispatchEvent(new Event(VENTAS_UPDATED_EVENT));
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
