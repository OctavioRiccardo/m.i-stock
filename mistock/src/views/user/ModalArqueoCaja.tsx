'use client';

/**
 * ====================================================================
 * COMPONENTE: MODAL DE ARQUEO Y CIERRE DE CAJA (MONO-CAJA)
 * ====================================================================
 * 
 * Propósito:
 * Interfaz limpia, ágil y visualmente despejada para el arqueo de efectivo
 * en gaveta y la emisión inmediata del Comprobante de Cierre (Reporte Z).
 */

import React, { useState, useEffect } from 'react';
import {
  Vault,
  Receipt,
  PencilSimple,
  Check,
} from '@phosphor-icons/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useUserDashboardController } from '@/controllers/userControllers/userDashboardController';

interface ModalArqueoCajaProps {
  isOpen: boolean;
  onClose: () => void;
  controller: ReturnType<typeof useUserDashboardController>;
}

export function ModalArqueoCaja({
  isOpen,
  onClose,
  controller,
}: ModalArqueoCajaProps) {
  const {
    monedaSimbolo,
    fondoInicial,
    setFondoInicial,
    resumenMediosTurno,
    totalVentasEfectivo,
    granTotalRecaudado,
    cantidadTicketsValidos,
    efectivoEsperado,
    confirmarCierreCaja,
  } = controller;

  const [efectivoContado, setEfectivoContado] = useState<string>('');
  const [editandoFondo, setEditandoFondo] = useState<boolean>(false);
  const [fondoInput, setFondoInput] = useState<string>(fondoInicial.toString());
  const [observaciones, setObservaciones] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setEfectivoContado('');
      setFondoInput(fondoInicial.toString());
      setEditandoFondo(false);
      setObservaciones('');
    }
  }, [isOpen, fondoInicial]);

  const numEfectivoContado = parseFloat(efectivoContado) || 0;
  const diferencia = numEfectivoContado - efectivoEsperado;
  const hayEntradaValida = efectivoContado.trim().length > 0;

  const handleGuardarFondo = () => {
    const val = parseFloat(fondoInput);
    if (!isNaN(val) && val >= 0) {
      setFondoInicial(val);
      setEditandoFondo(false);
    }
  };

  const handleConfirmarCierre = () => {
    if (!hayEntradaValida) return;
    confirmarCierreCaja(numEfectivoContado, observaciones);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-5 border-[#E8E6DF] shadow-2xl">
        {/* Encabezado Conciso */}
        <DialogHeader className="pb-3 border-b border-[#E8E6DF]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2A7A78] text-white">
                <Vault className="h-5 w-5" weight="duotone" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-[#1C2424]">
                  Cierre de Caja
                </DialogTitle>
                <p className="text-xs text-[#657373]">
                  {cantidadTicketsValidos} tickets registrados hoy
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-[#657373] uppercase font-semibold block">
                Total Facturado
              </span>
              <span className="text-sm font-extrabold text-[#2A7A78]">
                {monedaSimbolo} {granTotalRecaudado.toLocaleString('es-AR')}
              </span>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3.5 py-1">
          {/* Desglose Rápido por Medio de Pago */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2 rounded-lg bg-[#F8F7F2] border border-[#E8E6DF]">
              <span className="text-[10px] text-[#657373] uppercase font-semibold block truncate">
                Efectivo
              </span>
              <span className="text-xs font-bold text-[#1C2424] block mt-0.5">
                {monedaSimbolo} {totalVentasEfectivo.toLocaleString('es-AR')}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-[#F8F7F2] border border-[#E8E6DF]">
              <span className="text-[10px] text-[#657373] uppercase font-semibold block truncate">
                Mercado Pago
              </span>
              <span className="text-xs font-bold text-[#1C2424] block mt-0.5">
                {monedaSimbolo} {resumenMediosTurno.mercadoPago.toLocaleString('es-AR')}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-[#F8F7F2] border border-[#E8E6DF]">
              <span className="text-[10px] text-[#657373] uppercase font-semibold block truncate">
                Tarjetas
              </span>
              <span className="text-xs font-bold text-[#1C2424] block mt-0.5">
                {monedaSimbolo}{' '}
                {(
                  resumenMediosTurno.tarjetaDebito + resumenMediosTurno.tarjetaCredito
                ).toLocaleString('es-AR')}
              </span>
            </div>

            <div className="p-2 rounded-lg bg-[#F8F7F2] border border-[#E8E6DF]">
              <span className="text-[10px] text-[#657373] uppercase font-semibold block truncate">
                Transf.
              </span>
              <span className="text-xs font-bold text-[#1C2424] block mt-0.5">
                {monedaSimbolo} {resumenMediosTurno.transferencia.toLocaleString('es-AR')}
              </span>
            </div>
          </div>

          {/* Fila Compacta: Fondo Inicial & Efectivo Esperado */}
          <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-[#F8F7F2] border border-[#E8E6DF]">
            <div className="flex items-center gap-1.5">
              <span className="text-[#657373]">Fondo inicial:</span>
              {editandoFondo ? (
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={fondoInput}
                    onChange={(e) => setFondoInput(e.target.value)}
                    className="w-20 h-6 text-xs font-bold px-1.5 py-0 bg-white"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={handleGuardarFondo}
                    className="h-6 px-2 text-[10px] bg-[#2A7A78] hover:bg-[#205E5C] text-white"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditandoFondo(true)}
                  className="font-bold text-[#1C2424] inline-flex items-center gap-1 hover:text-[#2A7A78] cursor-pointer"
                  title="Clic para editar fondo inicial"
                >
                  <span>{monedaSimbolo} {fondoInicial.toLocaleString('es-AR')}</span>
                  <PencilSimple className="h-3 w-3 text-[#657373]" />
                </button>
              )}
            </div>

            <div className="text-right">
              <span className="text-[#657373]">Efectivo esperado: </span>
              <strong className="text-[#1C2424] font-bold">
                {monedaSimbolo} {efectivoEsperado.toLocaleString('es-AR')}
              </strong>
            </div>
          </div>

          {/* Bloque Central de Conteo Físico */}
          <div className="p-3.5 rounded-xl border border-[#2A7A78]/30 bg-[#E2F1F0]/15 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1C2424]">
                Efectivo en gaveta
              </label>

              {hayEntradaValida && (
                <Badge
                  variant="outline"
                  className={`text-xs font-bold px-2 py-0.5 ${
                    diferencia === 0
                      ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                      : diferencia > 0
                      ? 'border-sky-300 text-sky-700 bg-sky-50'
                      : 'border-rose-300 text-rose-700 bg-rose-50'
                  }`}
                >
                  {diferencia === 0
                    ? 'Caja exacta ($0)'
                    : diferencia > 0
                    ? `+ ${monedaSimbolo} ${diferencia.toLocaleString('es-AR')} (Sobrante)`
                    : `- ${monedaSimbolo} ${Math.abs(diferencia).toLocaleString('es-AR')} (Faltante)`}
                </Badge>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-[#657373]">
                {monedaSimbolo}
              </span>
              <Input
                type="number"
                placeholder="0"
                value={efectivoContado}
                onChange={(e) => setEfectivoContado(e.target.value)}
                className="pl-8 text-lg font-black text-[#1C2424] h-12 bg-white border-[#2A7A78]/40 focus:border-[#2A7A78]"
                autoFocus
              />
            </div>
          </div>

          {/* Observaciones (Opcional) */}
          <Input
            type="text"
            placeholder="Observaciones o notas de turno (opcional)..."
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            className="text-xs h-8.5 bg-white"
          />
        </div>

        {/* Acciones */}
        <DialogFooter className="pt-2 border-t border-[#E8E6DF] flex flex-row items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={!hayEntradaValida}
            onClick={handleConfirmarCierre}
            className="text-xs bg-[#2A7A78] hover:bg-[#205E5C] text-white gap-1.5 font-bold cursor-pointer"
          >
            <Receipt className="h-4 w-4" weight="bold" />
            <span>Cerrar Caja e Imprimir</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
