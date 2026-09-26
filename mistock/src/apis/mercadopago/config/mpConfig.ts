/**
 * ====================================================================
 * MERCADO PAGO API: CONFIGURACIÓN & CREDENCIALES
 * ====================================================================
 * 
 * Propósito:
 * Centralizar las credenciales, URLs base y cabeceras de autorización
 * requeridas para interactuar con las APIs de Mercado Pago (especialmente
 * la Point Integration API para terminales postnet de cobro presencial).
 * 
 * Documentación oficial:
 * https://www.mercadopago.com.ar/developers/es/reference
 * https://www.mercadopago.com.ar/developers/es/reference/point
 */

export const MP_CONFIG = {
  baseUrl: 'https://api.mercadopago.com',
  apiVersion: 'v1',
  // Tokens de autenticación leídos de variables de entorno del servidor
  get accessToken(): string {
    return process.env.MERCADOPAGO_ACCESS_TOKEN || '';
  },
  get publicKey(): string {
    return process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || '';
  },
  get webhookSecret(): string {
    return process.env.MERCADOPAGO_WEBHOOK_SECRET || '';
  },
  // Endpoints oficiales para Point (Terminales / Postnet Cloud)
  endpoints: {
    point: {
      devices: '/v1/point/integration-api/devices',
      deviceOperatingMode: (deviceId: string) =>
        `/v1/point/integration-api/devices/${deviceId}/operating-mode`,
      createIntent: (deviceId: string) =>
        `/v1/point/integration-api/devices/${deviceId}/payment-intents`,
      getIntent: (intentId: string) =>
        `/v1/point/integration-api/payment-intents/${intentId}`,
      cancelIntent: (deviceId: string, intentId: string) =>
        `/v1/point/integration-api/devices/${deviceId}/payment-intents/${intentId}`,
    },
    // Endpoints complementarios para QR dinámico en mostrador (si se implementa a futuro)
    qr: {
      createOrder: (userId: string, externalPosId: string) =>
        `/instore/orders/qr/seller/collectors/${userId}/pos/${externalPosId}/orders`,
    },
  },
};

/**
 * Genera las cabeceras estándar requeridas por la API de Mercado Pago.
 */
export function getMercadoPagoHeaders(idempotencyKey?: string): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${MP_CONFIG.accessToken}`,
  };

  if (idempotencyKey) {
    headers['X-Idempotency-Key'] = idempotencyKey;
  }

  return headers;
}
