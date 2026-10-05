'use client';

/**
 * ====================================================================
 * COMPONENTE: MODAL DE DETALLE DE VENTA Y TICKET TÉRMICO POS
 * ====================================================================
 * 
 * Propósito:
 * 1. Desplegar los metadatos y desglose de artículos ("Detalles") de la venta
 *    consumiendo la entidad `DetalleVenta` (tabla `public.detalle_ventas`).
 * 2. Generar el Ticket Térmico (80mm) con el formato oficial configurado
 *    en el Panel del Administrador (identidad comercial, régimen de emisión
 *    con leyenda legal o factura AFIP, desglose de ítems, totales y QR).
 * 3. Habilitar la impresión física o digital limpia mediante @media print.
 */

import React, { useState, useEffect } from 'react';
import {
  Receipt,
  User,
  Clock,
  CreditCard,
  Printer,
  CheckCircle,
  Package,
  QrCode,
  ArrowLeft,
} from '@phosphor-icons/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { VentaRecientePOS } from '@/models/modelos_vista/dashboardModel';
import { useConfiguracionData } from '@/services/configuracionService';
import { motion, AnimatePresence } from 'motion/react';

export interface ModalDetalleVentaProps {
  isOpen: boolean;
  onClose: () => void;
  venta: VentaRecientePOS | null;
  monedaSimbolo: string;
}

