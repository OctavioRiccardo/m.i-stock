'use client';

/**
 * ====================================================================
 * VISTA: TERMINAL DE VENTAS Y OPERACIONES (POS MOSTRADOR) (MVC - View)
 * ====================================================================
 * 
 * Propósito:
 * Pantalla central modularizada para el vendedor y cajero en mostrador:
 * 1. Terminal de Cobro: Operativa de caja, escaneo de código de barras y ticket activo.
 * 2. Catálogo de Productos: Catálogo general de artículos con existencias en tiempo real.
 * 3. Consultor de Precios: Verificación rápida de artículos y disponibilidad sin tocar el ticket.
 * 4. Historial del Día: Auditoría y reimpresión de comprobantes térmicos de 80mm del turno.
 */

import React, { useState } from 'react';
import {
  ShoppingCart,
  Package,
  Receipt,
  CheckCircle,
  WarningCircle,
  Storefront,
  Vault,
  Key,
} from '@phosphor-icons/react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useUserDashboardController } from '@/controllers/userControllers/userDashboardController';
import { VentaRecientePOS, PestanaOperativaPOS } from '@/models/modelos_vista/dashboardModel';
import { ModuloTerminalCobro } from './ModuloTerminalCobro';
import { ModuloCatalogoProductos } from './ModuloCatalogoProductos';
import { ModuloHistorialTickets } from './ModuloHistorialTickets';
import { ModalCobroTicket } from './ModalCobroTicket';
import { ModalDetalleVenta } from './ModalDetalleVenta';
import { ModalVentaCompletada } from './ModalVentaCompletada';
import { ModalAperturaCaja } from './ModalAperturaCaja';
import { ModalArqueoCaja } from './ModalArqueoCaja';
import { ModalReporteCierreTicket } from './ModalReporteCierreTicket';

interface UserDashboardViewProps {
  controller: ReturnType<typeof useUserDashboardController>;
}

