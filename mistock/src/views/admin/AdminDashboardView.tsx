'use client';

/**
 * ====================================================================
 * VISTA: MÉTRICAS Y KPIS DE RENDIMIENTO DEL NEGOCIO (Patrón MVC - View)
 * ====================================================================
 * 
 * Propósito:
 * Renderizar el panel analítico ejecutivo de M.I Stock focalizado en el
 * rendimiento comercial, recaudación mensual, rotación de artículos y
 * comportamiento transaccional con componentes interactivos Tremor.
 * 
 * Rol en la Arquitectura:
 * - Es la capa "V" (View).
 * - No contiene llamadas directas a APIs ni lógica de cálculo empresarial.
 * - Recibe su estado y acciones a través de la prop `controller`
 *   (instancia de `useAdminDashboardController`).
 */

import React from 'react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import {
  BarChart3,
  Check,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Receipt,
  PieChart,
  DollarSign,
  ShoppingBag,
  Boxes,
  AlertCircle,
} from 'lucide-react';
import { AreaChart, DonutChart, BarChart } from '@/components/tremor';
import { MetodoPago } from '@/models/modelos_dominio/ventaModel';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface AdminDashboardViewProps {
  controller: ReturnType<typeof useAdminDashboardController>;
}

export function AdminDashboardView({ controller }: AdminDashboardViewProps) {
  const {
    data,
    alertResolvedMsg,
    rotacionTab,
    cambiarTabRotacion,
    categoriaRotacion,
    cambiarCategoriaRotacion,
    paginaRotacion,
    setPaginaRotacion,
    itemsPorPaginaRotacion,
    periodoVentasTab,
    cambiarPeriodoVentas,
    paginaVentas,
    setPaginaVentas,
    itemsPorPaginaVentas,
  } = controller;

  // Referencias para auto-animación en tablas
  const [masVendidosTableBodyRef] = useAutoAnimate<HTMLTableSectionElement>({ duration: 220, easing: 'ease-out' });
  const [menosVendidosTableBodyRef] = useAutoAnimate<HTMLTableSectionElement>({ duration: 220, easing: 'ease-out' });
  const [ventasTableBodyRef] = useAutoAnimate<HTMLTableSectionElement>({ duration: 220, easing: 'ease-out' });

  // Lista de categorías únicas extraídas de ambos catálogos para filtrado interactivo
  const categoriasDisponibles = React.useMemo(() => {
    const cats = new Set<string>();
    data.productosMasVendidos.forEach((p) => cats.add(p.categoria));
    data.productosMenosVendidos.forEach((p) => cats.add(p.categoria));
    return ['Todas', ...Array.from(cats).sort()];
  }, [data.productosMasVendidos, data.productosMenosVendidos]);

  // Lista base según pestaña activa ('mas_vendidos' | 'menos_vendidos')
  const listaBaseRotacion =
    rotacionTab === 'mas_vendidos'
      ? data.productosMasVendidos
      : data.productosMenosVendidos;

  // Filtrado por categoría seleccionada
  const listaFiltradaRotacion = React.useMemo(() => {
    if (categoriaRotacion === 'Todas') {
      return listaBaseRotacion;
    }
    return listaBaseRotacion.filter(
      (p) => p.categoria.toLowerCase() === categoriaRotacion.toLowerCase()
    );
  }, [listaBaseRotacion, categoriaRotacion]);

  // Cálculos de Paginación para Rotación de Stock
  const totalRotacion = listaFiltradaRotacion.length;
  const totalPaginasRotacion =
    Math.ceil(totalRotacion / itemsPorPaginaRotacion) || 1;
  const inicioRotacion = (paginaRotacion - 1) * itemsPorPaginaRotacion;
  const productosRotacionPaginados = listaFiltradaRotacion.slice(
    inicioRotacion,
    inicioRotacion + itemsPorPaginaRotacion
  );

  // Cálculos analíticos para gráfico y resúmenes de Rotación
  const productosGraficoRotacion = React.useMemo(() => {
    return listaFiltradaRotacion.slice(0, 5);
  }, [listaFiltradaRotacion]);

  const totalFacturadoFiltrado = React.useMemo(() => {
    return listaFiltradaRotacion.reduce((acc, p) => acc + p.montoTotal, 0);
  }, [listaFiltradaRotacion]);

  const totalUnidadesFiltradas = React.useMemo(() => {
    return listaFiltradaRotacion.reduce((acc, p) => acc + p.unidadesVendidas, 0);
  }, [listaFiltradaRotacion]);

  const totalCapitalInmovilizadoFiltrado = React.useMemo(() => {
    return listaFiltradaRotacion.reduce((acc, p) => acc + (p.stockActual * 1950), 0);
  }, [listaFiltradaRotacion]);

  // Cálculos de Paginación y Resumen para Detalle de Ventas
  const listaActivaVentas =
    periodoVentasTab === 'semana'
      ? data.ventasDetalle.ventasSemana
      : data.ventasDetalle.ventasMes;
  const resumenActivoVentas =
    periodoVentasTab === 'semana'
      ? data.ventasDetalle.resumenSemana
      : data.ventasDetalle.resumenMes;
  const totalVentas = listaActivaVentas.length;
  const totalPaginasVentas =
    Math.ceil(totalVentas / itemsPorPaginaVentas) || 1;
  const inicioVentas = (paginaVentas - 1) * itemsPorPaginaVentas;
  const ventasPaginadas = listaActivaVentas.slice(
    inicioVentas,
    inicioVentas + itemsPorPaginaVentas
  );

  const getKpiIcon = (index: number) => {
    switch (index) {
      case 0:
        return <DollarSign className="h-4 w-4" />;
      case 1:
        return <Receipt className="h-4 w-4" />;
      case 2:
        return <ShoppingBag className="h-4 w-4" />;
      case 3:
      default:
        return <Boxes className="h-4 w-4" />;
    }
  };

  const getMetodoPagoBadge = (metodo: MetodoPago) => {
    switch (metodo) {
      case 'efectivo':
        return <Badge variant="success" className="text-xs font-medium">Efectivo</Badge>;
      case 'tarjeta_debito':
        return <Badge variant="default" className="text-xs font-medium">Débito</Badge>;
      case 'tarjeta_credito':
        return <Badge variant="secondary" className="text-xs font-medium">Crédito</Badge>;
      case 'transferencia':
        return <Badge variant="outline" className="text-xs font-medium">Transferencia</Badge>;
      case 'mercado_pago':
        return <Badge className="text-xs font-medium bg-[#009EE3] text-white hover:bg-[#0082ba]">Mercado Pago</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs font-medium">Otro</Badge>;
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Encabezado Principal */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <div>
            <h1 className="text-2xl font-bold text-[#1C2424] tracking-tight">
              Métricas & KPIs de Negocio
            </h1>
            <p className="text-sm text-[#657373]">
              Monitoreo financiero, recaudación mensual, rotación de artículos y comportamiento de cobros.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E2F1F0] text-[#2A7A78] border border-[#2A7A78]/20">
              <span className="w-2 h-2 rounded-full bg-[#2A7A78] animate-pulse" />
              Período Activo: Septiembre
            </span>
          </div>
        </motion.div>

        {/* Notificación tras acciones */}
        <AnimatePresence>
          {alertResolvedMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <Alert variant="success">
                <Check className="h-4 w-4" />
                <AlertTitle>Acción Registrada</AlertTitle>
                <AlertDescription>{alertResolvedMsg}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ==================================================================== */}
        {/* 1. TARJETAS KPI DE RENDIMIENTO FINANCIERO Y MENSUAL                  */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.kpiMetrics.map((kpi, idx) => (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: idx * 0.05, ease: 'easeOut' }}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
            >
              <Card className="p-5 h-full transition-shadow duration-200 hover:shadow-xs border-[#E8E6DF] bg-white flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#657373]">
                      {kpi.title}
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E2F1F0] text-[#2A7A78] shrink-0">
                      {getKpiIcon(idx)}
                    </div>
                  </div>

                  <div className="mt-3">
                    <span className="text-2xl font-extrabold text-[#1C2424] tracking-tight block">
                      {kpi.value}
                    </span>
                  </div>
                </div>

                {kpi.changePercentage && (
                  <div className="mt-2.5 flex items-center">
                    <Badge
                      variant={kpi.status === 'positive' ? 'success' : kpi.status === 'negative' ? 'destructive' : 'secondary'}
                      className="font-semibold text-xs px-2 py-0.5"
                    >
                      {kpi.changePercentage}
                    </Badge>
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>

        {/* ==================================================================== */}
        {/* 2. ANALÍTICA VISUAL: EVOLUCIÓN TEMPORAL & MÉTODOS DE PAGO (TREMOR)  */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Gráfico 1: Evolución Temporal de Recaudación (AreaChart) */}
          <div className="lg:col-span-8">
            <Card className="h-full flex flex-col justify-between border-[#E8E6DF] shadow-xs bg-white">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-3 border-b border-[#E8E6DF]">
                <div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-[#2A7A78]" />
                    <CardTitle className="text-base font-bold text-[#1C2424]">
                      Evolución de Recaudación
                    </CardTitle>
                  </div>
                  <p className="text-xs text-[#657373] mt-1">
                    Facturación acumulada comparada contra el período inmediatamente anterior.
                  </p>
                </div>

                {/* Selector de período interactivo con Motion pill */}
                <div className="relative inline-flex items-center p-1 bg-[#F8F7F2] rounded-lg border border-[#E8E6DF] self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => cambiarPeriodoVentas('semana')}
                    className={`relative px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors duration-150 z-10 ${
                      periodoVentasTab === 'semana'
                        ? 'text-[#2A7A78]'
                        : 'text-[#657373] hover:text-[#1C2424]'
                    }`}
                  >
                    {periodoVentasTab === 'semana' && (
                      <motion.span
                        layoutId="areaChartPeriodIndicator"
                        className="absolute inset-0 bg-white rounded-md shadow-xs -z-10"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                    Esta Semana
                  </button>
                  <button
                    type="button"
                    onClick={() => cambiarPeriodoVentas('mes')}
                    className={`relative px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors duration-150 z-10 ${
                      periodoVentasTab === 'mes'
                        ? 'text-[#2A7A78]'
                        : 'text-[#657373] hover:text-[#1C2424]'
                    }`}
                  >
                    {periodoVentasTab === 'mes' && (
                      <motion.span
                        layoutId="areaChartPeriodIndicator"
                        className="absolute inset-0 bg-white rounded-md shadow-xs -z-10"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                    Este Mes
                  </button>
                </div>
              </CardHeader>

              <CardContent className="pt-4 flex-1">
                <AreaChart
                  className="h-72"
                  data={
                    periodoVentasTab === 'semana'
                      ? data.graficos.tendenciaSemana
                      : data.graficos.tendenciaMes
                  }
                  index="fecha"
                  categories={["Recaudación Actual", "Período Anterior"]}
                  colors={["emerald", "gray"]}
                  valueFormatter={(number: number) => `$${number.toLocaleString('es-AR')}`}
                  showLegend={true}
                  showGridLines={true}
                  startEndOnly={false}
                />
              </CardContent>
            </Card>
          </div>

          {/* Gráfico 2: Distribución por Métodos de Pago (DonutChart) */}
          <div className="lg:col-span-4">
            <Card className="h-full flex flex-col justify-between border-[#E8E6DF] shadow-xs bg-white">
              <CardHeader className="pb-3 border-b border-[#E8E6DF]">
                <div className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-[#2A7A78]" />
                  <CardTitle className="text-base font-bold text-[#1C2424]">
                    Métodos de Pago
                  </CardTitle>
                </div>
                <p className="text-xs text-[#657373] mt-1">
                  Participación en ingresos ({periodoVentasTab === 'semana' ? 'Esta Semana' : 'Este Mes'})
                </p>
              </CardHeader>

              <CardContent className="pt-4 flex-1 flex flex-col justify-between">
                <div className="flex-1 flex items-center justify-center py-2 w-full">
                  <DonutChart
                    className="h-48 w-48 mx-auto"
                    data={
                      periodoVentasTab === 'semana'
                        ? data.graficos.distribucionPagosSemana
                        : data.graficos.distribucionPagosMes
                    }
                    category="metodo"
                    value="monto"
                    valueFormatter={(number: number) => `$${number.toLocaleString('es-AR')}`}
                    colors={["blue", "emerald", "violet", "amber"]}
                  />
                </div>

                <div className="mt-4 space-y-2 pt-3 border-t border-[#E8E6DF]">
                  {(periodoVentasTab === 'semana'
                    ? data.graficos.distribucionPagosSemana
                    : data.graficos.distribucionPagosMes
                  ).map((pago, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            idx === 0
                              ? 'bg-blue-500'
                              : idx === 1
                              ? 'bg-emerald-500'
                              : idx === 2
                              ? 'bg-violet-500'
                              : 'bg-amber-500'
                          }`}
                        />
                        <span className="text-[#657373] font-medium">{pago.metodo}</span>
                      </div>
                      <span className="font-bold text-[#1C2424]">
                        ${pago.monto.toLocaleString('es-AR')} ({pago.porcentaje}%)
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 3. REDISEÑO: ROTACIÓN DE PRODUCTOS Y SALUD DE STOCK                  */}
        {/* ==================================================================== */}
        <Card className="border-[#E8E6DF] shadow-xs bg-white overflow-hidden">
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between pb-4 gap-3 border-b border-[#E8E6DF]">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#2A7A78]" />
                <CardTitle className="text-base font-bold text-[#1C2424]">
                  Rotación de Productos y Salud de Stock
                </CardTitle>
              </div>
              <p className="text-xs text-[#657373] mt-1">
                Monitoreo de artículos con alta demanda comercial vs. productos con bajo movimiento o capital inmovilizado.
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
                    className={`px-3 py-1 rounded-full text-xs transition-all duration-150 shrink-0 cursor-pointer ${
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
                            ? 'Top artículos con mayor facturación acumulada en el período'
                            : `Artículos con mayor recaudación en la categoría ${categoriaRotacion}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#657373]">
                          Facturación segmento: <strong className="text-[#1C2424]">${totalFacturadoFiltrado.toLocaleString('es-AR')}</strong>
                        </span>
                        <span className="text-[#E8E6DF]">•</span>
                        <span className="text-xs text-[#657373]">
                          Salidas: <strong className="text-emerald-700">{totalUnidadesFiltradas} un.</strong>
                        </span>
                      </div>
                    </div>

                    {productosGraficoRotacion.length > 0 ? (
                      <BarChart
                        className="h-56 mt-2"
                        data={productosGraficoRotacion.map((p) => ({
                          producto: p.nombre,
                          "Facturación": p.montoTotal,
                        }))}
                        index="producto"
                        categories={["Facturación"]}
                        colors={["emerald"]}
                        valueFormatter={(number: number) => `$${number.toLocaleString('es-AR')}`}
                        showLegend={false}
                        showGridLines={true}
                        yAxisWidth={80}
                      />
                    ) : (
                      <div className="py-10 text-center text-xs text-[#657373] bg-white rounded-lg border border-dashed border-[#E8E6DF]">
                        No se registraron productos de alta rotación en la categoría &quot;{categoriaRotacion}&quot;.
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
                              No hay artículos registrados para esta categoría.
                            </TableCell>
                          </TableRow>
                        ) : (
                          productosRotacionPaginados.map((prod, idx) => {
                            const esStockBajo = prod.stockActual <= 10;
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
                                  ${prod.montoTotal.toLocaleString('es-AR')}
                                </TableCell>
                                <TableCell>
                                  <span className="font-medium text-sm text-[#1C2424]">
                                    {prod.stockActual} un.
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  {esStockBajo ? (
                                    <Badge variant="warning" className="text-xs">
                                      Demanda Alta / Stock Bajo
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
                          <ChevronLeft className="h-3.5 w-3.5 mr-1" />
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
                          <ChevronRight className="h-3.5 w-3.5 ml-1" />
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
                            ? 'Productos con menor volumen de venta o rotación estancada'
                            : `Artículos con menor movimiento en la categoría ${categoriaRotacion}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#657373]">
                          Facturación registrada: <strong className="text-[#1C2424]">${totalFacturadoFiltrado.toLocaleString('es-AR')}</strong>
                        </span>
                        <span className="text-[#E8E6DF]">•</span>
                        <span className="text-xs text-[#657373]">
                          Stock inmovilizado: <strong className="text-amber-800">${totalCapitalInmovilizadoFiltrado.toLocaleString('es-AR')}</strong>
                        </span>
                      </div>
                    </div>

                    {productosGraficoRotacion.length > 0 ? (
                      <BarChart
                        className="h-56 mt-2"
                        data={productosGraficoRotacion.map((p) => ({
                          producto: p.nombre,
                          "Facturación": p.montoTotal,
                        }))}
                        index="producto"
                        categories={["Facturación"]}
                        colors={["amber"]}
                        valueFormatter={(number: number) => `$${number.toLocaleString('es-AR')}`}
                        showLegend={false}
                        showGridLines={true}
                        yAxisWidth={80}
                      />
                    ) : (
                      <div className="py-10 text-center text-xs text-[#657373] bg-white rounded-lg border border-dashed border-[#E8E6DF]">
                        No se registraron productos de baja rotación en la categoría &quot;{categoriaRotacion}&quot;.
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
                          <TableHead>Stock Inmovilizado</TableHead>
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
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100">
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
                                ${prod.montoTotal.toLocaleString('es-AR')}
                              </TableCell>
                              <TableCell>
                                <span className="font-bold text-sm text-red-600">
                                  {prod.stockActual} un.
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                {prod.unidadesVendidas <= 1 ? (
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
                          <ChevronLeft className="h-3.5 w-3.5 mr-1" />
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
                          <ChevronRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* ==================================================================== */}
        {/* 4. DETALLE DE VENTAS: MÉTRICAS, GRÁFICO BARCHART & TRANSACCIONES    */}
        {/* ==================================================================== */}
        <Card className="border-[#E8E6DF] shadow-xs bg-white overflow-hidden">
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between pb-4 gap-3 border-b border-[#E8E6DF]">
            <div>
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-[#2A7A78]" />
                <CardTitle className="text-base font-bold text-[#1C2424]">
                  Detalle de Ventas y Comportamiento Transaccional
                </CardTitle>
              </div>
              <p className="text-xs text-[#657373] mt-1">
                Visualización gráfica del ritmo de ventas y registro pormenorizado de operaciones comerciales.
              </p>
            </div>

            {/* Segmented Control de período con pill deslizante Motion */}
            <div className="relative inline-flex items-center p-1 bg-[#F8F7F2] rounded-lg border border-[#E8E6DF] self-start md:self-auto">
              <button
                type="button"
                onClick={() => cambiarPeriodoVentas('semana')}
                className={`relative px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors duration-150 z-10 ${
                  periodoVentasTab === 'semana'
                    ? 'text-[#2A7A78]'
                    : 'text-[#657373] hover:text-[#1C2424]'
                }`}
              >
                {periodoVentasTab === 'semana' && (
                  <motion.span
                    layoutId="ventasPeriodoIndicator"
                    className="absolute inset-0 bg-white rounded-md shadow-xs -z-10"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                Esta Semana
              </button>

              <button
                type="button"
                onClick={() => cambiarPeriodoVentas('mes')}
                className={`relative px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors duration-150 z-10 ${
                  periodoVentasTab === 'mes'
                    ? 'text-[#2A7A78]'
                    : 'text-[#657373] hover:text-[#1C2424]'
                }`}
              >
                {periodoVentasTab === 'mes' && (
                  <motion.span
                    layoutId="ventasPeriodoIndicator"
                    className="absolute inset-0 bg-white rounded-md shadow-xs -z-10"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                Este Mes
              </button>
            </div>
          </CardHeader>

          <CardContent className="pt-4 overflow-hidden space-y-5">
            {/* Métricas Resumen del Período */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg border border-[#E8E6DF] bg-[#F8F7F2]/60">
                <span className="text-[11px] font-semibold text-[#657373] uppercase tracking-wider block">
                  Total Facturado
                </span>
                <span className="text-lg font-bold text-[#1C2424] mt-0.5 block">
                  ${resumenActivoVentas.totalRecaudado.toLocaleString('es-AR')}
                </span>
              </div>

              <div className="p-3 rounded-lg border border-[#E8E6DF] bg-[#F8F7F2]/60">
                <span className="text-[11px] font-semibold text-[#657373] uppercase tracking-wider block">
                  Transacciones
                </span>
                <span className="text-lg font-bold text-[#1C2424] mt-0.5 block">
                  {resumenActivoVentas.cantidadVentas} ventas
                </span>
              </div>

              <div className="p-3 rounded-lg border border-[#E8E6DF] bg-[#F8F7F2]/60">
                <span className="text-[11px] font-semibold text-[#657373] uppercase tracking-wider block">
                  Ticket Promedio
                </span>
                <span className="text-lg font-bold text-[#1C2424] mt-0.5 block">
                  ${resumenActivoVentas.ticketPromedio.toLocaleString('es-AR')}
                </span>
              </div>

              <div className="p-3 rounded-lg border border-[#E8E6DF] bg-[#F8F7F2]/60">
                <span className="text-[11px] font-semibold text-[#657373] uppercase tracking-wider block">
                  Unidades Despachadas
                </span>
                <span className="text-lg font-bold text-[#1C2424] mt-0.5 block">
                  {resumenActivoVentas.unidadesTotales} un.
                </span>
              </div>
            </div>

            {/* Gráfico Tremor BarChart: Comportamiento y Ritmo de Ventas */}
            <div className="p-4 rounded-lg border border-[#E8E6DF] bg-[#F8F7F2]/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#1C2424] uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4 text-[#2A7A78]" />
                  Ritmo de Facturación {periodoVentasTab === 'semana' ? 'Diario (Esta Semana)' : 'Semanal (Este Mes)'}
                </span>
                <span className="text-xs text-[#657373]">
                  Valores expresados en ARS ($)
                </span>
              </div>
              <BarChart
                className="h-64 mt-3"
                data={
                  periodoVentasTab === 'semana'
                    ? data.graficos.barrasVentasSemana
                    : data.graficos.barrasVentasMes
                }
                index="periodo"
                categories={["Monto Facturado"]}
                colors={["emerald"]}
                valueFormatter={(number: number) => `$${number.toLocaleString('es-AR')}`}
                showLegend={false}
                showGridLines={true}
                yAxisWidth={75}
              />
            </div>

            {/* Tabla de Detalle de Ventas con animación de transición */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`ventas-${periodoVentasTab}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="space-y-3"
              >
                <div className="rounded-lg border border-[#E8E6DF] overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#F8F7F2]">
                        <TableHead>Comprobante</TableHead>
                        <TableHead>Fecha y Hora</TableHead>
                        <TableHead>Vendedor / Caja</TableHead>
                        <TableHead>Método de Pago</TableHead>
                        <TableHead>Artículos</TableHead>
                        <TableHead>Monto Total</TableHead>
                        <TableHead className="text-right">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody ref={ventasTableBodyRef}>
                      {ventasPaginadas.map((v) => (
                        <TableRow key={v.id} className="transition-colors">
                          <TableCell>
                            <span className="font-mono font-semibold text-xs text-[#2A7A78] bg-[#E2F1F0] px-2 py-0.5 rounded">
                              {v.codigoComprobante}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-[#657373] font-medium">
                            {v.fechaHora}
                          </TableCell>
                          <TableCell className="text-sm font-semibold text-[#1C2424]">
                            {v.vendedor}
                          </TableCell>
                          <TableCell>
                            {getMetodoPagoBadge(v.metodoPago)}
                          </TableCell>
                          <TableCell className="text-xs text-[#657373]">
                            {v.cantidadItems} {v.cantidadItems === 1 ? 'producto' : 'productos'}
                          </TableCell>
                          <TableCell className="font-bold text-sm text-[#1C2424]">
                            ${v.total.toLocaleString('es-AR')}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="success" className="text-xs capitalize">
                              {v.estado}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Paginación de Detalle de Ventas */}
                {totalVentas > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 px-1 text-xs text-[#657373]">
                    <div>
                      Mostrando <span className="font-semibold text-[#1C2424]">{inicioVentas + 1}</span> a{' '}
                      <span className="font-semibold text-[#1C2424]">
                        {Math.min(inicioVentas + itemsPorPaginaVentas, totalVentas)}
                      </span>{' '}
                      de <span className="font-semibold text-[#1C2424]">{totalVentas}</span> ventas ({periodoVentasTab === 'semana' ? 'esta semana' : 'este mes'})
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-xs text-[#1C2424] border-[#E8E6DF] hover:bg-[#F8F7F2] active:scale-95 transition-all duration-150 cursor-pointer"
                        onClick={() => setPaginaVentas((p) => Math.max(p - 1, 1))}
                        disabled={paginaVentas <= 1}
                      >
                        <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                        Anterior
                      </Button>
                      <span className="px-2 font-medium text-[#1C2424]">
                        {paginaVentas} / {totalPaginasVentas}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-xs text-[#1C2424] border-[#E8E6DF] hover:bg-[#F8F7F2] active:scale-95 transition-all duration-150 cursor-pointer"
                        onClick={() => setPaginaVentas((p) => Math.min(p + 1, totalPaginasVentas))}
                        disabled={paginaVentas >= totalPaginasVentas}
                      >
                        Siguiente
                        <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </MotionConfig>
  );
}
