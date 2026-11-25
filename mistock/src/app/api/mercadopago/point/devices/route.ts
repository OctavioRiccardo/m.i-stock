import { NextResponse } from 'next/server';
import { listarDispositivosPoint } from '@/services/mercadopago';
import { verificarSesionApiPoint } from '@/services/mercadopago/security/pointApiGuard';

/**
 * GET /api/mercadopago/point/devices
 * Retorna las terminales Point registradas en la cuenta del comercio.
 */
export async function GET() {
  try {
    const auth = await verificarSesionApiPoint();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const resultado = await listarDispositivosPoint();

    if (!resultado.success) {
      return NextResponse.json(
        { error: resultado.error || 'No se pudieron obtener las terminales Point' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      devices: resultado.devices || [],
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
