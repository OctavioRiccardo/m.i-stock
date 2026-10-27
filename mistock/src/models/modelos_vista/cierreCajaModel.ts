/**
 * ====================================================================
 * MODELO DE VISTA: ARQUEO Y CIERRE DE CAJA (ViewModels)
 * ====================================================================
 * 
 * Propósito:
 * Estructuras de datos para la conciliación física de efectivo, resumen de
 * canales digitales de cobro y emisión del comprobante de Cierre de Caja
 * (Reporte Z) para la terminal de mostrador mono-caja.
 */

/**
 * Desglose numérico acumulado por cada método de cobro durante el turno.
 */
export interface ResumenMediosPagoCierre {
  efectivo: number;
  mercadoPago: number;
  tarjetaDebito: number;
  tarjetaCredito: number;
  transferencia: number;
  otro: number;
}

/**
 * Estado del balance de efectivo al momento del cierre.
 */
export type EstadoBalanceCaja = 'exacto' | 'sobrante' | 'faltante';

/**
 * DTO que consolida los datos del arqueo y cierre del turno para emitir el Reporte Z.
 */
export interface ArqueoCajaDTO {
  idCierre: string;
  idTurno?: string;
  fechaApertura: string;
  fechaCierre: string;
  cajero: string;
  numeroCaja: number;
  fondoInicial: number;
  totalVentasEfectivo: number;
  totalDigitales: number;
  granTotalRecaudado: number;
  cantidadTickets: number;
  efectivoEsperado: number; // fondoInicial + totalVentasEfectivo
  efectivoReal: number;     // Monto contado físicamente en la gaveta
  diferencia: number;       // efectivoReal - efectivoEsperado (+ sobrante, - faltante)
  estadoBalance: EstadoBalanceCaja;
  desgloseMedios: ResumenMediosPagoCierre;
  observaciones?: string;
}

/**
 * DTO para el registro de Apertura de Caja (Inicio de Turno / Sesión).
 */
export interface AperturaCajaDTO {
  idApertura: string;
  idTurno?: string;
  timestampApertura?: number;
  fechaApertura: string;
  cajero: string;
  numeroCaja: number;
  fondoInicial: number;
  observaciones?: string;
}

/**
 * Estado reactivo de la sesión de caja en la terminal.
 */
export interface EstadoSesionCaja {
  idTurno?: string;
  timestampApertura?: number;
  fondoInicial: number;
  fechaApertura: string | null;
  estaAbierta: boolean;
  cajaAbierta?: boolean;
  cajero?: string;
  cajeroApertura?: string;
  numeroCaja?: number;
  observacionesApertura?: string;
  ultimoCierre: ArqueoCajaDTO | null;
}

// ====================================================================
// Funciones Puras de Dominio / Cálculo para Arqueo y Cierre de Caja
// ====================================================================

/**
 * Calcula el efectivo total que debería haber en caja al finalizar el turno:
 * fondo inicial + recaudación total de ventas en efectivo.
 */
export function calcularEfectivoEsperado(fondoInicial: number, totalVentasEfectivo: number): number {
  const fondo = Math.max(0, Number(fondoInicial) || 0);
  const ventas = Math.max(0, Number(totalVentasEfectivo) || 0);
  return Number((fondo + ventas).toFixed(2));
}

/**
 * Calcula la diferencia entre el arqueo físico y el efectivo contable esperado.
 * Valor positivo (> 0) indica sobrante.
 * Valor negativo (< 0) indica faltante.
 * Cero (= 0) indica balance exacto.
 */
export function calcularDiferenciaCaja(efectivoReal: number, efectivoEsperado: number): number {
  const real = Number(efectivoReal) || 0;
  const esperado = Number(efectivoEsperado) || 0;
  return Number((real - esperado).toFixed(2));
}

/**
 * Determina la clasificación cualitativa del arqueo: 'exacto' | 'sobrante' | 'faltante'.
 */
export function determinarEstadoBalance(diferencia: number): EstadoBalanceCaja {
  const dif = Number(diferencia) || 0;
  if (Math.abs(dif) < 0.001) return 'exacto';
  if (dif > 0) return 'sobrante';
  return 'faltante';
}

/**
 * Agrega el desglose de canales digitales y calcula el gran total facturado en el turno.
 */
export function calcularTotalesCierre(
  totalVentasEfectivo: number,
  desgloseMedios: Partial<ResumenMediosPagoCierre>
): { totalDigitales: number; granTotalRecaudado: number } {
  const efectivo = Math.max(0, Number(totalVentasEfectivo) || 0);
  const totalDigitales = Number(
    (
      (Number(desgloseMedios.mercadoPago) || 0) +
      (Number(desgloseMedios.tarjetaDebito) || 0) +
      (Number(desgloseMedios.tarjetaCredito) || 0) +
      (Number(desgloseMedios.transferencia) || 0) +
      (Number(desgloseMedios.otro) || 0)
    ).toFixed(2)
  );
  const granTotalRecaudado = Number((efectivo + totalDigitales).toFixed(2));

  return { totalDigitales, granTotalRecaudado };
}
