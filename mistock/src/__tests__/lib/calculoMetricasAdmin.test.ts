import { describe, expect, it } from 'vitest';
import {
  MS_POR_DIA,
  calcularLimitesTiempo,
  calcularVariacionKPI,
  filtrarVentasPorVentana,
  obtenerEtiquetaPeriodo,
  obtenerTimestampVenta,
} from '@/lib/calculoMetricasAdmin';
import type { VentaRecientePOS } from '@/models/modelos_vista/dashboardModel';

function crearVenta(overrides: Partial<VentaRecientePOS> = {}): VentaRecientePOS {
  return {
    id: 'v-1',
    hora: '10:00',
    montoTotal: 1000,
    cantidadItems: 1,
    items: [],
    estado: 'completada',
    ...overrides,
  };
}

describe('calculoMetricasAdmin', () => {
  it('obtenerTimestampVenta prioriza timestamp, luego fechaISO y luego fecha dd/mm/yyyy', () => {
    expect(obtenerTimestampVenta(crearVenta({ timestamp: 1700000000000 }))).toBe(1700000000000);
    expect(
      obtenerTimestampVenta(crearVenta({ fechaISO: '2026-11-20T12:00:00.000Z' }))
    ).toBe(Date.parse('2026-11-20T12:00:00.000Z'));

    const tsAr = obtenerTimestampVenta(crearVenta({ fecha: '15/10/2026' }));
    expect(new Date(tsAr).getFullYear()).toBe(2026);
    expect(new Date(tsAr).getMonth()).toBe(9);
    expect(new Date(tsAr).getDate()).toBe(15);
  });

  it('obtenerEtiquetaPeriodo devuelve textos consistentes para todos los períodos', () => {
    expect(obtenerEtiquetaPeriodo('diario')).toBe('Hoy');
    expect(obtenerEtiquetaPeriodo('semanal')).toBe('Esta Semana');
    expect(obtenerEtiquetaPeriodo('ultimos_30_dias')).toBe('Últimos 30 Días');
    expect(obtenerEtiquetaPeriodo('mensual')).toBe('Este Mes');
  });

  it('calcularVariacionKPI maneja comparativa apagada, ceros, crecimiento y caída', () => {
    expect(calcularVariacionKPI(500, 100, false)).toEqual({
      changePercentage: undefined,
      status: 'positive',
    });
    expect(calcularVariacionKPI(0, 0, true)).toEqual({
      changePercentage: undefined,
      status: 'neutral',
    });
    expect(calcularVariacionKPI(250, 0, true)).toEqual({
      changePercentage: '+100%',
      status: 'positive',
    });
    expect(calcularVariacionKPI(150, 100, true)).toEqual({
      changePercentage: '+50%',
      status: 'positive',
    });
    expect(calcularVariacionKPI(80, 100, true)).toEqual({
      changePercentage: '-20%',
      status: 'negative',
    });
  });

  it('calcularLimitesTiempo y filtrarVentasPorVentana separan correctamente hoy vs ayer y corte mensual', () => {
    const referencia = new Date(2026, 10, 10, 14, 0, 0); // 10 Nov 2026 14:00
    const limites = calcularLimitesTiempo(referencia, {
      inicioSemana: 'lunes',
      diaCorteMensual: 15,
    });

    // Como día 10 < díaCorte 15, el mes operativo arrancó el 15 Oct 2026
    expect(new Date(limites.inicioMesTs).getMonth()).toBe(9);
    expect(new Date(limites.inicioMesTs).getDate()).toBe(15);

    const ventaHoy = crearVenta({ id: 'hoy', timestamp: limites.inicioHoy + 3600_000 });
    const ventaAyer = crearVenta({ id: 'ayer', timestamp: limites.inicioAyer + 3600_000 });
    const ventaVieja = crearVenta({ id: 'vieja', timestamp: limites.inicioAyer - 5 * MS_POR_DIA });

    const { ventasVentanaActiva, ventasVentanaAnterior } = filtrarVentasPorVentana(
      [ventaHoy, ventaAyer, ventaVieja],
      'diario',
      limites
    );

    expect(ventasVentanaActiva.map((v) => v.id)).toEqual(['hoy']);
    expect(ventasVentanaAnterior.map((v) => v.id)).toEqual(['ayer']);
  });
});
