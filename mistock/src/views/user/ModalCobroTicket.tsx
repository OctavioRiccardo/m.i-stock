'use client';

/**
 * ====================================================================
 * COMPONENTE: MODAL DE COBRO DE TICKET MULTI-PRODUCTO (POS CHECKOUT)
 * ====================================================================
 * 
 * Propósito:
 * Permitir al cajero/operador finalizar la venta del ticket actual:
 * 1. Seleccionar el método de cobro habilitado según la configuración del local.
 * 2. Si es Efectivo: cálculo reactivo de vuelto con atajos de billetes rápidos.
 * 3. Si es Mercado Pago: validación de cobro digital integrado.
 * 4. Si es Tarjeta / Transferencia: confirmación directa de terminal.
 * 5. Al confirmar, emitir la venta y habilitar la impresión inmediata del ticket térmico.
 */

import React, { useState, useEffect } from 'react';
import {
  Money,
  CreditCard,
  QrCode,
  ArrowsLeftRight,
  CheckCircle,
  WarningCircle,
  Receipt,
  Coins,
  Package,
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
import { Input } from '@/components/ui/input';
import { ItemCarritoPOS, VentaRecientePOS } from '@/models/modelos_vista/dashboardModel';
import { MetodoPago } from '@/models/modelos_dominio/ventaModel';
import { useConfiguracionData } from '@/services/configuracionService';
import { motion, AnimatePresence } from 'motion/react';

export interface ModalCobroTicketProps {
  isOpen: boolean;
  onClose: () => void;
  items: ItemCarritoPOS[];
  total: number;
  monedaSimbolo: string;
  onConfirmarCobro: (metodo: MetodoPago, montoRecibido?: number) => VentaRecientePOS | null;
  onVentaCompletada?: (venta: VentaRecientePOS) => void;
}

export function ModalCobroTicket({
  isOpen,
  onClose,
  items,
  total,
  monedaSimbolo,
  onConfirmarCobro,
  onVentaCompletada,
}: ModalCobroTicketProps) {
  const config = useConfiguracionData();
  const metodosConfig = config.pos.metodosPagoHabilitados;

  const [metodoSeleccionado, setMetodoSeleccionado] = useState<MetodoPago>('efectivo');
  const [montoRecibido, setMontoRecibido] = useState<string>('');

  // Reiniciar estado al abrir modal o cambiar total
  useEffect(() => {
    if (isOpen) {
      setMetodoSeleccionado('efectivo');
      setMontoRecibido('');
    }
  }, [isOpen, total]);

  // Cálculos de vuelto para pago en efectivo
  const montoRecibidoNum = parseFloat(montoRecibido) || 0;
  const vuelto = Math.max(0, montoRecibidoNum - total);
  const faltante = Math.max(0, total - montoRecibidoNum);
  const esMontoSuficiente = metodoSeleccionado !== 'efectivo' || montoRecibidoNum >= total;

  // Atajos de billetes sugeridos
  const sugerenciasBilletes = [
    { label: 'Exacto', valor: total },
    { label: '+ $1.000', valor: total + 1000 },
    { label: '+ $2.000', valor: total + 2000 },
    { label: '+ $5.000', valor: total + 5000 },
    { label: '+ $10.000', valor: total + 10000 },
    { label: '+ $20.000', valor: total + 20000 },
  ];

  const handleMontoExacto = () => {
    setMontoRecibido(total.toString());
  };

  const handleSetMonto = (valor: number) => {
    setMontoRecibido(Math.round(valor).toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!esMontoSuficiente) return;

    const venta = onConfirmarCobro(
      metodoSeleccionado,
      metodoSeleccionado === 'efectivo' ? montoRecibidoNum : total
    );

    if (venta) {
      onClose();
      if (onVentaCompletada) {
        onVentaCompletada(venta);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-6 border-[#E8E6DF] shadow-2xl">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-[#E8E6DF]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                <Receipt className="h-5 w-5" weight="duotone" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-[#1C2424]">
                  Cobrar Ticket de Venta
                </DialogTitle>
                <DialogDescription className="text-xs text-[#657373]">
                  {items.length} {items.length === 1 ? 'artículo en la orden' : 'artículos en la orden'}
                </DialogDescription>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#657373] uppercase tracking-wider block font-semibold">
                Total a Cobrar
              </span>
              <span className="text-xl font-black text-emerald-700 tracking-tight">
                {monedaSimbolo} {total.toLocaleString('es-AR')}
              </span>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Selector de Medio de Pago */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#1C2424] block">
              Seleccione el medio de cobro:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {metodosConfig.efectivo && (
                <button
                  type="button"
                  onClick={() => setMetodoSeleccionado('efectivo')}
                  className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                    metodoSeleccionado === 'efectivo'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs font-bold'
                      : 'border-[#E8E6DF] bg-white text-[#657373] hover:text-[#1C2424] hover:bg-[#F8F7F2]'
                  }`}
                >
                  <Money className="h-5 w-5" weight={metodoSeleccionado === 'efectivo' ? 'duotone' : 'regular'} />
                  <span className="text-xs">Efectivo</span>
                </button>
              )}

              {metodosConfig.mercado_pago && (
                <button
                  type="button"
                  onClick={() => setMetodoSeleccionado('mercado_pago')}
                  className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                    metodoSeleccionado === 'mercado_pago'
                      ? 'border-[#009EE3] bg-[#009EE3]/10 text-[#009EE3] shadow-xs font-bold'
                      : 'border-[#E8E6DF] bg-white text-[#657373] hover:text-[#1C2424] hover:bg-[#F8F7F2]'
                  }`}
                >
                  <QrCode className="h-5 w-5" weight={metodoSeleccionado === 'mercado_pago' ? 'duotone' : 'regular'} />
                  <span className="text-xs">Mercado Pago</span>
                </button>
              )}

              {metodosConfig.tarjeta_debito && (
                <button
                  type="button"
                  onClick={() => setMetodoSeleccionado('tarjeta_debito')}
                  className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                    metodoSeleccionado === 'tarjeta_debito'
                      ? 'border-[#2A7A78] bg-[#E2F1F0]/50 text-[#2A7A78] shadow-xs font-bold'
                      : 'border-[#E8E6DF] bg-white text-[#657373] hover:text-[#1C2424] hover:bg-[#F8F7F2]'
                  }`}
                >
                  <CreditCard className="h-5 w-5" weight={metodoSeleccionado === 'tarjeta_debito' ? 'duotone' : 'regular'} />
                  <span className="text-xs">Débito</span>
                </button>
              )}

              {metodosConfig.tarjeta_credito && (
                <button
                  type="button"
                  onClick={() => setMetodoSeleccionado('tarjeta_credito')}
                  className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                    metodoSeleccionado === 'tarjeta_credito'
                      ? 'border-[#2A7A78] bg-[#E2F1F0]/50 text-[#2A7A78] shadow-xs font-bold'
                      : 'border-[#E8E6DF] bg-white text-[#657373] hover:text-[#1C2424] hover:bg-[#F8F7F2]'
                  }`}
                >
                  <CreditCard className="h-5 w-5" weight={metodoSeleccionado === 'tarjeta_credito' ? 'duotone' : 'regular'} />
                  <span className="text-xs">Crédito</span>
                </button>
              )}

              {metodosConfig.transferencia && (
                <button
                  type="button"
                  onClick={() => setMetodoSeleccionado('transferencia')}
                  className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                    metodoSeleccionado === 'transferencia'
                      ? 'border-[#2A7A78] bg-[#E2F1F0]/50 text-[#2A7A78] shadow-xs font-bold'
                      : 'border-[#E8E6DF] bg-white text-[#657373] hover:text-[#1C2424] hover:bg-[#F8F7F2]'
                  }`}
                >
                  <ArrowsLeftRight className="h-5 w-5" weight={metodoSeleccionado === 'transferencia' ? 'duotone' : 'regular'} />
                  <span className="text-xs">Transferencia</span>
                </button>
              )}
            </div>
          </div>

          {/* Panel Dinámico según Medio de Pago */}
          {metodoSeleccionado === 'efectivo' && (
            <div className="p-3.5 rounded-xl border border-[#E8E6DF] bg-[#F8F7F2]/70 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#1C2424] flex items-center gap-1.5">
                  <Coins className="h-3.5 w-3.5 text-[#2A7A78]" weight="duotone" />
                  <span>Paga con (Monto recibido):</span>
                </label>
                <button
                  type="button"
                  onClick={handleMontoExacto}
                  className="text-xs font-semibold text-[#2A7A78] hover:underline cursor-pointer"
                >
                  Monto Exacto ({monedaSimbolo} {total.toLocaleString('es-AR')})
                </button>
              </div>

              <div className="relative">
                <span className="absolute left-3 top-2.5 text-base font-bold text-[#657373]">
                  {monedaSimbolo}
                </span>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={montoRecibido}
                  onChange={(e) => setMontoRecibido(e.target.value)}
                  className="pl-8 text-base font-bold h-11 bg-white border-[#E8E6DF] focus-visible:ring-emerald-600"
                  autoFocus
                />
              </div>

              {/* Atajos Rápidos de Billetes */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {sugerenciasBilletes.map((sug) => (
                  <button
                    key={sug.label}
                    type="button"
                    onClick={() => handleSetMonto(sug.valor)}
                    className="px-2.5 py-1 text-xs font-semibold bg-white border border-[#E8E6DF] rounded-md text-[#1C2424] hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition-colors cursor-pointer"
                  >
                    {sug.label}
                  </button>
                ))}
              </div>

              {/* Indicador Reactivo de Vuelto */}
              <AnimatePresence mode="wait">
                {montoRecibidoNum >= total && montoRecibidoNum > 0 ? (
                  <motion.div
                    key="vuelto-ok"
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -3 }}
                    className="p-3 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 text-emerald-900">
                      <CheckCircle className="h-4 w-4 shrink-0 text-emerald-700" weight="fill" />
                      <span className="text-xs font-bold">Vuelto a entregar:</span>
                    </div>
                    <span className="text-base font-black text-emerald-900">
                      {monedaSimbolo} {vuelto.toLocaleString('es-AR')}
                    </span>
                  </motion.div>
                ) : faltante > 0 && montoRecibidoNum > 0 ? (
                  <motion.div
                    key="monto-faltante"
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -3 }}
                    className="p-3 rounded-lg bg-amber-50 border border-amber-300 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 text-amber-900">
                      <WarningCircle className="h-4 w-4 shrink-0 text-amber-600" weight="fill" />
                      <span className="text-xs font-semibold">Monto insuficiente. Faltan:</span>
                    </div>
                    <span className="text-sm font-extrabold text-amber-900">
                      {monedaSimbolo} {faltante.toLocaleString('es-AR')}
                    </span>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          )}

          {metodoSeleccionado === 'mercado_pago' && (
            <div className="p-4 rounded-xl border border-[#009EE3]/30 bg-[#009EE3]/5 space-y-2 text-center">
              <QrCode className="h-8 w-8 mx-auto text-[#009EE3]" weight="duotone" />
              <p className="text-xs font-bold text-[#1C2424]">Cobro Digital con Mercado Pago</p>
              <p className="text-[11px] text-[#657373]">
                Presente el código QR en mostrador o procese el cobro en la terminal Point Smart.
              </p>
            </div>
          )}

          {(metodoSeleccionado === 'tarjeta_debito' || metodoSeleccionado === 'tarjeta_credito') && (
            <div className="p-4 rounded-xl border border-[#E8E6DF] bg-[#F8F7F2]/60 space-y-2 text-center">
              <CreditCard className="h-8 w-8 mx-auto text-[#2A7A78]" weight="duotone" />
              <p className="text-xs font-bold text-[#1C2424]">Cobro con Tarjeta en Terminal POS</p>
              <p className="text-[11px] text-[#657373]">
                Pase la tarjeta por la terminal bancaria e ingrese el cupón o autorización.
              </p>
            </div>
          )}

          {metodoSeleccionado === 'transferencia' && (
            <div className="p-4 rounded-xl border border-[#E8E6DF] bg-[#F8F7F2]/60 space-y-2 text-center">
              <ArrowsLeftRight className="h-8 w-8 mx-auto text-[#2A7A78]" weight="duotone" />
              <p className="text-xs font-bold text-[#1C2424]">Transferencia Bancaria Inmediata</p>
              <p className="text-[11px] text-[#657373]">
                Verifique la acreditación en la cuenta corriente comercial antes de emitir el ticket.
              </p>
            </div>
          )}

          {/* Desglose resumido de artículos */}
          <div className="pt-1">
            <details className="text-xs text-[#657373] cursor-pointer">
              <summary className="font-semibold text-[#1C2424] hover:underline select-none">
                Ver detalle de artículos ({items.length})
              </summary>
              <div className="mt-2 space-y-1 max-h-28 overflow-y-auto p-2 bg-[#F8F7F2]/60 rounded-lg border border-[#E8E6DF]">
                {items.map((it) => (
                  <div key={it.producto.id} className="flex justify-between text-[11px]">
                    <span className="truncate pr-2">
                      {it.cantidad}x {it.producto.nombre}
                    </span>
                    <span className="font-semibold text-[#1C2424] shrink-0">
                      {monedaSimbolo} {it.subtotal.toLocaleString('es-AR')}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-[#E8E6DF]">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs h-9 cursor-pointer"
            >
              Cancelar
            </Button>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="inline-block flex-1 sm:flex-initial">
              <Button
                type="submit"
                disabled={!esMontoSuficiente}
                className="w-full text-xs h-10 bg-emerald-700 hover:bg-emerald-800 text-white gap-2 font-bold cursor-pointer disabled:opacity-50 shadow-sm"
              >
                <CheckCircle className="h-4 w-4" weight="bold" />
                <span>Confirmar y Finalizar Venta ({monedaSimbolo} {total.toLocaleString('es-AR')})</span>
              </Button>
            </motion.div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
