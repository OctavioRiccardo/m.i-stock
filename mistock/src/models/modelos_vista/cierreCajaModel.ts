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

import { MetodoPago } from '@/models/modelos_dominio/ventaModel';

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
  fondoInicial: number;
  fechaApertura: string | null;
  estaAbierta: boolean;
  cajero: string;
  numeroCaja: number;
  observacionesApertura?: string;
  ultimoCierre: ArqueoCajaDTO | null;
}
