'use client';

/**
 * ====================================================================
 * SUB-VISTA POS: HISTORIAL DE TICKETS DEL DÍA (ModuloHistorialTickets)
 * ====================================================================
 * 
 * Propósito:
 * Pantalla dedicada para la consulta, auditoría y reimpresión de comprobantes del turno:
 * 1. Búsqueda instantánea por número de ticket (ej: VNT-101), cajero o nombre de producto.
 * 2. Filtrado rápido por medio de pago (Efectivo, Mercado Pago, Débito, Crédito, Transferencia).
 * 3. Alternador de vista entre Cuadrícula de Tarjetas y Tabla Detallada.
 * 4. Disparador directo para apertura del visor de ticket térmico de 80mm y reimpresión.
 */

import React, { useState } from 'react';
import {
  Receipt,
  Money,
  QrCode,
  CreditCard,
  ArrowsLeftRight,
  Clock,
  CaretLeft,
  CaretRight,
  SquaresFour,
  ListBullets,
  MagnifyingGlass,
  Printer,
  CalendarBlank,
  Vault,
} from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { useUserDashboardController } from '@/controllers/userControllers/userDashboardController';
import { VentaRecientePOS } from '@/models/modelos_vista/dashboardModel';

interface ModuloHistorialTicketsProps {
  controller: ReturnType<typeof useUserDashboardController>;
  onVerVenta: (venta: VentaRecientePOS) => void;
}

