'use client';

/**
 * ====================================================================
 * VISTA: AUDITORÍA CENTRALIZADA DEL SISTEMA (MVC - View)
 * ====================================================================
 *
 * Propósito:
 * Presentar la bitácora inmutable de trazabilidad operativa para administradores:
 * - Movimientos de inventario (altas, modificaciones, bajas, reactivaciones y ajustes).
 * - Inicios y cierres de sesión de administradores y vendedores.
 * - Aperturas y cierres de caja por usuario (con vista dedicada de turnos).
 * - Ventas registradas y anulaciones por usuario.
 */

import React, { useId } from 'react';
import {
  ClipboardText,
  Package,
  Vault,
  Receipt,
  SignIn,
  ArrowsClockwise,
  MagnifyingGlass,
  X,
  Eye,
  WarningCircle,
  CaretLeft,
  CaretRight,
  Clock,
  User,
} from '@phosphor-icons/react';
import { MotionConfig } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAdminAuditoriaController } from '@/controllers/adminControllers/auditoriaController';
import {
  AccionAuditoria,
  ModuloAuditoria,
  ETIQUETAS_ACCION_AUDITORIA,
  ETIQUETAS_MODULO_AUDITORIA,
} from '@/models/modelos_dominio/auditoriaModel';

interface AdminAuditoriaViewProps {
  controller: ReturnType<typeof useAdminAuditoriaController>;
}

const OPCIONES_MODULO: { id: ModuloAuditoria | 'todos'; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'inventario', label: 'Inventario' },
  { id: 'caja', label: 'Caja' },
  { id: 'ventas', label: 'Ventas' },
  { id: 'auth', label: 'Sesiones' },
];

function formatearFechaHora(iso?: string): string {
  if (!iso) return '—';
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return iso;
  return fecha.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getVarianteAccion(
  accion: AccionAuditoria
): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' {
  switch (accion) {
    case 'producto_alta':
    case 'producto_reactivacion':
    case 'caja_apertura':
    case 'venta_creada':
    case 'login':
      return 'success';
    case 'producto_baja':
    case 'venta_anulada':
      return 'destructive';
    case 'producto_modificacion':
    case 'stock_ajuste':
    case 'caja_cierre':
      return 'warning';
    case 'logout':
    default:
      return 'secondary';
  }
}

function getVarianteModulo(
  modulo: ModuloAuditoria
): 'default' | 'secondary' | 'outline' | 'warning' {
  switch (modulo) {
    case 'inventario':
      return 'default';
    case 'caja':
      return 'warning';
    case 'ventas':
      return 'secondary';
    case 'auth':
    default:
      return 'outline';
  }
}

function formatearValorJSON(val: unknown): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? 'Sí' : 'No';
  if (typeof val === 'number') return val.toLocaleString('es-AR');
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

