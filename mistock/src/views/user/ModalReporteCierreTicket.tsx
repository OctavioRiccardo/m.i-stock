'use client';

/**
 * ====================================================================
 * COMPONENTE: REPORTE DE CIERRE DE CAJA (Z) - TICKET TÉRMICO DE 80MM
 * ====================================================================
 * 
 * Propósito:
 * Visor y generador de impresión térmica oficial para el Comprobante
 * de Cierre de Caja / Arqueo de Turno (Reporte Z) del mostrador.
 * Respeta el formato estándar de ticket de 80mm para impresoras térmicas ESC/POS.
 */

import React from 'react';
import {
  Receipt,
  Printer,
  CheckCircle,
  WarningCircle,
  Clock,
  User,
  Storefront,
  Vault,
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
import { ArqueoCajaDTO } from '@/models/modelos_vista/cierreCajaModel';
import { useConfiguracionData } from '@/services/configuracionService';

interface ModalReporteCierreTicketProps {
  isOpen: boolean;
  onClose: () => void;
  cierre: ArqueoCajaDTO | null;
  monedaSimbolo: string;
}

export function ModalReporteCierreTicket({
  isOpen,
  onClose,
  cierre,
  monedaSimbolo,
}: ModalReporteCierreTicketProps) {
  const configGlobal = useConfiguracionData();
  const configNegocio = configGlobal.negocio;

  if (!cierre) return null;

  const handleImprimir = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const esExacto = cierre.estadoBalance === 'exacto';
  const esSobrante = cierre.estadoBalance === 'sobrante';
  const esFaltante = cierre.estadoBalance === 'faltante';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* Estilos dedicados para impresión en impresoras térmicas de 80mm */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * {
                visibility: hidden !important;
              }
              #ticket-cierre-impresion,
              #ticket-cierre-impresion * {
                visibility: visible !important;
              }
              #ticket-cierre-impresion {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 80mm !important;
                max-width: 80mm !important;
                margin: 0 !important;
                padding: 6mm 5mm !important;
                border: none !important;
                box-shadow: none !important;
                background: white !important;
                color: black !important;
                font-family: monospace !important;
                font-size: 11px !important;
                line-height: 1.35 !important;
              }
            }
          `,
        }}
      />

      <DialogContent className="max-w-md p-6 border-[#E8E6DF] shadow-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="pb-2 border-b border-[#E8E6DF]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E2F1F0] text-[#2A7A78]">
                <Receipt className="h-5 w-5" weight="duotone" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-[#1C2424]">
                  Comprobante de Cierre (Z)
                </DialogTitle>
                <DialogDescription className="text-xs text-[#657373]">
                  {cierre.idCierre}
                </DialogDescription>
              </div>
            </div>

            <Badge
              variant="outline"
              className={`text-[10px] font-bold uppercase px-2 py-0.5 ${
                esExacto
                  ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                  : esSobrante
                  ? 'border-sky-300 text-sky-700 bg-sky-50'
                  : 'border-rose-300 text-rose-700 bg-rose-50'
              }`}
            >
              {esExacto ? 'Caja Cuadrada' : esSobrante ? 'Sobrante' : 'Faltante'}
            </Badge>
          </div>
        </DialogHeader>

        {/* ==================================================================== */}
        {/* TICKET TÉRMICO DE 80MM (SIMULACIÓN VISUAL E IMPRESIÓN OFICIAL)       */}
        {/* ==================================================================== */}
        <div
          id="ticket-cierre-impresion"
          className="bg-white border border-[#E8E6DF] rounded-lg p-5 font-mono text-xs text-[#1C2424] space-y-3 shadow-inner my-2"
        >
          {/* Encabezado del Comercio */}
          <div className="text-center space-y-0.5 pb-2 border-b border-dashed border-gray-300">
            <p className="font-bold text-sm tracking-wider uppercase text-black">
              {configNegocio.nombreComercial || 'M.I STOCK'}
            </p>
            <p className="text-[10px] text-gray-600">{configNegocio.razonSocial}</p>
            <p className="text-[10px] text-gray-600">CUIT: {configNegocio.cuit}</p>
            <p className="text-[10px] text-gray-600">{configNegocio.direccion}</p>
            <p className="text-[10px] text-gray-600">Tel: {configNegocio.telefono}</p>
            <p className="text-[9px] uppercase tracking-wide text-gray-500 pt-0.5">
              IVA: {configNegocio.condicionIva.replace('_', ' ')}
            </p>
          </div>

          {/* Título Oficial del Documento */}
          <div className="text-center py-1 border-b border-dashed border-gray-300 space-y-0.5">
            <p className="font-bold text-xs uppercase tracking-widest text-black">
              *** CIERRE DE CAJA (REPORTE Z) ***
            </p>
            <p className="text-[10px] font-semibold text-gray-600">
              AUDITORÍA Y ARQUEO DIARIO
            </p>
          </div>

          {/* Metadatos de la Sesión */}
          <div className="text-[11px] space-y-1 pb-2 border-b border-dashed border-gray-300">
            <div className="flex justify-between">
              <span className="text-gray-600">N° Comprobante:</span>
              <span className="font-bold">{cierre.idCierre}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fecha Cierre:</span>
              <span>{cierre.fechaCierre}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cajero / Operador:</span>
              <span className="font-bold">{cierre.cajero}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tickets Emitidos:</span>
              <span className="font-bold">{cierre.cantidadTickets} comprobantes</span>
            </div>
          </div>

          {/* Desglose por Medio de Cobro */}
          <div className="space-y-1 pb-2 border-b border-dashed border-gray-300">
            <p className="font-bold text-[10px] uppercase text-gray-500 tracking-wider">
              1. RECAUDACIÓN POR CANAL DE PAGO
            </p>
            <div className="flex justify-between text-[11px]">
              <span>Efectivo en Ventas:</span>
              <span className="font-semibold">
                {monedaSimbolo} {cierre.desgloseMedios.efectivo.toLocaleString('es-AR')}
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Mercado Pago QR:</span>
              <span className="font-semibold">
                {monedaSimbolo} {cierre.desgloseMedios.mercadoPago.toLocaleString('es-AR')}
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Tarjetas de Débito:</span>
              <span className="font-semibold">
                {monedaSimbolo} {cierre.desgloseMedios.tarjetaDebito.toLocaleString('es-AR')}
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Tarjetas de Crédito:</span>
              <span className="font-semibold">
                {monedaSimbolo} {cierre.desgloseMedios.tarjetaCredito.toLocaleString('es-AR')}
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Transferencias Bancarias:</span>
              <span className="font-semibold">
                {monedaSimbolo} {cierre.desgloseMedios.transferencia.toLocaleString('es-AR')}
              </span>
            </div>
            <div className="flex justify-between text-xs pt-1 border-t border-gray-200 font-bold">
              <span>TOTAL VENTAS FACTURADAS:</span>
              <span>
                {monedaSimbolo} {cierre.granTotalRecaudado.toLocaleString('es-AR')}
              </span>
            </div>
          </div>

          {/* Conciliación y Arqueo de Efectivo Físico */}
          <div className="space-y-1 pb-2 border-b border-dashed border-gray-300">
            <p className="font-bold text-[10px] uppercase text-gray-500 tracking-wider">
              2. ARQUEO DE EFECTIVO EN GAVETA
            </p>
            <div className="flex justify-between text-[11px]">
              <span>Fondo Inicial (Gaveta):</span>
              <span>
                {monedaSimbolo} {cierre.fondoInicial.toLocaleString('es-AR')}
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>(+) Efectivo Cobrado:</span>
              <span>
                {monedaSimbolo} {cierre.totalVentasEfectivo.toLocaleString('es-AR')}
              </span>
            </div>
            <div className="flex justify-between text-[11px] font-semibold border-t border-gray-200 pt-0.5">
              <span>(=) Efectivo Esperado:</span>
              <span>
                {monedaSimbolo} {cierre.efectivoEsperado.toLocaleString('es-AR')}
              </span>
            </div>
            <div className="flex justify-between text-xs font-bold pt-0.5">
              <span>Efectivo Real Contado:</span>
              <span>
                {monedaSimbolo} {cierre.efectivoReal.toLocaleString('es-AR')}
              </span>
            </div>

            <div
              className={`flex justify-between text-xs font-bold pt-1.5 border-t border-dashed ${
                esExacto
                  ? 'text-emerald-700'
                  : esSobrante
                  ? 'text-sky-700'
                  : 'text-rose-700'
              }`}
            >
              <span>DIFERENCIA DE CAJA:</span>
              <span>
                {cierre.diferencia > 0 ? '+' : ''}
                {monedaSimbolo} {cierre.diferencia.toLocaleString('es-AR')}{' '}
                ({esExacto ? 'EXACTO' : esSobrante ? 'SOBRANTE' : 'FALTANTE'})
              </span>
            </div>
          </div>

          {/* Observaciones (si las hubo) */}
          {cierre.observaciones && (
            <div className="text-[10px] text-gray-700 pb-2 border-b border-dashed border-gray-300 space-y-0.5">
              <span className="font-bold uppercase text-gray-500 block">Observaciones:</span>
              <p className="italic">{cierre.observaciones}</p>
            </div>
          )}

          {/* Espacio para Firmas */}
          <div className="pt-4 pb-2 space-y-6 text-center text-[10px] text-gray-600">
            <div>
              <div className="w-3/4 mx-auto border-t border-gray-400 mb-1" />
              <span>Firma y Aclaración del Cajero</span>
            </div>
            <div>
              <div className="w-3/4 mx-auto border-t border-gray-400 mb-1" />
              <span>Firma y Conforme del Administrador</span>
            </div>
          </div>

          {/* Pie de Documento */}
          <div className="text-center text-[9px] text-gray-500 pt-1 border-t border-dashed border-gray-300">
            <p>COMPROBANTE INTERNO DE CONTROL DE CAJA</p>
            <p>M.I Stock Sistema de Gestión Comercial</p>
          </div>
        </div>

        {/* Acciones del Modal */}
        <DialogFooter className="pt-2 border-t border-[#E8E6DF] flex flex-col sm:flex-row items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto text-xs"
          >
            Cerrar
          </Button>

          <Button
            type="button"
            onClick={handleImprimir}
            className="w-full sm:w-auto text-xs bg-[#2A7A78] hover:bg-[#205E5C] text-white gap-2 font-bold cursor-pointer"
          >
            <Printer className="h-4 w-4" weight="bold" />
            <span>Imprimir Ticket Térmico (80mm)</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