export function ModuloHistorialTickets({
  controller,
  onVerVenta,
}: ModuloHistorialTicketsProps) {
  const {
    data,
    ventasFiltradas,
    ventasRecientesPaginadas,
    metodoPagoFiltroVentas,
    setMetodoPagoFiltroVentas,
    conteosPorMetodoPago,
    busquedaHistorial,
    setBusquedaHistorial,
    paginaVentas,
    setPaginaVentas,
    totalPaginasVentas,
    inicioPaginacionVentas,
    itemsPorPaginaVentas,
    monedaSimbolo,
    setIsModalArqueoOpen,
    setIsModalTicketCierreOpen,
    ultimoCierre,
  } = controller;

  const [modoVistaVentas, setModoVistaVentas] = useState<'grid' | 'table'>('table');

  /**
   * Opciones de medios de cobro disponibles
   */
  const opcionesFiltroMetodo = [
    { id: 'todos', label: 'Todos los medios', icon: Receipt },
    { id: 'efectivo', label: 'Efectivo', icon: Money },
    { id: 'mercado_pago', label: 'Mercado Pago', icon: QrCode },
    { id: 'tarjeta_debito', label: 'Débito', icon: CreditCard },
    { id: 'tarjeta_credito', label: 'Crédito', icon: CreditCard },
    { id: 'transferencia', label: 'Transferencia', icon: ArrowsLeftRight },
  ];

  /**
   * Renderiza el badge visual representativo del método de pago
   */
  const renderBadgeMetodo = (metodo?: string) => {
    const m = metodo || 'efectivo';
    switch (m) {
      case 'efectivo':
        return (
          <Badge
            variant="outline"
            className="text-[9px] uppercase px-1.5 py-0 font-semibold border-emerald-300 text-emerald-700 bg-emerald-50 gap-1 inline-flex items-center"
          >
            <Money className="h-3 w-3" weight="bold" />
            <span>Efectivo</span>
          </Badge>
        );
      case 'mercado_pago':
        return (
          <Badge
            variant="outline"
            className="text-[9px] uppercase px-1.5 py-0 font-semibold border-[#009EE3]/40 text-[#009EE3] bg-[#009EE3]/10 gap-1 inline-flex items-center"
          >
            <QrCode className="h-3 w-3" weight="bold" />
            <span>Mercado Pago</span>
          </Badge>
        );
      case 'tarjeta_debito':
        return (
          <Badge
            variant="outline"
            className="text-[9px] uppercase px-1.5 py-0 font-semibold border-[#2A7A78]/40 text-[#2A7A78] bg-[#E2F1F0]/60 gap-1 inline-flex items-center"
          >
            <CreditCard className="h-3 w-3" weight="bold" />
            <span>Débito</span>
          </Badge>
        );
      case 'tarjeta_credito':
        return (
          <Badge
            variant="outline"
            className="text-[9px] uppercase px-1.5 py-0 font-semibold border-[#2A7A78]/40 text-[#2A7A78] bg-[#E2F1F0]/60 gap-1 inline-flex items-center"
          >
            <CreditCard className="h-3 w-3" weight="bold" />
            <span>Crédito</span>
          </Badge>
        );
      case 'transferencia':
        return (
          <Badge
            variant="outline"
            className="text-[9px] uppercase px-1.5 py-0 font-semibold border-gray-300 text-gray-700 bg-gray-50 gap-1 inline-flex items-center"
          >
            <ArrowsLeftRight className="h-3 w-3" weight="bold" />
            <span>Transferencia</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0 font-semibold border-[#E8E6DF] text-[#657373]">
            {m.replace('_', ' ')}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Resumen Superior del Turno */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-[#E8E6DF] bg-white shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2A7A78] text-white shadow-xs">
              <Receipt className="h-5 w-5" weight="duotone" />
            </div>
            <div>
              <span className="text-[10px] text-[#657373] uppercase font-bold block">
                Tickets Registrados Hoy
              </span>
              <span className="text-xl font-black text-[#1C2424]">
                {data.ventasDelDia} tickets
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E8E6DF] bg-white shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <Money className="h-5 w-5" weight="duotone" />
            </div>
            <div>
              <span className="text-[10px] text-[#657373] uppercase font-bold block">
                Recaudación Total del Turno
              </span>
              <span className="text-xl font-black text-emerald-800">
                {monedaSimbolo} {data.recaudacionDelDia.toLocaleString('es-AR')}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E8E6DF] bg-white shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
              <CalendarBlank className="h-5 w-5" weight="duotone" />
            </div>
            <div>
              <span className="text-[10px] text-[#657373] uppercase font-bold block">
                Comprobantes Filtrados
              </span>
              <span className="text-xl font-black text-[#1C2424]">
                {ventasFiltradas.length} operaciones
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenedor Principal: Filtros y Tabla/Tarjetas */}
      <Card className="border-[#E8E6DF] shadow-xs bg-white">
        <CardHeader className="pb-3 border-b border-[#E8E6DF] bg-[#F8F7F2]/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-[#2A7A78]" weight="duotone" />
              <div>
                <CardTitle className="text-sm font-bold text-[#1C2424]">
                  Historial de Tickets y Reimpresión
                </CardTitle>
                <p className="text-[11px] text-[#657373]">
                  Seleccione cualquier comprobante para inspeccionar renglones o reimprimir en formato térmico.
                </p>
              </div>
            </div>

            {/* Acciones de Cierre de Caja y Alternador de Vista */}
            <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
              {ultimoCierre && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setIsModalTicketCierreOpen(true)}
                  className="h-8 text-xs font-semibold text-[#2A7A78] border-[#2A7A78]/30 hover:bg-[#E2F1F0] gap-1.5 cursor-pointer shadow-xs"
                >
                  <Receipt className="h-3.5 w-3.5" weight="duotone" />
                  <span>Ver Cierre (Z)</span>
                </Button>
              )}

              {controller.cajaAbierta && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsModalArqueoOpen(true)}
                  className="h-8 text-xs font-bold bg-[#2A7A78] hover:bg-[#205E5C] text-white gap-1.5 cursor-pointer shadow-xs"
                >
                  <Vault className="h-3.5 w-3.5" weight="duotone" />
                  <span>Arqueo y Cierre</span>
                </Button>
              )}

              {/* Alternador de Vista (Tarjetas vs Tabla) */}
              <div className="flex items-center border border-[#E8E6DF] rounded-lg bg-white p-0.5 shrink-0 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setModoVistaVentas('grid')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1 text-xs ${
                    modoVistaVentas === 'grid'
                      ? 'bg-[#2A7A78] text-white font-medium'
                      : 'text-[#657373] hover:text-[#1C2424]'
                  }`}
                  title="Vista cuadrícula de tarjetas"
                >
                  <SquaresFour className="h-4 w-4" weight={modoVistaVentas === 'grid' ? 'bold' : 'regular'} />
                  <span className="hidden sm:inline">Tarjetas</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModoVistaVentas('table')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1 text-xs ${
                    modoVistaVentas === 'table'
                      ? 'bg-[#2A7A78] text-white font-medium'
                      : 'text-[#657373] hover:text-[#1C2424]'
                  }`}
                  title="Vista tabla detallada"
                >
                  <ListBullets className="h-4 w-4" weight={modoVistaVentas === 'table' ? 'bold' : 'regular'} />
                  <span className="hidden sm:inline">Tabla</span>
                </button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {/* Barra de Búsqueda Rápida de Tickets */}
          <div className="relative">
            <Input
              placeholder="Buscar por N° comprobante (ej: VNT-101), vendedor o producto..."
              value={busquedaHistorial}
              onChange={(e) => setBusquedaHistorial(e.target.value)}
              className="pl-9 h-10 text-xs bg-white border-[#E8E6DF] focus-visible:ring-[#2A7A78]"
            />
            <MagnifyingGlass className="absolute left-3 top-3 h-4 w-4 text-[#657373]" />
            {busquedaHistorial && (
              <button
                type="button"
                onClick={() => setBusquedaHistorial('')}
                className="absolute right-3 top-2.5 text-xs text-[#657373] hover:text-[#1C2424] cursor-pointer"
                title="Limpiar"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtros Rápidos por Medio de Cobro */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {opcionesFiltroMetodo.map((op) => {
              const esActivo = metodoPagoFiltroVentas === op.id;
              const cantidad = conteosPorMetodoPago[op.id] || 0;
              const IconComponent = op.icon;

              return (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => setMetodoPagoFiltroVentas(op.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                    esActivo
                      ? 'bg-[#2A7A78] text-white shadow-xs font-semibold'
                      : 'bg-[#F8F7F2] text-[#657373] hover:text-[#1C2424] hover:bg-[#E8E6DF] border border-[#E8E6DF]'
                  }`}
                >
                  <IconComponent className="h-3.5 w-3.5" weight={esActivo ? 'bold' : 'regular'} />
                  <span>{op.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] ${
                      esActivo ? 'bg-white/20 text-white font-bold' : 'bg-[#E8E6DF] text-[#657373]'
                    }`}
                  >
                    {cantidad}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Contenido: Tarjetas vs Tabla */}
          {ventasFiltradas.length === 0 ? (
            <div className="py-12 px-4 text-center border border-dashed border-[#E8E6DF] rounded-xl space-y-2">
              <Receipt className="h-8 w-8 mx-auto text-[#A0A8A8]" weight="duotone" />
              <p className="text-xs font-bold text-[#1C2424]">
                No se encontraron ventas para este filtro
              </p>
              <p className="text-[11px] text-[#657373]">
                Verifique el criterio de búsqueda o el medio de cobro seleccionado.
              </p>
              {(busquedaHistorial || metodoPagoFiltroVentas !== 'todos') && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setBusquedaHistorial('');
                    setMetodoPagoFiltroVentas('todos');
                  }}
                  className="text-xs h-7 text-[#2A7A78] hover:underline cursor-pointer mt-1"
                >
                  Restablecer filtros
                </Button>
              )}
            </div>
          ) : modoVistaVentas === 'grid' ? (
            /* Vista Cuadrícula de Tarjetas */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ventasRecientesPaginadas.map((sale) => (
                <motion.div
                  key={sale.id}
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onVerVenta(sale)}
                  className="p-3.5 rounded-xl border border-[#E8E6DF] bg-white hover:border-[#2A7A78] cursor-pointer shadow-2xs transition-all hover:bg-[#F8F7F2]/60 flex flex-col justify-between"
                  title="Ver detalle del ticket / reimprimir"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-[#1C2424] font-mono">{sale.id}</span>
                      {renderBadgeMetodo(sale.metodoPago)}
                    </div>
                    <p className="text-[11px] text-[#657373] mt-1 flex items-center gap-1 font-mono">
                      <Clock className="h-3 w-3 text-[#2A7A78]" weight="duotone" />
                      <span>{sale.hora} {sale.fecha ? `• ${sale.fecha}` : ''}</span>
                    </p>
                    <p className="text-[11px] text-[#657373] mt-0.5">
                      {sale.cantidadItems} {sale.cantidadItems === 1 ? 'artículo' : 'artículos'} • {sale.vendedor || 'Caja'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-[#E8E6DF]/60">
                    <span className="text-[11px] text-[#657373] font-medium">Total:</span>
                    <span className="text-sm font-black text-[#2A7A78]">
                      {monedaSimbolo} {sale.montoTotal.toLocaleString('es-AR')}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            /* Vista Tabla Detallada */
            <div className="rounded-lg border border-[#E8E6DF] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F8F7F2]/60">
                    <TableHead className="text-xs">Comprobante</TableHead>
                    <TableHead className="text-xs">Fecha y Hora</TableHead>
                    <TableHead className="text-xs">Medio de Cobro</TableHead>
                    <TableHead className="text-xs">Cajero / Vendedor</TableHead>
                    <TableHead className="text-xs">Artículos</TableHead>
                    <TableHead className="text-xs text-right">Total Cobrado</TableHead>
                    <TableHead className="text-xs text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ventasRecientesPaginadas.map((sale) => (
                    <TableRow key={sale.id} className="hover:bg-[#F8F7F2]/50">
                      <TableCell className="py-2.5 font-bold text-xs text-[#1C2424] font-mono">
                        {sale.id}
                      </TableCell>
                      <TableCell className="py-2.5 text-xs text-[#657373]">
                        {sale.hora} {sale.fecha ? `• ${sale.fecha}` : ''}
                      </TableCell>
                      <TableCell className="py-2.5">
                        {renderBadgeMetodo(sale.metodoPago)}
                      </TableCell>
                      <TableCell className="py-2.5 text-xs text-[#1C2424]">
                        {sale.vendedor || 'Cajero en Turno'}
                      </TableCell>
                      <TableCell className="py-2.5 text-xs text-[#657373]">
                        {sale.cantidadItems} {sale.cantidadItems === 1 ? 'ítem' : 'ítems'}
                      </TableCell>
                      <TableCell className="py-2.5 text-xs font-black text-[#2A7A78] text-right">
                        {monedaSimbolo} {sale.montoTotal.toLocaleString('es-AR')}
                      </TableCell>
                      <TableCell className="py-2.5 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onVerVenta(sale)}
                          className="h-7 px-2.5 text-xs border-[#E8E6DF] hover:bg-[#E2F1F0] text-[#2A7A78] hover:text-[#205E5D] font-medium gap-1 cursor-pointer"
                        >
                          <Printer className="h-3.5 w-3.5" weight="duotone" />
                          <span>Ver / Imprimir</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Paginación del Historial */}
          {ventasFiltradas.length > 0 && (
            <div className="flex items-center justify-between pt-3 border-t border-[#E8E6DF] text-xs text-[#657373]">
              <div>
                Mostrando {inicioPaginacionVentas + 1} a{' '}
                {Math.min(inicioPaginacionVentas + itemsPorPaginaVentas, ventasFiltradas.length)} de{' '}
                {ventasFiltradas.length} tickets
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPaginaVentas((p) => Math.max(p - 1, 1))}
                  disabled={paginaVentas <= 1}
                  className="h-7 px-2 text-xs border-[#E8E6DF] hover:bg-[#F8F7F2] text-[#1C2424] cursor-pointer"
                >
                  <CaretLeft className="h-3.5 w-3.5" />
                  <span>Ant.</span>
                </Button>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#F8F7F2] text-[#1C2424] border border-[#E8E6DF]">
                  {paginaVentas} / {totalPaginasVentas}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPaginaVentas((p) => Math.min(p + 1, totalPaginasVentas))}
                  disabled={paginaVentas >= totalPaginasVentas}
                  className="h-7 px-2 text-xs border-[#E8E6DF] hover:bg-[#F8F7F2] text-[#1C2424] cursor-pointer"
                >
                  <span>Sig.</span>
                  <CaretRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
