'use client';

/**
 * ====================================================================
 * SUB-VISTA POS: MONITOR DE REPOSICIÓN EN SALÓN (ModuloMonitorReposicion)
 * ====================================================================
 * 
 * Propósito:
 * Pantalla operativa de piso orientada al vendedor / repositor de salón:
 * 1. Monitoreo ágil de artículos agotados (stock 0) y góndolas con stock crítico (<= stock mínimo).
 * 2. Filtrado por pasillo/categoría (Almacén, Bebidas, Limpieza) para recorridas de salón eficientes.
 * 3. Botón de acción para "Solicitar a Depósito" con trazabilidad de estado en tiempo real.
 * 4. Protege la confidencialidad comercial: CERO costos mayoristas, márgenes ni datos de proveedores.
 */

import React from 'react';
import {
  ListChecks,
  WarningCircle,
  CheckCircle,
  Package,
  Funnel,
  ArrowsClockwise,
  PaperPlaneTilt,
  Check,
  X,
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { useUserDashboardController } from '@/controllers/userControllers/userDashboardController';

interface ModuloMonitorReposicionProps {
  controller: ReturnType<typeof useUserDashboardController>;
}

export function ModuloMonitorReposicion({ controller }: ModuloMonitorReposicionProps) {
  const {
    data,
    categorias,
    filtroCategoriaReposicion,
    setFiltroCategoriaReposicion,
    filtroEstadoReposicion,
    setFiltroEstadoReposicion,
    solicitudesReposicion,
    solicitarReposicion,
    cancelarSolicitudReposicion,
    productosAgotados,
    productosStockBajo,
    productosParaReponer,
  } = controller;

  const cantidadSolicitados = Object.keys(solicitudesReposicion).length;

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* ==================================================================== */}
      {/* TARJETAS RESUMEN DE ESTADO DE GÓNDOLAS Y SALÓN                       */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Agotados */}
        <Card className="border-red-200 bg-red-50/40 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white shadow-xs">
              <WarningCircle className="h-5 w-5" weight="fill" />
            </div>
            <div>
              <span className="text-[10px] text-red-700 uppercase font-bold block">
                Artículos Agotados en Salón
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-red-900">
                  {productosAgotados.length}
                </span>
                <span className="text-[11px] text-red-700">requieren reposición inmediata</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stock Crítico */}
        <Card className="border-amber-200 bg-amber-50/40 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
              <WarningCircle className="h-5 w-5" weight="duotone" />
            </div>
            <div>
              <span className="text-[10px] text-amber-800 uppercase font-bold block">
                Góndolas con Stock Crítico
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-amber-900">
                  {productosStockBajo.length}
                </span>
                <span className="text-[11px] text-amber-800">por debajo del umbral mínimo</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Solicitados a Depósito */}
        <Card className="border-[#2A7A78]/30 bg-[#E2F1F0]/40 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2A7A78] text-white shadow-xs">
              <PaperPlaneTilt className="h-5 w-5" weight="duotone" />
            </div>
            <div>
              <span className="text-[10px] text-[#205E5D] uppercase font-bold block">
                Solicitados a Depósito
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-[#1C2424]">
                  {cantidadSolicitados}
                </span>
                <span className="text-[11px] text-[#657373]">pedidos de traslado activos</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ==================================================================== */}
      {/* BANDEJA DE GESTIÓN Y LISTADO DE FALTANTES                            */}
      {/* ==================================================================== */}
      <Card className="border-[#E8E6DF] shadow-xs bg-white">
        <CardHeader className="pb-3 border-b border-[#E8E6DF] bg-[#F8F7F2]/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-[#2A7A78]" weight="duotone" />
              <div>
                <CardTitle className="text-sm font-bold text-[#1C2424]">
                  Planilla de Faltantes y Reposición en Salón
                </CardTitle>
                <p className="text-[11px] text-[#657373]">
                  Detecte qué productos deben traerse del almacén para rellenar estanterías y exhibidores.
                </p>
              </div>
            </div>

            <Badge variant="outline" className="border-[#2A7A78]/30 bg-white text-[#2A7A78] font-semibold text-xs self-start sm:self-auto">
              {productosParaReponer.length} artículos a reponer
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {/* Barra de Filtros: Categoría / Pasillo y Estado de Criticidad */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Píldoras de Estado */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setFiltroEstadoReposicion('todos')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
                  filtroEstadoReposicion === 'todos'
                    ? 'bg-[#2A7A78] text-white shadow-xs font-semibold'
                    : 'bg-[#F8F7F2] text-[#657373] hover:text-[#1C2424] hover:bg-[#E8E6DF] border border-[#E8E6DF]'
                }`}
              >
                <span>Todos los faltantes</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${
                  filtroEstadoReposicion === 'todos' ? 'bg-white/20 text-white' : 'bg-[#E8E6DF] text-[#657373]'
                }`}>
                  {productosAgotados.length + productosStockBajo.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFiltroEstadoReposicion('agotados')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
                  filtroEstadoReposicion === 'agotados'
                    ? 'bg-red-600 text-white shadow-xs font-semibold'
                    : 'bg-[#F8F7F2] text-[#657373] hover:text-red-700 hover:bg-red-50 border border-[#E8E6DF]'
                }`}
              >
                <span>Solo Agotados (0 un.)</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${
                  filtroEstadoReposicion === 'agotados' ? 'bg-white/20 text-white' : 'bg-[#E8E6DF] text-[#657373]'
                }`}>
                  {productosAgotados.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFiltroEstadoReposicion('criticos')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
                  filtroEstadoReposicion === 'criticos'
                    ? 'bg-amber-600 text-white shadow-xs font-semibold'
                    : 'bg-[#F8F7F2] text-[#657373] hover:text-amber-800 hover:bg-amber-50 border border-[#E8E6DF]'
                }`}
              >
                <span>Solo Stock Crítico</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${
                  filtroEstadoReposicion === 'criticos' ? 'bg-white/20 text-white' : 'bg-[#E8E6DF] text-[#657373]'
                }`}>
                  {productosStockBajo.length}
                </span>
              </button>
            </div>

            {/* Selector Desplegable de Categoría / Pasillo */}
            <div className="w-full sm:w-60 shrink-0">
              <Select
                value={filtroCategoriaReposicion}
                onValueChange={(val) => setFiltroCategoriaReposicion(val)}
              >
                <SelectTrigger className="h-9 text-xs bg-white border-[#E8E6DF] focus:ring-[#2A7A78] cursor-pointer">
                  <div className="flex items-center gap-1.5 truncate">
                    <Funnel className="h-3.5 w-3.5 text-[#2A7A78] shrink-0" weight="duotone" />
                    <SelectValue placeholder="Todas las categorías" />
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="todas">
                    Todas las categorías / pasillos
                  </SelectItem>
                  {categorias.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabla de Artículos a Reponer */}
          {productosParaReponer.length === 0 ? (
            <div className="py-14 px-4 text-center border border-dashed border-[#E8E6DF] rounded-xl space-y-2">
              <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                <CheckCircle className="h-6 w-6" weight="fill" />
              </div>
              <p className="text-xs font-bold text-[#1C2424]">
                ¡Góndolas con stock óptimo!
              </p>
              <p className="text-[11px] text-[#657373] max-w-sm mx-auto">
                No hay faltantes registrados para el filtro seleccionado. Todas las estanterías de esta sección tienen existencias disponibles.
              </p>
              {(filtroCategoriaReposicion !== 'todas' || filtroEstadoReposicion !== 'todos') && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setFiltroCategoriaReposicion('todas');
                    setFiltroEstadoReposicion('todos');
                  }}
                  className="text-xs h-7 text-[#2A7A78] hover:underline cursor-pointer mt-1"
                >
                  Ver todos los pasillos
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-[#E8E6DF] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F8F7F2]/60">
                    <TableHead className="text-xs">Código</TableHead>
                    <TableHead className="text-xs">Artículo</TableHead>
                    <TableHead className="text-xs">Pasillo / Categoría</TableHead>
                    <TableHead className="text-xs text-center">Nivel Salón</TableHead>
                    <TableHead className="text-xs text-center">Umbral Mínimo</TableHead>
                    <TableHead className="text-xs text-center">Urgencia</TableHead>
                    <TableHead className="text-xs text-right">Solicitud a Depósito</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productosParaReponer.map((prod) => {
                    const estaSolicitado = !!solicitudesReposicion[prod.id];
                    const esAgotado = prod.stock === 0;

                    return (
                      <TableRow
                        key={prod.id}
                        className={`hover:bg-[#F8F7F2]/50 ${
                          estaSolicitado ? 'bg-[#E2F1F0]/20' : esAgotado ? 'bg-red-50/20' : ''
                        }`}
                      >
                        <TableCell className="py-2.5 text-xs font-mono text-[#657373]">
                          {prod.codigo}
                        </TableCell>

                        <TableCell className="py-2.5">
                          <span className="text-xs font-bold text-[#1C2424] block">
                            {prod.nombre}
                          </span>
                          {prod.descripcion && (
                            <span className="text-[10px] text-[#A0A8A8] block truncate max-w-xs">
                              {prod.descripcion}
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="py-2.5">
                          <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0 border-[#E8E6DF] text-[#657373]">
                            {prod.categoria}
                          </Badge>
                        </TableCell>

                        <TableCell className="py-2.5 text-center">
                          <span
                            className={`text-xs font-black ${
                              esAgotado ? 'text-red-600' : 'text-amber-600'
                            }`}
                          >
                            {prod.stock} un.
                          </span>
                        </TableCell>

                        <TableCell className="py-2.5 text-center text-xs text-[#657373] font-semibold">
                          {prod.stockMinimo ?? 5} un.
                        </TableCell>

                        <TableCell className="py-2.5 text-center">
                          {esAgotado ? (
                            <Badge
                              variant="destructive"
                              className="text-[9px] uppercase px-1.5 py-0 font-bold gap-1 inline-flex items-center"
                            >
                              <WarningCircle className="h-3 w-3" weight="fill" />
                              <span>Agotado</span>
                            </Badge>
                          ) : (
                            <Badge
                              variant="warning"
                              className="text-[9px] uppercase px-1.5 py-0 font-bold gap-1 inline-flex items-center"
                            >
                              <WarningCircle className="h-3 w-3" weight="duotone" />
                              <span>Crítico</span>
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="py-2.5 text-right">
                          {estaSolicitado ? (
                            <div className="inline-flex items-center gap-1.5">
                              <Badge
                                variant="outline"
                                className="text-[10px] px-2 py-0.5 border-[#2A7A78] text-[#2A7A78] bg-[#E2F1F0] font-bold gap-1"
                              >
                                <Check className="h-3 w-3" weight="bold" />
                                <span>Solicitado</span>
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => cancelarSolicitudReposicion(prod.id)}
                                className="h-7 w-7 p-0 text-[#657373] hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                title="Cancelar pedido"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => solicitarReposicion(prod.id)}
                              className="h-7 px-2.5 text-xs border-[#E8E6DF] hover:border-[#2A7A78] hover:bg-[#E2F1F0] text-[#2A7A78] hover:text-[#205E5D] font-semibold gap-1.5 cursor-pointer shadow-2xs"
                            >
                              <PaperPlaneTilt className="h-3 w-3" weight="bold" />
                              <span>Pedir a Depósito</span>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
