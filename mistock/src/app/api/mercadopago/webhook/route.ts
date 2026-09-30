import { NextRequest, NextResponse } from 'next/server';
import {
  procesarWebhookPoint,
  validarFirmaWebhook,
  PointWebhookPayload,
} from '@/services/mercadopago';

/**
 * POST /api/mercadopago/webhook
 * Receptor de notificaciones en tiempo real para eventos de Point y Pagos.
 */
export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-signature');
    const requestId = req.headers.get('x-request-id');

    // Validación de seguridad opcional si está configurada la firma
    const esValido = validarFirmaWebhook(signature, requestId);
    if (!esValido) {
      return NextResponse.json({ error: 'Firma de webhook inválida' }, { status: 401 });
    }

    const payload: PointWebhookPayload = await req.json();

    // Procesar evento en background/asíncrono
    const resultado = await procesarWebhookPoint(payload);

    return NextResponse.json({
      received: true,
      processed: resultado.handled,
      status: resultado.status,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Error al procesar webhook';
    // Siempre responder con status 200/400 para evitar reintentos infinitos si el payload era corrupto
    return NextResponse.json({ received: false, error: errorMsg }, { status: 400 });
  }
}
