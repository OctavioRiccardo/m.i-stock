import { describe, it, expect } from 'vitest';
import {
  MAX_PRECIO_DB,
  MAX_STOCK_DB,
  LIMITES_TEXTO,
  normalizarTexto,
  esEmailValido,
  sanitizarTelefonoInput,
  esTelefonoValido,
  formatearCuitInput,
  esCuitValido,
  esSkuValido,
  sanitizarCodigoIsoInput,
  acotarEntero,
} from '@/lib/validaciones';

describe('Utilidades de Validación y Sanitización (validaciones.ts)', () => {
  it('expone límites numéricos compatibles con PostgreSQL numeric(10,2) e integer', () => {
    expect(MAX_PRECIO_DB).toBe(99_999_999.99);
    expect(MAX_STOCK_DB).toBe(1_000_000);
    expect(LIMITES_TEXTO.PASSWORD_MIN).toBe(6);
    expect(LIMITES_TEXTO.PASSWORD_MAX).toBe(72);
  });

  it('normalizarTexto colapsa espacios múltiples y recorta extremos', () => {
    expect(normalizarTexto('   Yerba   Mate   Playadito  ')).toBe('Yerba Mate Playadito');
    expect(normalizarTexto('')).toBe('');
  });

  it('esEmailValido acepta correos comerciales y dominios de testing (.mistock, .test)', () => {
    expect(esEmailValido('carlos@test.mistock')).toBe(true);
    expect(esEmailValido('vendedor@mistock.test')).toBe(true);
    expect(esEmailValido('admin@comercio.com.ar')).toBe(true);
    expect(esEmailValido('sin-arroba.com')).toBe(false);
    expect(esEmailValido('espacio en@correo.com')).toBe(false);
    expect(esEmailValido(`${'a'.repeat(120)}@test.com`)).toBe(false);
  });

  it('sanitizarTelefonoInput y esTelefonoValido filtran letras y exigen 6 a 15 dígitos', () => {
    expect(sanitizarTelefonoInput('+54 9 (11) 4521-8890 abc!')).toBe('+54 9 (11) 4521-8890 ');
    expect(esTelefonoValido('')).toBe(true); // opcional
    expect(esTelefonoValido('+54 9 11 4521-8890')).toBe(true);
    expect(esTelefonoValido('12345')).toBe(false); // menos de 6 dígitos
    expect(esTelefonoValido('1234567890123456')).toBe(false); // más de 15 dígitos
  });

  it('formatearCuitInput y esCuitValido normalizan a XX-XXXXXXXX-X con 11 dígitos exactos', () => {
    expect(formatearCuitInput('30718293409')).toBe('30-71829340-9');
    expect(formatearCuitInput('20-1234')).toBe('20-1234');
    expect(esCuitValido('')).toBe(true); // opcional en configuración
    expect(esCuitValido('30-71829340-9')).toBe(true);
    expect(esCuitValido('30-7182934')).toBe(false);
  });

  it('esSkuValido valida códigos sin espacios dentro de 2..40 caracteres', () => {
    expect(esSkuValido('BEB-1024')).toBe(true);
    expect(esSkuValido('7790040123456')).toBe(true);
    expect(esSkuValido('A')).toBe(false);
    expect(esSkuValido('COD CON ESPACIO')).toBe(false);
    expect(esSkuValido('X'.repeat(41))).toBe(false);
  });

  it('sanitizarCodigoIsoInput conserva solo hasta 3 letras en mayúsculas', () => {
    expect(sanitizarCodigoIsoInput('ars123')).toBe('ARS');
    expect(sanitizarCodigoIsoInput('us$d')).toBe('USD');
  });

  it('acotarEntero trunca decimales, respeta [min, max] y usa fallback ante NaN', () => {
    expect(acotarEntero(45.9, 1, 365, 30)).toBe(45);
    expect(acotarEntero(-10, 1, 365, 30)).toBe(1);
    expect(acotarEntero(999, 1, 365, 30)).toBe(365);
    expect(acotarEntero(Number.NaN, 1, 365, 30)).toBe(30);
  });
});
