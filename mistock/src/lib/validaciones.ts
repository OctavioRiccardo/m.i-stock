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
 * Sanitiza el símbolo monetario (ej. `$`, `US$`, `€`, `R$`), bloqueando números,
 * comas, puntos, signos negativos y espacios.
 */
export function sanitizarSimboloMonedaInput(raw: string): string {
  return raw
    .replace(/[0-9.,;\-+_=@#%^&*()[\]{}|\\<>?~`"]/g, '')
    .replace(/\s+/g, '')
    .slice(0, 4);
}

/**
 * Sanitiza en tiempo real un input numérico decimal (precios, montos en efectivo):
 * - Convierte comas `,` en puntos `.` para soportar teclado regional (`es-AR`).
 * - Bloquea signos negativos `-`, `+`, notación científica `e`, letras y símbolos.
 * - Permite a lo sumo un separador decimal y hasta `maxDecimales` dígitos fraccionarios.
 * - Limita la parte entera a 8 dígitos (`MAX_PRECIO_DB = 99.999.999,99`).
 */
export function sanitizarDecimalInput(raw: string, maxDecimales = 2): string {
  if (!raw) return '';
  const conPuntos = raw.replace(/,/g, '.').replace(/[^0-9.]/g, '');
  if (!conPuntos) return '';

  const primerPuntoIdx = conPuntos.indexOf('.');
  let parteEntera = primerPuntoIdx === -1 ? conPuntos : conPuntos.slice(0, primerPuntoIdx);
  const tienePunto = primerPuntoIdx !== -1;
  const parteDecimal = tienePunto
    ? conPuntos.slice(primerPuntoIdx + 1).replace(/\./g, '').slice(0, maxDecimales)
    : '';

  if (parteEntera === '' && tienePunto) {
    parteEntera = '0';
  }

  if (parteEntera.length > 1 && parteEntera.startsWith('0')) {
    parteEntera = parteEntera.replace(/^0+/, '') || '0';
  }

  parteEntera = parteEntera.slice(0, 8);

  return tienePunto ? `${parteEntera}.${parteDecimal}` : parteEntera;
}

/**
 * Convierte de forma segura un texto o número decimal (con coma o punto) en un `number`
 * acotado entre `0` y `MAX_PRECIO_DB`.
 */
export function parsearDecimalSeguro(raw: string | number): number {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) && raw >= 0 ? Math.min(raw, MAX_PRECIO_DB) : 0;
  }
  const limpio = sanitizarDecimalInput(raw);
  if (!limpio) return 0;
  const num = parseFloat(limpio);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.min(num, MAX_PRECIO_DB);
}

/**
 * Sanitiza en tiempo real un input de número entero positivo (stock, punto de venta, caja):
 * - Elimina comas, puntos, signos `-`/`+`, letra `e` y cualquier símbolo no numérico.
 * - Normaliza ceros a la izquierda innecesarios y acota al `maxValor` indicado.
 */
export function sanitizarEnteroInput(raw: string, maxValor: number = MAX_STOCK_DB): string {
  if (!raw) return '';
  let soloDigitos = raw.replace(/\D/g, '');
  if (!soloDigitos) return '';
  if (soloDigitos.length > 1 && soloDigitos.startsWith('0')) {
    soloDigitos = soloDigitos.replace(/^0+/, '') || '0';
  }
  const valorNumerico = parseInt(soloDigitos, 10);
  if (!Number.isFinite(valorNumerico)) return '';
  if (valorNumerico > maxValor) {
    return String(maxValor);
  }
  return String(valorNumerico);
}

/**
 * Sanitiza en tiempo real un código SKU / Código de Barras:
 * - Convierte espacios en guiones `-` y elimina símbolos inválidos (comas, `;`, `$`, `@`, etc.).
 */
export function sanitizarSkuInput(raw: string): string {
  return raw
    .replace(/\s+/g, '-')
    .replace(/[^A-Za-z0-9._\-/]/g, '')
    .slice(0, LIMITES_TEXTO.SKU_MAX);
}

/**
 * Sanitiza en tiempo real el nombre de una persona / colaborador:
 * - Permite letras (incluyendo tildes y diéresis), espacios, puntos, apóstrofes y guiones.
 * - Bloquea números y símbolos especiales (`@#$%^&*()`, comas, etc.).
 */
export function sanitizarNombrePersonaInput(raw: string): string {
  return raw
    .replace(/[^a-zA-ZÁÉÍÓÚáéíóúÀÈÌÒÙàèìòùÂÊÎÔÛâêîôûÄËÏÖÜäëïöüÑñÇç\s.'\-]/g, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, LIMITES_TEXTO.NOMBRE_USUARIO_MAX);
}

/**
 * Sanitiza un alias bancario / billetera virtual (solo letras, números, puntos y guiones, sin espacios ni comas).
 */
export function sanitizarAliasTransferenciaInput(raw: string): string {
  return raw
    .replace(/[^a-zA-Z0-9.\-]/g, '')
    .toLowerCase()
    .slice(0, 40);
}

/**
 * Acota un número entero dentro de `[min, max]` con valor de respaldo si es `NaN`.
 */
export function acotarEntero(valor: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(valor)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(valor)));
}
