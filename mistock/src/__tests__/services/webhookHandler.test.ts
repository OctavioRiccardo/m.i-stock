import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  procesarWebhookPoint,
  validarFirmaWebhook,
} from '@/services/mercadopago/webhooks/webhookHandler';
import * as pointService from '@/services/mercadopago/services/pointService';

function firmarWebhook(
  secret: string,
  params: { dataId?: string; requestId?: string; ts: string }
): string {
  let manifest = '';
  if (params.dataId) {
    manifest += `id:${params.dataId.toLowerCase()};`;
  }
  if (params.requestId) {
    manifest += `request-id:${params.requestId};`;
  }
  manifest += `ts:${params.ts};`;

  const hash = createHmac('sha256', secret).update(manifest).digest('hex');
  return `ts=${params.ts},v1=${hash}`;
}

describe('validarFirmaWebhook (HMAC-SHA256 Mercado Pago)', () => {
  const originalSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.stubEnv('MERCADOPAGO_WEBHOOK_SECRET', 'test_webhook_secret_123');
    vi.stubEnv('NODE_ENV', 'test');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    if (originalSecret !== undefined) {
      process.env.MERCADOPAGO_WEBHOOK_SECRET = originalSecret;
    } else {
      delete process.env.MERCADOPAGO_WEBHOOK_SECRET;
    }
    if (originalNodeEnv !== undefined) {
      vi.stubEnv('NODE_ENV', originalNodeEnv);
    }
  });

  it('acepta una firma HMAC-SHA256 válida con dataId, request-id y ts', () => {
    const xRequestId = 'req-998877';
    const dataId = 'INTENT-ABC-123';
    const xSignature = firmarWebhook('test_webhook_secret_123', {
      dataId,
      requestId: xRequestId,
      ts: '1704908010',
    });

    expect(validarFirmaWebhook(xSignature, xRequestId, dataId)).toBe(true);
  });

  it('rechaza una firma v1 manipulada aunque ambos headers estén presentes', () => {
    const xRequestId = 'req-998877';
    const dataId = 'intent-abc-123';
    const xSignature = 'ts=1704908010,v1=0000000000000000000000000000000000000000000000000000000000000000';

    expect(validarFirmaWebhook(xSignature, xRequestId, dataId)).toBe(false);
  });

  it('rechaza una firma con formato inválido o sin ts/v1', () => {
    expect(validarFirmaWebhook('malformed-signature', 'req-1', '123')).toBe(false);
    expect(validarFirmaWebhook('ts=1704908010', 'req-1', '123')).toBe(false);
    expect(validarFirmaWebhook('v1=abcdef', 'req-1', '123')).toBe(false);
  });

  it('rechaza cuando falta x-signature o x-request-id con secreto configurado', () => {
    const xSignature = firmarWebhook('test_webhook_secret_123', {
      dataId: '123',
      requestId: 'req-1',
      ts: '1704908010',
    });

    expect(validarFirmaWebhook(null, 'req-1', '123')).toBe(false);
    expect(validarFirmaWebhook(xSignature, null, '123')).toBe(false);
    expect(validarFirmaWebhook(xSignature, '', '123')).toBe(false);
  });

  it('rechaza si el dataId fue alterado respecto a la firma', () => {
    const xSignature = firmarWebhook('test_webhook_secret_123', {
      dataId: 'intent-original',
      requestId: 'req-1',
      ts: '1704908010',
    });

    expect(validarFirmaWebhook(xSignature, 'req-1', 'intent-alterado')).toBe(false);
  });

  it('falla cerrado (rechaza) en producción si MERCADOPAGO_WEBHOOK_SECRET no está definido', () => {
    vi.stubEnv('MERCADOPAGO_WEBHOOK_SECRET', '');
    vi.stubEnv('NODE_ENV', 'production');

    expect(validarFirmaWebhook('ts=123,v1=abc', 'req-1', '123')).toBe(false);
  });

  it('permite pruebas locales fuera de producción cuando MERCADOPAGO_WEBHOOK_SECRET no está definido', () => {
    vi.stubEnv('MERCADOPAGO_WEBHOOK_SECRET', '');
    vi.stubEnv('NODE_ENV', 'development');

    expect(validarFirmaWebhook(null, null, null)).toBe(true);
  });
});

describe('procesarWebhookPoint', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('devuelve handled=false si el payload no incluye data.id', async () => {
    const res = await procesarWebhookPoint({
      id: 'evt-1',
      live_mode: false,
      type: 'point_integration_wh',
      date_created: '2026-11-24T00:00:00Z',
      user_id: 1,
      api_version: 'v1',
      action: 'payment_intent.finished',
      data: { id: '' },
    });

    expect(res.received).toBe(true);
    expect(res.handled).toBe(false);
    expect(res.error).toBeTruthy();
  });

  it('consulta el estado de la intención en Point y retorna el status verificado', async () => {
    vi.spyOn(pointService, 'obtenerEstadoIntencionPoint').mockResolvedValue({
      success: true,
      intent: {
        id: 'intent-42',
        status: 'PROCESSED',
        amount: 150000,
        device_id: 'PAX_1',
      },
    });

    const res = await procesarWebhookPoint({
      id: 'evt-2',
      live_mode: false,
      type: 'point_integration_wh',
      date_created: '2026-11-24T00:00:00Z',
      user_id: 1,
      api_version: 'v1',
      action: 'payment_intent.finished',
      data: { id: 'intent-42' },
    });

    expect(res).toEqual({
      received: true,
      handled: true,
      intentId: 'intent-42',
      action: 'payment_intent.finished',
      status: 'PROCESSED',
    });
  });
});
