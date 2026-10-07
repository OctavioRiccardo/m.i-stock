'use client';

/**
 * ====================================================================
 * COMPONENTE: MODAL DE ARQUEO Y CIERRE DE CAJA (MONO-CAJA)
 * ====================================================================
 * 
 * Propósito:
 * Proporcionar al cajero / vendedor una interfaz guiada para conciliar
 * el efectivo físico en gaveta (arqueo de caja), revisar los importes
 * acumulados por canales electrónicos (MP, Débito, Crédito, Transferencia)
 * y emitir el Comprobante de Cierre de Caja (Reporte Z).
 */

import React, { useState, useEffect } from 'react';
import {
  Vault,
  Money,
  QrCode,
  CreditCard,
  ArrowsLeftRight,
  CheckCircle,
  WarningCircle,
  Clock,
  Printer,
  Receipt,
  Scales,
  PencilSimple,
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
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
    totalDigitales,
    granTotalRecaudado,
    cantidadTicketsValidos,
    efectivoEsperado,
    confirmarCierreCaja,
    config,
  } = controller;

  // Estado local para el conteo de efectivo y observaciones
  const [efectivoContado, setEfectivoContado] = useState<string>('');
  const [editandoFondo, setEditandoFondo] = useState<boolean>(false);
  const [fondoInput, setFondoInput] = useState<string>(fondoInicial.toString());
  const [observaciones, setObservaciones] = useState<string>('');

  // Inicializar o sincronizar el estado al abrir el modal
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
      <DialogContent className="max-w-2xl p-6 border-[#E8E6DF] shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Encabezado del Arqueo */}
        <DialogHeader className="pb-3 border-b border-[#E8E6DF] space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2A7A78] text-white shadow-xs">
                <Vault className="h-6 w-6" weight="duotone" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-lg font-bold text-[#1C2424] tracking-tight">
                    Arqueo y Cierre de Caja
                  </DialogTitle>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold text-[#2A7A78] border-[#2A7A78]/30 bg-[#E2F1F0]/50"
                  >
                    Terminal N° {config.pos.numeroCaja || 1}
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-[#657373]">
                  Conciliación de dinero físico en gaveta y resumen de operaciones del turno.
                </DialogDescription>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <span className="text-[10px] font-semibold text-[#657373] uppercase block">
                Operaciones del Día
              </span>
              <span className="text-sm font-bold text-[#1C2424]">
                {cantidadTicketsValidos} comprobantes
              </span>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* ==================================================================== */}
          {/* 1. FONDO INICIAL (CAMBIO EN GAVETA)                                 */}
          {/* ==================================================================== */}
          <div className="p-3.5 rounded-xl bg-[#F8F7F2] border border-[#E8E6DF] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-white border border-[#E8E6DF] text-[#2A7A78]">
                <Money className="h-4 w-4" weight="duotone" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#1C2424] block">
                  Fondo Inicial (Cambio para Dar Vuelto)
                </span>
                <span className="text-[11px] text-[#657373]">
                  Efectivo base disponible en gaveta al inicio de la jornada.
                </span>
              </div>
            </div>

            {editandoFondo ? (
              <div className="flex items-center gap-2">
                <div className="relative w-32">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#657373]">
                    {monedaSimbolo}
                  </span>
                  <Input
                    type="number"
                    value={fondoInput}
                    onChange={(e) => setFondoInput(e.target.value)}
                    className="pl-7 h-8 text-xs font-bold"
                    autoFocus
                  />
                </div>
                <Button
                  size="sm"
                  onClick={handleGuardarFondo}
                  className="h-8 text-xs bg-[#2A7A78] hover:bg-[#205E5C] text-white"
                >
                  OK
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#1C2424]">
                  {monedaSimbolo} {fondoInicial.toLocaleString('es-AR')}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditandoFondo(true)}
                  className="h-7 w-7 text-[#657373] hover:text-[#1C2424]"
                  title="Modificar fondo inicial"
                >
                  <PencilSimple className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>

          {/* ==================================================================== */}
          {/* 2. RESUMEN DE COBROS POR CANAL (VENTAS REGISTRADAS)                 */}
          {/* ==================================================================== */}
          <div>
            <h3 className="text-xs font-bold text-[#1C2424] mb-2 uppercase tracking-wider flex items-center gap-1.5">
              <span>Recaudación Registrada por Canal</span>
              <Badge variant="secondary" className="text-[10px] font-normal">
                Turno en curso
              </Badge>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Efectivo */}
              <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/60 flex flex-col justify-between">
                <div className="flex items-center justify-between text-emerald-800 mb-1">
                  <span className="text-[11px] font-semibold">Efectivo Cobrado</span>
                  <Money className="h-4 w-4" weight="duotone" />
                </div>
                <span className="text-sm font-bold text-emerald-900">
                  {monedaSimbolo} {totalVentasEfectivo.toLocaleString('es-AR')}
                </span>
              </div>

              {/* Mercado Pago */}
              <div className="p-3 rounded-xl border border-sky-200 bg-sky-50/60 flex flex-col justify-between">
                <div className="flex items-center justify-between text-sky-800 mb-1">
                  <span className="text-[11px] font-semibold">Mercado Pago</span>
                  <QrCode className="h-4 w-4" weight="duotone" />
                </div>
                <span className="text-sm font-bold text-sky-900">
                  {monedaSimbolo} {resumenMediosTurno.mercadoPago.toLocaleString('es-AR')}
                </span>
              </div>

              {/* Tarjetas */}
              <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/60 flex flex-col justify-between">
                <div className="flex items-center justify-between text-indigo-800 mb-1">
                  <span className="text-[11px] font-semibold">Tarjetas (D/C)</span>
                  <CreditCard className="h-4 w-4" weight="duotone" />
                </div>
                <span className="text-sm font-bold text-indigo-900">
                  {monedaSimbolo}{' '}
                  {(
                    resumenMediosTurno.tarjetaDebito + resumenMediosTurno.tarjetaCredito
                  ).toLocaleString('es-AR')}
                </span>
              </div>

              {/* Transferencias */}
              <div className="p-3 rounded-xl border border-violet-200 bg-violet-50/60 flex flex-col justify-between">
                <div className="flex items-center justify-between text-violet-800 mb-1">
                  <span className="text-[11px] font-semibold">Transferencia</span>
                  <ArrowsLeftRight className="h-4 w-4" weight="duotone" />
                </div>
                <span className="text-sm font-bold text-violet-900">
                  {monedaSimbolo} {resumenMediosTurno.transferencia.toLocaleString('es-AR')}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs mt-2 px-1 text-[#657373]">
              <span>
                Total Digitales (POSNet / Bancos / MP):{' '}
                <strong className="text-[#1C2424]">
                  {monedaSimbolo} {totalDigitales.toLocaleString('es-AR')}
                </strong>
              </span>
              <span>
                Gran Total Ventas:{' '}
                <strong className="text-[#2A7A78] font-bold">
                  {monedaSimbolo} {granTotalRecaudado.toLocaleString('es-AR')}
                </strong>
              </span>
            </div>
          </div>

          {/* ==================================================================== */}
          {/* 3. ARQUEO DE EFECTIVO: CONTEO FÍSICO Y BALANCE                       */}
          {/* ==================================================================== */}
          <div className="p-4 rounded-xl border border-[#2A7A78]/30 bg-[#E2F1F0]/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scales className="h-5 w-5 text-[#2A7A78]" weight="duotone" />
                <h3 className="text-xs font-bold text-[#1C2424] uppercase tracking-wider">
                  Conciliación de Efectivo en Gaveta
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#657373] block uppercase font-semibold">
                  Efectivo Esperado
                </span>
                <span className="text-xs font-bold text-[#1C2424]">
                  {monedaSimbolo} {efectivoEsperado.toLocaleString('es-AR')}{' '}
                  <span className="text-[10px] text-[#657373] font-normal">
                    (Fondo {monedaSimbolo}{fondoInicial.toLocaleString('es-AR')} + Ventas {monedaSimbolo}{totalVentasEfectivo.toLocaleString('es-AR')})
                  </span>
                </span>
              </div>
            </div>

            {/* Input de conteo */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1C2424] flex items-center justify-between">
                <span>Efectivo Real Contado en Gaveta:</span>
                <span className="text-[11px] font-normal text-[#657373]">
                  Ingrese la suma total de billetes y monedas
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#657373]">
                  {monedaSimbolo}
                </span>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={efectivoContado}
                  onChange={(e) => setEfectivoContado(e.target.value)}
                  className="pl-8 text-base font-bold text-[#1C2424] h-11 border-[#2A7A78]/40 focus:border-[#2A7A78] bg-white"
                  autoFocus
                />
              </div>
            </div>

            {/* Indicador reactivo de balance / diferencia */}
            {hayEntradaValida && (
              <div className="pt-1">
                {diferencia === 0 ? (
                  <Alert variant="success" className="bg-emerald-50 border-emerald-300 py-2.5">
                    <CheckCircle className="h-4 w-4 text-emerald-700" weight="fill" />
                    <AlertTitle className="text-emerald-900 font-bold text-xs">
                      Caja Cuadrada Exacta (Sin Diferencias)
                    </AlertTitle>
                    <AlertDescription className="text-emerald-800 text-[11px]">
                      El efectivo físico contado coincide exactamente con el fondo inicial más las ventas registradas.
                    </AlertDescription>
                  </Alert>
                ) : diferencia > 0 ? (
                  <Alert className="bg-sky-50 border-sky-300 text-sky-900 py-2.5">
                    <CheckCircle className="h-4 w-4 text-sky-700" weight="fill" />
                    <AlertTitle className="font-bold text-xs flex items-center justify-between">
                      <span>Sobrante de Caja Detectado</span>
                      <span className="font-bold text-sm">
                        + {monedaSimbolo} {diferencia.toLocaleString('es-AR')}
                      </span>
                    </AlertTitle>
                    <AlertDescription className="text-sky-800 text-[11px]">
                      Hay más dinero físico en gaveta del esperado. Se registrará el sobrante en el reporte de cierre.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive" className="py-2.5">
                    <WarningCircle className="h-4 w-4 text-red-600" weight="fill" />
                    <AlertTitle className="font-bold text-xs flex items-center justify-between">
                      <span>Faltante de Caja Detectado</span>
                      <span className="font-bold text-sm">
                        - {monedaSimbolo} {Math.abs(diferencia).toLocaleString('es-AR')}
                      </span>
                    </AlertTitle>
                    <AlertDescription className="text-[11px]">
                      Falta dinero en gaveta con respecto al cálculo esperado. Revise si hubo retiros no declarados o diferencias de cambio.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          {/* Observaciones del Cierre */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#657373] block">
              Observaciones o Novedades de Turno (Opcional):
            </label>
            <Input
              type="text"
              placeholder="Ej: Retiro autorizado por dueño $5.000 para flete, billete falso rechazado, etc."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="text-xs h-9 bg-white"
            />
          </div>
        </div>

        {/* Acciones de Cierre */}
        <DialogFooter className="pt-3 border-t border-[#E8E6DF] flex flex-col sm:flex-row items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto text-xs"
          >
            Volver a la Terminal
          </Button>

          <Button
            type="button"
            disabled={!hayEntradaValida}
            onClick={handleConfirmarCierre}
            className="w-full sm:w-auto text-xs bg-[#2A7A78] hover:bg-[#205E5C] text-white gap-2 font-bold cursor-pointer"
          >
            <Receipt className="h-4 w-4" weight="bold" />
            <span>Confirmar Cierre e Imprimir Reporte (Z)</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
