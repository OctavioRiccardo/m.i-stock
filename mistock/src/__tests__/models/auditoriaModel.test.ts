import { describe, it, expect } from 'vitest';
import {
  toAuditoriaEvento,
  filtrarEventosAuditoria,
  calcularResumenAuditoria,
  AuditoriaEventoRow,
} from '@/models/modelos_dominio/auditoriaModel';
import { toSesionCaja, SesionCajaRow } from '@/models/modelos_dominio/sesionCajaModel';

describe('auditoriaModel — mapeo, filtros y métricas de auditoría', () => {
  const rowInventario: AuditoriaEventoRow = {
    id_evento: '11111111-1111-1111-1111-111111111111',
    id_usuario: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    rol_usuario: 'admin',
    modulo: 'inventario',
    accion: 'producto_alta',
    entidad: 'productos',
    entidad_id: '22222222-2222-2222-2222-222222222222',
    resumen: 'Alta de producto "Yerba Taragüi 1kg" (SKU: ALM-010, stock inicial: 25)',
    datos_anteriores: null,
    datos_nuevos: { nombre: 'Yerba Taragüi 1kg', precio_venta: 4200, stock_actual: 25 },
    creado_el: '2026-11-20T14:30:00.000Z',
    usuario: { nombre: 'Carlos', email: 'carlos@test.mistock', rol: 'admin' },
  };

  const rowAuth: AuditoriaEventoRow = {
    id_evento: '33333333-3333-3333-3333-333333333333',
    id_usuario: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    rol_usuario: 'vendedor',
    modulo: 'auth',
    accion: 'login',
    entidad: 'auth',
    entidad_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    resumen: 'Inicio de sesión de Vendedor 1 (vendedor)',
    datos_anteriores: null,
    datos_nuevos: { email: 'vendedor1@test.mistock', rol: 'vendedor' },
    creado_el: '2026-11-20T15:00:00.000Z',
    usuario: { nombre: 'Vendedor 1', email: 'vendedor1@test.mistock', rol: 'vendedor' },
  };

  const rowCaja: AuditoriaEventoRow = {
    id_evento: '44444444-4444-4444-4444-444444444444',
    id_usuario: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    rol_usuario: 'vendedor',
    modulo: 'caja',
    accion: 'caja_apertura',
    entidad: 'sesiones_caja',
    entidad_id: '55555555-5555-5555-5555-555555555555',
    resumen: 'Apertura de Caja N° 1 (TRN-998877) · Fondo inicial: $20000',
    datos_anteriores: null,
    datos_nuevos: { fondo_inicial: 20000, numero_caja: 1 },
    creado_el: '2026-11-20T15:05:00.000Z',
    usuario: { nombre: 'Vendedor 1', email: 'vendedor1@test.mistock', rol: 'vendedor' },
  };

  const rowVenta: AuditoriaEventoRow = {
    id_evento: '66666666-6666-6666-6666-666666666666',
    id_usuario: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    rol_usuario: 'vendedor',
    modulo: 'ventas',
    accion: 'venta_creada',
    entidad: 'ventas',
    entidad_id: '77777777-7777-7777-7777-777777777777',
    resumen: 'Venta registrada #77777777 · Total: $4200',
    datos_anteriores: null,
    datos_nuevos: { total: 4200, estado: 'completada' },
    creado_el: '2026-11-20T15:10:00.000Z',
    usuario: { nombre: 'Vendedor 1', email: 'vendedor1@test.mistock', rol: 'vendedor' },
  };

  const eventos = [rowInventario, rowAuth, rowCaja, rowVenta].map(toAuditoriaEvento);

  it('mapea AuditoriaEventoRow correctamente a entidad de dominio', () => {
    const ev = toAuditoriaEvento(rowInventario);
    expect(ev.id).toBe(rowInventario.id_evento);
    expect(ev.usuarioNombre).toBe('Carlos');
    expect(ev.rolUsuario).toBe('admin');
    expect(ev.modulo).toBe('inventario');
    expect(ev.accion).toBe('producto_alta');
    expect(ev.timestamp).toBeGreaterThan(0);
  });

  it('asigna nombre "Sistema" cuando el evento no posee usuario asociado', () => {
    const ev = toAuditoriaEvento({
      ...rowInventario,
      id_usuario: null,
      usuario: null,
    });
    expect(ev.usuarioNombre).toBe('Sistema');
    expect(ev.usuarioId).toBeUndefined();
  });

  it('filtra por módulo, usuario y búsqueda textual sin distinguir mayúsculas', () => {
    const soloInventario = filtrarEventosAuditoria(eventos, {
      modulo: 'inventario',
      usuarioId: 'todos',
      busqueda: 'taragüi',
      fechaDesde: '',
      fechaHasta: '',
    });
    expect(soloInventario).toHaveLength(1);
    expect(soloInventario[0].accion).toBe('producto_alta');

    const soloVendedor = filtrarEventosAuditoria(eventos, {
      modulo: 'todos',
      usuarioId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      busqueda: '',
      fechaDesde: '',
      fechaHasta: '',
    });
    expect(soloVendedor).toHaveLength(3);
  });

  it('calcula correctamente el resumen por categoría operativa', () => {
    const resumen = calcularResumenAuditoria(eventos);
    expect(resumen).toEqual({
      totalEventos: 4,
      eventosInventario: 1,
      eventosCaja: 1,
      eventosVentas: 1,
      eventosAuth: 1,
    });
  });
});

describe('sesionCajaModel — mapeo de sesiones de caja', () => {
  it('mapea SesionCajaRow con operador de apertura y cierre', () => {
    const row: SesionCajaRow = {
      id_sesion: '99999999-9999-9999-9999-999999999999',
      codigo_turno: 'TRN-123456',
      id_usuario: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      id_usuario_cierre: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      numero_caja: 1,
      fondo_inicial: 20000,
      efectivo_esperado: 32500,
      efectivo_real: 32500,
      diferencia: 0,
      total_recaudado: 15000,
      cantidad_tickets: 4,
      estado: 'cerrada',
      observaciones_apertura: 'Cambio inicial',
      observaciones_cierre: 'Caja exacta',
      abierta_el: '2026-11-20T12:00:00.000Z',
      cerrada_el: '2026-11-20T20:00:00.000Z',
      usuario_apertura: { nombre: 'Vendedor 1', email: 'vendedor1@test.mistock' },
      usuario_cierre: { nombre: 'Carlos', email: 'carlos@test.mistock' },
    };

    const sesion = toSesionCaja(row);
    expect(sesion.codigoTurno).toBe('TRN-123456');
    expect(sesion.usuarioNombre).toBe('Vendedor 1');
    expect(sesion.usuarioCierreNombre).toBe('Carlos');
    expect(sesion.diferencia).toBe(0);
    expect(sesion.estado).toBe('cerrada');
  });
});
