import type { PeriodoMetricas } from '@/models/modelos_vista/configuracionModel';
import type { VentaRecientePOS } from '@/models/modelos_vista/dashboardModel';

export const MS_POR_DIA = 86400000;

export interface LimitesTiempoMetricas {
  inicioHoy: number;
  inicioAyer: number;
  inicioSemanaTs: number;
  inicioSemanaAnteriorTs: number;
  inicioMesTs: number;
  inicioMesAnteriorTs: number;
  inicio30DiasTs: number;
  inicio30DiasAnteriorTs: number;
  iniciaDomingo: boolean;
}

/**
 * Obtiene el timestamp numérico de una venta reciente a partir de su campo timestamp, fechaISO o fecha.
 */
export function obtenerTimestampVenta(v: VentaRecientePOS): number {
  if (typeof v.timestamp === 'number' && !Number.isNaN(v.timestamp)) {
    return v.timestamp;
  }
  if (v.fechaISO) {
    const parsed = Date.parse(v.fechaISO);
    if (!Number.isNaN(parsed)) return parsed;
  }
  if (v.fecha) {
    const partes = v.fecha.split('/');
    if (partes.length === 3) {
      const [dia, mes, anio] = partes.map(Number);
      const fechaObj = new Date(anio, mes - 1, dia);
      if (!Number.isNaN(fechaObj.getTime())) return fechaObj.getTime();
    }
  }
  return Date.now();
}

/**
 * Devuelve la etiqueta legible para el período analítico activo.
 */
export function obtenerEtiquetaPeriodo(periodo: PeriodoMetricas): string {
  switch (periodo) {
    case 'diario':
      return 'Hoy';
    case 'semanal':
      return 'Esta Semana';
    case 'ultimos_30_dias':
      return 'Últimos 30 Días';
    case 'mensual':
    default:
      return 'Este Mes';
  }
}

/**
 * Calcula la variación porcentual real frente al período anterior inmediato.
 */
export function calcularVariacionKPI(
  actual: number,
  anterior: number,
  mostrarComparativa: boolean
): { changePercentage?: string; status: 'positive' | 'negative' | 'neutral' } {
  if (!mostrarComparativa) {
    return {
      changePercentage: undefined,
      status: actual > 0 ? 'positive' : 'neutral',
    };
  }
  if (anterior === 0 && actual === 0) {
    return { changePercentage: undefined, status: 'neutral' };
  }
  if (anterior === 0 && actual > 0) {
    return { changePercentage: '+100%', status: 'positive' };
  }
  const variacion = Math.round(((actual - anterior) / anterior) * 100);
  const signo = variacion > 0 ? '+' : '';
  const status: 'positive' | 'negative' | 'neutral' =
    variacion > 0 ? 'positive' : variacion < 0 ? 'negative' : 'neutral';

  return {
    changePercentage: `${signo}${variacion}%`,
    status,
  };
}

/**
 * Calcula los límites de ventana actual y anterior a partir de una fecha de referencia.
 */
export function calcularLimitesTiempo(
  ahora: Date,
  opciones?: { inicioSemana?: 'lunes' | 'domingo'; diaCorteMensual?: number }
): LimitesTiempoMetricas {
  const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).getTime();
  const inicioAyer = inicioHoy - MS_POR_DIA;

  const diaSemana = ahora.getDay();
  const iniciaDomingo = opciones?.inicioSemana === 'domingo';
  const diasDesdeInicioSemana = iniciaDomingo ? diaSemana : (diaSemana + 6) % 7;
  const inicioSemanaTs = inicioHoy - diasDesdeInicioSemana * MS_POR_DIA;
  const inicioSemanaAnteriorTs = inicioSemanaTs - 7 * MS_POR_DIA;

  const diaCorte = Math.max(1, Math.min(28, opciones?.diaCorteMensual || 1));
  let inicioMesDate = new Date(ahora.getFullYear(), ahora.getMonth(), diaCorte);
  if (ahora.getDate() < diaCorte) {
    inicioMesDate = new Date(ahora.getFullYear(), ahora.getMonth() - 1, diaCorte);
  }
  const inicioMesTs = inicioMesDate.getTime();
  const inicioMesAnteriorDate = new Date(
    inicioMesDate.getFullYear(),
    inicioMesDate.getMonth() - 1,
    diaCorte
  );
  const inicioMesAnteriorTs = inicioMesAnteriorDate.getTime();

  const inicio30DiasTs = inicioHoy - 29 * MS_POR_DIA;
  const inicio30DiasAnteriorTs = inicio30DiasTs - 30 * MS_POR_DIA;

  return {
    inicioHoy,
    inicioAyer,
    inicioSemanaTs,
    inicioSemanaAnteriorTs,
    inicioMesTs,
    inicioMesAnteriorTs,
    inicio30DiasTs,
    inicio30DiasAnteriorTs,
    iniciaDomingo,
  };
}

/**
 * Separa las ventas en ventana activa y ventana anterior comparable según el período.
 */
export function filtrarVentasPorVentana(
  ventas: VentaRecientePOS[],
  periodo: PeriodoMetricas,
  limites: LimitesTiempoMetricas
): { ventasVentanaActiva: VentaRecientePOS[]; ventasVentanaAnterior: VentaRecientePOS[] } {
  const rangos: Record<PeriodoMetricas, [number, number]> = {
    diario: [limites.inicioHoy, limites.inicioAyer],
    semanal: [limites.inicioSemanaTs, limites.inicioSemanaAnteriorTs],
    ultimos_30_dias: [limites.inicio30DiasTs, limites.inicio30DiasAnteriorTs],
    mensual: [limites.inicioMesTs, limites.inicioMesAnteriorTs],
  };

  const [inicioActual, inicioAnterior] = rangos[periodo] ?? rangos.mensual;

  return {
    ventasVentanaActiva: ventas.filter((v) => obtenerTimestampVenta(v) >= inicioActual),
    ventasVentanaAnterior: ventas.filter((v) => {
      const ts = obtenerTimestampVenta(v);
      return ts >= inicioAnterior && ts < inicioActual;
    }),
  };
}
