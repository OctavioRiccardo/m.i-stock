import { NextRequest, NextResponse } from 'next/server';
import {
  obtenerEstadoIntencionPoint,
  cancelarIntencionPagoPoint,
} from '@/apis/mercadopago';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/mercadopago/point/intent/[id]
 * Consulta el estado en tiempo real de una intención de cobro.
 */
export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: 'Falta el id de la intención.' }, { status: 400 });
    }

    const resultado = await obtenerEstadoIntencionPoint(id);

    if (!resultado.success || !resultado.intent) {
      return NextResponse.json(
        { error: resultado.error || 'No se encontró la intención de pago.' },
        { status: 404 }
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

/**
 * DELETE /api/mercadopago/point/intent/[id]
 * Cancela una intención activa en el dispositivo Point.
 */
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get('deviceId');

    if (!id || !deviceId) {
      return NextResponse.json(
        { error: 'Se requiere tanto el intentId como el deviceId para cancelar el cobro.' },
        { status: 400 }
      );
    }

    const resultado = await cancelarIntencionPagoPoint(deviceId, id);

    if (!resultado.success) {
      return NextResponse.json(
        { error: resultado.error || 'No se pudo cancelar el cobro en el Point.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: 'Cobro cancelado en la terminal.' });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
