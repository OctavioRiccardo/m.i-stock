import { describe, expect, it, vi } from 'vitest';
import { MAX_PRECIO_DB } from '@/lib/validaciones';
import {
  validarSolicitudIntentPoint,
  verificarSesionApiPoint,
} from '@/services/mercadopago/security/pointApiGuard';

describe('validarSolicitudIntentPoint', () => {
  it('rechaza si falta deviceId y no existe defaultDeviceId', () => {
    const res = validarSolicitudIntentPoint({ amount: 1500 }, '');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/deviceId/i);
  });

  it('rechaza montos inválidos, negativos, cero, NaN, Infinity o superiores a MAX_PRECIO_DB', () => {
    for (const badAmount of [0, -100, Number.NaN, Number.POSITIVE_INFINITY, 'abc', MAX_PRECIO_DB + 1]) {
      const res = validarSolicitudIntentPoint({ deviceId: 'PAX_1', amount: badAmount }, '');
      expect(res.ok).toBe(false);
    }
  });

  it('respeta la cabecera x-idempotency-key cuando se envía explícitamente', () => {
    const res = validarSolicitudIntentPoint(
      { deviceId: 'PAX_1', amount: 2500.5, ticketNumber: 'TKT-101' },
      '',
      'idem-explicit-999'
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.idempotencyKey).toBe('idem-explicit-999');
      expect(res.data.amount).toBe(2500.5);
      expect(res.data.deviceId).toBe('PAX_1');
    }
  });

  it('deriva una clave de idempotencia determinista ante reintentos con el mismo ticket o externalReference', () => {
    const r1 = validarSolicitudIntentPoint(
      { deviceId: 'PAX_1', amount: 1500, ticketNumber: 'TKT-4242', externalReference: 'VNT-4242' },
      ''
    );
    const r2 = validarSolicitudIntentPoint(
      { deviceId: 'PAX_1', amount: 1500, ticketNumber: 'TKT-4242', externalReference: 'VNT-4242' },
      ''
    );

    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(true);
    if (r1.ok && r2.ok) {
      expect(r1.data.idempotencyKey).toBe(r2.data.idempotencyKey);
      expect(r1.data.idempotencyKey.length).toBeGreaterThanOrEqual(16);
    }
  });
});

describe('verificarSesionApiPoint', () => {
  it('retorna 401 si no hay usuario autenticado', async () => {
    const fakeSupabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      from: vi.fn(),
    };

    const res = await verificarSesionApiPoint(fakeSupabase as never);
    expect(res).toMatchObject({ authorized: false, status: 401 });
  });

  it('retorna 403 si el colaborador está inactivo o tiene rol no_rol', async () => {
    const makeClient = (perfil: { rol: string; activo: boolean } | null) => ({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: '123e4567-e89b-12d3-a456-426614174000' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: perfil, error: null }),
          }),
        }),
      }),
    });

    const sinRol = await verificarSesionApiPoint(makeClient({ rol: 'no_rol', activo: true }) as never);
    expect(sinRol).toMatchObject({ authorized: false, status: 403 });

    const inactivo = await verificarSesionApiPoint(
      makeClient({ rol: 'vendedor', activo: false }) as never
    );
    expect(inactivo).toMatchObject({ authorized: false, status: 403 });
  });

  it('autoriza a usuarios autenticados activos con rol admin o vendedor', async () => {
    const fakeSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: '123e4567-e89b-12d3-a456-426614174000' } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi
              .fn()
              .mockResolvedValue({ data: { rol: 'vendedor', activo: true }, error: null }),
          }),
        }),
      }),
    };

    const res = await verificarSesionApiPoint(fakeSupabase as never);
    expect(res).toEqual({
      authorized: true,
      userId: '123e4567-e89b-12d3-a456-426614174000',
      rol: 'vendedor',
    });
  });
});
