'use client';

/**
 * ====================================================================
 * COMPONENTE: MODAL DE VENTA COMPLETADA (ALERTA INMEDIATA POS)
 * ====================================================================
 *
 * Propósito:
 * Mostrar al cajero/vendedor una alerta visual destacada de "¡Venta Completada!"
 * inmediatamente después de confirmar el cobro (junto con el sonido de confirmación),
 * permitiendo finalizar la operación, imprimir el ticket manualmente o anular la venta.
 */

import React, { useState } from 'react';
import {
  CheckCircle,
  Receipt,
  Printer,
  User,
  Clock,
  Sparkle,
  Warning,
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
import { BadgeMetodoPago } from '@/components/ui/badge-metodo-pago';
import { VentaRecientePOS } from '@/models/modelos_vista/dashboardModel';
import { formatearCodigoComprobante } from '@/lib/validaciones';

export interface ModalVentaCompletadaProps {
  isOpen: boolean;
  onClose: () => void;
  venta: VentaRecientePOS | null;
  monedaSimbolo: string;
  onIrAImprimirTicket?: (venta: VentaRecientePOS) => void;
  onCancelarVenta?: (ventaId: string) => void;
}

export function ModalVentaCompletada({
  isOpen,
  onClose,
  venta,
  monedaSimbolo,
  onIrAImprimirTicket,
  onCancelarVenta,
}: ModalVentaCompletadaProps) {
  const [confirmandoAnulacion, setConfirmandoAnulacion] = useState(false);
  const modalKey = `${isOpen}:${venta?.id ?? ''}`;
  const [prevModalKey, setPrevModalKey] = useState(modalKey);

  if (modalKey !== prevModalKey) {
    setPrevModalKey(modalKey);
    setConfirmandoAnulacion(false);
  }

  if (!venta) return null;

  const codigoComprobante = formatearCodigoComprobante(venta.id);

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        hideCloseButton
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="sm:max-w-[500px] p-6 border-emerald-200 shadow-2xl rounded-2xl bg-white"
      >
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
              {codigoComprobante}
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
            <div><BadgeMetodoPago metodo={venta.metodoPago} size="sm" /></div>
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

        {/* Confirmación en línea antes de anular */}
        {confirmandoAnulacion && (
          <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/80 flex items-start gap-2.5">
            <Warning className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" weight="duotone" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-rose-900">
                ¿Confirmás anular el ticket {codigoComprobante}?
              </p>
              <p className="text-[11px] text-rose-800 leading-relaxed">
                El ticket pasará a estado anulado y las unidades vendidas volverán automáticamente al inventario. Esta acción no se puede deshacer.
              </p>
            </div>
          </div>
        )}

        {/* Footer con Acciones Manuales */}
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:items-center gap-2 pt-2">
          {confirmandoAnulacion ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmandoAnulacion(false)}
                className="text-xs h-9.5 cursor-pointer sm:flex-1"
              >
                No, mantener venta
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  onCancelarVenta?.(venta.id);
                  setConfirmandoAnulacion(false);
                  onClose();
                }}
                className="text-xs h-9.5 font-bold cursor-pointer sm:flex-1"
              >
                Sí, confirmar anulación
              </Button>
            </>
          ) : (
            <>
              {onCancelarVenta && venta.estado !== 'cancelada' && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setConfirmandoAnulacion(true)}
                  className="text-xs h-9.5 font-semibold cursor-pointer sm:mr-auto"
                >
                  Anular Venta
                </Button>
              )}

              {onIrAImprimirTicket && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onIrAImprimirTicket(venta)}
                  className="text-xs h-9.5 border-[#2A7A78]/35 text-[#2A7A78] hover:bg-[#E2F1F0]/60 hover:text-[#205E5C] font-semibold gap-1.5 cursor-pointer"
                >
                  <Printer className="h-4 w-4" weight="duotone" />
                  <span>Imprimir Ticket</span>
                </Button>
              )}

              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="inline-block"
              >
                <Button
                  type="button"
                  autoFocus
                  onClick={onClose}
                  className="w-full text-xs h-9.5 bg-[#2A7A78] hover:bg-[#205E5C] text-white font-bold px-4 cursor-pointer shadow-xs"
                >
                  Finalizar Venta
                </Button>
              </motion.div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
