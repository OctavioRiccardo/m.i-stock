/**
 * ====================================================================
 * UTILIDADES CENTRALIZADAS DE VALIDACIÓN Y SANITIZACIÓN DE ENTRADAS
 * ====================================================================
 *
 * Propósito:
 * Garantizar la integridad de datos, límites de longitud y rangos numéricos
 * compatibles con las restricciones de PostgreSQL (`numeric(10,2)`, `integer`,
 * `UNIQUE`, `CHECK >= 0`) antes de impactar el estado o la base de datos.
 */

/** Tope máximo compatible con `numeric(10,2)` en PostgreSQL (`99.999.999,99`). */
export const MAX_PRECIO_DB = 99_999_999.99;

/** Tope máximo operativo para cantidades enteras de stock. */
export const MAX_STOCK_DB = 1_000_000;

/** Límites de longitud para campos textuales. */
export const LIMITES_TEXTO = {
  NOMBRE_PRODUCTO_MIN: 2,
  NOMBRE_PRODUCTO_MAX: 120,
  NOMBRE_CATEGORIA_MIN: 2,
  NOMBRE_CATEGORIA_MAX: 60,
  DESCRIPCION_MAX: 300,
  SKU_MIN: 2,
  SKU_MAX: 40,
  NOMBRE_USUARIO_MIN: 2,
  NOMBRE_USUARIO_MAX: 80,
  EMAIL_MAX: 120,
  PASSWORD_MIN: 6,
  PASSWORD_MAX: 72,
  TELEFONO_MAX: 25,
  CUIT_MAX: 13,
  OBSERVACIONES_MAX: 250,
  NOMBRE_COMERCIAL_MAX: 80,
  RAZON_SOCIAL_MAX: 100,
  DIRECCION_MAX: 150,
  MENSAJE_TICKET_MAX: 160,
} as const;

/**
 * Normaliza espacios múltiples y recorta espacios laterales.
 */
export function normalizarTexto(valor: string): string {
  return valor.trim().replace(/\s+/g, ' ');
}

/**
 * Valida formato de correo electrónico (soporta TLDs estándar y de prueba como `.mistock` o `.test`).
 */
export function esEmailValido(email: string): boolean {
  const limpio = email.trim();
  if (!limpio || limpio.length > LIMITES_TEXTO.EMAIL_MAX) return false;
  return /^[^\s@]+@[^\s@]+\.[a-zA-Z0-9-]{2,}$/.test(limpio);
}

/**
 * Sanitiza en vivo un input telefónico permitiendo solo dígitos, espacios y `+-()`.
 */
export function sanitizarTelefonoInput(raw: string): string {
  return raw.replace(/[^0-9+\-()\s]/g, '').slice(0, LIMITES_TEXTO.TELEFONO_MAX);
}

/**
 * Valida un número telefónico opcional (si se ingresa, debe tener al menos 6 dígitos reales).
 */
export function esTelefonoValido(telefono?: string): boolean {
  if (!telefono || !telefono.trim()) return true;
  const limpio = telefono.trim();
  if (limpio.length > LIMITES_TEXTO.TELEFONO_MAX) return false;
  if (!/^[0-9+\-()\s]+$/.test(limpio)) return false;
  const soloDigitos = limpio.replace(/\D/g, '');
  return soloDigitos.length >= 6 && soloDigitos.length <= 15;
}

/**
 * Formatea progresivamente un CUIT argentino a `XX-XXXXXXXX-X` eliminando caracteres no numéricos.
 */
export function formatearCuitInput(raw: string): string {
  const digitos = raw.replace(/\D/g, '').slice(0, 11);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 10) return `${digitos.slice(0, 2)}-${digitos.slice(2)}`;
  return `${digitos.slice(0, 2)}-${digitos.slice(2, 10)}-${digitos.slice(10, 11)}`;
}

/**
 * Valida un CUIT opcional (si se completa, debe contener exactamente 11 dígitos numéricos).
 */
export function esCuitValido(cuit?: string): boolean {
  if (!cuit || !cuit.trim()) return true;
  const digitos = cuit.replace(/\D/g, '');
  return digitos.length === 11;
}

/**
 * Valida código de barras / SKU (2 a 40 caracteres alfanuméricos, guiones, puntos o barras, sin espacios).
 */
export function esSkuValido(sku: string): boolean {
  const limpio = sku.trim();
  if (limpio.length < LIMITES_TEXTO.SKU_MIN || limpio.length > LIMITES_TEXTO.SKU_MAX) {
    return false;
  }
  return /^[A-Za-z0-9._\-/]+$/.test(limpio);
}

/**
 * Sanitiza un código ISO 4217 de moneda a hasta 3 letras mayúsculas (ej. `ARS`, `USD`).
 */
export function sanitizarCodigoIsoInput(raw: string): string {
  return raw.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 3);
}

/**
 * Acota un número entero dentro de `[min, max]` con valor de respaldo si es `NaN`.
 */
export function acotarEntero(valor: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(valor)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(valor)));
}
