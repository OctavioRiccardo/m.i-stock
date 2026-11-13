'use client';

/**
 * ====================================================================
 * COMPONENTE: MODAL DE VENTA COMPLETADA (FEEDBACK POS)
 * ====================================================================
 * 
 * Propósito:
 * Proporcionar al cajero/vendedor una confirmación visual inmediata y clara
 * tras concretar una venta y finalizar (o cancelar/omitir) la impresión
 * del ticket térmico de 80mm.
 * 
 * Garantiza retroalimentación explícita sobre el éxito de la transacción,
 * el número de comprobante emitido, el medio de cobro y la actualización de stock.
 */

import React from 'react';
import {
  CheckCircle,
  Receipt,
  Printer,
  ArrowRight,
  Money,
  QrCode,
  CreditCard,
  ArrowsLeftRight,
  User,
  Clock,
  Sparkle,
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
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
import { VentaRecientePOS } from '@/models/modelos_vista/dashboardModel';

export interface ModalVentaCompletadaProps {
  isOpen: boolean;
  onClose: () => void;
  venta: VentaRecientePOS | null;
  monedaSimbolo: string;
  onReimprimirTicket?: () => void;
}

export function ModalVentaCompletada({
  isOpen,
  onClose,
  venta,
  monedaSimbolo,
  onReimprimirTicket,
}: ModalVentaCompletadaProps) {
  if (!venta) return null;

  const renderBadgeMetodo = (metodo?: string) => {
    const m = (metodo || 'efectivo').toLowerCase();
    switch (m) {
      case 'efectivo':
        return (
          <Badge
            variant="outline"
            className="text-[10px] uppercase px-2 py-0.5 font-bold border-emerald-300 text-emerald-800 bg-emerald-50 gap-1 inline-flex items-center"
          >
            <Money className="h-3 w-3" weight="bold" />
            <span>Efectivo</span>
          </Badge>
        );
      case 'mercado_pago':
        return (
          <Badge
            variant="outline"
            className="text-[10px] uppercase px-2 py-0.5 font-bold border-[#009EE3]/40 text-[#009EE3] bg-[#009EE3]/10 gap-1 inline-flex items-center"
          >
            <QrCode className="h-3 w-3" weight="bold" />
            <span>Mercado Pago</span>
          </Badge>
        );
      case 'tarjeta_debito':
        return (
          <Badge
            variant="outline"
            className="text-[10px] uppercase px-2 py-0.5 font-bold border-[#2A7A78]/40 text-[#2A7A78] bg-[#E2F1F0]/60 gap-1 inline-flex items-center"
          >
            <CreditCard className="h-3 w-3" weight="bold" />
            <span>Débito</span>
          </Badge>
        );
      case 'tarjeta_credito':
        return (
          <Badge
            variant="outline"
            className="text-[10px] uppercase px-2 py-0.5 font-bold border-[#2A7A78]/40 text-[#2A7A78] bg-[#E2F1F0]/60 gap-1 inline-flex items-center"
          >
            <CreditCard className="h-3 w-3" weight="bold" />
            <span>Crédito</span>
          </Badge>
        );
      case 'transferencia':
        return (
          <Badge
            variant="outline"
            className="text-[10px] uppercase px-2 py-0.5 font-bold border-gray-300 text-gray-700 bg-gray-50 gap-1 inline-flex items-center"
          >
            <ArrowsLeftRight className="h-3 w-3" weight="bold" />
            <span>Transferencia</span>
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="text-[10px] uppercase px-2 py-0.5 font-bold border-[#E8E6DF] text-[#657373]"
          >
            {m.replace('_', ' ')}
          </Badge>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-6 border-[#E8E6DF] shadow-2xl rounded-2xl bg-white">
        <DialogHeader className="text-center space-y-3 pb-2">
          {/* Icono de Éxito con Animación Suave */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100/90 text-emerald-700 ring-6 ring-emerald-50 shadow-xs"
          >
            <CheckCircle className="h-8 w-8" weight="fill" />
          </motion.div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1.5">
              <DialogTitle className="text-xl font-black text-[#1C2424] tracking-tight">
                ¡Venta Completada!
              </DialogTitle>
              <Sparkle className="h-4 w-4 text-emerald-600" weight="fill" />
            </div>
            <DialogDescription className="text-xs text-[#657373] leading-relaxed">
              La operación fue registrada con éxito en el sistema y las existencias fueron descontadas de depósito.
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Tarjeta Resumen del Comprobante */}
        <div className="p-4 rounded-xl border border-[#E8E6DF] bg-[#F8F7F2]/75 space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#E8E6DF]/70">
            <div className="flex items-center gap-1.5">
              <Receipt className="h-4 w-4 text-[#2A7A78]" weight="duotone" />
              <span className="text-xs font-semibold text-[#657373]">Comprobante:</span>
            </div>
            <span className="text-xs font-mono font-bold text-[#1C2424] bg-white px-2 py-0.5 rounded border border-[#E8E6DF]">
              {venta.id}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-xs text-[#657373] font-medium">Total Cobrado:</span>
            <span className="text-2xl font-black text-[#2A7A78] tracking-tight">
              {monedaSimbolo} {venta.montoTotal.toLocaleString('es-AR')}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px] text-[#657373]">
            <span>Medio de pago:</span>
            <div>{renderBadgeMetodo(venta.metodoPago)}</div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#657373] pt-1 border-t border-[#E8E6DF]/50">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-[#2A7A78]" weight="duotone" />
              <span>{venta.hora} {venta.fecha ? `• ${venta.fecha}` : ''}</span>
            </span>
            <span className="flex items-center gap-1">
              <User className="h-3 w-3 text-[#2A7A78]" weight="duotone" />
              <span>{venta.vendedor || 'Cajero en Turno'}</span>
            </span>
          </div>
        </div>

        {/* Footer con Acciones */}
        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          {onReimprimirTicket && (
            <Button
              type="button"
              variant="outline"
              onClick={onReimprimirTicket}
              className="text-xs h-9.5 border-[#E8E6DF] hover:bg-[#E2F1F0]/60 text-[#2A7A78] font-semibold gap-1.5 cursor-pointer sm:flex-1"
            >
              <Printer className="h-4 w-4" weight="duotone" />
              <span>Reimprimir Ticket</span>
            </Button>
          )}

          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="sm:flex-1"
          >
            <Button
              type="button"
              autoFocus
              onClick={onClose}
              className="w-full text-xs h-9.5 bg-[#2A7A78] hover:bg-[#205E5C] text-white font-bold gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Nueva Venta</span>
              <ArrowRight className="h-4 w-4" weight="bold" />
            </Button>
          </motion.div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
