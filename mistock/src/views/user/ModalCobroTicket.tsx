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
  DeviceMobile,
  CircleNotch,
  ArrowClockwise,
  WifiHigh,
  XCircle,
  Check,
} from '@phosphor-icons/react';
import { PointDevice } from '@/services/mercadopago';
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

  // ------------------------------------------------------------------
  // ESTADOS REACTIVOS DE MERCADO PAGO POINT SMART
  // ------------------------------------------------------------------
  type EstadoPoint =
    | 'idle'
    | 'cargando_terminales'
    | 'creando_intencion'
    | 'esperando_tarjeta'
    | 'procesando'
    | 'aprobado'
    | 'rechazado';

  const [devicesPoint, setDevicesPoint] = useState<PointDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [estadoPoint, setEstadoPoint] = useState<EstadoPoint>('idle');
  const [intentActivo, setIntentActivo] = useState<{
    id: string;
    status: string;
    deviceId?: string;
    paymentId?: number;
  } | null>(null);
  const [mensajePoint, setMensajePoint] = useState<string>('');
  const [buscoDispositivos, setBuscoDispositivos] = useState<boolean>(false);

  // Reiniciar estado al abrir modal o cambiar total
  useEffect(() => {
    if (isOpen) {
      setMetodoSeleccionado('efectivo');
      setMontoRecibido('');
      setEstadoPoint('idle');
      setIntentActivo(null);
      setMensajePoint('');
    } else {
      // Si se cierra el modal mientras hay intención activa en Point, cancelarla para liberar el lector
      if (intentActivo) {
        fetch(`/api/mercadopago/point/intent/${intentActivo.id}?deviceId=${intentActivo.deviceId || selectedDeviceId}`, {
          method: 'DELETE',
        }).catch(() => {});
      }
    }
  }, [isOpen, total]);

  // Consultar terminales cuando el cajero selecciona Mercado Pago
  const consultarTerminalesPoint = async () => {
    setEstadoPoint('cargando_terminales');
    setMensajePoint('');
    try {
      const res = await fetch('/api/mercadopago/point/devices');
      const data = await res.json();
      if (res.ok && Array.isArray(data.devices) && data.devices.length > 0) {
        setDevicesPoint(data.devices);
        setSelectedDeviceId(data.devices[0].id);
        setEstadoPoint('idle');
      } else {
        setDevicesPoint([]);
        setEstadoPoint('idle');
        if (data.error) {
          setMensajePoint(data.error);
        }
      }
    } catch {
      setEstadoPoint('idle');
      setMensajePoint('No se pudo verificar la conexión con terminales Point.');
    } finally {
      setBuscoDispositivos(true);
    }
  };

  useEffect(() => {
    if (isOpen && metodoSeleccionado === 'mercado_pago' && !buscoDispositivos) {
      consultarTerminalesPoint();
    }
  }, [isOpen, metodoSeleccionado, buscoDispositivos]);

  // Transmitir orden de cobro al lector físico Point Smart
  const handleEnviarCobroPoint = async () => {
    setEstadoPoint('creando_intencion');
    setMensajePoint('Transmitiendo orden a la pantalla del Point Smart...');
    try {
      const res = await fetch('/api/mercadopago/point/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          deviceId: selectedDeviceId || undefined,
          description: `Cobro en Mostrador (${items.length} items)`,
          ticketNumber: `TKT-${Date.now().toString().slice(-4)}`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.intent) {
        setIntentActivo({
          id: data.intent.id,
          status: data.intent.status || 'OPEN',
          deviceId: selectedDeviceId,
        });
        setEstadoPoint('esperando_tarjeta');
        setMensajePoint('Terminal Point Smart activa: Pídale al cliente que acerque, inserte o deslice su tarjeta.');
      } else {
        setEstadoPoint('rechazado');
        setMensajePoint(data.error || 'No se pudo enviar la orden al lector Point Smart.');
      }
    } catch {
      setEstadoPoint('rechazado');
      setMensajePoint('Error de conexión al enviar el cobro a Mercado Pago.');
    }
  };

  // Cancelar cobro activo en la terminal
  const handleCancelarCobroPoint = async () => {
    if (intentActivo) {
      try {
        await fetch(
          `/api/mercadopago/point/intent/${intentActivo.id}?deviceId=${intentActivo.deviceId || selectedDeviceId}`,
          { method: 'DELETE' }
        );
      } catch {
        // Silencioso
      }
    }
    setIntentActivo(null);
    setEstadoPoint('idle');
    setMensajePoint('Cobro cancelado en la terminal.');
  };

  // Polling automático para detectar cobro completado en el postnet de Mercado Pago
  useEffect(() => {
    if (!intentActivo || (estadoPoint !== 'esperando_tarjeta' && estadoPoint !== 'procesando')) {
      return;
    }

    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(`/api/mercadopago/point/intent/${intentActivo.id}`);
        if (res.ok) {
          const data = await res.json();
          const status = data.intent?.status;
          if (status === 'PROCESSED') {
            setEstadoPoint('aprobado');
            setMensajePoint('Operación completada con éxito en el postnet.');
            setIntentActivo((prev) =>
              prev ? { ...prev, status: 'PROCESSED', paymentId: data.intent?.payment?.id } : null
            );
            clearInterval(intervalId);
          } else if (status === 'PROCESSING') {
            setEstadoPoint('procesando');
            setMensajePoint('Tarjeta detectada. Autorizando transacción con el banco emisor...');
          } else if (status === 'ERROR' || status === 'ABANDONED' || status === 'CANCELED') {
            setEstadoPoint('rechazado');
            setMensajePoint(
              status === 'ABANDONED'
                ? 'Operación cancelada o tiempo expirado en el postnet.'
                : status === 'CANCELED'
                ? 'Cobro cancelado desde el sistema.'
                : 'Pago rechazado por el banco emisor (fondos insuficientes o denegado).'
            );
            clearInterval(intervalId);
          }
        }
      } catch {
        // Silencioso ante fallos temporales de sondeo
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [intentActivo, estadoPoint]);

  // Cálculos de vuelto para pago en efectivo
  const montoRecibidoNum = parseFloat(montoRecibido) || 0;
  const vuelto = Math.max(0, montoRecibidoNum - total);
  const faltante = Math.max(0, total - montoRecibidoNum);
  const esMontoSuficiente =
    metodoSeleccionado === 'mercado_pago'
      ? estadoPoint === 'aprobado'
      : metodoSeleccionado !== 'efectivo' || montoRecibidoNum >= total;

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
    if (metodoSeleccionado === 'mercado_pago') {
      if (estadoPoint === 'idle') {
        handleEnviarCobroPoint();
        return;
      }
      if (estadoPoint !== 'aprobado') {
        return;
      }
    } else if (!esMontoSuficiente) {
      return;
    }

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
            <div className="p-4 rounded-xl border border-[#009EE3]/40 bg-[#009EE3]/5 space-y-3">
              {/* Cabecera del Módulo Point Smart */}
              <div className="flex items-center justify-between pb-2 border-b border-[#009EE3]/20">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#009EE3] text-white shadow-xs">
                    <DeviceMobile className="h-4 w-4" weight="bold" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#1C2424] block leading-tight">
                      Postnet Mercado Pago (Point Smart)
                    </span>
                    <span className="text-[10px] text-[#657373]">
                      Cobro presencial con tarjeta (Chip / Contactless)
                    </span>
                  </div>
                </div>

                {/* Estado de Conectividad de la Terminal */}
                {estadoPoint === 'cargando_terminales' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#657373]">
                    <CircleNotch className="h-3.5 w-3.5 animate-spin text-[#009EE3]" />
                    Verificando postnet...
                  </span>
                ) : devicesPoint.length > 0 ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    <WifiHigh className="h-3.5 w-3.5 text-emerald-600" weight="bold" />
                    {devicesPoint.length === 1 ? 'Postnet en línea' : `${devicesPoint.length} terminales`}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    <WifiHigh className="h-3.5 w-3.5 text-emerald-600" weight="bold" />
                    Terminal lista para cobro
                  </span>
                )}
              </div>

              {/* Selector si hay múltiples terminales en la cuenta */}
              {devicesPoint.length > 1 && estadoPoint === 'idle' && (
                <div className="flex items-center justify-between gap-2 text-xs">
                  <label className="text-[11px] text-[#657373] font-medium">Terminal destino:</label>
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                    className="text-xs bg-white border border-[#E8E6DF] rounded-md px-2 py-1 font-mono text-[#1C2424]"
                  >
                    {devicesPoint.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.id} ({d.operating_mode})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* ESTADO 1: IDLE (Listo para enviar cobro al postnet) */}
              {estadoPoint === 'idle' && (
                <div className="space-y-3 pt-0.5">
                  <div className="p-3.5 rounded-xl bg-white border border-[#009EE3]/30 flex items-center justify-between shadow-2xs">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-[#657373] uppercase font-semibold block">
                        Monto a Cobrar en Postnet
                      </span>
                      <span className="text-xl font-black text-[#009EE3] tracking-tight">
                        {monedaSimbolo} {total.toLocaleString('es-AR')}
                      </span>
                    </div>

                    <Button
                      type="button"
                      onClick={handleEnviarCobroPoint}
                      className="h-9 px-4 text-xs font-bold bg-[#009EE3] hover:bg-[#0082BD] text-white gap-2 cursor-pointer shadow-xs"
                    >
                      <DeviceMobile className="h-4 w-4" weight="bold" />
                      <span>Enviar al Postnet</span>
                    </Button>
                  </div>

                  {mensajePoint && (
                    <p className="text-[11px] text-[#657373] text-center italic">
                      {mensajePoint}
                    </p>
                  )}
                </div>
              )}

              {/* ESTADO 2: CREANDO INTENCIÓN */}
              {estadoPoint === 'creando_intencion' && (
                <div className="py-6 text-center space-y-2 bg-white rounded-xl border border-[#009EE3]/30">
                  <CircleNotch className="h-8 w-8 mx-auto animate-spin text-[#009EE3]" />
                  <p className="text-xs font-bold text-[#1C2424]">Transmitiendo orden al postnet...</p>
                  <p className="text-[11px] text-[#657373]">{mensajePoint}</p>
                </div>
              )}

              {/* ESTADO 3: ESPERANDO TARJETA / PROCESANDO EN POSTNET */}
              {(estadoPoint === 'esperando_tarjeta' || estadoPoint === 'procesando') && (
                <div className="py-3 px-4 rounded-xl bg-white border border-[#009EE3]/40 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#009EE3] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#009EE3]"></span>
                      </span>
                      <span className="text-xs font-bold text-[#1C2424]">
                        {estadoPoint === 'procesando' ? 'Procesando Tarjeta...' : 'Esperando Tarjeta en Postnet'}
                      </span>
                    </div>
                    {intentActivo?.id && (
                      <Badge variant="outline" className="font-mono text-[9px] text-[#657373] border-[#E8E6DF]">
                        ID: {intentActivo.id.slice(0, 14)}...
                      </Badge>
                    )}
                  </div>

                  <div className="text-center py-2.5 px-3 space-y-1 bg-[#009EE3]/5 rounded-xl border border-[#009EE3]/20">
                    <span className="text-[10px] text-[#657373] uppercase font-semibold block">
                      Monto Mostrado en Pantalla del Postnet
                    </span>
                    <div className="text-2xl font-black text-[#009EE3] tracking-tight">
                      {monedaSimbolo} {total.toLocaleString('es-AR')}
                    </div>
                    <p className="text-xs font-semibold text-[#1C2424]">
                      {estadoPoint === 'procesando'
                        ? 'Autorizando transacción con la entidad bancaria...'
                        : 'Pídale al cliente que acerque, inserte o deslice la tarjeta en el postnet'}
                    </p>
                  </div>

                  <div className="flex items-center justify-end pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCancelarCobroPoint}
                      className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 cursor-pointer gap-1"
                    >
                      <XCircle className="h-3.5 w-3.5" weight="bold" />
                      <span>Cancelar cobro en Postnet</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* ESTADO 4: APROBADO / OPERACIÓN COMPLETADA */}
              {estadoPoint === 'aprobado' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-400 text-center space-y-2.5 shadow-xs"
                >
                  <div className="flex h-11 w-11 mx-auto items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                    <CheckCircle className="h-7 w-7" weight="fill" />
                  </div>
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-200 text-emerald-950 mb-1">
                      Operación Completada
                    </span>
                    <h4 className="text-base font-black text-emerald-950">
                      Cobro Aprobado en Postnet
                    </h4>
                    <p className="text-xs text-emerald-800 font-medium mt-0.5">
                      {monedaSimbolo} {total.toLocaleString('es-AR')} acreditado exitosamente en Mercado Pago.
                    </p>
                  </div>

                  {intentActivo?.paymentId && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/90 rounded-md border border-emerald-200 text-[11px] font-mono text-emerald-900 shadow-2xs">
                      <span className="font-bold">Comprobante MP:</span>
                      <span>#{intentActivo.paymentId}</span>
                    </div>
                  )}

                  <p className="text-[11px] text-emerald-700 font-medium">
                    Presione el botón inferior para finalizar la venta y emitir el ticket.
                  </p>
                </motion.div>
              )}

              {/* ESTADO 5: RECHAZADO / ERROR */}
              {estadoPoint === 'rechazado' && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 space-y-2">
                  <div className="flex items-start gap-2 text-red-800">
                    <WarningCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-600" weight="fill" />
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold block">No se completó el cobro en el Postnet</span>
                      <p className="text-[11px] text-red-700 leading-snug">{mensajePoint}</p>
                    </div>
                  </div>
                  <div className="pt-1 flex justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleEnviarCobroPoint}
                      className="h-8 text-xs font-bold bg-red-600 hover:bg-red-700 text-white gap-1.5 cursor-pointer shadow-xs"
                    >
                      <ArrowClockwise className="h-3.5 w-3.5" weight="bold" />
                      <span>Reintentar Cobro</span>
                    </Button>
                  </div>
                </div>
              )}
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
            {metodoSeleccionado === 'mercado_pago' ? (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="inline-block flex-1 sm:flex-initial">
                {estadoPoint === 'aprobado' ? (
                  <Button
                    type="submit"
                    className="w-full text-xs h-10 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-bold cursor-pointer shadow-sm"
                  >
                    <CheckCircle className="h-4 w-4" weight="bold" />
                    <span>Operación Completada • Emitir Ticket ({monedaSimbolo} {total.toLocaleString('es-AR')})</span>
                  </Button>
                ) : estadoPoint === 'esperando_tarjeta' || estadoPoint === 'procesando' || estadoPoint === 'creando_intencion' ? (
                  <Button
                    type="button"
                    disabled
                    className="w-full text-xs h-10 bg-[#009EE3]/80 text-white gap-2 font-bold cursor-wait"
                  >
                    <CircleNotch className="h-4 w-4 animate-spin" />
                    <span>Esperando cobro en Postnet...</span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleEnviarCobroPoint}
                    className="w-full text-xs h-10 bg-[#009EE3] hover:bg-[#0082BD] text-white gap-2 font-bold cursor-pointer shadow-sm"
                  >
                    <DeviceMobile className="h-4 w-4" weight="bold" />
                    <span>Cobrar en Postnet ({monedaSimbolo} {total.toLocaleString('es-AR')})</span>
                  </Button>
                )}
              </motion.div>
            ) : (
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
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
