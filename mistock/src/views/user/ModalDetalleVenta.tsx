'use client';

/**
 * ====================================================================
 * COMPONENTE: MODAL DE DETALLE DE VENTA (Entidad detalle_ventas)
 * ====================================================================
 * 
 * Propósito:
 * Desplegar la información completa de una transacción comercial registrada,
 * consumiendo la entidad de dominio `DetalleVenta` (tabla `public.detalle_ventas`
 * en PostgreSQL con precio congelado, cantidades y subtotales por producto).
 */

import React from 'react';
import {
  Receipt,
  User,
  Clock,
  CreditCard,
  Printer,
  CheckCircle2,
  Package,
} from 'lucide-react';
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
  if (!venta) return null;

  const items = venta.items || [];
  const esEfectivo = venta.metodoPago === 'efectivo';
  const esMercadoPago = venta.metodoPago === 'mercado_pago';

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-6 border-[#E8E6DF] shadow-2xl">
        <DialogHeader className="space-y-2 pb-2 border-b border-[#E8E6DF]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E2F1F0] text-[#2A7A78]">
                <Receipt className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base font-bold text-[#1C2424]">
                    Detalle de Venta {venta.id}
                  </DialogTitle>
                  <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-300 bg-emerald-50">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Completada
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-[#657373]">
                  Registro fiscal/operativo consolidado con snapshot de precios históricos.
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Ficha de Metadatos de la Cabecera de Venta */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-xl border border-[#E8E6DF] bg-[#F8F7F2]/60 text-xs">
            <div>
              <span className="text-[10px] text-[#657373] uppercase tracking-wider font-semibold block flex items-center gap-1">
                <Clock className="h-3 w-3 text-[#2A7A78]" />
                Hora de Operación
              </span>
              <span className="font-bold text-[#1C2424] mt-0.5 block">
                {venta.hora} {venta.fecha ? `• ${venta.fecha}` : ''}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-[#657373] uppercase tracking-wider font-semibold block flex items-center gap-1">
                <User className="h-3 w-3 text-[#2A7A78]" />
                Vendedor / Caja
              </span>
              <span className="font-bold text-[#1C2424] mt-0.5 block truncate">
                {venta.vendedor || 'Cajero en Turno'}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-[#657373] uppercase tracking-wider font-semibold block flex items-center gap-1">
                <CreditCard className="h-3 w-3 text-[#2A7A78]" />
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
                  {esMercadoPago ? 'Mercado Pago' : (venta.metodoPago?.replace('_', ' ') || 'Efectivo')}
                </Badge>
              </div>
            </div>
          </div>

          {/* Desglose de Renglones Facturados (Entidad detalle_ventas) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-[#1C2424]">
              <span className="flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-[#2A7A78]" />
                Renglones de la Operación (detalle_ventas):
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
                              <p className="text-[10px] text-[#657373]">Cód: {it.codigoProducto}</p>
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

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-[#E8E6DF]">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs h-9 cursor-pointer"
          >
            Cerrar
          </Button>
          <Button
            type="button"
            onClick={handlePrint}
            className="text-xs h-9 bg-[#2A7A78] hover:bg-[#205E5C] text-white gap-1.5 font-semibold cursor-pointer shadow-xs"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimir Ticket</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
