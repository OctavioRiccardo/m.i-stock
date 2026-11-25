import { describe, expect, it } from 'vitest';
import { esErrorTablaFaltante, isUUID } from '@/services/supabase/shared';
import { mapearFilaVentaAReciente } from '@/services/supabase/ventasRepo';

describe('services/supabase/shared', () => {
  it('isUUID valida únicamente identificadores UUID estándar', () => {
    expect(isUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
    expect(isUUID('VNT-1042')).toBe(false);
    expect(isUUID('')).toBe(false);
  });

  it('esErrorTablaFaltante detecta códigos 42P01, PGRST205 y mensajes de tabla ausente', () => {
    expect(esErrorTablaFaltante({ code: '42P01', message: 'relation does not exist' })).toBe(true);
    expect(esErrorTablaFaltante({ code: 'PGRST205', message: 'schema cache' })).toBe(true);
    expect(esErrorTablaFaltante({ message: 'Could not find the table public.foo' })).toBe(true);
    expect(esErrorTablaFaltante({ code: '23505', message: 'duplicate key' })).toBe(false);
    expect(esErrorTablaFaltante(null)).toBe(false);
  });
});

describe('mapearFilaVentaAReciente', () => {
  it('mapea detalles, pagos, método principal y usuario con valores seguros', () => {
    const venta = mapearFilaVentaAReciente({
      id_venta: '123e4567-e89b-12d3-a456-426614174000',
      creado_el: '2026-11-20T15:00:00.000Z',
      total: 4500,
      estado: 'completada',
      usuario: { nombre: 'Lucía' },
      pagos: [{ id_pago: 'p-1', metodo: 'mercado_pago', total: 4500 }],
      detalle_ventas: [
        {
          id_detalle: 'd-1',
          id_producto: 'prod-1',
          cantidad: 3,
          precio_unitario: 1500,
          productos: { nombre: 'Yerba 1kg', sku: 'YER-01' },
        },
      ],
    });

    expect(venta.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(venta.montoTotal).toBe(4500);
    expect(venta.metodoPago).toBe('mercado_pago');
    expect(venta.vendedor).toBe('Lucía');
    expect(venta.cantidadItems).toBe(3);
    expect(venta.items).toHaveLength(1);
    expect(venta.items[0]).toMatchObject({
      nombreProducto: 'Yerba 1kg',
      codigoProducto: 'YER-01',
      subtotal: 4500,
    });
  });

  it('usa defaults seguros cuando faltan relaciones opcionales', () => {
    const venta = mapearFilaVentaAReciente({
      id_venta: 'v-minimal',
      total: '1200',
    });

    expect(venta.metodoPago).toBe('efectivo');
    expect(venta.vendedor).toBe('Cajero');
    expect(venta.estado).toBe('completada');
    expect(venta.cantidadItems).toBe(1);
    expect(venta.items).toEqual([]);
  });
});
