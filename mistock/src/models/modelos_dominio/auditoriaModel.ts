/**
 * ====================================================================
 * MODELO DE DOMINIO: AUDITORÍA CENTRALIZADA (Append-Only Ledger)
 * ====================================================================
 *
 * Propósito:
 * Representar la bitácora inmutable de eventos críticos del sistema:
 * - Movimientos de inventario y catálogo (alta, modificación, baja lógica, reactivación, ajuste de stock).
 * - Sesiones de acceso (login y logout de administradores y vendedores).
 * - Turnos de caja (apertura y cierre de caja por usuario).
 * - Operaciones de venta (registro y anulación de tickets).
 *
 * Sincronizado 1:1 con la tabla `public.auditoria_eventos` en PostgreSQL.
 */

import { RolUsuarioDB } from './userModel';

export type ModuloAuditoria = 'auth' | 'inventario' | 'caja' | 'ventas' | 'usuarios';

export type AccionAuditoria =
  | 'login'
  | 'logout'
  | 'producto_alta'
  | 'producto_modificacion'
  | 'producto_baja'
  | 'producto_reactivacion'
  | 'stock_ajuste'
  | 'caja_apertura'
  | 'caja_cierre'
  | 'venta_creada'
  | 'venta_anulada';

export interface AuditoriaEventoRow {
  id_evento: string;
  id_usuario: string | null;
  rol_usuario: RolUsuarioDB | null;
  modulo: ModuloAuditoria;
  accion: AccionAuditoria;
  entidad: string | null;
  entidad_id: string | null;
  resumen: string;
  datos_anteriores: Record<string, unknown> | null;
  datos_nuevos: Record<string, unknown> | null;
  creado_el: string;
  usuario?: {
    nombre: string | null;
    email: string | null;
    rol: RolUsuarioDB | null;
  } | null;
}

export interface AuditoriaEvento {
  id: string;
  usuarioId?: string;
  usuarioNombre: string;
  usuarioEmail?: string;
  rolUsuario?: RolUsuarioDB;
  modulo: ModuloAuditoria;
  accion: AccionAuditoria;
  entidad?: string;
  entidadId?: string;
  resumen: string;
  datosAnteriores: Record<string, unknown> | null;
  datosNuevos: Record<string, unknown> | null;
  fechaISO: string;
  timestamp: number;
}

export interface FiltrosAuditoria {
  modulo: ModuloAuditoria | 'todos';
  usuarioId: string; // 'todos' o UUID
  busqueda: string;
  fechaDesde: string; // YYYY-MM-DD o ''
  fechaHasta: string; // YYYY-MM-DD o ''
}

export interface ResumenAuditoria {
  totalEventos: number;
  eventosInventario: number;
  eventosCaja: number;
  eventosVentas: number;
  eventosAuth: number;
}

export const ETIQUETAS_MODULO_AUDITORIA: Record<ModuloAuditoria, string> = {
  inventario: 'Inventario',
  caja: 'Caja',
  ventas: 'Ventas',
  auth: 'Sesiones',
  usuarios: 'Usuarios',
};

export const ETIQUETAS_ACCION_AUDITORIA: Record<AccionAuditoria, string> = {
  login: 'Inicio de sesión',
  logout: 'Cierre de sesión',
  producto_alta: 'Alta de producto',
  producto_modificacion: 'Modificación de producto',
  producto_baja: 'Baja de producto',
  producto_reactivacion: 'Reactivación de producto',
  stock_ajuste: 'Ajuste de stock',
  caja_apertura: 'Apertura de caja',
  caja_cierre: 'Cierre de caja',
  venta_creada: 'Venta registrada',
  venta_anulada: 'Venta anulada',
};

/**
 * Transforma una fila de `public.auditoria_eventos` en la entidad de dominio `AuditoriaEvento`.
 */
export function toAuditoriaEvento(row: AuditoriaEventoRow): AuditoriaEvento {
  const usuarioJoin = Array.isArray(row.usuario) ? row.usuario[0] : row.usuario;
  const email = usuarioJoin?.email || undefined;
  const nombre =
    (usuarioJoin?.nombre && usuarioJoin.nombre.trim()) ||
    (email ? email.split('@')[0] : 'Sistema');
  const rol = row.rol_usuario || usuarioJoin?.rol || undefined;
  const parsedTs = Date.parse(row.creado_el);

  return {
    id: row.id_evento,
    usuarioId: row.id_usuario || undefined,
    usuarioNombre: nombre,
    usuarioEmail: email,
    rolUsuario: rol,
    modulo: row.modulo,
    accion: row.accion,
    entidad: row.entidad || undefined,
    entidadId: row.entidad_id || undefined,
    resumen: row.resumen,
    datosAnteriores:
      row.datos_anteriores && typeof row.datos_anteriores === 'object'
        ? row.datos_anteriores
        : null,
    datosNuevos:
      row.datos_nuevos && typeof row.datos_nuevos === 'object'
        ? row.datos_nuevos
        : null,
    fechaISO: row.creado_el,
    timestamp: Number.isNaN(parsedTs) ? 0 : parsedTs,
  };
}

/**
 * Filtra una lista de eventos de auditoría según módulo, usuario, búsqueda textual y rango de fechas.
 */
export function filtrarEventosAuditoria(
  eventos: AuditoriaEvento[],
  filtros: FiltrosAuditoria
): AuditoriaEvento[] {
  const q = filtros.busqueda.trim().toLowerCase();
  const desdeTs = filtros.fechaDesde ? new Date(`${filtros.fechaDesde}T00:00:00`).getTime() : null;
  const hastaTs = filtros.fechaHasta ? new Date(`${filtros.fechaHasta}T23:59:59.999`).getTime() : null;

  return eventos.filter((ev) => {
    if (filtros.modulo !== 'todos' && ev.modulo !== filtros.modulo) {
      return false;
    }

    if (filtros.usuarioId !== 'todos' && ev.usuarioId !== filtros.usuarioId) {
      return false;
    }

    if (desdeTs !== null && !Number.isNaN(desdeTs) && ev.timestamp < desdeTs) {
      return false;
    }

    if (hastaTs !== null && !Number.isNaN(hastaTs) && ev.timestamp > hastaTs) {
      return false;
    }

    if (q) {
      const etiquetaAccion = ETIQUETAS_ACCION_AUDITORIA[ev.accion]?.toLowerCase() || '';
      const etiquetaModulo = ETIQUETAS_MODULO_AUDITORIA[ev.modulo]?.toLowerCase() || '';
      const texto = [
        ev.resumen,
        ev.usuarioNombre,
        ev.usuarioEmail || '',
        ev.entidadId || '',
        etiquetaAccion,
        etiquetaModulo,
      ]
        .join(' ')
        .toLowerCase();

      if (!texto.includes(q)) return false;
    }

    return true;
  });
}

/**
 * Calcula los totales por categoría operativa sobre una lista de eventos de auditoría.
 */
export function calcularResumenAuditoria(eventos: AuditoriaEvento[]): ResumenAuditoria {
  let eventosInventario = 0;
  let eventosCaja = 0;
  let eventosVentas = 0;
  let eventosAuth = 0;

  for (const ev of eventos) {
    if (ev.modulo === 'inventario') eventosInventario += 1;
    else if (ev.modulo === 'caja') eventosCaja += 1;
    else if (ev.modulo === 'ventas') eventosVentas += 1;
    else if (ev.modulo === 'auth') eventosAuth += 1;
  }

  return {
    totalEventos: eventos.length,
    eventosInventario,
    eventosCaja,
    eventosVentas,
    eventosAuth,
  };
}
