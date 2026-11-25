'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import {
  ChartBar,
  CaretLeft,
  CaretRight,
} from '@phosphor-icons/react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { useAdminDashboardController } from '@/controllers/adminControllers/dashboardController';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

const rotacionMasVendidosChartConfig = {
  Facturación: {
    label: 'Facturación',
    color: '#2A7A78',
  },
} satisfies ChartConfig;

const rotacionMenosVendidosChartConfig = {
  Facturación: {
    label: 'Facturación',
    color: '#F59E0B',
  },
} satisfies ChartConfig;

interface SeccionRotacionDashboardProps {
  controller: ReturnType<typeof useAdminDashboardController>;
}

export function SeccionRotacionDashboard({ controller }: SeccionRotacionDashboardProps) {
  const {
    data,
    etiquetaPeriodoActivo,
    monedaSimbolo,
    rotacionTab,
    cambiarTabRotacion,
    categoriaRotacion,
    cambiarCategoriaRotacion,
    paginaRotacion,
    setPaginaRotacion,
    itemsPorPaginaRotacion,
  } = controller;

  const [masVendidosTableBodyRef] = useAutoAnimate<HTMLTableSectionElement>({
    duration: 220,
    easing: 'ease-out',
  });
  const [menosVendidosTableBodyRef] = useAutoAnimate<HTMLTableSectionElement>({
    duration: 220,
    easing: 'ease-out',
  });

  const categoriasDisponibles = React.useMemo(() => {
    const cats = new Set<string>();
    data.productosMasVendidos.forEach((p) => cats.add(p.categoria));
    data.productosMenosVendidos.forEach((p) => cats.add(p.categoria));
    return ['Todas', ...Array.from(cats).sort()];
  }, [data.productosMasVendidos, data.productosMenosVendidos]);

  const listaBaseRotacion =
    rotacionTab === 'mas_vendidos'
      ? data.productosMasVendidos
      : data.productosMenosVendidos;

  const listaFiltradaRotacion = React.useMemo(() => {
    if (categoriaRotacion === 'Todas') {
      return listaBaseRotacion;
    }
    return listaBaseRotacion.filter(
      (p) => p.categoria.toLowerCase() === categoriaRotacion.toLowerCase()
    );
  }, [listaBaseRotacion, categoriaRotacion]);

  const totalRotacion = listaFiltradaRotacion.length;
  const totalPaginasRotacion = Math.ceil(totalRotacion / itemsPorPaginaRotacion) || 1;
  const inicioRotacion = (paginaRotacion - 1) * itemsPorPaginaRotacion;
  const productosRotacionPaginados = listaFiltradaRotacion.slice(
    inicioRotacion,
    inicioRotacion + itemsPorPaginaRotacion
  );

  const productosGraficoRotacion = React.useMemo(
    () => listaFiltradaRotacion.slice(0, 5),
    [listaFiltradaRotacion]
  );

  const totalFacturadoFiltrado = React.useMemo(
    () => listaFiltradaRotacion.reduce((acc, p) => acc + p.montoTotal, 0),
    [listaFiltradaRotacion]
  );

  const totalUnidadesFiltradas = React.useMemo(
    () => listaFiltradaRotacion.reduce((acc, p) => acc + p.unidadesVendidas, 0),
    [listaFiltradaRotacion]
  );

  const totalCapitalInmovilizadoFiltrado = React.useMemo(
    () => listaFiltradaRotacion.reduce((acc, p) => acc + p.stockActual * p.precioCosto, 0),
    [listaFiltradaRotacion]
  );

  return (
        <Card className="border-[#E8E6DF] shadow-xs bg-white overflow-hidden">
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between pb-4 gap-3 border-b border-[#E8E6DF]">
            <div>
              <div className="flex items-center gap-2">
                <ChartBar className="h-5 w-5 text-[#2A7A78]" weight="duotone" />
                <CardTitle className="text-base font-bold text-[#1C2424]">
                  Rotación de Productos y Salud de Stock ({etiquetaPeriodoActivo})
                </CardTitle>
              </div>
              <p className="text-xs text-[#657373] mt-1">
                Artículos con mayor salida comercial frente a productos con baja rotación o capital inmovilizado a costo de reposición.
              </p>
            </div>

            {/* Segmented Control de pestañas con pill deslizante Motion */}
            <div className="relative inline-flex items-center p-1 bg-[#F8F7F2] rounded-lg border border-[#E8E6DF] self-start md:self-auto">
              <button
                type="button"
                onClick={() => cambiarTabRotacion('mas_vendidos')}
                className={`relative px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors duration-150 z-10 ${
                  rotacionTab === 'mas_vendidos'
                    ? 'text-[#2A7A78]'
                    : 'text-[#657373] hover:text-[#1C2424]'
                }`}
              >
                {rotacionTab === 'mas_vendidos' && (
                  <motion.span
                    layoutId="rotacionTabIndicator"
                    className="absolute inset-0 bg-white rounded-md shadow-xs -z-10"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                Más Vendidos
              </button>

              <button
                type="button"
                onClick={() => cambiarTabRotacion('menos_vendidos')}
                className={`relative px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors duration-150 z-10 ${
                  rotacionTab === 'menos_vendidos'
                    ? 'text-[#2A7A78]'
                    : 'text-[#657373] hover:text-[#1C2424]'
                }`}
              >
                {rotacionTab === 'menos_vendidos' && (
                  <motion.span
                    layoutId="rotacionTabIndicator"
                    className="absolute inset-0 bg-white rounded-md shadow-xs -z-10"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                Menos Vendidos
              </button>
            </div>
          </CardHeader>

          <CardContent className="pt-4 overflow-hidden space-y-4">
            {/* Barra de Filtros por Categoría */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#E8E6DF] scrollbar-thin">
              <span className="text-xs font-semibold text-[#657373] uppercase tracking-wider mr-1 shrink-0">
                Categoría:
              </span>
              {categoriasDisponibles.map((cat) => {
                const esActiva = categoriaRotacion.toLowerCase() === cat.toLowerCase();
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => cambiarCategoriaRotacion(cat)}
                    className={`px-3 py-1 rounded-md text-xs transition-all duration-150 shrink-0 cursor-pointer ${
                      esActiva
                        ? 'bg-[#2A7A78] text-white shadow-xs font-semibold'
                        : 'bg-[#F8F7F2] text-[#657373] hover:text-[#1C2424] hover:bg-[#E8E6DF]/70 border border-[#E8E6DF] font-medium'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              {/* Vista 1: Más Vendidos / Alta Rotación */}
              {rotacionTab === 'mas_vendidos' && (
                <motion.div
                  key="tab-mas-vendidos"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="space-y-4"
                >
                  {/* Gráfico Visual: Top Facturación por Producto */}
                  <div className="p-4 bg-[#F8F7F2]/60 rounded-xl border border-[#E8E6DF]">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                      <div>
                        <span className="text-xs font-bold text-[#1C2424] uppercase tracking-wider block">
                          Top Facturación por Producto
                        </span>
                        <span className="text-xs text-[#657373]">
                          {categoriaRotacion === 'Todas'
                            ? `Top artículos con mayor facturación acumulada (${etiquetaPeriodoActivo.toLowerCase()})`
                            : `Artículos con mayor recaudación en la categoría ${categoriaRotacion}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#657373]">
                          Facturación segmento:{' '}
                          <strong className="text-[#1C2424]">
                            {monedaSimbolo}{totalFacturadoFiltrado.toLocaleString('es-AR')}
                          </strong>
                        </span>
                        <span className="text-[#E8E6DF]">•</span>
                        <span className="text-xs text-[#657373]">
                          Salidas: <strong className="text-emerald-700">{totalUnidadesFiltradas} un.</strong>
                        </span>
                      </div>
                    </div>

                    {productosGraficoRotacion.length > 0 ? (
                      <ChartContainer
                        config={rotacionMasVendidosChartConfig}
                        className="h-56 w-full aspect-auto mt-2"
                      >
                        <BarChart
                          data={productosGraficoRotacion.map((p) => ({
                            producto: p.nombre,
                            Facturación: p.montoTotal,
                          }))}
                          margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E6DF" />
                          <XAxis
                            dataKey="producto"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tick={{ fill: '#657373', fontSize: 11 }}
                            interval={0}
                            tickFormatter={(val: string) =>
                              val.length > 14 ? `${val.substring(0, 12)}...` : val
                            }
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tick={{ fill: '#657373', fontSize: 11 }}
                            tickFormatter={(val) => `${monedaSimbolo}${(val / 1000).toLocaleString('es-AR')}k`}
                          />
                          <ChartTooltip
                            cursor={{ fill: '#EFECE4', opacity: 0.7 }}
                            content={
                              <ChartTooltipContent
                                formatter={(value) => `${monedaSimbolo}${Number(value).toLocaleString('es-AR')}`}
                              />
                            }
                          />
                          <Bar
                            dataKey="Facturación"
                            fill="#2A7A78"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={45}
                          />
                        </BarChart>
                      </ChartContainer>
                    ) : (
                      <div className="py-10 text-center text-xs text-[#657373] bg-white rounded-lg border border-dashed border-[#E8E6DF]">
                        No se registraron salidas comerciales en {etiquetaPeriodoActivo.toLowerCase()} para{' '}
                        {categoriaRotacion === 'Todas' ? 'el catálogo' : `la categoría "${categoriaRotacion}"`}.
                      </div>
                    )}
                  </div>

                  {/* Tabla Paginada de Más Vendidos */}
                  <div className="rounded-lg border border-[#E8E6DF] overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#F8F7F2]">
                          <TableHead className="w-12 text-center">#</TableHead>
                          <TableHead>Producto</TableHead>
                          <TableHead>Categoría</TableHead>
                          <TableHead>Unidades Vendidas</TableHead>
                          <TableHead>Monto Recaudado</TableHead>
                          <TableHead>Stock Actual</TableHead>
                          <TableHead className="text-right">Salud Comercial</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody ref={masVendidosTableBodyRef}>
                        {productosRotacionPaginados.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="h-28 text-center text-xs text-[#657373]">
                              No hay artículos con ventas registradas en este segmento durante {etiquetaPeriodoActivo.toLowerCase()}.
                            </TableCell>
                          </TableRow>
                        ) : (
                          productosRotacionPaginados.map((prod, idx) => {
                            const esStockCritico = prod.stockActual <= prod.stockMinimo;
                            return (
                              <TableRow key={prod.id} className="transition-colors">
                                <TableCell className="text-center font-bold text-xs text-[#2A7A78]">
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#E2F1F0]">
                                    {inicioRotacion + idx + 1}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="font-semibold text-sm text-[#1C2424]">{prod.nombre}</div>
                                  <div className="text-xs text-[#657373] font-mono">SKU: {prod.codigo}</div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className="text-xs">
                                    {prod.categoria}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <span className="font-bold text-sm text-emerald-700">
                                    {prod.unidadesVendidas} un.
                                  </span>
                                </TableCell>
                                <TableCell className="font-bold text-sm text-[#1C2424]">
                                  {monedaSimbolo}{prod.montoTotal.toLocaleString('es-AR')}
                                </TableCell>
                                <TableCell>
                                  <span className="font-medium text-sm text-[#1C2424]">
                                    {prod.stockActual} un.
                                  </span>
                                  <span className="text-[11px] text-[#657373] ml-1">
                                    (mín. {prod.stockMinimo})
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  {esStockCritico ? (
                                    <Badge variant="warning" className="text-xs">
                                      Demanda Alta / Reponer Stock
                                    </Badge>
                                  ) : (
                                    <Badge variant="success" className="text-xs">
                                      Demanda Óptima
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Paginación de Más Vendidos */}
                  {totalRotacion > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 px-1 text-xs text-[#657373]">
                      <div>
                        Mostrando <span className="font-semibold text-[#1C2424]">{inicioRotacion + 1}</span> a{' '}
                        <span className="font-semibold text-[#1C2424]">
                          {Math.min(inicioRotacion + itemsPorPaginaRotacion, totalRotacion)}
                        </span>{' '}
                        de <span className="font-semibold text-[#1C2424]">{totalRotacion}</span> productos
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 text-xs text-[#1C2424] border-[#E8E6DF] hover:bg-[#F8F7F2] active:scale-95 transition-all duration-150 cursor-pointer"
                          onClick={() => setPaginaRotacion((p) => Math.max(p - 1, 1))}
                          disabled={paginaRotacion <= 1}
                        >
                          <CaretLeft className="h-3.5 w-3.5 mr-1" />
                          Anterior
                        </Button>
                        <span className="px-2 font-medium text-[#1C2424]">
                          {paginaRotacion} / {totalPaginasRotacion}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 text-xs text-[#1C2424] border-[#E8E6DF] hover:bg-[#F8F7F2] active:scale-95 transition-all duration-150 cursor-pointer"
                          onClick={() => setPaginaRotacion((p) => Math.min(p + 1, totalPaginasRotacion))}
                          disabled={paginaRotacion >= totalPaginasRotacion}
                        >
                          Siguiente
                          <CaretRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Vista 2: Menos Vendidos / Stock Inmovilizado */}
              {rotacionTab === 'menos_vendidos' && (
                <motion.div
                  key="tab-menos-vendidos"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="space-y-4"
                >
                  {/* Gráfico Visual de Menor Facturación */}
                  <div className="p-4 bg-[#F8F7F2]/60 rounded-xl border border-[#E8E6DF]">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                      <div>
                        <span className="text-xs font-bold text-[#1C2424] uppercase tracking-wider block">
                          Artículos con Menor Facturación o Baja Salida
                        </span>
                        <span className="text-xs text-[#657373]">
                          {categoriaRotacion === 'Todas'
                            ? `Productos activos con menor volumen de salida (${etiquetaPeriodoActivo.toLowerCase()})`
                            : `Artículos con menor movimiento en la categoría ${categoriaRotacion}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#657373]">
                          Facturación segmento:{' '}
                          <strong className="text-[#1C2424]">
                            {monedaSimbolo}{totalFacturadoFiltrado.toLocaleString('es-AR')}
                          </strong>
                        </span>
                        <span className="text-[#E8E6DF]">•</span>
                        <span className="text-xs text-[#657373]">
                          Capital a costo:{' '}
                          <strong className="text-amber-800">
                            {monedaSimbolo}{totalCapitalInmovilizadoFiltrado.toLocaleString('es-AR')}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {productosGraficoRotacion.length > 0 ? (
                      <ChartContainer
                        config={rotacionMenosVendidosChartConfig}
                        className="h-56 w-full aspect-auto mt-2"
                      >
                        <BarChart
                          data={productosGraficoRotacion.map((p) => ({
                            producto: p.nombre,
                            Facturación: p.montoTotal,
                          }))}
                          margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E6DF" />
                          <XAxis
                            dataKey="producto"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tick={{ fill: '#657373', fontSize: 11 }}
                            interval={0}
                            tickFormatter={(val: string) =>
                              val.length > 14 ? `${val.substring(0, 12)}...` : val
                            }
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tick={{ fill: '#657373', fontSize: 11 }}
                            tickFormatter={(val) => `${monedaSimbolo}${(val / 1000).toLocaleString('es-AR')}k`}
                          />
                          <ChartTooltip
                            cursor={{ fill: '#EFECE4', opacity: 0.7 }}
                            content={
                              <ChartTooltipContent
                                formatter={(value) => `${monedaSimbolo}${Number(value).toLocaleString('es-AR')}`}
                              />
                            }
                          />
                          <Bar
                            dataKey="Facturación"
                            fill="#F59E0B"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={45}
                          />
                        </BarChart>
                      </ChartContainer>
                    ) : (
                      <div className="py-10 text-center text-xs text-[#657373] bg-white rounded-lg border border-dashed border-[#E8E6DF]">
                        No se registraron productos activos en la categoría &quot;{categoriaRotacion}&quot;.
                      </div>
                    )}
                  </div>

                  {/* Tabla de Menos Vendidos */}
                  <div className="rounded-lg border border-[#E8E6DF] overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#F8F7F2]">
                          <TableHead className="w-12 text-center">#</TableHead>
                          <TableHead>Producto</TableHead>
                          <TableHead>Categoría</TableHead>
                          <TableHead>Unidades Vendidas</TableHead>
                          <TableHead>Monto Recaudado</TableHead>
                          <TableHead>Stock / Capital a Costo</TableHead>
                          <TableHead className="text-right">Diagnóstico</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody ref={menosVendidosTableBodyRef}>
                        {productosRotacionPaginados.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="h-28 text-center text-xs text-[#657373]">
                              No hay artículos registrados para esta categoría.
                            </TableCell>
                          </TableRow>
                        ) : (
                          productosRotacionPaginados.map((prod, idx) => (
                            <TableRow key={prod.id} className="transition-colors">
                              <TableCell className="text-center font-bold text-xs text-[#657373]">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#EFECE4]">
                                  {inicioRotacion + idx + 1}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="font-semibold text-sm text-[#1C2424]">{prod.nombre}</div>
                                <div className="text-xs text-[#657373] font-mono">SKU: {prod.codigo}</div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="text-xs">
                                  {prod.categoria}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="font-bold text-sm text-[#657373]">
                                  {prod.unidadesVendidas} un.
                                </span>
                              </TableCell>
                              <TableCell className="font-medium text-sm text-[#657373]">
                                {monedaSimbolo}{prod.montoTotal.toLocaleString('es-AR')}
                              </TableCell>
                              <TableCell>
                                <span className="font-bold text-sm text-[#1C2424]">
                                  {prod.stockActual} un.
                                </span>
                                <span className="text-xs text-amber-800 ml-1.5 font-medium">
                                  ({monedaSimbolo}{(prod.stockActual * prod.precioCosto).toLocaleString('es-AR')})
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                {prod.unidadesVendidas === 0 ? (
                                  <Badge variant="destructive" className="text-xs">
                                    Sin Salida Comercial
                                  </Badge>
                                ) : (
                                  <Badge variant="warning" className="text-xs">
                                    Baja Rotación
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Paginación de Menos Vendidos */}
                  {totalRotacion > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 px-1 text-xs text-[#657373]">
                      <div>
                        Mostrando <span className="font-semibold text-[#1C2424]">{inicioRotacion + 1}</span> a{' '}
                        <span className="font-semibold text-[#1C2424]">
                          {Math.min(inicioRotacion + itemsPorPaginaRotacion, totalRotacion)}
                        </span>{' '}
                        de <span className="font-semibold text-[#1C2424]">{totalRotacion}</span> productos
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 text-xs text-[#1C2424] border-[#E8E6DF] hover:bg-[#F8F7F2] active:scale-95 transition-all duration-150 cursor-pointer"
                          onClick={() => setPaginaRotacion((p) => Math.max(p - 1, 1))}
                          disabled={paginaRotacion <= 1}
                        >
                          <CaretLeft className="h-3.5 w-3.5 mr-1" />
                          Anterior
                        </Button>
                        <span className="px-2 font-medium text-[#1C2424]">
                          {paginaRotacion} / {totalPaginasRotacion}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 text-xs text-[#1C2424] border-[#E8E6DF] hover:bg-[#F8F7F2] active:scale-95 transition-all duration-150 cursor-pointer"
                          onClick={() => setPaginaRotacion((p) => Math.min(p + 1, totalPaginasRotacion))}
                          disabled={paginaRotacion >= totalPaginasRotacion}
                        >
                          Siguiente
                          <CaretRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
  );
}
