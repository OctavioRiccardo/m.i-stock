/**
 * ====================================================================
 * MERCADO PAGO POINT API: SERVICIO CLIENTE (SDK Service)
 * ====================================================================
 * 
 * Propósito:
 * Proporcionar métodos tipados y robustos para interactuar con la Point
 * Integration API (Cloud) de Mercado Pago:
 * - Detectar y listar los postnet Point físicos asociados al comercio.
 * - Cambiar el modo de operación de la terminal (PDV / STANDALONE).
 * - Enviar intenciones de cobro a la pantalla del dispositivo físico.
 * - Consultar en tiempo real el estado del cobro (aprobado, rechazado, etc.).
 * - Cancelar intenciones activas si el cliente o cajero decide abortar.
 * 
 * Ventaja económica:
 * La API de integración Point de Mercado Pago es 100% GRATUITA y sin costo
 * de mantenimiento ni software. Solo rigen las comisiones estándar por
 * cobro con tarjeta que el comercio ya abona habitualmente.
 */

import { MP_CONFIG, getMercadoPagoHeaders } from '../config/mpConfig';
import {
  PointDevice,
  PointOperatingMode,
  CreatePointPaymentIntentPayload,
  PointPaymentIntent,
} from '../types/pointTypes';

/**
 * Obtiene el listado de terminales Point físicas vinculadas a la cuenta del vendedor.
 */
export async function listarDispositivosPoint(): Promise<{
  success: boolean;
  devices?: PointDevice[];
  error?: string;
}> {
  try {
    if (!MP_CONFIG.accessToken) {
      return {
        success: false,
        error: 'Falta configurar MERCADOPAGO_ACCESS_TOKEN en el entorno.',
      };
    }

    const response = await fetch(`${MP_CONFIG.baseUrl}${MP_CONFIG.endpoints.point.devices}`, {
      method: 'GET',
      headers: getMercadoPagoHeaders(),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `Error al consultar terminales Point (${response.status})`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      devices: data.devices || [],
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error desconocido de red';
    return {
      success: false,
      error: `Fallo de conexión con Mercado Pago: ${errorMsg}`,
    };
  }
}

/**
 * Cambia el modo operativo de la terminal (ej: a 'PDV' para integración con M.I Stock).
 */
export async function configurarModoOperativoPoint(
  deviceId: string,
  mode: PointOperatingMode
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `${MP_CONFIG.baseUrl}${MP_CONFIG.endpoints.point.deviceOperatingMode(deviceId)}`,
      {
        method: 'PATCH',
        headers: getMercadoPagoHeaders(),
        body: JSON.stringify({ operating_mode: mode }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || 'No se pudo actualizar el modo del dispositivo.',
      };
    }

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
    return { success: false, error: errorMsg };
  }
}

/**
 * Envía una intención de cobro presencial a la pantalla del lector Point.
 * La terminal física se activará inmediatamente en mostrador solicitando la tarjeta.
 */
export async function crearIntencionPagoPoint(
  deviceId: string,
  payload: CreatePointPaymentIntentPayload,
  idempotencyKey?: string
): Promise<{
  success: boolean;
  intent?: PointPaymentIntent;
  error?: string;
}> {
  try {
    if (!MP_CONFIG.accessToken) {
      return {
        success: false,
        error: 'Credencial MERCADOPAGO_ACCESS_TOKEN no configurada.',
      };
    }

    if (payload.amount <= 0) {
      return {
        success: false,
        error: 'El importe a cobrar en la terminal debe ser superior a cero.',
      };
    }

    const response = await fetch(
      `${MP_CONFIG.baseUrl}${MP_CONFIG.endpoints.point.createIntent(deviceId)}`,
      {
        method: 'POST',
        headers: getMercadoPagoHeaders(idempotencyKey),
        body: JSON.stringify({
          amount: Math.round(payload.amount), // Mercado Pago Point en ARS requiere enteros sin centavos fraccionados
          description: payload.description || 'Cobro en Punto de Venta M.I Stock',
          payment_mode: 'card',
          additional_info: {
            external_reference: payload.additional_info?.external_reference,
            print_on_terminal: payload.additional_info?.print_on_terminal ?? true,
            ticket_number: payload.additional_info?.ticket_number,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error:
          errorData.message ||
          `Mercado Pago rechazó la creación de cobro en Point (${response.status})`,
      };
    }

    const data: PointPaymentIntent = await response.json();
    return {
      success: true,
      intent: data,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
    return {
      success: false,
      error: `Fallo al transmitir la orden al postnet: ${errorMsg}`,
    };
  }
}

/**
 * Consulta el estado actual de una intención de pago en el lector.
 * Útil para sondeo (polling) mientras el cliente inserta la tarjeta o ingresa PIN.
 */
export async function obtenerEstadoIntencionPoint(
  intentId: string
): Promise<{
  success: boolean;
  intent?: PointPaymentIntent;
  error?: string;
}> {
  try {
    const response = await fetch(
      `${MP_CONFIG.baseUrl}${MP_CONFIG.endpoints.point.getIntent(intentId)}`,
      {
        method: 'GET',
        headers: getMercadoPagoHeaders(),
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || 'No se pudo obtener el estado de la intención de pago.',
      };
    }

    const data: PointPaymentIntent = await response.json();
    return {
      success: true,
      intent: data,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error de comunicación';
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Cancela la intención de pago en curso en la pantalla del lector Point.
 */
export async function cancelarIntencionPagoPoint(
  deviceId: string,
  intentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `${MP_CONFIG.baseUrl}${MP_CONFIG.endpoints.point.cancelIntent(deviceId, intentId)}`,
      {
        method: 'DELETE',
        headers: getMercadoPagoHeaders(),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || 'No se pudo cancelar el cobro en la terminal.',
      };
    }

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
    return { success: false, error: errorMsg };
  }
}
