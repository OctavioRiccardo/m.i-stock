'use client';

/**
 * ====================================================================
 * COMPONENTE: MODAL PARA REGISTRAR VENTA EN EFECTIVO (POS)
 * ====================================================================
 * 
 * Propósito:
 * Permitir al cajero/vendedor seleccionar la cantidad a despachar,
 * visualizar el subtotal en tiempo real, ingresar el importe abonado
 * por el cliente y calcular inmediatamente el vuelto a entregar.
 */

import React, { useState, useEffect } from 'react';
import {
  Banknote,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Coins,
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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ProductoRapidoPOS } from '@/models/modelos_vista/dashboardModel';
import { motion, AnimatePresence } from 'motion/react';

export interface ModalVentaEfectivoProps {
  isOpen: boolean;
  onClose: () => void;
  producto: ProductoRapidoPOS | null;
  monedaSimbolo: string;
  permitirVentaSinStock: boolean;
  onConfirmar: (productoId: string, cantidad: number, montoRecibido?: number) => void;
}

export function ModalVentaEfectivo({
  isOpen,
  onClose,
  producto,
  monedaSimbolo,
  permitirVentaSinStock,
  onConfirmar,
}: ModalVentaEfectivoProps) {
  const [cantidad, setCantidad] = useState<number>(1);
  const [montoRecibido, setMontoRecibido] = useState<string>('');

  // Reiniciar estado al cambiar de producto o abrir
  useEffect(() => {
    if (producto) {
      setCantidad(1);
      setMontoRecibido(producto.precio.toString());
    }
  }, [producto, isOpen]);

  if (!producto) return null;

  const precioUnitario = producto.precio;
  const stockDisponible = producto.stock;
  const totalACobrar = precioUnitario * cantidad;

  const montoRecibidoNum = montoRecibido === '' ? 0 : Number(montoRecibido);
  const esMontoSuficiente = montoRecibido !== '' && montoRecibidoNum >= totalACobrar;
  const vuelto = esMontoSuficiente ? montoRecibidoNum - totalACobrar : 0;
  const faltante = !esMontoSuficiente && montoRecibido !== '' ? totalACobrar - montoRecibidoNum : 0;

  const puedeAumentar = permitirVentaSinStock || cantidad < stockDisponible;

  const incrementar = () => {
    if (puedeAumentar) {
      const nuevaCantidad = cantidad + 1;
      setCantidad(nuevaCantidad);
      // Ajustar monto recibido si estaba en exacto
      if (montoRecibidoNum === totalACobrar) {
        setMontoRecibido((precioUnitario * nuevaCantidad).toString());
      }
    }
  };

  const decrementar = () => {
    if (cantidad > 1) {
      const nuevaCantidad = cantidad - 1;
      setCantidad(nuevaCantidad);
      if (montoRecibidoNum === totalACobrar) {
        setMontoRecibido((precioUnitario * nuevaCantidad).toString());
      }
    }
  };

  const handleMontoExacto = () => {
    setMontoRecibido(totalACobrar.toString());
  };

  const agregarDinero = (monto: number) => {
    const actual = montoRecibido === '' ? totalACobrar : Number(montoRecibido);
    setMontoRecibido((actual + monto).toString());
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!esMontoSuficiente && montoRecibido !== '') return;
    if (!permitirVentaSinStock && stockDisponible < cantidad) return;

    onConfirmar(producto.id, cantidad, montoRecibidoNum);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-6 border-[#E8E6DF] shadow-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Banknote className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-[#1C2424]">
                Registrar Venta en Efectivo
              </DialogTitle>
              <DialogDescription className="text-xs text-[#657373]">
                Operación directa en mostrador con cálculo automático de vuelto.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Ficha Resumen del Producto */}
          <div className="p-3 rounded-lg border border-[#E8E6DF] bg-[#F8F7F2]/60 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-[#1C2424] leading-snug">{producto.nombre}</p>
                <p className="text-[11px] text-[#657373]">
                  {producto.categoria} • Cód: {producto.codigo}
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] shrink-0">
                P. Unit: {monedaSimbolo} {precioUnitario.toLocaleString('es-AR')}
              </Badge>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-[#E8E6DF]/60 text-[11px] text-[#657373]">
              <Package className="h-3.5 w-3.5 text-[#2A7A78]" />
              <span>
                Stock en góndola: <strong className="text-[#1C2424]">{stockDisponible} unidades</strong>
              </span>
            </div>
          </div>

          {/* Selector de Cantidad */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#1C2424]">
              Cantidad a despachar
            </label>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-[#E8E6DF] rounded-lg bg-white overflow-hidden shadow-xs">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.88 }}
                  onClick={decrementar}
                  disabled={cantidad <= 1}
                  className="h-9 w-9 flex items-center justify-center hover:bg-[#F8F7F2] text-[#1C2424] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors"
                >
                  <Minus className="h-3.5 w-3.5" />
                </motion.button>
                <div className="w-14 text-center text-sm font-bold text-[#1C2424] select-none">
                  {cantidad}
                </div>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.88 }}
                  onClick={incrementar}
                  disabled={!puedeAumentar}
                  className="h-9 w-9 flex items-center justify-center hover:bg-[#F8F7F2] text-[#1C2424] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                </motion.button>
              </div>

              <div className="flex-1 text-right">
                <span className="text-[11px] text-[#657373] block uppercase tracking-wider font-medium">
                  Total a Cobrar
                </span>
                <span className="text-xl font-extrabold text-[#1C2424]">
                  {monedaSimbolo} {totalACobrar.toLocaleString('es-AR')}
                </span>
              </div>
            </div>
          </div>

          {/* Importe Abonado y Vuelto */}
          <div className="space-y-2 pt-2 border-t border-[#E8E6DF]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#1C2424] flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5 text-[#2A7A78]" />
                <span>Paga con (Monto recibido):</span>
              </label>
              <button
                type="button"
                onClick={handleMontoExacto}
                className="text-[11px] font-semibold text-[#2A7A78] hover:underline cursor-pointer"
              >
                Monto Exacto
              </button>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-2 text-sm font-bold text-[#657373]">
                {monedaSimbolo}
              </span>
              <Input
                type="number"
                step="any"
                min={totalACobrar}
                value={montoRecibido}
                onChange={(e) => setMontoRecibido(e.target.value)}
                placeholder={totalACobrar.toString()}
                className="pl-8 text-base font-bold text-[#1C2424] bg-white h-9"
                autoFocus
              />
            </div>

            {/* Atajos de billetes frecuentes */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[1000, 2000, 5000, 10000, 20000].map((billete) => (
                <motion.button
                  key={billete}
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.94 }}
                  transition={{ duration: 0.12 }}
                  onClick={() => agregarDinero(billete)}
                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#F8F7F2] hover:bg-[#E8E6DF] text-[#1C2424] border border-[#E8E6DF] transition-colors cursor-pointer"
                >
                  +{monedaSimbolo} {billete.toLocaleString('es-AR')}
                </motion.button>
              ))}
            </div>

            {/* Indicador Reactivo de Vuelto con AnimatePresence */}
            <AnimatePresence mode="wait">
              {esMontoSuficiente ? (
                <motion.div
                  key="vuelto-ok"
                  initial={{ opacity: 0, y: 4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span className="text-xs font-semibold">Vuelto a entregar al cliente:</span>
                  </div>
                  <span className="text-sm font-extrabold text-emerald-800">
                    {monedaSimbolo} {vuelto.toLocaleString('es-AR')}
                  </span>
                </motion.div>
              ) : faltante > 0 ? (
                <motion.div
                  key="monto-faltante"
                  initial={{ opacity: 0, y: 4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 text-amber-800">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                    <span className="text-xs font-semibold">Monto insuficiente. Faltan:</span>
                  </div>
                  <span className="text-sm font-extrabold text-amber-800">
                    {monedaSimbolo} {faltante.toLocaleString('es-AR')}
                  </span>
                </motion.div>
              ) : null}
            </AnimatePresence>
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
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="inline-block">
              <Button
                type="submit"
                disabled={!esMontoSuficiente || (!permitirVentaSinStock && stockDisponible < cantidad)}
                className="text-xs h-9 bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5 font-semibold cursor-pointer disabled:opacity-50"
              >
                <Banknote className="h-4 w-4" />
                <span>Confirmar Cobro en Efectivo</span>
              </Button>
            </motion.div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
