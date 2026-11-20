/**
 * ====================================================================
 * MODELO DE DOMINIO: SESIONES DE CAJA (Turnos de Apertura y Cierre)
 * ====================================================================
 *
 * Propósito:
 * Modelar el historial persistido de aperturas y cierres de caja por usuario.
 * Sincronizado 1:1 con la tabla `public.sesiones_caja` en PostgreSQL.
 */

export type EstadoSesionCajaDB = 'abierta' | 'cerrada';

export interface SesionCajaRow {
  id_sesion: string;
  codigo_turno: string | null;
  id_usuario: string;
  id_usuario_cierre: string | null;
  numero_caja: number;
  fondo_inicial: number;
  efectivo_esperado: number | null;
  efectivo_real: number | null;
  diferencia: number | null;
  total_recaudado: number;
  cantidad_tickets: number;
  estado: EstadoSesionCajaDB;
  observaciones_apertura: string | null;
  observaciones_cierre: string | null;
  abierta_el: string;
  cerrada_el: string | null;
  usuario_apertura?: {
    nombre: string | null;
    email: string | null;
  } | null;
  usuario_cierre?: {
    nombre: string | null;
    email: string | null;
  } | null;
}

export interface SesionCaja {
  id: string;
  codigoTurno: string;
  usuarioId: string;
  usuarioNombre: string;
  usuarioCierreId?: string;
  usuarioCierreNombre?: string;
  numeroCaja: number;
  fondoInicial: number;
  efectivoEsperado: number | null;
  efectivoReal: number | null;
  diferencia: number | null;
  totalRecaudado: number;
  cantidadTickets: number;
  estado: EstadoSesionCajaDB;
  observacionesApertura?: string;
  observacionesCierre?: string;
  abiertaEl: string;
  cerradaEl?: string;
}

/**
 * Transforma una fila de `public.sesiones_caja` a la entidad de dominio `SesionCaja`.
 */
export function toSesionCaja(row: SesionCajaRow): SesionCaja {
  const aperturaJoin = Array.isArray(row.usuario_apertura)
    ? row.usuario_apertura[0]
    : row.usuario_apertura;
  const cierreJoin = Array.isArray(row.usuario_cierre)
    ? row.usuario_cierre[0]
    : row.usuario_cierre;

  const nombreApertura =
    (aperturaJoin?.nombre && aperturaJoin.nombre.trim()) ||
    (aperturaJoin?.email ? aperturaJoin.email.split('@')[0] : 'Cajero');

  const nombreCierre = cierreJoin
    ? (cierreJoin.nombre && cierreJoin.nombre.trim()) ||
      (cierreJoin.email ? cierreJoin.email.split('@')[0] : undefined)
    : undefined;

  return {
    id: row.id_sesion,
    codigoTurno: row.codigo_turno || `TRN-${row.id_sesion.slice(0, 6).toUpperCase()}`,
    usuarioId: row.id_usuario,
    usuarioNombre: nombreApertura,
    usuarioCierreId: row.id_usuario_cierre || undefined,
    usuarioCierreNombre: nombreCierre,
    numeroCaja: Number(row.numero_caja || 1),
    fondoInicial: Number(row.fondo_inicial || 0),
    efectivoEsperado: row.efectivo_esperado !== null ? Number(row.efectivo_esperado) : null,
    efectivoReal: row.efectivo_real !== null ? Number(row.efectivo_real) : null,
    diferencia: row.diferencia !== null ? Number(row.diferencia) : null,
    totalRecaudado: Number(row.total_recaudado || 0),
    cantidadTickets: Number(row.cantidad_tickets || 0),
    estado: row.estado,
    observacionesApertura: row.observaciones_apertura || undefined,
    observacionesCierre: row.observaciones_cierre || undefined,
    abiertaEl: row.abierta_el,
    cerradaEl: row.cerrada_el || undefined,
  };
}
