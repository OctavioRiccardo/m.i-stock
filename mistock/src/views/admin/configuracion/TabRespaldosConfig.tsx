'use client';

import React from 'react';
import { motion } from 'motion/react';
import {
  ArrowCounterClockwise,
  Package,
  FileCsv,
  Warning,
  HardDrive,
  CurrencyDollar,
} from '@phosphor-icons/react';
import { useAdminConfiguracionController } from '@/controllers/adminControllers/configuracionController';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface TabRespaldosConfigProps {
  controller: ReturnType<typeof useAdminConfiguracionController>;
  onAbrirModalRestablecer: () => void;
}

export function TabRespaldosConfig({
  controller,
  onAbrirModalRestablecer,
}: TabRespaldosConfigProps) {
  const { estadisticasSistema, exportarCatalogoCSV, exportarVentasCSV } = controller;
  const setModalRestablecerAbierto = (open: boolean) => {
    if (open) onAbrirModalRestablecer();
  };

  return (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* Monitor de Salud de la Infraestructura Supabase con Conteos Reales */}
            <Card className="border-[#E8E6DF] shadow-sm">
              <CardHeader className="pb-3 border-b border-[#E8E6DF]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-[#2A7A78]" weight="duotone" />
                    <CardTitle className="text-sm font-bold text-[#1C2424]">
                      Monitor de Conexión e Infraestructura
                    </CardTitle>
                  </div>
                  <Badge variant="success" className="text-xs gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Base de Datos Activa
                  </Badge>
                </div>
                <p className="text-xs text-[#657373]">
                  Resumen de registros almacenados en el sistema y estado del último respaldo descargado.
                </p>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-[#F8F7F2] border border-[#E8E6DF]">
                    <span className="text-[11px] font-semibold text-[#657373] uppercase tracking-wider">
                      Última Exportación CSV
                    </span>
                    <p className="text-sm font-bold text-[#1C2424] mt-1">
                      {estadisticasSistema.ultimoRespaldoCSV || 'Sin exportaciones recientes'}
                    </p>
                    <p className="text-[11px] text-[#657373] mt-0.5">
                      Respaldo manual descargado
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#F8F7F2] border border-[#E8E6DF]">
                    <span className="text-[11px] font-semibold text-[#657373] uppercase tracking-wider">
                      Volumen de Registros
                    </span>
                    <p className="text-sm font-bold text-[#1C2424] mt-1">
                      {estadisticasSistema.totalRegistros} registros
                    </p>
                    <p className="text-[11px] text-[#657373] mt-0.5">
                      {estadisticasSistema.totalProductos} prod. • {estadisticasSistema.totalCategorias} cat. • {estadisticasSistema.totalVentas} ventas
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Descargas y Respaldos en CSV */}
            <Card className="border-[#E8E6DF] shadow-sm">
              <CardHeader className="pb-3 border-b border-[#E8E6DF]">
                <div className="flex items-center gap-2">
                  <FileCsv className="h-4 w-4 text-[#2A7A78]" weight="duotone" />
                  <CardTitle className="text-sm font-bold text-[#1C2424]">
                    Exportación de Datos y Respaldos Manuales
                  </CardTitle>
                </div>
                <p className="text-xs text-[#657373]">
                  Descarga planillas en formato CSV compatible con Microsoft Excel, Google Sheets y sistemas contables.
                </p>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Exportación 1: Catálogo */}
                  <div className="p-4 rounded-xl border border-[#E8E6DF] bg-white hover:border-[#2A7A78] transition-colors flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E2F1F0] text-[#2A7A78]">
                          <Package className="h-5 w-5" weight="duotone" />
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {estadisticasSistema.totalProductos} artículos • UTF-8 .CSV
                        </Badge>
                      </div>
                      <p className="font-bold text-xs text-[#1C2424] mt-3">
                        Catálogo Completo de Productos
                      </p>
                      <p className="text-xs text-[#657373] mt-1 leading-relaxed">
                        Exporta el listado completo con códigos SKU, descripciones, categorías, precios de compra y venta, y stock físico en tiempo real.
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#E8E6DF]">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={exportarCatalogoCSV}
                        className="w-full text-xs border-[#2A7A78] text-[#2A7A78] hover:bg-[#E2F1F0] gap-1.5 cursor-pointer"
                      >
                        <FileCsv className="h-3.5 w-3.5" />
                        <span>Descargar Catálogo CSV</span>
                      </Button>
                    </div>
                  </div>

                  {/* Exportación 2: Historial de Ventas */}
                  <div className="p-4 rounded-xl border border-[#E8E6DF] bg-white hover:border-[#2A7A78] transition-colors flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
                          <CurrencyDollar className="h-5 w-5" weight="duotone" />
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {estadisticasSistema.totalVentas} ventas • UTF-8 .CSV
                        </Badge>
                      </div>
                      <p className="font-bold text-xs text-[#1C2424] mt-3">
                        Registro Histórico de Ventas
                      </p>
                      <p className="text-xs text-[#657373] mt-1 leading-relaxed">
                        Descarga el arqueo contable con número de ticket, fecha y hora, vendedor interviniente, método de cobro utilizado y total facturado.
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#E8E6DF]">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={exportarVentasCSV}
                        className="w-full text-xs border-emerald-600 text-emerald-800 hover:bg-emerald-50 gap-1.5 cursor-pointer"
                      >
                        <FileCsv className="h-3.5 w-3.5" />
                        <span>Descargar Ventas CSV</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Zona de Mantenimiento y Restablecimiento */}
            <Card className="border-red-200 bg-red-50/20 shadow-sm">
              <CardHeader className="pb-3 border-b border-red-100">
                <div className="flex items-center gap-2">
                  <Warning className="h-4 w-4 text-red-600" weight="duotone" />
                  <CardTitle className="text-sm font-bold text-red-900">
                    Zona de Mantenimiento del Sistema
                  </CardTitle>
                </div>
                <p className="text-xs text-red-700">
                  Acciones sobre los parámetros de configuración local del comercio.
                </p>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-[#1C2424]">
                      Restablecer Parámetros de Fábrica
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Restablece los datos del comercio, medios de pago, períodos base y umbrales a los valores predeterminados.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setModalRestablecerAbierto(true)}
                    className="border-red-300 text-red-700 hover:bg-red-50 text-xs gap-1.5 cursor-pointer self-start sm:self-auto"
                  >
                    <ArrowCounterClockwise className="h-3.5 w-3.5" />
                    <span>Restablecer Fábrica</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
  );
}
