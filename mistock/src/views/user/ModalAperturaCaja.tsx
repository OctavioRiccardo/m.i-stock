'use client';

/**
 * ====================================================================
 * COMPONENTE: MODAL DE APERTURA DE CAJA (MONO-CAJA POS)
 * ====================================================================
 * 
 * Propósito:
 * Permitir al cajero/vendedor iniciar formalmente la sesión de caja antes
 * de procesar ventas o cobrar tickets en mostrador:
 * 1. Establecer el fondo de gaveta inicial para dar cambio ($ efectivo físico).
 * 2. Asignar el cajero responsable y la terminal de punto de venta.
 * 3. Registrar opcionalmente observaciones del turno.
 * 4. Habilitar el circuito comercial de ventas y cobros en el sistema.
 */

import React, { useState, useEffect } from 'react';
import {
  Key,
  Coins,
  User,
  CheckCircle,
  Storefront,
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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useUserDashboardController } from '@/controllers/userControllers/userDashboardController';

interface ModalAperturaCajaProps {
  isOpen: boolean;
  onClose: () => void;
  controller: ReturnType<typeof useUserDashboardController>;
}

export function ModalAperturaCaja({
  isOpen,
  onClose,
  controller,
}: ModalAperturaCajaProps) {
  const {
    monedaSimbolo,
    fondoInicial,
    cajeroApertura,
    config,
    abrirCaja,
  } = controller;

  const [montoInput, setMontoInput] = useState<string>(fondoInicial ? fondoInicial.toString() : '10000');
  const [observacionesInput, setObservacionesInput] = useState<string>('');
  const [errorInput, setErrorInput] = useState<string | null>(null);

  // Atajos rápidos para montos habituales de fondo de caja
  const sugerenciasFondo = [0, 5000, 10000, 20000, 50000];

  useEffect(() => {
    if (isOpen) {
      setMontoInput(fondoInicial ? fondoInicial.toString() : '10000');
      setObservacionesInput('');
      setErrorInput(null);
    }
  }, [isOpen, fondoInicial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(montoInput);
    if (isNaN(parsed) || parsed < 0) {
      setErrorInput('El fondo inicial debe ser un importe numérico mayor o igual a 0.');
      return;
    }

    abrirCaja(parsed, observacionesInput.trim() || undefined);
    onClose();
  };

  const handleSeleccionarAtajo = (valor: number) => {
    setMontoInput(valor.toString());
    setErrorInput(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-5 border-[#E8E6DF] shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Encabezado Conciso */}
          <DialogHeader className="pb-3 border-b border-[#E8E6DF]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                <Key className="h-5 w-5" weight="bold" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-[#1C2424]">
                  Apertura de Caja
                </DialogTitle>
                <DialogDescription className="text-xs text-[#657373]">
                  Declare el fondo en efectivo de la gaveta para iniciar la jornada de ventas.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Ficha Resumen de la Sesión */}
          <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-[#F8F7F2]/80 border border-[#E8E6DF] text-xs">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-[#2A7A78] shrink-0" weight="duotone" />
              <div className="truncate">
                <span className="text-[10px] text-[#657373] block uppercase font-semibold">Cajero Responsable</span>
                <span className="font-bold text-[#1C2424] truncate block">{cajeroApertura || 'Lucas Benítez'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Storefront className="h-4 w-4 text-[#2A7A78] shrink-0" weight="duotone" />
              <div>
                <span className="text-[10px] text-[#657373] block uppercase font-semibold">Punto de Venta</span>
                <Badge variant="outline" className="text-[10px] font-bold border-[#E8E6DF] text-[#1C2424]">
                  Caja N° {config.pos.numeroCaja || 1}
                </Badge>
              </div>
            </div>
          </div>

          {/* Bloque Central: Monto de Fondo Inicial */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1C2424] flex items-center gap-1.5">
                <Coins className="h-4 w-4 text-emerald-700" weight="duotone" />
                <span>Fondo Inicial en Gaveta (Efectivo):</span>
              </label>
              <span className="text-[11px] text-[#657373]">Para cambio y vuelto</span>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-base font-black text-[#657373]">
                {monedaSimbolo}
              </span>
              <Input
                type="number"
                step="any"
                min="0"
                placeholder="0"
                value={montoInput}
                onChange={(e) => {
                  setMontoInput(e.target.value);
                  setErrorInput(null);
                }}
                className="pl-9 text-lg font-black h-11 bg-white border-[#E8E6DF] text-[#1C2424] focus-visible:ring-emerald-600 shadow-2xs"
                autoFocus
                required
              />
            </div>

            {errorInput && (
              <p className="text-xs text-red-600 font-semibold">{errorInput}</p>
            )}

            {/* Atajos Rápidos de Fondo */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-semibold text-[#657373] uppercase mr-1">Atajos:</span>
              {sugerenciasFondo.map((valor) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => handleSeleccionarAtajo(valor)}
                  className={`text-xs px-2.5 py-1 rounded-md border font-mono font-medium transition-all cursor-pointer ${
                    parseFloat(montoInput) === valor
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-2xs'
                      : 'bg-white border-[#E8E6DF] text-[#657373] hover:text-[#1C2424] hover:bg-[#F8F7F2]'
                  }`}
                >
                  {valor === 0 ? '$0 (Sin fondo)' : `${monedaSimbolo} ${valor.toLocaleString('es-AR')}`}
                </button>
              ))}
            </div>
          </div>

          {/* Campo de Observaciones Opcionales */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#657373]">
              Observaciones de Apertura (opcional):
            </label>
            <Input
              type="text"
              placeholder="Ej: Cambio en billetes de $1.000 y $2.000..."
              value={observacionesInput}
              onChange={(e) => setObservacionesInput(e.target.value)}
              className="text-xs h-9 bg-white border-[#E8E6DF]"
            />
          </div>

          {/* Pie con Acciones */}
          <DialogFooter className="pt-2 border-t border-[#E8E6DF] flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs h-9 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              className="text-xs h-9 bg-emerald-700 hover:bg-emerald-800 text-white font-bold gap-1.5 cursor-pointer shadow-xs"
            >
              <CheckCircle className="h-4 w-4" weight="bold" />
              <span>Abrir Caja e Iniciar Ventas</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
