'use client';

/**
 * ====================================================================
 * COMPONENTE: MODAL DE VENTA COMPLETADA (ALERTA INMEDIATA POS)
 * ====================================================================
 *
 * Propósito:
 * Mostrar al cajero/vendedor una alerta visual destacada de "¡Venta Completada!"
 * inmediatamente después de confirmar el cobro (junto con el sonido de confirmación),
 * antes de dar paso al modal de impresión del ticket térmico de 80mm.
 */

import React, { useEffect } from 'react';
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
import { motion } from 'motion/react';
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
import { formatearCodigoComprobante } from '@/lib/validaciones';

export interface ModalVentaCompletadaProps {
  isOpen: boolean;
  onClose: () => void;
  venta: VentaRecientePOS | null;
  monedaSimbolo: string;
  onIrAImprimirTicket?: (venta: VentaRecientePOS) => void;
}

const DELAY_AUTO_TICKET_MS = 1800;

export function ModalVentaCompletada({
  isOpen,
  onClose,
  venta,
  monedaSimbolo,
  onIrAImprimirTicket,
}: ModalVentaCompletadaProps) {
  useEffect(() => {
    if (!isOpen || !venta || !onIrAImprimirTicket) return;

    const timer = setTimeout(() => {
      onIrAImprimirTicket(venta);
    }, DELAY_AUTO_TICKET_MS);

    return () => clearTimeout(timer);
  }, [isOpen, venta, onIrAImprimirTicket]);

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
      <DialogContent hideCloseButton className="max-w-md p-6 border-emerald-200 shadow-2xl rounded-2xl bg-white">
        <DialogHeader className="text-center space-y-3 pb-2">
          {/* Icono de Éxito con Animación Suave */}
          <motion.div
            initial={{ scale: 0.65, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100/90 text-emerald-700 ring-6 ring-emerald-50 shadow-xs"
          >
            <CheckCircle className="h-8 w-8" weight="fill" />
          </motion.div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1.5">
              <DialogTitle className="text-xl font-black text-emerald-900 tracking-tight">
                ¡Venta Completada!
              </DialogTitle>
              <Sparkle className="h-4 w-4 text-emerald-600" weight="fill" />
            </div>
            <DialogDescription className="text-xs text-[#657373] leading-relaxed">
              El cobro fue registrado con éxito y el stock fue actualizado.
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Tarjeta Resumen del Comprobante */}
        <div className="p-4 rounded-xl border border-[#E8E6DF] bg-[#F8F7F2]/75 space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#E8E6DF]/70">
            <div className="flex items-center gap-1.5">
              <Receipt className="h-4 w-4 text-[#2A7A78]" weight="duotone" />
              <span className="text-xs font-semibold text-[#657373]">Ticket:</span>
            </div>
            <span className="text-xs font-mono font-bold text-[#1C2424] bg-white px-2 py-0.5 rounded border border-[#E8E6DF]">
              {formatearCodigoComprobante(venta.id)}
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

        {/* Barra de transición automática al modal de impresión */}
        {onIrAImprimirTicket && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-[#657373]">
              <span>Abriendo ticket para imprimir...</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#E8E6DF] overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: DELAY_AUTO_TICKET_MS / 1000, ease: 'linear' }}
                className="h-full bg-[#2A7A78] rounded-full"
              />
            </div>
          </div>
        )}

        {/* Footer con Acciones */}
        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs h-9.5 border-[#E8E6DF] text-[#657373] hover:text-[#1C2424] font-semibold gap-1.5 cursor-pointer sm:flex-1"
          >
            <span>Nueva Venta</span>
            <ArrowRight className="h-4 w-4" weight="bold" />
          </Button>

          {onIrAImprimirTicket && (
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="sm:flex-1"
            >
              <Button
                type="button"
                autoFocus
                onClick={() => onIrAImprimirTicket(venta)}
                className="w-full text-xs h-9.5 bg-[#2A7A78] hover:bg-[#205E5C] text-white font-bold gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="h-4 w-4" weight="duotone" />
                <span>Imprimir Ticket</span>
              </Button>
            </motion.div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