export function ModalDetalleVenta({
  isOpen,
  onClose,
  venta,
  monedaSimbolo,
}: ModalDetalleVentaProps) {
  const [vistaActiva, setVistaActiva] = useState<'detalles' | 'ticket'>('detalles');
  const configGlobal = useConfiguracionData();
  const configNegocio = configGlobal.negocio;

  // Restablecer a vista 'detalles' cada vez que se abre una venta
  useEffect(() => {
    if (isOpen) {
      setVistaActiva('detalles');
    }
  }, [isOpen, venta?.id]);

  if (!venta) return null;

  const items = venta.items || [];
  const esEfectivo = venta.metodoPago === 'efectivo';
  const esMercadoPago = venta.metodoPago === 'mercado_pago';

  const handleImprimirTicket = () => {
    setVistaActiva('ticket');
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.print();
      }
    }, 150);
  };

  const ejecutarImpresionDirecta = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* Estilos dedicados para impresión en impresoras térmicas de 80mm */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * {
                visibility: hidden !important;
              }
              #ticket-termico-impresion,
              #ticket-termico-impresion * {
                visibility: visible !important;
              }
              #ticket-termico-impresion {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 80mm !important;
                max-width: 80mm !important;
                margin: 0 !important;
                padding: 8mm 6mm !important;
                border: none !important;
                box-shadow: none !important;
                background: white !important;
                color: black !important;
                font-family: monospace !important;
                font-size: 11px !important;
                line-height: 1.35 !important;
              }
            }
          `,
        }}
      />

      <DialogContent className="max-w-lg p-6 border-[#E8E6DF] shadow-2xl">
        {/* Encabezado con selector de vistas: Detalles vs Ticket Térmico */}
        <DialogHeader className="space-y-2 pb-2 border-b border-[#E8E6DF]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E2F1F0] text-[#2A7A78] shrink-0">
                <Receipt className="h-6 w-6" weight="duotone" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base font-bold text-[#1C2424]">
                    Comprobante {venta.id}
                  </DialogTitle>
                  <Badge
                    variant="outline"
                    className="text-[10px] text-emerald-700 border-emerald-300 bg-emerald-50"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" weight="fill" />
                    Completada
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-[#657373]">
                  {vistaActiva === 'detalles'
                    ? 'Registro operativo con snapshot histórico de artículos.'
                    : 'Simulación y emisión del ticket térmico en 80mm.'}
                </DialogDescription>
              </div>
            </div>

            {/* Pestañas para alternar entre Detalles y Ticket Térmico */}
            <div className="flex items-center bg-[#F8F7F2] p-0.5 rounded-lg border border-[#E8E6DF] self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setVistaActiva('detalles')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  vistaActiva === 'detalles'
                    ? 'bg-white text-[#1C2424] shadow-xs'
                    : 'text-[#657373] hover:text-[#1C2424]'
                }`}
              >
                Detalles
              </button>
              <button
                type="button"
                onClick={() => setVistaActiva('ticket')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  vistaActiva === 'ticket'
                    ? 'bg-white text-[#2A7A78] shadow-xs'
                    : 'text-[#657373] hover:text-[#1C2424]'
                }`}
              >
                <Receipt className="h-3 w-3" />
                <span>Ticket (80mm)</span>
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* CONTENIDO 1: DETALLES DE VENTA */}
        {vistaActiva === 'detalles' && (
          <div className="space-y-4 pt-2">
            {/* Ficha de Metadatos de la Cabecera de Venta */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-xl border border-[#E8E6DF] bg-[#F8F7F2]/60 text-xs">
              <div>
                <span className="text-[10px] text-[#657373] uppercase tracking-wider font-semibold block flex items-center gap-1">
                  <Clock className="h-3 w-3 text-[#2A7A78]" weight="duotone" />
                  Hora de Operación
                </span>
                <span className="font-bold text-[#1C2424] mt-0.5 block">
                  {venta.hora} {venta.fecha ? `• ${venta.fecha}` : ''}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-[#657373] uppercase tracking-wider font-semibold block flex items-center gap-1">
                  <User className="h-3 w-3 text-[#2A7A78]" weight="duotone" />
                  Vendedor / Caja
                </span>
                <span className="font-bold text-[#1C2424] mt-0.5 block truncate">
                  {venta.vendedor || 'Cajero en Turno'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-[#657373] uppercase tracking-wider font-semibold block flex items-center gap-1">
                  <CreditCard className="h-3 w-3 text-[#2A7A78]" weight="duotone" />
                  Medio de Cobro
                </span>
                <div className="mt-0.5">
                  <Badge
                    variant="outline"
                    className={`text-[10px] uppercase font-bold px-1.5 py-0 ${
                      esEfectivo
                        ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                        : esMercadoPago
                        ? 'border-[#009EE3]/50 text-[#009EE3] bg-[#009EE3]/10'
                        : 'border-[#E8E6DF] text-[#1C2424]'
                    }`}
                  >
                    {esMercadoPago
                      ? 'Mercado Pago'
                      : venta.metodoPago?.replace('_', ' ') || 'Efectivo'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Desglose de Artículos (Detalles) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-[#1C2424]">
                <span className="flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-[#2A7A78]" weight="duotone" />
                  Detalles:
                </span>
                <span className="text-[11px] text-[#657373] font-normal">
                  {items.length} {items.length === 1 ? 'artículo' : 'artículos'}
                </span>
              </div>

              <div className="rounded-lg border border-[#E8E6DF] overflow-hidden max-h-52 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#F8F7F2]/80">
                      <TableHead className="text-[11px] py-1.5">Producto / SKU</TableHead>
                      <TableHead className="text-[11px] py-1.5 text-center">Cant.</TableHead>
                      <TableHead className="text-[11px] py-1.5 text-right">P. Unitario</TableHead>
                      <TableHead className="text-[11px] py-1.5 text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-xs py-4 text-[#657373]">
                          No se registraron renglones detallados para este comprobante.
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((it, idx) => {
                        const subtotal = it.subtotal || it.cantidad * it.precioUnitario;
                        return (
                          <TableRow key={it.id || idx} className="hover:bg-[#F8F7F2]/40 text-xs">
                            <TableCell className="py-2">
                              <p className="font-semibold text-[#1C2424] leading-tight">
                                {it.nombreProducto || 'Artículo Comercial'}
                              </p>
                              {it.codigoProducto && (
                                <p className="text-[10px] text-[#657373]">
                                  Cód: {it.codigoProducto}
                                </p>
                              )}
                            </TableCell>
                            <TableCell className="py-2 text-center font-bold text-[#1C2424]">
                              {it.cantidad}
                            </TableCell>
                            <TableCell className="py-2 text-right text-[#657373]">
                              {monedaSimbolo} {it.precioUnitario.toLocaleString('es-AR')}
                            </TableCell>
                            <TableCell className="py-2 text-right font-bold text-[#1C2424]">
                              {monedaSimbolo} {subtotal.toLocaleString('es-AR')}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Liquidación Contable de la Venta */}
            <div className="p-3 rounded-xl border border-[#E8E6DF] bg-[#F8F7F2]/50 space-y-1.5">
              <div className="flex justify-between text-xs text-[#657373]">
                <span>Subtotal Neto:</span>
                <span className="font-semibold text-[#1C2424]">
                  {monedaSimbolo} {venta.montoTotal.toLocaleString('es-AR')}
                </span>
              </div>
              <div className="flex justify-between text-xs text-[#657373]">
                <span>Descuentos / Bonificaciones:</span>
                <span className="font-semibold text-[#1C2424]">{monedaSimbolo} 0,00</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[#E8E6DF] text-sm">
                <span className="font-bold text-[#1C2424]">Total Cobrado:</span>
                <span className="text-xl font-extrabold text-[#2A7A78]">
                  {monedaSimbolo} {venta.montoTotal.toLocaleString('es-AR')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* CONTENIDO 2: VISTA DEL TICKET TÉRMICO (80mm) TAL COMO FUE DEFINIDO EN ADMINISTRACIÓN */}
        {vistaActiva === 'ticket' && (
          <div className="pt-2">
            <div className="p-3 bg-[#F2F1EA]/40 rounded-xl border border-[#E8E6DF] max-h-[58vh] overflow-y-auto">
              <div
                id="ticket-termico-impresion"
                className="bg-white border border-[#D5D3C8] shadow-md rounded-md p-5 font-mono text-[11px] text-[#2C3539] max-w-sm mx-auto leading-relaxed"
              >
                {/* Cabecera Comercial del Negocio */}
                <div className="text-center space-y-1 pb-3 border-b border-dashed border-[#A0A8A8]">
                  <p className="font-bold text-sm tracking-wide text-[#111827] uppercase">
                    {configNegocio.nombreComercial || 'M.I STOCK'}
                  </p>
                  <p className="text-[10px] text-[#4B5563]">
                    {configNegocio.razonSocial || 'Almacén Comercial'}
                  </p>
                  {configNegocio.cuit && (
                    <p className="text-[10px] text-[#4B5563]">
                      CUIT: {configNegocio.cuit}
                    </p>
                  )}
                  {configNegocio.direccion && (
                    <p className="text-[10px] text-[#4B5563]">
                      {configNegocio.direccion}
                    </p>
                  )}
                  {configNegocio.telefono && (
                    <p className="text-[10px] text-[#4B5563]">
                      TEL: {configNegocio.telefono}
                    </p>
                  )}

                  {/* Caja de Régimen Legal configurado por el Administrador */}
                  {configNegocio.modoComprobante === 'no_fiscal' ? (
                    configNegocio.mostrarAclaracionLegal && (
                      <div className="my-2 p-1.5 border border-dashed border-[#111827] bg-[#F9F9F6] text-center">
                        <p className="font-extrabold text-[9px] tracking-wide text-[#111827]">
                          *** {configNegocio.textoAclaracionLegal || 'DOCUMENTO NO VÁLIDO COMO FACTURA'} ***
                        </p>
                        <p className="text-[8px] text-[#6B7280] tracking-normal uppercase">
                          COMPROBANTE DE CONTROL INTERNO Y CAMBIO
                        </p>
                      </div>
                    )
                  ) : (
                    <div className="my-2 p-1.5 border-2 border-solid border-[#111827] bg-[#F9F9F6] text-center">
                      <p className="font-extrabold text-xs tracking-wider text-[#111827]">
                        FACTURA B
                      </p>
                      <p className="text-[9px] text-[#4B5563] font-semibold">
                        PTO. VTA: {String(configNegocio.puntoVenta || 1).padStart(4, '0')} - COMP. NRO: {venta.id.replace(/\D/g, '').padStart(8, '0')}
                      </p>
                    </div>
                  )}

                  <p className="pt-0.5 text-[10px] font-semibold text-[#1F2937]">
                    {configNegocio.mensajeEncabezadoTicket || 'Comprobante de Entrega'}
                  </p>
                </div>

                {/* Metadata del Ticket */}
                <div className="py-2.5 space-y-0.5 text-[10px] border-b border-dashed border-[#A0A8A8]">
                  <div className="flex justify-between">
                    <span>
                      {configNegocio.modoComprobante === 'no_fiscal'
                        ? 'TICKET NRO:'
                        : 'COMPROBANTE N°:'}
                    </span>
                    <span className="font-bold">
                      {String(configNegocio.puntoVenta || 1).padStart(4, '0')}-{venta.id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>FECHA Y HORA:</span>
                    <span>
                      {venta.fecha || new Date().toLocaleDateString('es-AR')} {venta.hora}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>CAJERO:</span>
                    <span>{venta.vendedor || 'Cajero en Turno'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>FORMA DE PAGO:</span>
                    <span className="font-semibold uppercase">
                      {esMercadoPago
                        ? 'Mercado Pago'
                        : venta.metodoPago?.replace('_', ' ') || 'Efectivo'}
                    </span>
                  </div>
                </div>

                {/* Artículos Reales (detalle_ventas) */}
                <div className="py-2.5 space-y-1.5 border-b border-dashed border-[#A0A8A8]">
                  <div className="flex justify-between font-bold text-[10px] pb-1 border-b border-dotted border-[#D5D3C8]">
                    <span>CANT / ARTÍCULO</span>
                    <span>TOTAL</span>
                  </div>
                  {items.length === 0 ? (
                    <div className="text-center py-2 text-[#6B7280]">
                      Sin artículos especificados
                    </div>
                  ) : (
                    items.map((it, idx) => {
                      const subtotal = it.subtotal || it.cantidad * it.precioUnitario;
                      return (
                        <div key={it.id || idx} className="flex justify-between items-baseline text-[10px]">
                          <span className="truncate pr-2">
                            {it.cantidad}.0 x {it.nombreProducto || 'Artículo'}
                          </span>
                          <span className="font-semibold whitespace-nowrap">
                            {monedaSimbolo} {subtotal.toLocaleString('es-AR')}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Resumen de Totales */}
                <div className="py-2.5 space-y-1 border-b border-dashed border-[#A0A8A8]">
                  <div className="flex justify-between text-[10px]">
                    <span>SUBTOTAL:</span>
                    <span>
                      {monedaSimbolo} {venta.montoTotal.toLocaleString('es-AR')}
                    </span>
                  </div>
                  {configNegocio.modoComprobante === 'factura_afip' && (
                    <div className="flex justify-between text-[10px]">
                      <span>IVA (21.0%):</span>
                      <span>
                        {monedaSimbolo}{' '}
                        {((venta.montoTotal * 0.21) / 1.21).toLocaleString('es-AR', {
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm pt-1 text-[#111827]">
                    <span>TOTAL:</span>
                    <span>
                      {monedaSimbolo} {venta.montoTotal.toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>

                {/* Pie del Ticket con Mensaje Institucional y QR */}
                <div className="pt-3 text-center space-y-2">
                  <p className="text-[10px] text-[#4B5563] italic">
                    {configNegocio.mensajePieTicket ||
                      '¡Muchas gracias por su compra! Conserve su ticket para cambios.'}
                  </p>

                  {configNegocio.modoComprobante === 'no_fiscal' ? (
                    <div className="flex flex-col items-center justify-center pt-1 text-[#6B7280]">
                      <QrCode className="h-9 w-9 opacity-60" />
                      <span className="text-[8px] mt-0.5 tracking-wider text-[#6B7280] uppercase">
                        CÓDIGO DE SEGUIMIENTO Y CAMBIOS
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="pt-2 text-[9px] border-t border-dashed border-[#A0A8A8] space-y-0.5 text-left font-mono">
                        <div className="flex justify-between">
                          <span>CAE N°:</span>
                          <span className="font-bold">74389201938472</span>
                        </div>
                        <div className="flex justify-between">
                          <span>VTO. CAE:</span>
                          <span>05/10/2026</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center justify-center pt-1 text-[#111827]">
                        <QrCode className="h-10 w-10 text-[#111827]" />
                        <span className="text-[8px] mt-0.5 tracking-widest text-[#4B5563] font-bold">
                          AFIP QR OFICIAL (RG 4892)
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer con Acciones */}
        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-[#E8E6DF]">
          {vistaActiva === 'ticket' ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setVistaActiva('detalles')}
                className="text-xs h-9 cursor-pointer gap-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Volver a Detalles</span>
              </Button>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }} className="inline-block">
                <Button
                  type="button"
                  onClick={ejecutarImpresionDirecta}
                  className="text-xs h-9 bg-[#2A7A78] hover:bg-[#205E5C] text-white gap-1.5 font-semibold cursor-pointer shadow-xs"
                >
                  <Printer className="h-4 w-4" weight="duotone" />
                  <span>Imprimir Ticket (80mm)</span>
                </Button>
              </motion.div>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="text-xs h-9 cursor-pointer"
              >
                Cerrar
              </Button>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }} className="inline-block">
                <Button
                  type="button"
                  onClick={handleImprimirTicket}
                  className="text-xs h-9 bg-[#2A7A78] hover:bg-[#205E5C] text-white gap-1.5 font-semibold cursor-pointer shadow-xs"
                >
                  <Printer className="h-4 w-4" weight="duotone" />
                  <span>Imprimir Ticket</span>
                </Button>
              </motion.div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
