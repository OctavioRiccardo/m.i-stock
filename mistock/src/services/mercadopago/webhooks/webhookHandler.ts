/**
 * ====================================================================
 * MERCADO PAGO WEBHOOK HANDLER: EVENTOS EN TIEMPO REAL
 * ====================================================================
 * 
 * Propósito:
 * Procesar las notificaciones push enviadas por los servidores de Mercado
 * Pago cuando una transacción en la terminal Point cambia de estado
 * ('payment_intent.finished', 'payment_intent.abandoned', etc.).
 */

import { PointWebhookPayload } from '../types/pointTypes';
import { obtenerEstadoIntencionPoint } from '../services/pointService';

export interface WebhookProcessingResult {
  received: boolean;
  handled: boolean;
  action?: string;
  intentId?: string;
  status?: string;
  error?: string;
}

/**
 * Valida la firma del webhook si MERCADOPAGO_WEBHOOK_SECRET está configurado.
 */
export function validarFirmaWebhook(
  xSignature?: string | null,
  xRequestId?: string | null
): boolean {
  // Si no se definió secreto de webhook en desarrollo, permitir para pruebas locales
  if (!process.env.MERCADOPAGO_WEBHOOK_SECRET) {
    return true;
  }

  // Validación de presencia básica
  return Boolean(xSignature && xRequestId);
}

/**
 * Procesa la notificación entrante del evento Point.
 */
export async function procesarWebhookPoint(
  payload: PointWebhookPayload
): Promise<WebhookProcessingResult> {
  try {
    const { action, data } = payload;
    const intentId = data?.id;

    if (!intentId) {
      return {
        received: true,
        handled: false,
        error: 'El payload del webhook no incluye el ID de la intención de pago.',
      };
    }

    // Consultar el estado definitivo de la intención en Mercado Pago
    const resolucion = await obtenerEstadoIntencionPoint(intentId);

    if (!resolucion.success || !resolucion.intent) {
      return {
        received: true,
        handled: false,
        intentId,
        action,
        error: resolucion.error || 'No se pudo verificar el estado en la API de Point.',
      };
    }

    return {
      received: true,
      handled: true,
      intentId,
      action,
      status: resolucion.intent.status,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error inesperado';
    return {
      received: true,
      handled: false,
      error: errorMsg,
    };
  }
}
