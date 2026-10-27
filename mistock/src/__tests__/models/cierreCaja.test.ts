import { describe, it, expect } from 'vitest';
import {
  calcularEfectivoEsperado,
  calcularDiferenciaCaja,
  determinarEstadoBalance,
  calcularTotalesCierre,
  ResumenMediosPagoCierre,
} from '@/models/modelos_vista/cierreCajaModel';

describe('Modelo de Vista: Arqueo y Cierre de Caja (cierreCajaModel)', () => {
  describe('calcularEfectivoEsperado', () => {
    it('debe sumar correctamente el fondo inicial de gaveta y las ventas en efectivo del turno', () => {
      const fondoInicial = 10000;
      const ventasEfectivo = 25450;
      const esperado = calcularEfectivoEsperado(fondoInicial, ventasEfectivo);

      expect(esperado).toBe(35450);
    });

    it('debe retornar únicamente el fondo inicial cuando no hubo ventas en efectivo en el turno', () => {
      const fondoInicial = 15000;
      const ventasEfectivo = 0;
      const esperado = calcularEfectivoEsperado(fondoInicial, ventasEfectivo);

      expect(esperado).toBe(15000);
    });

    it('debe retornar únicamente las ventas en efectivo si la caja abrió con fondo inicial 0', () => {
      const fondoInicial = 0;
      const ventasEfectivo = 8700;
      const esperado = calcularEfectivoEsperado(fondoInicial, ventasEfectivo);

      expect(esperado).toBe(8700);
    });

    it('debe prevenir valores negativos tratando entradas erróneas como 0', () => {
      const fondoInicial = -500;
      const ventasEfectivo = 1200;
      const esperado = calcularEfectivoEsperado(fondoInicial, ventasEfectivo);

      expect(esperado).toBe(1200);
    });
  });

  describe('calcularDiferenciaCaja', () => {
    it('debe dar diferencia 0 cuando el arqueo físico coincide exactamente con lo esperado', () => {
      const efectivoReal = 20000;
      const efectivoEsperado = 20000;
      const diferencia = calcularDiferenciaCaja(efectivoReal, efectivoEsperado);

      expect(diferencia).toBe(0);
    });

    it('debe dar una diferencia positiva cuando hay dinero sobrante en la gaveta', () => {
      const efectivoReal = 21500;
      const efectivoEsperado = 20000;
      const diferencia = calcularDiferenciaCaja(efectivoReal, efectivoEsperado);

      expect(diferencia).toBe(1500);
      expect(diferencia).toBeGreaterThan(0);
    });

    it('debe dar una diferencia negativa cuando hay faltante de dinero en la gaveta', () => {
      const efectivoReal = 18200;
      const efectivoEsperado = 20000;
      const diferencia = calcularDiferenciaCaja(efectivoReal, efectivoEsperado);

      expect(diferencia).toBe(-1800);
      expect(diferencia).toBeLessThan(0);
    });

    it('debe redondear con precisión decimal sin desbordes de coma flotante IEEE 754', () => {
      const efectivoReal = 15000.3;
      const efectivoEsperado = 15000.1;
      const diferencia = calcularDiferenciaCaja(efectivoReal, efectivoEsperado);

      expect(diferencia).toBe(0.2);
    });
  });

  describe('determinarEstadoBalance', () => {
    it('debe clasificar como "exacto" cuando la diferencia es 0', () => {
      expect(determinarEstadoBalance(0)).toBe('exacto');
    });

    it('debe clasificar como "sobrante" cuando la diferencia es mayor a 0', () => {
      expect(determinarEstadoBalance(500)).toBe('sobrante');
      expect(determinarEstadoBalance(0.5)).toBe('sobrante');
    });

    it('debe clasificar como "faltante" cuando la diferencia es menor a 0', () => {
      expect(determinarEstadoBalance(-1200)).toBe('faltante');
      expect(determinarEstadoBalance(-0.1)).toBe('faltante');
    });

    it('debe tolerar micro-desviaciones infinitesimales de coma flotante clasificando como exacto', () => {
      expect(determinarEstadoBalance(0.0000001)).toBe('exacto');
      expect(determinarEstadoBalance(-0.0000001)).toBe('exacto');
    });
  });

  describe('calcularTotalesCierre', () => {
    it('debe consolidar adecuadamente los medios digitales y el gran total general', () => {
      const totalEfectivo = 15000;
      const desglose: ResumenMediosPagoCierre = {
        efectivo: 15000,
        mercadoPago: 12500,
        tarjetaDebito: 8000,
        tarjetaCredito: 5000,
        transferencia: 4500,
        otro: 1000,
      };

      const resultado = calcularTotalesCierre(totalEfectivo, desglose);

      // Digitales: 12500 + 8000 + 5000 + 4500 + 1000 = 31000
      expect(resultado.totalDigitales).toBe(31000);
      // Gran total: 15000 + 31000 = 46000
      expect(resultado.granTotalRecaudado).toBe(46000);
    });

    it('debe tolerar desgloses incompletos o parciales sin arrojar NaN', () => {
      const totalEfectivo = 10000;
      const desgloseParcial = {
        mercadoPago: 5000,
      };

      const resultado = calcularTotalesCierre(totalEfectivo, desgloseParcial);

      expect(resultado.totalDigitales).toBe(5000);
      expect(resultado.granTotalRecaudado).toBe(15000);
    });
  });
});
