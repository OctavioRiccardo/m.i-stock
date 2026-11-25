import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { calcularResumenMediosTurno } from '@/controllers/userControllers/useCajaTurno';
import { useCarritoPos } from '@/controllers/userControllers/useCarritoPos';
import type { ProductoRapidoPOS, VentaRecientePOS } from '@/models/modelos_vista/dashboardModel';

const PRODUCTO_STOCK_2: ProductoRapidoPOS = {
  id: 'prod-1',
  nombre: 'Café Molido 500g',
  categoria: 'Almacén',
  precio: 3500,
  stock: 2,
  stockMinimo: 1,
  codigo: 'CAF-500',
};

const PRODUCTO_AGOTADO: ProductoRapidoPOS = {
  id: 'prod-0',
  nombre: 'Azúcar 1kg',
  categoria: 'Almacén',
  precio: 1200,
  stock: 0,
  stockMinimo: 5,
  codigo: 'AZU-1',
};

describe('calcularResumenMediosTurno', () => {
  it('agrupa correctamente los importes por medio de pago', () => {
    const baseVenta = {
      id: 'v',
      hora: '10:00',
      cantidadItems: 1,
      items: [],
      estado: 'completada' as const,
    };

    const ventas: VentaRecientePOS[] = [
      { ...baseVenta, id: '1', metodoPago: 'efectivo', montoTotal: 1000 },
      { ...baseVenta, id: '2', metodoPago: 'efectivo', montoTotal: 500 },
      { ...baseVenta, id: '3', metodoPago: 'mercado_pago', montoTotal: 2200 },
      { ...baseVenta, id: '4', metodoPago: 'tarjeta_debito', montoTotal: 1800 },
      { ...baseVenta, id: '5', metodoPago: 'tarjeta_credito', montoTotal: 3000 },
      { ...baseVenta, id: '6', metodoPago: 'transferencia', montoTotal: 900 },
      { ...baseVenta, id: '7', metodoPago: 'cheque', montoTotal: 400 },
    ];

    expect(calcularResumenMediosTurno(ventas)).toEqual({
      efectivo: 1500,
      mercadoPago: 2200,
      tarjetaDebito: 1800,
      tarjetaCredito: 3000,
      transferencia: 900,
      otro: 400,
    });
  });
});

describe('useCarritoPos', () => {
  it('rechaza agregar productos si la caja está cerrada', () => {
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useCarritoPos({
        cajaAbierta: false,
        permitirVentaSinStock: false,
        productosPopulares: [PRODUCTO_STOCK_2],
        onError,
      })
    );

    let agregado = true;
    act(() => {
      agregado = result.current.agregarAlCarrito(PRODUCTO_STOCK_2, 1);
    });

    expect(agregado).toBe(false);
    expect(result.current.carrito).toHaveLength(0);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('bloquea productos sin stock salvo que permitirVentaSinStock esté activo', () => {
    const onError = vi.fn();
    const { result: bloqueado } = renderHook(() =>
      useCarritoPos({
        cajaAbierta: true,
        permitirVentaSinStock: false,
        productosPopulares: [PRODUCTO_AGOTADO],
        onError,
      })
    );

    act(() => {
      expect(bloqueado.current.agregarAlCarrito(PRODUCTO_AGOTADO)).toBe(false);
    });
    expect(bloqueado.current.carrito).toHaveLength(0);
    expect(onError).toHaveBeenCalledTimes(1);

    const { result: permitido } = renderHook(() =>
      useCarritoPos({
        cajaAbierta: true,
        permitirVentaSinStock: true,
        productosPopulares: [PRODUCTO_AGOTADO],
        onError: vi.fn(),
      })
    );

    act(() => {
      expect(permitido.current.agregarAlCarrito(PRODUCTO_AGOTADO, 2)).toBe(true);
    });
    expect(permitido.current.totalCarrito).toBe(2400);
    expect(permitido.current.cantidadArticulosCarrito).toBe(2);
  });

  it('incrementa cantidades respetando stock máximo y elimina el ítem al fijar cantidad 0', () => {
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useCarritoPos({
        cajaAbierta: true,
        permitirVentaSinStock: false,
        productosPopulares: [PRODUCTO_STOCK_2],
        onError,
      })
    );

    act(() => {
      result.current.agregarAlCarrito(PRODUCTO_STOCK_2, 1);
      result.current.agregarAlCarrito(PRODUCTO_STOCK_2, 1);
    });

    expect(result.current.cantidadArticulosCarrito).toBe(2);
    expect(result.current.totalCarrito).toBe(7000);

    // Exceder stock disponible (=2) no debe modificar la cantidad
    act(() => {
      result.current.agregarAlCarrito(PRODUCTO_STOCK_2, 1);
    });
    expect(result.current.cantidadArticulosCarrito).toBe(2);
    expect(onError).toHaveBeenCalled();

    // Cantidad 0 elimina el renglón
    act(() => {
      result.current.actualizarCantidadItem(PRODUCTO_STOCK_2.id, 0);
    });
    expect(result.current.carrito).toHaveLength(0);
    expect(result.current.totalCarrito).toBe(0);
  });
});
