import { NextRequest, NextResponse } from 'next/server';
import { crearIntencionPagoPoint, MP_CONFIG } from '@/services/mercadopago';
import {
  validarSolicitudIntentPoint,
  verificarSesionApiPoint,
} from '@/services/mercadopago/security/pointApiGuard';

/**
 * POST /api/mercadopago/point/intent
 * Crea una intención de pago y despierta el postnet físico en mostrador.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await verificarSesionApiPoint();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body: unknown = await req.json();
    const validacion = validarSolicitudIntentPoint(
      body,
      MP_CONFIG.defaultDeviceId,
      req.headers.get('x-idempotency-key')
    );

    if (!validacion.ok) {
      return NextResponse.json({ error: validacion.error }, { status: 400 });
    }

    const { deviceId, amount, description, externalReference, ticketNumber, idempotencyKey } =
      validacion.data;

    const resultado = await crearIntencionPagoPoint(
      deviceId,
      {
        amount,
        description,
        payment_mode: 'card',
        additional_info: {
          external_reference: externalReference,
          print_on_terminal: true,
          ticket_number: ticketNumber,
        },
      },
      idempotencyKey
    );

    if (!resultado.success || !resultado.intent) {
      return NextResponse.json(
        { error: resultado.error || 'Error al enviar orden de cobro al Point.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      intent: resultado.intent,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
