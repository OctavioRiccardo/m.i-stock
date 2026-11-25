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

import { createHmac, timingSafeEqual } from 'node:crypto';
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

function parsearFirmaHeader(xSignature: string): { ts: string; v1: string } | null {
  let ts = '';
  let v1 = '';

  for (const parte of xSignature.split(',')) {
    const idx = parte.indexOf('=');
    if (idx <= 0) continue;
    const clave = parte.slice(0, idx).trim();
    const valor = parte.slice(idx + 1).trim();
    if (clave === 'ts') ts = valor;
    if (clave === 'v1') v1 = valor;
  }

  if (!ts || !v1 || !/^[0-9a-f]+$/i.test(v1)) {
    return null;
  }

  return { ts, v1: v1.toLowerCase() };
}

/**
 * Valida la firma HMAC-SHA256 del webhook de Mercado Pago (`x-signature`: `ts=...,v1=...`).
 * En producción falla cerrado si `MERCADOPAGO_WEBHOOK_SECRET` no está configurado.
 */
export function validarFirmaWebhook(
  xSignature?: string | null,
  xRequestId?: string | null,
  dataId?: string | null
): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim();

  if (!secret) {
    return process.env.NODE_ENV !== 'production';
  }

  if (!xSignature || !xRequestId?.trim()) {
    return false;
  }

  const parsed = parsearFirmaHeader(xSignature);
  if (!parsed) {
    return false;
  }

  let manifest = '';
  if (dataId?.trim()) {
    manifest += `id:${dataId.trim().toLowerCase()};`;
  }
  manifest += `request-id:${xRequestId.trim()};`;
  manifest += `ts:${parsed.ts};`;

  const expectedHex = createHmac('sha256', secret).update(manifest).digest('hex');
  const receivedBuf = Buffer.from(parsed.v1, 'utf8');
  const expectedBuf = Buffer.from(expectedHex, 'utf8');

  if (receivedBuf.length !== expectedBuf.length) {
    return false;
  }

  return timingSafeEqual(receivedBuf, expectedBuf);
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
