import { NextRequest, NextResponse } from 'next/server';
import {
  obtenerEstadoIntencionPoint,
  cancelarIntencionPagoPoint,
  MP_CONFIG,
} from '@/services/mercadopago';
import { verificarSesionApiPoint } from '@/services/mercadopago/security/pointApiGuard';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/mercadopago/point/intent/[id]
 * Consulta el estado en tiempo real de una intención de cobro.
 */
export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const auth = await verificarSesionApiPoint();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await context.params;
    const intentId = id?.trim();

    if (!intentId) {
      return NextResponse.json({ error: 'Falta el id de la intención.' }, { status: 400 });
    }

    const resultado = await obtenerEstadoIntencionPoint(intentId);

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
    const auth = await verificarSesionApiPoint();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await context.params;
    const intentId = id?.trim();
    const { searchParams } = new URL(req.url);
    const deviceId = (searchParams.get('deviceId') || MP_CONFIG.defaultDeviceId).trim();

    if (!intentId || !deviceId) {
      return NextResponse.json(
        {
          error:
            'Se requiere tanto el intentId como el deviceId (o configurar MERCADOPAGO_POINT_DEVICE_ID en el entorno).',
        },
        { status: 400 }
      );
    }

    const resultado = await cancelarIntencionPagoPoint(deviceId, intentId);

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
