'use client';

/**
 * ====================================================================
 * VISTA: CONFIGURACIÓN GENERAL DEL SISTEMA (Patrón MVC - View)
 * ====================================================================
 *
 * Propósito:
 * Orquestar la consola centralizada de configuración con guardado reactivo
 * automático delegando cada pestaña a un subcomponente cohesivo en
 * `src/views/admin/configuracion/`.
 */

import React, { useState } from 'react';
import { MotionConfig } from 'motion/react';
import {
  Storefront,
  CreditCard,
  SlidersHorizontal,
  Database,
  ArrowCounterClockwise,
  Check,
  WarningCircle,
  Warning,
  CheckCircle,
  ChartLineUp,
} from '@phosphor-icons/react';
import {
  useAdminConfiguracionController,
  PestañaConfiguracion,
} from '@/controllers/adminControllers/configuracionController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { TabNegocioConfig } from './configuracion/TabNegocioConfig';
import { TabPosConfig } from './configuracion/TabPosConfig';
import { TabInventarioYMetricasConfig } from './configuracion/TabInventarioYMetricasConfig';
import { TabRespaldosConfig } from './configuracion/TabRespaldosConfig';

interface AdminConfiguracionViewProps {
  controller: ReturnType<typeof useAdminConfiguracionController>;
}

export function AdminConfiguracionView({ controller }: AdminConfiguracionViewProps) {
  const {
    pestañaActiva,
    setPestañaActiva,
    mensajeExito,
    mensajeError,
    restablecerPorDefecto,
    limpiarMensajes,
  } = controller;

  const [modalRestablecerAbierto, setModalRestablecerAbierto] = useState<boolean>(false);
  const [campoEditandoVacio, setCampoEditandoVacio] = useState<string | null>(null);

  const pestañas: Array<{
    id: PestañaConfiguracion;
    etiqueta: string;
    icono: React.ElementType;
    descripcion: string;
  }> = [
    {
      id: 'negocio',
      etiqueta: 'Negocio & Ticket',
      icono: Storefront,
      descripcion: 'Datos comerciales, fiscales y encabezado de comprobantes.',
    },
    {
      id: 'pos',
      etiqueta: 'Caja & Métodos de Pago',
      icono: CreditCard,
      descripcion: 'Medios de cobro habilitados, control de stock en caja y periféricos.',
    },
    {
      id: 'inventario',
      etiqueta: 'Reglas de Inventario',
      icono: SlidersHorizontal,
      descripcion: 'Umbrales mínimos de seguridad y control estricto de catálogo.',
    },
    {
      id: 'metricas',
      etiqueta: 'Métricas & Períodos',
      icono: ChartLineUp,
      descripcion: 'Período base de análisis, corte de ciclo e indicadores de rendimiento.',
    },
    {
      id: 'respaldos',
      etiqueta: 'Respaldos & Base de Datos',
      icono: Database,
      descripcion: 'Estado de la base de datos, descargas en CSV y restablecimiento.',
    },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div className="space-y-6 pb-20">
        {/* Cabecera Principal con Indicador de Guardado Automático */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E6DF] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#1C2424]">
                Configuración del Sistema
              </h1>
              <Badge
                variant="outline"
                className="text-[#2A7A78] border-[#2A7A78] bg-[#E2F1F0]/50 text-xs"
              >
                Admin
              </Badge>
            </div>
            <p className="text-sm text-[#657373] mt-1">
              Personaliza la identidad del negocio, reglas de venta en caja, períodos analíticos y
              respaldos.
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E2F1F0]/60 border border-[#2A7A78]/25 text-xs font-medium text-[#2A7A78] self-start sm:self-auto">
            <CheckCircle className="h-4 w-4 shrink-0" weight="duotone" />
            <span>Guardado automático en tiempo real</span>
          </div>
        </div>

        {/* Notificaciones de Estado */}
        {mensajeExito && (
          <Alert variant="success" className="cursor-pointer shadow-sm" onClick={limpiarMensajes}>
            <Check className="h-4 w-4" weight="bold" />
            <AlertTitle>Operación Completada</AlertTitle>
            <AlertDescription>{mensajeExito}</AlertDescription>
          </Alert>
        )}

        {mensajeError && (
          <Alert
            variant="destructive"
            className="cursor-pointer shadow-sm"
            onClick={limpiarMensajes}
          >
            <WarningCircle className="h-4 w-4" weight="duotone" />
            <AlertTitle>Atención</AlertTitle>
            <AlertDescription>{mensajeError}</AlertDescription>
          </Alert>
        )}

        {/* Navegación por Pestañas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 p-1.5 bg-[#F8F7F2] rounded-xl border border-[#E8E6DF]">
          {pestañas.map((p) => {
            const Icono = p.icono;
            const esActiva = pestañaActiva === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  limpiarMensajes();
                  setPestañaActiva(p.id);
                }}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                  esActiva
                    ? 'bg-white text-[#1C2424] font-semibold shadow-xs border border-[#E8E6DF]'
                    : 'text-[#657373] hover:text-[#1C2424] hover:bg-white/60'
                }`}
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-md ${
                    esActiva ? 'bg-[#E2F1F0] text-[#2A7A78]' : 'bg-[#E8E6DF]/60 text-[#657373]'
                  }`}
                >
                  <Icono className="h-4 w-4" weight={esActiva ? 'duotone' : 'regular'} />
                </div>
                <div className="truncate">
                  <p className="truncate leading-snug">{p.etiqueta}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Pestañas modulares */}
        {pestañaActiva === 'negocio' && (
          <TabNegocioConfig
            controller={controller}
            campoEditandoVacio={campoEditandoVacio}
            setCampoEditandoVacio={setCampoEditandoVacio}
          />
        )}

        {pestañaActiva === 'pos' && (
          <TabPosConfig
            controller={controller}
            campoEditandoVacio={campoEditandoVacio}
            setCampoEditandoVacio={setCampoEditandoVacio}
          />
        )}

        {(pestañaActiva === 'inventario' || pestañaActiva === 'metricas') && (
          <TabInventarioYMetricasConfig
            controller={controller}
            campoEditandoVacio={campoEditandoVacio}
            setCampoEditandoVacio={setCampoEditandoVacio}
          />
        )}

        {pestañaActiva === 'respaldos' && (
          <TabRespaldosConfig
            controller={controller}
            onAbrirModalRestablecer={() => setModalRestablecerAbierto(true)}
          />
        )}

        {/* Modal de Confirmación para Restablecer Fábrica */}
        <Dialog open={modalRestablecerAbierto} onOpenChange={setModalRestablecerAbierto}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2 text-amber-700 mb-1">
                <Warning className="h-5 w-5" weight="duotone" />
                <DialogTitle>¿Restablecer Valores de Fábrica?</DialogTitle>
              </div>
              <DialogDescription className="text-xs text-[#657373] pt-1">
                Esta acción restablecerá los datos comerciales, opciones de tickets térmicos, medios
                de pago y reglas de inventario a su estado predeterminado.
                <br />
                <br />
                <strong className="text-foreground">
                  Los productos y las ventas registradas en el sistema no se eliminarán.
                </strong>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalRestablecerAbierto(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  restablecerPorDefecto();
                  setModalRestablecerAbierto(false);
                }}
                className="text-xs gap-1.5"
              >
                <ArrowCounterClockwise className="h-3.5 w-3.5" />
                <span>Sí, Restablecer</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MotionConfig>
  );
}
