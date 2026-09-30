/**
 * ====================================================================
 * MERCADO PAGO POINT API: DEFINICIONES DE TIPOS (TypeScript)
 * ====================================================================
 * 
 * Propósito:
 * Modelar con precisión de tipos las entidades oficiales de la API
 * de integración de terminales Point (postnet de Mercado Pago):
 * dispositivos, modos de operación, intenciones de cobro y webhooks.
 * 
 * Referencia técnica:
 * https://www.mercadopago.com.ar/developers/es/reference/point
 */

/**
 * Modo de funcionamiento de la terminal Point:
 * - 'PDV': Modo Integrado. La terminal espera recibir el monto desde el software
 *   M.I Stock. Bloquea el teclado manual para evitar errores humanos de cobro.
 * - 'STANDALONE': Modo Autónomo / Clásico. El cobro se digita a mano en el lector.
 */
export type PointOperatingMode = 'PDV' | 'STANDALONE';

/**
 * Estados del ciclo de vida de una intención de cobro presencial en el lector:
 */
export type PointPaymentIntentStatus =
  | 'OPEN'          // Creada en el servidor, lista para transmitirse
  | 'ON_TERMINAL'   // Mostrando "Acerque o inserte tarjeta" en la pantalla del Point
  | 'PROCESSING'    // Leyendo chip/contactless y autorizando con el banco
  | 'PROCESSED'     // ¡Cobro aprobado y acreditado exitosamente!
  | 'ABANDONED'     // Cancelado por timeout o cliente retiró la tarjeta
  | 'CANCELED'      // Cancelado intencionalmente desde la caja M.I Stock
  | 'ERROR';        // Tarjeta rechazada, fondos insuficientes o error de red

/**
 * Representa una terminal Point asociada a la cuenta del negocio en Mercado Pago.
 */
export interface PointDevice {
  id: string; // Identificador único de la terminal (ej: "PAX_A910__123456789")
  operating_mode: PointOperatingMode;
  pos_id?: number | null;
  store_id?: string | null;
  external_pos_id?: string | null;
}

/**
 * Parámetros para enviar una solicitud de cobro al postnet físico.
 */
export interface CreatePointPaymentIntentPayload {
  amount: number; // Monto a cobrar en pesos argentinos (ej: 1500)
  description?: string; // Breve descripción para el comprobante
  payment_mode?: 'card'; // Cobro con tarjeta (débito, crédito o prepaga)
  additional_info?: {
    external_reference?: string; // Identificador interno en M.I Stock (ej: VNT-1049)
    print_on_terminal?: boolean; // True para que el Point imprima su ticket térmico
    ticket_number?: string;
  };
}

/**
 * Respuesta devuelta por Mercado Pago al gestionar una intención de cobro en Point.
 */
export interface PointPaymentIntent {
  id: string; // ID único de la intención (ej: "01H... / UUID")
  device_id: string;
  amount: number;
  description?: string;
  status: PointPaymentIntentStatus;
  payment?: {
    id: number; // ID oficial del cobro registrado en la cuenta de Mercado Pago
    state_complimentary?: string;
  };
  additional_info?: {
    external_reference?: string;
    print_on_terminal?: boolean;
    ticket_number?: string;
  };
}

/**
 * Estructura de evento Webhook recibido en tiempo real desde Mercado Pago.
 */
export interface PointWebhookPayload {
  id: number | string;
  live_mode: boolean;
  type: 'point_integration_wh' | 'payment';
  date_created: string;
  user_id: number | string;
  api_version: string;
  action: 'payment_intent.created' | 'payment_intent.finished' | 'payment_intent.abandoned';
  data: {
    id: string; // ID de la intención de pago para consultar su resolución
  };
}