export function UserDashboardView({ controller }: UserDashboardViewProps) {
  const {
    pestanaOperativa,
    setPestanaOperativa,
    data,
    monedaSimbolo,
    permitirVentaSinStock,
    saleSuccessMessage,
    saleErrorMessage,
    carrito,
    totalCarrito,
    procesarVentaTicket,
    cajaAbierta,
    isModalAperturaOpen,
    setIsModalAperturaOpen,
    isModalArqueoOpen,
    setIsModalArqueoOpen,
    isModalTicketCierreOpen,
    setIsModalTicketCierreOpen,
    ultimoCierre,
    cancelarVenta,
    config,
  } = controller;

  const [isModalCobroOpen, setIsModalCobroOpen] = useState<boolean>(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState<VentaRecientePOS | null>(null);
  const [autoImprimirVenta, setAutoImprimirVenta] = useState<boolean>(false);
  const [esNuevaVenta, setEsNuevaVenta] = useState<boolean>(false);
  const [ventaCompletadaFeedback, setVentaCompletadaFeedback] = useState<VentaRecientePOS | null>(null);

  /**
   * Pestañas operativas disponibles para el vendedor / cajero (en móvil/tablet)
   */
  const pestanas: { id: PestanaOperativaPOS; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'caja', label: 'Terminal de Cobro', icon: ShoppingCart, badge: carrito.length > 0 ? carrito.length : undefined },
    { id: 'catalogo', label: 'Catálogo de Productos', icon: Package },
    { id: 'historial', label: 'Historial del Día', icon: Receipt },
  ];

  const handleVentaCompletada = (venta: VentaRecientePOS) => {
    setVentaCompletadaFeedback(venta);
  };

  const handleAbrirTicketDesdeVentaCompletada = (venta: VentaRecientePOS) => {
    setVentaCompletadaFeedback(null);
    setEsNuevaVenta(true);
    setAutoImprimirVenta(Boolean(config.pos.autoImprimirTicket));
    setVentaSeleccionada(venta);
  };

  const handleVolverAVentaCompletada = (venta: VentaRecientePOS) => {
    setVentaSeleccionada(null);
    setAutoImprimirVenta(false);
    setEsNuevaVenta(false);
    setVentaCompletadaFeedback(venta);
  };

  // Mantener la venta activa de los modales sincronizada con `data.ventasRecientes` cuando recibe su UUID remoto
  const ventaCompletadaActual = ventaCompletadaFeedback
    ? data.ventasRecientes.find(
        (v) => v.id === ventaCompletadaFeedback.id || v.idTemporal === ventaCompletadaFeedback.id
      ) ?? ventaCompletadaFeedback
    : null;

  const ventaSeleccionadaActual = ventaSeleccionada
    ? data.ventasRecientes.find(
        (v) => v.id === ventaSeleccionada.id || v.idTemporal === ventaSeleccionada.id
      ) ?? ventaSeleccionada
    : null;

  return (
    <MotionConfig reducedMotion="user">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* ==================================================================== */}
        {/* BARRA SUPERIOR: ESTADO DE CAJA & ACCESOS MODULARES                   */}
        {/* ==================================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-card shadow-[0_0_0_1px_rgba(28,36,36,0.08),0_1px_2px_rgba(28,36,36,0.04)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary shrink-0">
              <Storefront className="h-5 w-5" weight="duotone" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold text-foreground tracking-[-0.015em]">
                  Punto de Venta
                </h1>
                {cajaAbierta ? (
                  <Badge variant="success" className="text-[11px] font-semibold gap-1 inline-flex items-center">
                    <CheckCircle className="h-3 w-3 text-emerald-700" weight="fill" />
                    <span>Caja Abierta</span>
                  </Badge>
                ) : (
                  <Badge variant="warning" className="text-[11px] font-semibold gap-1 inline-flex items-center">
                    <WarningCircle className="h-3 w-3 text-amber-700" weight="fill" />
                    <span>Caja Cerrada</span>
                  </Badge>
                )}
                {permitirVentaSinStock && (
                  <Badge variant="warning" className="text-[10px]">
                    Venta sin stock activada
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Operativa de mostrador • Escaneo rápido, catálogo y cobro de tickets.
              </p>
            </div>
          </div>

          {/* Mini-KPIs del Turno Actual */}
          <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap justify-end text-xs">
            <div className="px-3 py-1.5 rounded-lg bg-background border border-border text-right">
              <span className="text-[10px] text-muted-foreground uppercase tracking-[0.06em] font-semibold block">
                Recaudación Hoy
              </span>
              <span className="font-mono font-bold tabular-nums text-sm text-foreground">
                {monedaSimbolo} {data.recaudacionDelDia.toLocaleString('es-AR')}
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-background border border-border text-right">
              <span className="text-[10px] text-muted-foreground uppercase tracking-[0.06em] font-semibold block">
                Tickets Hoy
              </span>
              <span className="font-mono font-bold tabular-nums text-sm text-foreground">
                {data.ventasDelDia}
              </span>
            </div>

            {/* Acceso a Apertura, Cierre o Último Reporte Z en barra principal */}
            {ultimoCierre && !cajaAbierta && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalTicketCierreOpen(true)}
                className="min-h-10 px-3 text-xs font-semibold text-primary border-primary/30 hover:bg-secondary gap-1.5"
              >
                <Receipt className="h-4 w-4" weight="duotone" />
                <span>Ver Cierre (Z)</span>
              </Button>
            )}

            {cajaAbierta ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalArqueoOpen(true)}
                className="min-h-10 px-3 text-xs font-semibold text-primary border-primary/30 hover:bg-secondary gap-1.5"
              >
                <Vault className="h-4 w-4" weight="duotone" />
                <span>Arqueo y Cierre</span>
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={() => setIsModalAperturaOpen(true)}
                className="min-h-10 px-4 text-xs font-semibold gap-2"
              >
                <Key className="h-4 w-4" weight="bold" />
                <span>Abrir Caja</span>
              </Button>
            )}
          </div>
        </div>

        {/* ==================================================================== */}
        {/* SELECTOR SEGMENTADO DE PESTAÑAS OPERATIVAS (Visible en móvil/tablet) */}
        {/* En escritorio (lg:) la navegación ya está presente en UserSidebar    */}
        {/* ==================================================================== */}
        <div className="flex lg:hidden items-center gap-1.5 p-1 rounded-xl bg-[#E8E6DF]/60 border border-[#E8E6DF] overflow-x-auto">
          {pestanas.map((pestana) => {
            const Icon = pestana.icon;
            const esActiva = pestanaOperativa === pestana.id;

            return (
              <button
                key={pestana.id}
                type="button"
                onClick={() => setPestanaOperativa(pestana.id)}
                className={`flex-1 min-w-[150px] py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  esActiva
                    ? 'bg-white text-[#1C2424] shadow-xs'
                    : 'text-[#657373] hover:text-[#1C2424] hover:bg-white/40'
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${esActiva ? 'text-[#2A7A78]' : 'text-[#657373]'}`}
                  weight={esActiva ? 'duotone' : 'regular'}
                />
                <span>{pestana.label}</span>
                {pestana.badge !== undefined && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono tabular-nums bg-[#2A7A78] text-white">
                    {pestana.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Notificaciones Operativas Globales */}
        <AnimatePresence>
          {saleSuccessMessage && (
            <motion.div
              key="alert-sale-success"
              initial={{ opacity: 0, height: 0, y: -6 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -6 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <Alert variant="success" className="shadow-xs border-emerald-300 bg-emerald-50">
                <CheckCircle className="h-4 w-4 text-emerald-700" weight="fill" />
                <AlertTitle className="text-emerald-900 font-bold">Operación Registrada</AlertTitle>
                <AlertDescription className="text-emerald-800 text-xs">{saleSuccessMessage}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          {saleErrorMessage && (
            <motion.div
              key="alert-sale-error"
              initial={{ opacity: 0, height: 0, y: -6 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -6 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <Alert variant="destructive" className="shadow-xs">
                <WarningCircle className="h-4 w-4 text-red-600" weight="fill" />
                <AlertTitle className="font-bold">Aviso Operativo</AlertTitle>
                <AlertDescription className="text-xs">{saleErrorMessage}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ==================================================================== */}
        {/* RENDERIZADO CONDICIONAL DE LA SUB-VISTA ACTIVA                       */}
        {/* ==================================================================== */}
        <AnimatePresence mode="wait">
          {pestanaOperativa === 'caja' && (
            <motion.div
              key="modulo-caja"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <ModuloTerminalCobro
                controller={controller}
                onAbrirCobro={() => setIsModalCobroOpen(true)}
              />
            </motion.div>
          )}

          {pestanaOperativa === 'catalogo' && (
            <motion.div
              key="modulo-catalogo"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <ModuloCatalogoProductos controller={controller} />
            </motion.div>
          )}

          {pestanaOperativa === 'historial' && (
            <motion.div
              key="modulo-historial"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <ModuloHistorialTickets
                controller={controller}
                onVerVenta={(sale) => {
                  setEsNuevaVenta(false);
                  setAutoImprimirVenta(false);
                  setVentaSeleccionada(sale);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal de Cobro Multi-Ítem del Ticket */}
        <ModalCobroTicket
          isOpen={isModalCobroOpen}
          onClose={() => setIsModalCobroOpen(false)}
          items={carrito}
          total={totalCarrito}
          monedaSimbolo={monedaSimbolo}
          onConfirmarCobro={procesarVentaTicket}
          onVentaCompletada={handleVentaCompletada}
        />

        {/* Modal de Retroalimentación de Venta Completada (aparece primero con el sonido) */}
        <ModalVentaCompletada
          isOpen={!!ventaCompletadaActual}
          onClose={() => setVentaCompletadaFeedback(null)}
          venta={ventaCompletadaActual}
          monedaSimbolo={monedaSimbolo}
          onIrAImprimirTicket={handleAbrirTicketDesdeVentaCompletada}
          onCancelarVenta={cancelarVenta}
        />

        {/* Modal de Detalle de Venta y Ticket Térmico de 80mm */}
        <ModalDetalleVenta
          isOpen={!!ventaSeleccionadaActual}
          onClose={() => {
            setVentaSeleccionada(null);
            setAutoImprimirVenta(false);
            setEsNuevaVenta(false);
          }}
          venta={ventaSeleccionadaActual}
          monedaSimbolo={monedaSimbolo}
          onCancelarVenta={cancelarVenta}
          autoPrint={autoImprimirVenta}
          esNuevaVenta={esNuevaVenta}
          onVolverAVentaCompletada={handleVolverAVentaCompletada}
        />

        {/* Modal de Apertura de Caja (Inicio de Turno / Sesión) */}
        <ModalAperturaCaja
          isOpen={isModalAperturaOpen}
          onClose={() => setIsModalAperturaOpen(false)}
          controller={controller}
        />

        {/* Modal de Arqueo y Conciliación de Efectivo (Mono-caja) */}
        <ModalArqueoCaja
          isOpen={isModalArqueoOpen}
          onClose={() => setIsModalArqueoOpen(false)}
          controller={controller}
        />

        {/* Modal de Reporte Z de Cierre de Caja (Ticket 80mm) */}
        <ModalReporteCierreTicket
          isOpen={isModalTicketCierreOpen}
          onClose={() => setIsModalTicketCierreOpen(false)}
          cierre={ultimoCierre}
          monedaSimbolo={monedaSimbolo}
        />
      </div>
    </MotionConfig>
  );
}
