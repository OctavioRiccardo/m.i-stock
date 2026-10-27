import { describe, it, expect } from 'vitest';
import {
  calcularSubtotalRenglon,
  calcularTotalesCarrito,
  calcularVueltoPOS,
  generarSugerenciasBilletes,
} from '@/models/modelos_vista/dashboardModel';

describe('Punto de Venta (POS): Cálculos de Carrito, Cobro y Vuelto', () => {
  describe('calcularSubtotalRenglon', () => {
    it('debe calcular el subtotal multiplicando precio unitario por cantidad', () => {
      const subtotal = calcularSubtotalRenglon(1250, 3);
      expect(subtotal).toBe(3750);
    });

    it('debe redondear adecuadamente cuando hay centavos en el precio', () => {
      const subtotal = calcularSubtotalRenglon(33.33, 3);
      expect(subtotal).toBe(99.99);
    });

    it('debe retornar 0 si la cantidad solicitada es 0', () => {
      const subtotal = calcularSubtotalRenglon(500, 0);
      expect(subtotal).toBe(0);
    });

    it('debe proteger contra valores negativos devolviendo 0', () => {
      expect(calcularSubtotalRenglon(-100, 2)).toBe(0);
      expect(calcularSubtotalRenglon(100, -2)).toBe(0);
    });
  });

  describe('calcularTotalesCarrito', () => {
    it('debe totalizar correctamente un ticket vacío', () => {
      const { total, cantidadArticulos } = calcularTotalesCarrito([]);
      expect(total).toBe(0);
      expect(cantidadArticulos).toBe(0);
    });

    it('debe sumar los subtotales y cantidades de múltiples renglones de venta', () => {
      const carrito = [
        { cantidad: 2, subtotal: 3000 },  // 2 ítems de $1.500
        { cantidad: 1, subtotal: 4500 },  // 1 ítem de $4.500
        { cantidad: 3, subtotal: 1500 },  // 3 ítems de $500
      ];

      const { total, cantidadArticulos } = calcularTotalesCarrito(carrito);

      expect(total).toBe(9000);
      expect(cantidadArticulos).toBe(6);
    });

    it('debe evitar errores de precisión en sumas con decimales', () => {
      const carrito = [
        { cantidad: 1, subtotal: 10.1 },
        { cantidad: 1, subtotal: 20.2 },
      ];

      const { total, cantidadArticulos } = calcularTotalesCarrito(carrito);

      expect(total).toBe(30.3);
      expect(cantidadArticulos).toBe(2);
    });
  });

  describe('calcularVueltoPOS', () => {
    it('debe indicar vuelto 0 y monto suficiente cuando el cliente paga justo (monto exacto)', () => {
      const total = 4500;
      const montoRecibido = 4500;

      const resultado = calcularVueltoPOS(total, montoRecibido);

      expect(resultado.vuelto).toBe(0);
      expect(resultado.faltante).toBe(0);
      expect(resultado.esMontoSuficiente).toBe(true);
    });

    it('debe calcular el vuelto correspondiente cuando el cliente abona con un billete mayor', () => {
      const total = 3700;
      const montoRecibido = 5000;

      const resultado = calcularVueltoPOS(total, montoRecibido);

      expect(resultado.vuelto).toBe(1300);
      expect(resultado.faltante).toBe(0);
      expect(resultado.esMontoSuficiente).toBe(true);
    });

    it('debe detectar pago insuficiente y calcular el dinero faltante a completar', () => {
      const total = 10000;
      const montoRecibido = 7500;

      const resultado = calcularVueltoPOS(total, montoRecibido);

      expect(resultado.vuelto).toBe(0);
      expect(resultado.faltante).toBe(2500);
      expect(resultado.esMontoSuficiente).toBe(false);
    });

    it('debe manejar monto recibido 0 sin fallos', () => {
      const total = 2000;
      const montoRecibido = 0;

      const resultado = calcularVueltoPOS(total, montoRecibido);

      expect(resultado.vuelto).toBe(0);
      expect(resultado.faltante).toBe(2000);
      expect(resultado.esMontoSuficiente).toBe(false);
    });
  });

  describe('generarSugerenciasBilletes', () => {
    it('debe generar la sugerencia de pago exacto y las escalas superiores de billetes habituales', () => {
      const total = 4200;
      const sugerencias = generarSugerenciasBilletes(total);

      expect(sugerencias).toHaveLength(6);
      expect(sugerencias[0]).toEqual({ label: 'Exacto', valor: 4200 });
      expect(sugerencias[1]).toEqual({ label: '+ $1.000', valor: 5200 });
      expect(sugerencias[2]).toEqual({ label: '+ $2.000', valor: 6200 });
      expect(sugerencias[3]).toEqual({ label: '+ $5.000', valor: 9200 });
      expect(sugerencias[4]).toEqual({ label: '+ $10.000', valor: 14200 });
      expect(sugerencias[5]).toEqual({ label: '+ $20.000', valor: 24200 });
    });

    it('debe redondear valores con centavos a enteros para sugerencias de billetes físicos', () => {
      const total = 1450.75;
      const sugerencias = generarSugerenciasBilletes(total);

      expect(sugerencias[0]).toEqual({ label: 'Exacto', valor: 1451 });
      expect(sugerencias[1].valor).toBe(2451);
    });
  });
});
