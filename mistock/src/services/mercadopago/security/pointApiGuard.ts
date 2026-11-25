import { createHash, randomUUID } from 'node:crypto';
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';
import { LIMITES_TEXTO, MAX_PRECIO_DB } from '@/lib/validaciones';

export type ResultadoAuthApiPoint =
  | { authorized: true; userId: string; rol: 'admin' | 'vendedor' }
  | { authorized: false; status: 401 | 403; error: string };

type SupabaseServerLike = Awaited<ReturnType<typeof createServerSupabaseClient>>;

/**
 * Verifica que la petición provenga de un usuario autenticado en Supabase Auth
 * con perfil activo y rol operativo (`admin` o `vendedor`) en `public.usuario`.
 */
export async function verificarSesionApiPoint(
  supabaseOverride?: SupabaseServerLike
): Promise<ResultadoAuthApiPoint> {
  const supabase = supabaseOverride ?? (await createServerSupabaseClient());
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.id) {
    return {
      authorized: false,
      status: 401,
      error: 'Sesión no autenticada. Inicia sesión para operar con terminales Point.',
    };
  }

  const { data: perfil, error: perfilError } = await supabase
    .from('usuario')
    .select('rol, activo')
    .eq('id_usuario', user.id)
    .maybeSingle();

  if (perfilError || !perfil) {
    return {
      authorized: false,
      status: 403,
      error: 'No se pudo verificar el perfil operativo del usuario.',
    };
  }

  const rol = String(perfil.rol || '');
  const activo = perfil.activo !== false;

  if (!activo || (rol !== 'admin' && rol !== 'vendedor')) {
    return {
      authorized: false,
      status: 403,
      error: 'Tu cuenta no posee permisos activos para operar cobros Point.',
    };
  }

  return {
    authorized: true,
    userId: user.id,
    rol,
  };
}

export interface SolicitudIntentPointValidada {
  deviceId: string;
  amount: number;
  description: string;
  externalReference?: string;
  ticketNumber?: string;
  idempotencyKey: string;
}

export type ResultadoValidacionIntentPoint =
  | { ok: true; data: SolicitudIntentPointValidada }
  | { ok: false; error: string };

/**
 * Valida en la frontera HTTP la solicitud de creación de intención Point
 * y deriva una clave de idempotencia estable ante reintentos.
 */
export function validarSolicitudIntentPoint(
  body: unknown,
  defaultDeviceId: string,
  headerIdempotencyKey?: string | null
): ResultadoValidacionIntentPoint {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'El cuerpo de la solicitud debe ser un objeto JSON válido.' };
  }

  const raw = body as Record<string, unknown>;
  const deviceIdRaw =
    typeof raw.deviceId === 'string' && raw.deviceId.trim()
      ? raw.deviceId.trim()
      : defaultDeviceId.trim();

  if (!deviceIdRaw) {
    return {
      ok: false,
      error:
        'Se requiere el identificador deviceId de la terminal Point (o configurar MERCADOPAGO_POINT_DEVICE_ID en el entorno).',
    };
  }

  const amountNum = typeof raw.amount === 'number' ? raw.amount : Number(raw.amount);
  if (!Number.isFinite(amountNum) || amountNum <= 0 || amountNum > MAX_PRECIO_DB) {
    return {
      ok: false,
      error: `El monto a cobrar debe ser un número finito mayor a cero y menor o igual a ${MAX_PRECIO_DB}.`,
    };
  }

  const amountRedondeado = Number(amountNum.toFixed(2));
  const description =
    typeof raw.description === 'string' && raw.description.trim()
      ? raw.description.trim().slice(0, LIMITES_TEXTO.OBSERVACIONES_MAX)
      : 'Venta presencial en mostrador M.I Stock';

  const externalReference =
    typeof raw.externalReference === 'string' && raw.externalReference.trim()
      ? raw.externalReference.trim().slice(0, 64)
      : undefined;

  const ticketNumber =
    typeof raw.ticketNumber === 'string' && raw.ticketNumber.trim()
      ? raw.ticketNumber.trim().slice(0, 64)
      : undefined;

  const explicitKey = headerIdempotencyKey?.trim();
  let idempotencyKey: string;
  if (explicitKey) {
    idempotencyKey = explicitKey.slice(0, 64);
  } else if (externalReference || ticketNumber) {
    const seed = `${deviceIdRaw}|${amountRedondeado}|${externalReference ?? ''}|${ticketNumber ?? ''}`;
    const digest = createHash('sha256').update(seed).digest('hex').slice(0, 32);
    idempotencyKey = `MP-${digest}`;
  } else {
    idempotencyKey = `MP-${randomUUID()}`;
  }

  return {
    ok: true,
    data: {
      deviceId: deviceIdRaw,
      amount: amountRedondeado,
      description,
      externalReference,
      ticketNumber,
      idempotencyKey,
    },
  };
}
