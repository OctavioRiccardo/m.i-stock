import { NextRequest, NextResponse } from 'next/server';
import { crearIntencionPagoPoint } from '@/apis/mercadopago';

/**
 * POST /api/mercadopago/point/intent
 * Crea una intención de pago y despierta el postnet físico en mostrador.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { deviceId, amount, description, externalReference, ticketNumber } = body;

    if (!deviceId) {
      return NextResponse.json(
        { error: 'Se requiere el identificador deviceId de la terminal Point.' },
        { status: 400 }
      );
    }

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json(
        { error: 'El monto a cobrar debe ser mayor a cero.' },
        { status: 400 }
      );
    }

    const idempotencyKey = req.headers.get('x-idempotency-key') || `MP-${Date.now()}`;

    const resultado = await crearIntencionPagoPoint(
      deviceId,
      {
        amount: Number(amount),
        description: description || 'Venta presencial en mostrador M.I Stock',
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
