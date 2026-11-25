'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import {
  CaretLeft,
  CaretRight,
  Receipt,
  MagnifyingGlass,
  Funnel,
  ArrowCounterClockwise,
  Users,
  CreditCard,
  X,
  CalendarBlank,
} from '@phosphor-icons/react';
import { MetodoPago, EstadoVenta } from '@/models/modelos_dominio/ventaModel';
import { useAdminDashboardController } from '@/controllers/adminControllers/dashboardController';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BadgeMetodoPago } from '@/components/ui/badge-metodo-pago';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

interface SeccionHistorialVentasAdminProps {
  controller: ReturnType<typeof useAdminDashboardController>;
}

export function SeccionHistorialVentasAdmin({ controller }: SeccionHistorialVentasAdminProps) {
  const {
    data,
    periodoMetricasActivo,
    etiquetaPeriodoActivo,
    monedaSimbolo,
    paginaVentas,
    setPaginaVentas,
    itemsPorPaginaVentas,
    filtroVendedorVentas,
    cambiarFiltroVendedorVentas,
    filtroMetodoPagoVentas,
    cambiarFiltroMetodoPagoVentas,
    filtroEstadoVentas,
    cambiarFiltroEstadoVentas,
    busquedaVentas,
    cambiarBusquedaVentas,
    limpiarFiltrosVentas,
  } = controller;

  const [ventasTableBodyRef] = useAutoAnimate<HTMLTableSectionElement>({
    duration: 220,
    easing: 'ease-out',
  });

  const listaActivaVentas = data.ventasDetalle.ventasPeriodoActivo;
  const resumenActivoVentas = data.ventasDetalle.resumenPeriodoActivo;

  const vendedoresDisponibles = React.useMemo(() => {
    const set = new Set<string>();
    listaActivaVentas.forEach((v) => {
      if (v.vendedor) set.add(v.vendedor);
    });
    return ['Todos', ...Array.from(set).sort()];
  }, [listaActivaVentas]);

  const listaFiltradaVentas = React.useMemo(() => {
    return listaActivaVentas.filter((v) => {
      if (filtroVendedorVentas !== 'Todos' && v.vendedor !== filtroVendedorVentas) {
        return false;
      }
      if (filtroMetodoPagoVentas !== 'Todos' && v.metodoPago !== filtroMetodoPagoVentas) {
        return false;
      }
      if (filtroEstadoVentas !== 'Todos' && v.estado !== filtroEstadoVentas) {
        return false;
      }
      if (busquedaVentas.trim()) {
        const query = busquedaVentas.toLowerCase().trim();
        const coincideComprobante = v.codigoComprobante.toLowerCase().includes(query);
        const coincideVendedor = v.vendedor.toLowerCase().includes(query);
        if (!coincideComprobante && !coincideVendedor) {
          return false;
        }
      }
      return true;
    });
  }, [
    listaActivaVentas,
    filtroVendedorVentas,
    filtroMetodoPagoVentas,
    filtroEstadoVentas,
    busquedaVentas,
  ]);

  const hayFiltrosVentasActivos =
    filtroVendedorVentas !== 'Todos' ||
    filtroMetodoPagoVentas !== 'Todos' ||
    filtroEstadoVentas !== 'Todos' ||
    busquedaVentas.trim() !== '';

  const resumenFiltradoVentas = React.useMemo(() => {
    if (!hayFiltrosVentasActivos) {
      return resumenActivoVentas;
    }
    const activasFiltradas = listaFiltradaVentas.filter((v) => v.estado !== 'cancelada');
    const totalRecaudado = activasFiltradas.reduce((acc, v) => acc + v.total, 0);
    const cantidadVentas = activasFiltradas.length;
    const ticketPromedio =
      cantidadVentas > 0 ? Math.round(totalRecaudado / cantidadVentas) : 0;
    const unidadesTotales = activasFiltradas.reduce((acc, v) => acc + v.cantidadItems, 0);
    return {
      totalRecaudado,
      cantidadVentas,
      ticketPromedio,
      unidadesTotales,
    };
  }, [hayFiltrosVentasActivos, resumenActivoVentas, listaFiltradaVentas]);

  const totalVentas = listaFiltradaVentas.length;
  const totalPaginasVentas = Math.ceil(totalVentas / itemsPorPaginaVentas) || 1;
  const inicioVentas = (paginaVentas - 1) * itemsPorPaginaVentas;
  const ventasPaginadas = listaFiltradaVentas.slice(
    inicioVentas,
    inicioVentas + itemsPorPaginaVentas
  );

  const getMetodoPagoBadge = (metodo: MetodoPago) => (
    <BadgeMetodoPago metodo={metodo} size="md" showIcon={false} />
  );

  const getEstadoBadge = (estado: EstadoVenta) => {
    switch (estado) {
      case 'completada':
        return (
          <Badge variant="success" className="text-xs font-medium capitalize">
            Completada
          </Badge>
        );
      case 'cancelada':
        return (
          <Badge
            variant="outline"
            className="text-xs font-medium capitalize bg-rose-50 text-rose-700 border-rose-300"
          >
            Cancelada
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-xs font-medium capitalize">
            {estado}
          </Badge>
        );
    }
  };

  return (
        <Card className="border-[#E8E6DF] shadow-xs bg-white overflow-hidden">
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between pb-4 gap-3 border-b border-[#E8E6DF]">
            <div>
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-[#2A7A78]" weight="duotone" />
                <CardTitle className="text-base font-bold text-[#1C2424]">
                  Registro de Operaciones Comerciales
                </CardTitle>
              </div>
              <p className="text-xs text-[#657373] mt-1">
                Auditoría pormenorizada de comprobantes emitidos en caja durante el período seleccionado.
              </p>
            </div>

            <Badge
              variant="outline"
              className="self-start md:self-auto bg-[#F8F7F2] text-[#2A7A78] border-[#E8E6DF] font-semibold text-xs px-2.5 py-1 flex items-center gap-1.5"
            >
              <CalendarBlank className="h-3.5 w-3.5" weight="duotone" />
              {etiquetaPeriodoActivo} ({listaActivaVentas.length} {listaActivaVentas.length === 1 ? 'operación' : 'operaciones'})
            </Badge>
          </CardHeader>

          <CardContent className="pt-4 overflow-hidden space-y-4">
            {/* Barra de Filtros Interactivos para la Tabla de Ventas */}
            <div className="p-3 bg-[#F8F7F2]/80 rounded-xl border border-[#E8E6DF] space-y-2.5">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
                {/* 1. Input de Búsqueda Rápida */}
                <div className="relative flex-1 min-w-[220px]">
                  <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#657373]" />
                  <Input
                    type="text"
                    maxLength={120}
                    placeholder="Buscar por comprobante o vendedor..."
                    value={busquedaVentas}
                    onChange={(e) => cambiarBusquedaVentas(e.target.value)}
                    className="pl-9 pr-8 h-9 text-xs bg-white border-[#E8E6DF] focus:border-[#2A7A78] focus:ring-[#2A7A78]/20"
                  />
                  {busquedaVentas && (
                    <button
                      type="button"
                      onClick={() => cambiarBusquedaVentas('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#657373] hover:text-[#1C2424] cursor-pointer"
                      title="Borrar búsqueda"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* 2. Selectores de Filtro: Vendedor, Método de Pago, Estado */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Selector Vendedor */}
                  <div className="w-full sm:w-44">
                    <Select
                      value={filtroVendedorVentas}
                      onValueChange={cambiarFiltroVendedorVentas}
                    >
                      <SelectTrigger className="h-9 text-xs bg-white border-[#E8E6DF]">
                        <div className="flex items-center gap-1.5 truncate">
                          <Users className="h-3.5 w-3.5 text-[#2A7A78] shrink-0" weight="duotone" />
                          <span className="truncate">
                            {filtroVendedorVentas === 'Todos'
                              ? 'Todos los vendedores'
                              : filtroVendedorVentas}
                          </span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {vendedoresDisponibles.map((v) => (
                          <SelectItem key={v} value={v} className="text-xs">
                            {v === 'Todos' ? 'Todos los vendedores' : v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Selector Método de Pago */}
                  <div className="w-full sm:w-40">
                    <Select
                      value={filtroMetodoPagoVentas}
                      onValueChange={cambiarFiltroMetodoPagoVentas}
                    >
                      <SelectTrigger className="h-9 text-xs bg-white border-[#E8E6DF]">
                        <div className="flex items-center gap-1.5 truncate">
                          <CreditCard className="h-3.5 w-3.5 text-[#2A7A78] shrink-0" weight="duotone" />
                          <span className="truncate">
                            {filtroMetodoPagoVentas === 'Todos'
                              ? 'Todos los pagos'
                              : filtroMetodoPagoVentas === 'efectivo'
                              ? 'Efectivo'
                              : filtroMetodoPagoVentas === 'tarjeta_debito'
                              ? 'Tarjeta Débito'
                              : filtroMetodoPagoVentas === 'tarjeta_credito'
                              ? 'Tarjeta Crédito'
                              : filtroMetodoPagoVentas === 'transferencia'
                              ? 'Transferencia'
                              : filtroMetodoPagoVentas === 'mercado_pago'
                              ? 'Mercado Pago'
                              : filtroMetodoPagoVentas}
                          </span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Todos" className="text-xs">Todos los pagos</SelectItem>
                        <SelectItem value="efectivo" className="text-xs">Efectivo</SelectItem>
                        <SelectItem value="tarjeta_debito" className="text-xs">Tarjeta Débito</SelectItem>
                        <SelectItem value="tarjeta_credito" className="text-xs">Tarjeta Crédito</SelectItem>
                        <SelectItem value="transferencia" className="text-xs">Transferencia</SelectItem>
                        <SelectItem value="mercado_pago" className="text-xs">Mercado Pago</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Selector Estado (solo estados reales de venta POS) */}
                  <div className="w-full sm:w-36">
                    <Select
                      value={filtroEstadoVentas}
                      onValueChange={cambiarFiltroEstadoVentas}
                    >
                      <SelectTrigger className="h-9 text-xs bg-white border-[#E8E6DF]">
                        <div className="flex items-center gap-1.5 truncate">
                          <Funnel className="h-3.5 w-3.5 text-[#2A7A78] shrink-0" weight="duotone" />
                          <span className="truncate">
                            {filtroEstadoVentas === 'Todos'
                              ? 'Todos los estados'
                              : filtroEstadoVentas === 'completada'
                              ? 'Completadas'
                              : 'Canceladas'}
                          </span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Todos" className="text-xs">Todos los estados</SelectItem>
                        <SelectItem value="completada" className="text-xs">Completadas</SelectItem>
                        <SelectItem value="cancelada" className="text-xs">Canceladas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Botón Reset de Filtros */}
                  {hayFiltrosVentasActivos && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={limpiarFiltrosVentas}
                      className="h-9 px-3 text-xs text-[#657373] hover:text-[#1C2424] border-[#E8E6DF] hover:bg-white active:scale-95 transition-all duration-150 cursor-pointer"
                      title="Restablecer todos los filtros"
                    >
                      <ArrowCounterClockwise className="h-3.5 w-3.5 mr-1.5" />
                      Limpiar
                    </Button>
                  )}
                </div>
              </div>

              {/* Resumen compacto exclusivamente cuando hay filtros aplicados sobre la tabla */}
              {hayFiltrosVentasActivos && (
                <div className="flex flex-wrap items-center justify-between text-xs pt-2 px-1 border-t border-[#E8E6DF]/70 text-[#657373] gap-2">
                  <span>
                    Mostrando <strong className="text-[#1C2424]">{totalVentas}</strong> de{' '}
                    <strong className="text-[#1C2424]">{listaActivaVentas.length}</strong> operaciones
                  </span>
                  <div className="flex flex-wrap items-center gap-3">
                    <span>
                      Total filtrado:{' '}
                      <strong className="text-[#2A7A78]">
                        {monedaSimbolo}{resumenFiltradoVentas.totalRecaudado.toLocaleString('es-AR')}
                      </strong>
                    </span>
                    <span className="text-[#E8E6DF]">•</span>
                    <span>
                      Ticket prom.:{' '}
                      <strong className="text-[#1C2424]">
                        {monedaSimbolo}{resumenFiltradoVentas.ticketPromedio.toLocaleString('es-AR')}
                      </strong>
                    </span>
                    <span className="text-[#E8E6DF]">•</span>
                    <span>
                      Unidades: <strong className="text-[#1C2424]">{resumenFiltradoVentas.unidadesTotales} un.</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Tabla de Detalle de Ventas con animación de transición */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`ventas-${periodoMetricasActivo}-${filtroVendedorVentas}-${filtroMetodoPagoVentas}-${filtroEstadoVentas}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="space-y-3"
              >
                <div className="rounded-lg border border-[#E8E6DF] overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#F8F7F2]">
                        <TableHead>Comprobante</TableHead>
                        <TableHead>Fecha y Hora</TableHead>
                        <TableHead>Vendedor / Caja</TableHead>
                        <TableHead>Método de Pago</TableHead>
                        <TableHead>Artículos</TableHead>
                        <TableHead>Monto Total</TableHead>
                        <TableHead className="text-right">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody ref={ventasTableBodyRef}>
                      {ventasPaginadas.length > 0 ? (
                        ventasPaginadas.map((v) => (
                          <TableRow key={v.id} className="transition-colors">
                            <TableCell>
                              <span className="font-mono font-semibold text-xs text-[#2A7A78] bg-[#E2F1F0] px-2 py-0.5 rounded">
                                {v.codigoComprobante}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs text-[#657373] font-medium">
                              {v.fechaHora}
                            </TableCell>
                            <TableCell className="text-sm font-semibold text-[#1C2424]">
                              {v.vendedor}
                            </TableCell>
                            <TableCell>
                              {getMetodoPagoBadge(v.metodoPago)}
                            </TableCell>
                            <TableCell className="text-xs text-[#657373]">
                              {v.cantidadItems} {v.cantidadItems === 1 ? 'producto' : 'productos'}
                            </TableCell>
                            <TableCell className="font-bold text-sm text-[#1C2424]">
                              {monedaSimbolo}{v.total.toLocaleString('es-AR')}
                            </TableCell>
                            <TableCell className="text-right">
                              {getEstadoBadge(v.estado)}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="h-32 text-center text-[#657373]">
                            <div className="flex flex-col items-center justify-center gap-2 py-4">
                              <Funnel className="h-6 w-6 text-[#94A3B8]" weight="duotone" />
                              <p className="text-sm font-semibold text-[#1C2424]">
                                {hayFiltrosVentasActivos
                                  ? 'No se encontraron transacciones para los filtros aplicados'
                                  : `No se registraron ventas en ${etiquetaPeriodoActivo.toLowerCase()}`}
                              </p>
                              <p className="text-xs text-[#657373]">
                                {hayFiltrosVentasActivos
                                  ? 'Prueba ajustando el vendedor, medio de pago o término de búsqueda.'
                                  : 'Las operaciones concretadas en la terminal POS aparecerán automáticamente aquí.'}
                              </p>
                              {hayFiltrosVentasActivos && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={limpiarFiltrosVentas}
                                  className="h-7 px-3 text-xs mt-1 border-[#E8E6DF] hover:bg-[#F8F7F2] cursor-pointer"
                                >
                                  Restablecer filtros
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Paginación de Detalle de Ventas */}
                {totalVentas > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 px-1 text-xs text-[#657373]">
                    <div>
                      Mostrando <span className="font-semibold text-[#1C2424]">{inicioVentas + 1}</span> a{' '}
                      <span className="font-semibold text-[#1C2424]">
                        {Math.min(inicioVentas + itemsPorPaginaVentas, totalVentas)}
                      </span>{' '}
                      de <span className="font-semibold text-[#1C2424]">{totalVentas}</span> ventas{' '}
                      {hayFiltrosVentasActivos
                        ? `(filtradas de ${listaActivaVentas.length})`
                        : `(${etiquetaPeriodoActivo.toLowerCase()})`}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-xs text-[#1C2424] border-[#E8E6DF] hover:bg-[#F8F7F2] active:scale-95 transition-all duration-150 cursor-pointer"
                        onClick={() => setPaginaVentas((p) => Math.max(p - 1, 1))}
                        disabled={paginaVentas <= 1}
                      >
                        <CaretLeft className="h-3.5 w-3.5 mr-1" />
                        Anterior
                      </Button>
                      <span className="px-2 font-medium text-[#1C2424]">
                        {paginaVentas} / {totalPaginasVentas}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-xs text-[#1C2424] border-[#E8E6DF] hover:bg-[#F8F7F2] active:scale-95 transition-all duration-150 cursor-pointer"
                        onClick={() => setPaginaVentas((p) => Math.min(p + 1, totalPaginasVentas))}
                        disabled={paginaVentas >= totalPaginasVentas}
                      >
                        Siguiente
                        <CaretRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>
  );
}