export function AdminAuditoriaView({ controller }: AdminAuditoriaViewProps) {
  const searchId = useId();
  const desdeId = useId();
  const hastaId = useId();

  const {
    monedaSimbolo,
    vistaActiva,
    setVistaActiva,
    cargando,
    errorCarga,
    migracionPendiente,
    eventosFiltrados,
    eventosPaginados,
    sesionesFiltradas,
    sesionesPaginadas,
    resumenGlobal,
    opcionesUsuarios,
    moduloFiltro,
    setModuloFiltro,
    usuarioFiltro,
    setUsuarioFiltro,
    busqueda,
    setBusqueda,
    fechaDesde,
    setFechaDesde,
    fechaHasta,
    setFechaHasta,
    hayFiltrosActivos,
    limpiarFiltros,
    pagina,
    setPagina,
    totalPaginas,
    eventoSeleccionado,
    setEventoSeleccionado,
    recargarAuditoria,
  } = controller;

  const clavesDetalle = eventoSeleccionado
    ? Array.from(
        new Set([
          ...Object.keys(eventoSeleccionado.datosAnteriores || {}),
          ...Object.keys(eventoSeleccionado.datosNuevos || {}),
        ])
      )
    : [];

  return (
    <MotionConfig reducedMotion="user">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-[-0.02em]">
              Auditoría del Sistema
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Registro cronológico de movimientos de stock, accesos de usuarios, aperturas/cierres de caja y ventas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void recargarAuditoria()}
              disabled={cargando}
              className="gap-1.5"
            >
              <ArrowsClockwise className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </Button>
          </div>
        </div>

        {/* Aviso si falta aplicar el parche SQL */}
        {migracionPendiente && (
          <Alert variant="warning">
            <WarningCircle className="h-4 w-4" weight="fill" />
            <AlertTitle className="font-semibold">Migración pendiente en Supabase</AlertTitle>
            <AlertDescription className="text-xs leading-relaxed">
              Ejecutar el esquema unificado{' '}
              <code className="font-mono font-semibold">
                mistock/supabase/migrations/schema.sql
              </code>{' '}
              en el SQL Editor de Supabase para habilitar las tablas{' '}
              <code className="font-mono">public.auditoria_eventos</code> y{' '}
              <code className="font-mono">public.sesiones_caja</code> junto con sus triggers automáticos.
            </AlertDescription>
          </Alert>
        )}

        {errorCarga && !migracionPendiente && (
          <Alert variant="destructive">
            <WarningCircle className="h-4 w-4" weight="fill" />
            <AlertTitle className="font-semibold">No se pudo cargar la auditoría</AlertTitle>
            <AlertDescription className="text-xs">{errorCarga}</AlertDescription>
          </Alert>
        )}

        {/* Jerarquía KPI Asimétrica (estilo Libro Mayor compacto) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          <Card className="lg:col-span-4 overflow-hidden relative">
            <div className="absolute inset-y-0 left-0 w-1 bg-primary" aria-hidden="true" />
            <div className="p-5 pl-6 flex flex-col justify-center h-full gap-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground block">
                    Eventos Registrados
                  </span>
                  <span className="text-xs text-foreground-subtle mt-0.5 block">
                    Bitácora inmutable centralizada
                  </span>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary shrink-0">
                  <ClipboardText className="h-4 w-4" weight="duotone" />
                </div>
              </div>
              <p className="text-3xl font-bold font-mono tabular-nums text-foreground tracking-[-0.03em] leading-none">
                {resumenGlobal.totalEventos.toLocaleString('es-AR')}
              </p>
            </div>
          </Card>

          <Card className="lg:col-span-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 h-full divide-y sm:divide-y-0 sm:divide-x divide-border/80">
              <div className="p-4 sm:p-5 flex flex-col justify-center gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                    Inventario y Stock
                  </span>
                  <Package className="h-4 w-4 text-primary/80 shrink-0" weight="duotone" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono tabular-nums text-foreground leading-tight">
                    {resumenGlobal.eventosInventario.toLocaleString('es-AR')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Altas, bajas y ajustes
                  </p>
                </div>
              </div>

              <div className="p-4 sm:p-5 flex flex-col justify-center gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                    Caja y Ventas
                  </span>
                  <Vault className="h-4 w-4 text-primary/80 shrink-0" weight="duotone" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono tabular-nums text-foreground leading-tight">
                    {(resumenGlobal.eventosCaja + resumenGlobal.eventosVentas).toLocaleString('es-AR')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {resumenGlobal.eventosCaja} caja · {resumenGlobal.eventosVentas} ventas
                  </p>
                </div>
              </div>

              <div className="p-4 sm:p-5 flex flex-col justify-center gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                    Accesos (Auth)
                  </span>
                  <SignIn className="h-4 w-4 text-primary/80 shrink-0" weight="duotone" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono tabular-nums text-foreground leading-tight">
                    {resumenGlobal.eventosAuth.toLocaleString('es-AR')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Inicios y cierres de sesión
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Panel Principal: Selector de Vista + Filtros + Tabla */}
        <Card>
          <CardHeader className="pb-4 border-b border-border space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base font-semibold text-foreground">
                  {vistaActiva === 'eventos' ? 'Bitácora de Eventos' : 'Historial de Turnos de Caja'}
                </CardTitle>
                <Badge variant="default" className="font-mono tabular-nums">
                  {vistaActiva === 'eventos' ? eventosFiltrados.length : sesionesFiltradas.length}
                </Badge>
              </div>

              {/* Alternador entre Bitácora General y Tabla de Turnos de Caja */}
              <div className="inline-flex items-center p-1 rounded-lg bg-muted/80 border border-border self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => setVistaActiva('eventos')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-[background-color,color] duration-150 cursor-pointer ${
                    vistaActiva === 'eventos'
                      ? 'bg-card text-foreground shadow-[0_1px_2px_rgba(28,36,36,0.06)]'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ClipboardText className="h-3.5 w-3.5" weight={vistaActiva === 'eventos' ? 'duotone' : 'regular'} />
                  <span>Eventos Generales</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVistaActiva('sesiones_caja')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-[background-color,color] duration-150 cursor-pointer ${
                    vistaActiva === 'sesiones_caja'
                      ? 'bg-card text-foreground shadow-[0_1px_2px_rgba(28,36,36,0.06)]'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Vault className="h-3.5 w-3.5" weight={vistaActiva === 'sesiones_caja' ? 'duotone' : 'regular'} />
                  <span>Turnos de Caja</span>
                </button>
              </div>
            </div>

            {/* Filtros por Módulo (en vista de eventos) */}
            {vistaActiva === 'eventos' && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {OPCIONES_MODULO.map((op) => {
                  const activo = moduloFiltro === op.id;
                  return (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => setModuloFiltro(op.id)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-[background-color,color,border-color] duration-150 cursor-pointer ${
                        activo
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background text-muted-foreground border border-border hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {op.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Barra de búsqueda, usuario y rango de fechas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-end">
              <div className="lg:col-span-4 space-y-1">
                <label htmlFor={searchId} className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  Buscar
                </label>
                <div className="relative">
                  <MagnifyingGlass className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id={searchId}
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar por resumen, usuario o SKU..."
                    className="pl-8 pr-8 h-9 text-xs"
                  />
                  {busqueda && (
                    <button
                      type="button"
                      onClick={() => setBusqueda('')}
                      aria-label="Limpiar búsqueda"
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="lg:col-span-3 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  Usuario
                </span>
                <Select value={usuarioFiltro} onValueChange={setUsuarioFiltro}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Todos los usuarios" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los usuarios</SelectItem>
                    {opcionesUsuarios.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.nombre} {u.rol ? `(${u.rol})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="lg:col-span-2 space-y-1">
                <label htmlFor={desdeId} className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  Desde
                </label>
                <Input
                  id={desdeId}
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="lg:col-span-2 space-y-1">
                <label htmlFor={hastaId} className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  Hasta
                </label>
                <Input
                  id={hastaId}
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="lg:col-span-1">
                {hayFiltrosActivos && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={limpiarFiltros}
                    className="w-full h-9 text-xs"
                  >
                    Limpiar
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {cargando ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                Cargando registros de auditoría...
              </div>
            ) : vistaActiva === 'eventos' ? (
              eventosPaginados.length === 0 ? (
                <div className="py-16 px-4 text-center space-y-2">
                  <ClipboardText className="h-9 w-9 mx-auto text-foreground-subtle" weight="duotone" />
                  <p className="text-sm font-semibold text-foreground">
                    Sin eventos para mostrar
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {hayFiltrosActivos
                      ? 'Ajustar o limpiar los filtros para ver otros registros.'
                      : 'Los movimientos de stock, accesos, cajas y ventas aparecerán aquí automáticamente.'}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha y Hora</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Módulo</TableHead>
                      <TableHead>Acción</TableHead>
                      <TableHead>Detalle</TableHead>
                      <TableHead className="text-right">Registro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eventosPaginados.map((ev) => {
                      const tienePayload = Boolean(ev.datosAnteriores || ev.datosNuevos);
                      return (
                        <TableRow key={ev.id}>
                          <TableCell className="font-mono tabular-nums text-xs text-muted-foreground whitespace-nowrap">
                            {formatearFechaHora(ev.fechaISO)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="text-xs font-semibold text-foreground">
                                  {ev.usuarioNombre}
                                </div>
                                {ev.rolUsuario && (
                                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                    {ev.rolUsuario}
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getVarianteModulo(ev.modulo)}>
                              {ETIQUETAS_MODULO_AUDITORIA[ev.modulo]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getVarianteAccion(ev.accion)}>
                              {ETIQUETAS_ACCION_AUDITORIA[ev.accion]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-foreground-secondary max-w-md">
                            <span className="line-clamp-2">{ev.resumen}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            {tienePayload ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setEventoSeleccionado(ev)}
                                className="h-7 px-2.5 text-xs gap-1"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>Ver</span>
                              </Button>
                            ) : (
                              <span className="text-xs text-foreground-subtle">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )
            ) : sesionesPaginadas.length === 0 ? (
              <div className="py-16 px-4 text-center space-y-2">
                <Vault className="h-9 w-9 mx-auto text-foreground-subtle" weight="duotone" />
                <p className="text-sm font-semibold text-foreground">
                  Sin turnos de caja registrados
                </p>
                <p className="text-xs text-muted-foreground">
                  Cada apertura y cierre de caja realizado desde el POS quedará trazado aquí.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Turno / Caja</TableHead>
                    <TableHead>Operador</TableHead>
                    <TableHead>Apertura / Cierre</TableHead>
                    <TableHead className="text-right">Fondo Inicial</TableHead>
                    <TableHead className="text-right">Recaudado</TableHead>
                    <TableHead className="text-right">Diferencia</TableHead>
                    <TableHead className="text-right">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sesionesPaginadas.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="font-mono text-xs font-semibold text-foreground">
                          {s.codigoTurno}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Caja N° {s.numeroCaja} · {s.cantidadTickets} tickets
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-semibold text-foreground">{s.usuarioNombre}</div>
                        {s.usuarioCierreNombre && s.usuarioCierreNombre !== s.usuarioNombre && (
                          <div className="text-[11px] text-muted-foreground">
                            Cierre: {s.usuarioCierreNombre}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-mono tabular-nums text-xs text-muted-foreground whitespace-nowrap">
                        <div>Ap: {formatearFechaHora(s.abiertaEl)}</div>
                        <div>Ci: {s.cerradaEl ? formatearFechaHora(s.cerradaEl) : 'En curso'}</div>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-xs text-foreground">
                        {monedaSimbolo} {s.fondoInicial.toLocaleString('es-AR')}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-xs font-semibold text-foreground">
                        {monedaSimbolo} {s.totalRecaudado.toLocaleString('es-AR')}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-xs">
                        {s.diferencia === null ? (
                          <span className="text-foreground-subtle">—</span>
                        ) : (
                          <span
                            className={
                              s.diferencia === 0
                                ? 'text-emerald-700 font-semibold'
                                : s.diferencia > 0
                                ? 'text-primary font-semibold'
                                : 'text-red-700 font-semibold'
                            }
                          >
                            {s.diferencia > 0 ? '+' : ''}
                            {monedaSimbolo} {s.diferencia.toLocaleString('es-AR')}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={s.estado === 'abierta' ? 'success' : 'secondary'}>
                          {s.estado === 'abierta' ? 'Abierta' : 'Cerrada'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Paginación */}
            {!cargando && totalPaginas > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border text-xs text-muted-foreground">
                <span className="font-mono tabular-nums">
                  Página {pagina} de {totalPaginas}
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pagina <= 1}
                    onClick={() => setPagina((p) => Math.max(1, p - 1))}
                    className="h-8 px-2.5 gap-1"
                  >
                    <CaretLeft className="h-3.5 w-3.5" />
                    <span>Anterior</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pagina >= totalPaginas}
                    onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                    className="h-8 px-2.5 gap-1"
                  >
                    <span>Siguiente</span>
                    <CaretRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Detalle Antes / Después del Evento */}
        <Dialog open={!!eventoSeleccionado} onOpenChange={(open) => !open && setEventoSeleccionado(null)}>
          <DialogContent className="max-w-xl p-6">
            {eventoSeleccionado && (
              <>
                <DialogHeader className="pb-3 border-b border-border space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={getVarianteModulo(eventoSeleccionado.modulo)}>
                      {ETIQUETAS_MODULO_AUDITORIA[eventoSeleccionado.modulo]}
                    </Badge>
                    <Badge variant={getVarianteAccion(eventoSeleccionado.accion)}>
                      {ETIQUETAS_ACCION_AUDITORIA[eventoSeleccionado.accion]}
                    </Badge>
                  </div>
                  <DialogTitle className="text-base font-bold text-foreground">
                    Detalle del Evento de Auditoría
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    {eventoSeleccionado.resumen}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-background border border-border text-xs">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary shrink-0" weight="duotone" />
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                        Responsable
                      </span>
                      <span className="font-semibold text-foreground">
                        {eventoSeleccionado.usuarioNombre}
                        {eventoSeleccionado.rolUsuario ? ` (${eventoSeleccionado.rolUsuario})` : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary shrink-0" weight="duotone" />
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                        Fecha y Hora
                      </span>
                      <span className="font-mono tabular-nums font-semibold text-foreground">
                        {formatearFechaHora(eventoSeleccionado.fechaISO)}
                      </span>
                    </div>
                  </div>
                </div>

                {clavesDetalle.length > 0 && (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Campo</TableHead>
                          {eventoSeleccionado.datosAnteriores && <TableHead>Anterior</TableHead>}
                          <TableHead>Nuevo / Registrado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clavesDetalle.map((clave) => {
                          const prevVal = eventoSeleccionado.datosAnteriores?.[clave];
                          const nextVal = eventoSeleccionado.datosNuevos?.[clave];
                          const cambio =
                            eventoSeleccionado.datosAnteriores &&
                            JSON.stringify(prevVal) !== JSON.stringify(nextVal);
                          return (
                            <TableRow key={clave}>
                              <TableCell className="font-mono text-xs font-semibold text-foreground">
                                {clave}
                              </TableCell>
                              {eventoSeleccionado.datosAnteriores && (
                                <TableCell className="font-mono text-xs text-muted-foreground">
                                  {formatearValorJSON(prevVal)}
                                </TableCell>
                              )}
                              <TableCell
                                className={`font-mono text-xs ${
                                  cambio ? 'font-bold text-primary' : 'text-foreground'
                                }`}
                              >
                                {formatearValorJSON(nextVal)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {eventoSeleccionado.entidadId && (
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                    <span className="inline-flex items-center gap-1">
                      <Receipt className="h-3.5 w-3.5" />
                      <span>Entidad: {eventoSeleccionado.entidad || 'sistema'}</span>
                    </span>
                    <span className="font-mono">ID: {eventoSeleccionado.entidadId}</span>
                  </div>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MotionConfig>
  );
}
