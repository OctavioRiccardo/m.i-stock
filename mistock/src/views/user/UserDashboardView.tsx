'use client';

/**
 * ====================================================================
 * VISTA: TERMINAL DE VENTAS Y OPERACIONES (POS MOSTRADOR) (MVC - View)
 * ====================================================================
 * 
 * Propósito:
 * Pantalla central modularizada para el vendedor y cajero en mostrador:
 * 1. Terminal de Cobro: Operativa de caja, escaneo de código de barras y ticket activo.
 * 2. Consultor de Precios: Verificación rápida de artículos y disponibilidad sin tocar el ticket.
 * 3. Historial del Día: Auditoría y reimpresión de comprobantes térmicos de 80mm del turno.
 * 4. Faltantes de Góndola: Monitor de reposición de salón desde depósito (sin costos confidenciales).
 */

import React, { useState } from 'react';
import {
  ShoppingCart,
  Package,
  Tag,
  Receipt,
  CheckCircle,
  WarningCircle,
  Storefront,
  Vault,
} from '@phosphor-icons/react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useUserDashboardController } from '@/controllers/userControllers/userDashboardController';
import { VentaRecientePOS, PestanaOperativaPOS } from '@/models/modelos_vista/dashboardModel';
import { ModuloTerminalCobro } from './ModuloTerminalCobro';
import { ModuloCatalogoProductos } from './ModuloCatalogoProductos';
import { ModuloConsultorPrecios } from './ModuloConsultorPrecios';
import { ModuloHistorialTickets } from './ModuloHistorialTickets';
import { ModalCobroTicket } from './ModalCobroTicket';
import { ModalDetalleVenta } from './ModalDetalleVenta';
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
    config,
    permitirVentaSinStock,
    saleSuccessMessage,
    saleErrorMessage,
    carrito,
    totalCarrito,
    procesarVentaTicket,
    isModalArqueoOpen,
    setIsModalArqueoOpen,
    isModalTicketCierreOpen,
    setIsModalTicketCierreOpen,
    ultimoCierre,
  } = controller;

  const [isModalCobroOpen, setIsModalCobroOpen] = useState<boolean>(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState<VentaRecientePOS | null>(null);

  /**
   * Pestañas operativas disponibles para el vendedor / cajero
   */
  const pestanas: { id: PestanaOperativaPOS; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'caja', label: 'Terminal de Cobro', icon: ShoppingCart, badge: carrito.length > 0 ? carrito.length : undefined },
    { id: 'catalogo', label: 'Catálogo de Productos', icon: Package },
    { id: 'precios', label: 'Consultor de Precios', icon: Tag },
    { id: 'historial', label: 'Historial del Día', icon: Receipt },
  ];

  const handleVentaCompletada = (venta: VentaRecientePOS) => {
    setVentaSeleccionada(venta);
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* ==================================================================== */}
        {/* BARRA SUPERIOR: ESTADO DE CAJA & ACCESOS MODULARES                   */}
        {/* ==================================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-[#E8E6DF] bg-white shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2A7A78] text-white shadow-xs">
              <Storefront className="h-5 w-5" weight="duotone" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-[#1C2424] tracking-tight">
                  Punto de Venta
                </h1>
                {permitirVentaSinStock && (
                  <Badge variant="warning" className="text-[10px]">
                    Venta sin stock activada
                  </Badge>
                )}
              </div>
              <p className="text-xs text-[#657373]">
                Operativa comercial en mostrador • Gestión de ventas, catálogo y cobro de tickets.
              </p>
            </div>
          </div>

          {/* Mini-KPIs del Turno Actual */}
          <div className="flex items-center gap-3 self-end sm:self-auto text-xs">
            <div className="px-3 py-1.5 rounded-lg bg-[#F8F7F2] border border-[#E8E6DF] text-right">
              <span className="text-[10px] text-[#657373] uppercase font-semibold block">
                Recaudación Hoy
              </span>
              <span className="font-bold text-[#1C2424]">
                {monedaSimbolo} {data.recaudacionDelDia.toLocaleString('es-AR')}
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-[#F8F7F2] border border-[#E8E6DF] text-right">
              <span className="text-[10px] text-[#657373] uppercase font-semibold block">
                Tickets Hoy
              </span>
              <span className="font-bold text-[#1C2424]">
                {data.ventasDelDia} tickets
              </span>
            </div>

            {/* Acceso a Cierre de Turno y Arqueo */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalArqueoOpen(true)}
              className="h-10 px-3 text-xs font-bold text-[#2A7A78] border-[#2A7A78]/30 hover:bg-[#E2F1F0] hover:text-[#205E5C] gap-1.5 cursor-pointer shadow-xs"
            >
              <Vault className="h-4 w-4" weight="duotone" />
              <span>Arqueo y Cierre</span>
            </Button>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* SELECTOR SEGMENTADO DE PESTAÑAS OPERATIVAS                           */}
        {/* ==================================================================== */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#E8E6DF]/60 border border-[#E8E6DF] overflow-x-auto">
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
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#2A7A78] text-white">
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

          {pestanaOperativa === 'precios' && (
            <motion.div
              key="modulo-precios"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <ModuloConsultorPrecios controller={controller} />
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
                onVerVenta={(sale) => setVentaSeleccionada(sale)}
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

        {/* Modal de Detalle de Venta y Ticket Térmico de 80mm */}
        <ModalDetalleVenta
          isOpen={!!ventaSeleccionada}
          onClose={() => setVentaSeleccionada(null)}
          venta={ventaSeleccionada}
          monedaSimbolo={monedaSimbolo}
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
