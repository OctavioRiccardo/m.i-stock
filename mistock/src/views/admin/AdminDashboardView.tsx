'use client';

/**
 * ====================================================================
 * VISTA: MÉTRICAS Y KPIS DE RENDIMIENTO DEL NEGOCIO (Patrón MVC - View)
 * ====================================================================
 * 
 * Propósito:
 * Renderizar el panel analítico ejecutivo de M.I Stock focalizado en el
 * rendimiento comercial, recaudación mensual, rotación de artículos y
 * comportamiento transaccional con componentes shadcn/ui Charts (Recharts).
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
  ChartBar,
  TrendUp,
  CaretLeft,
  CaretRight,
  Receipt,
  ChartPie as PieChartIcon,
  CurrencyDollar,
  ShoppingBag,
  Package,
  MagnifyingGlass,
  Funnel,
  ArrowCounterClockwise,
  Users,
  CreditCard,
  X,
  CalendarBlank,
} from '@phosphor-icons/react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Pie,
  PieChart,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { MetodoPago, EstadoVenta } from '@/models/modelos_dominio/ventaModel';
import { PeriodoMetricas } from '@/models/modelos_vista/configuracionModel';
import { useAdminDashboardController } from '@/controllers/adminControllers/dashboardController';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

/**
 * Configuraciones tipadas de shadcn/ui Charts para cada visualización
 */
const areaChartConfig = {
  'Recaudación Actual': {
    label: 'Recaudación Actual',
    color: '#2A7A78',
  },
  'Período Anterior': {
    label: 'Período Anterior',
    color: '#94A3B8',
  },
} satisfies ChartConfig;

const metodosPagoChartConfig = {
  monto: {
    label: 'Monto Recaudado',
  },
  'Mercado Pago (Point)': {
    label: 'Mercado Pago (Point)',
    color: '#009EE3',
  },
  'Efectivo': {
    label: 'Efectivo',
    color: '#2A7A78',
  },
  'Transferencia': {
    label: 'Transferencia',
    color: '#F59E0B',
  },
  'Tarjeta Débito/Crédito': {
    label: 'Tarjeta Débito/Crédito',
    color: '#6366F1',
  },
} satisfies ChartConfig;

const COLORES_METODOS: Record<string, string> = {
  'Mercado Pago (Point)': '#009EE3',
  'Efectivo': '#2A7A78',
  'Transferencia': '#F59E0B',
  'Tarjeta Débito/Crédito': '#6366F1',
};

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

const ritmoVentasChartConfig = {
  'Monto Facturado': {
    label: 'Monto Facturado',
    color: '#2A7A78',
  },
} satisfies ChartConfig;

interface AdminDashboardViewProps {
  controller: ReturnType<typeof useAdminDashboardController>;
}

export function AdminDashboardView({ controller }: AdminDashboardViewProps) {
  const {
    data,
    periodoMetricasActivo,
    cambiarPeriodoMetricas,
    configuracionMetricas,
    kpisActivos,
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
    filtroVendedorVentas,
    cambiarFiltroVendedorVentas,
    filtroMetodoPagoVentas,
    cambiarFiltroMetodoPagoVentas,
    filtroEstadoVentas,
    cambiarFiltroEstadoVentas,
    busquedaVentas,
    cambiarBusquedaVentas,
    limpiarFiltrosVentas,
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

  // Cálculos de Paginación, Filtrado y Resumen para Detalle de Ventas
  const listaActivaVentas =
    periodoVentasTab === 'semana'
      ? data.ventasDetalle.ventasSemana
      : data.ventasDetalle.ventasMes;
  const resumenActivoVentas =
    periodoVentasTab === 'semana'
      ? data.ventasDetalle.resumenSemana
      : data.ventasDetalle.resumenMes;

  // Lista de vendedores únicos presentes en las transacciones del período
  const vendedoresDisponibles = React.useMemo(() => {
    const set = new Set<string>();
    listaActivaVentas.forEach((v) => {
      if (v.vendedor) set.add(v.vendedor);
    });
    return ['Todos', ...Array.from(set).sort()];
  }, [listaActivaVentas]);

  // Filtrado multivariado de ventas: Vendedor, Método de Pago, Estado y Búsqueda
  const listaFiltradaVentas = React.useMemo(() => {
    return listaActivaVentas.filter((v) => {
      // 1. Filtro por vendedor / usuario
      if (filtroVendedorVentas !== 'Todos' && v.vendedor !== filtroVendedorVentas) {
        return false;
      }
      // 2. Filtro por método de pago
      if (filtroMetodoPagoVentas !== 'Todos' && v.metodoPago !== filtroMetodoPagoVentas) {
        return false;
      }
      // 3. Filtro por estado de transacción
      if (filtroEstadoVentas !== 'Todos' && v.estado !== filtroEstadoVentas) {
        return false;
      }
      // 4. Búsqueda por texto (código de comprobante o nombre de vendedor)
      if (busquedaVentas.trim()) {
        const query = busquedaVentas.toLowerCase().trim();
        const coincideComprobante = v.codigoComprobante.toLowerCase().includes(query);
        const coincideVendedor = v.vendedor.toLowerCase().includes(query);
        if (!coincideComprobante && !coincideVendedor) {
          return false;
        }
      }
      return true;
    });
  }, [
    listaActivaVentas,
    filtroVendedorVentas,
    filtroMetodoPagoVentas,
    filtroEstadoVentas,
    busquedaVentas,
  ]);

  const hayFiltrosVentasActivos =
    filtroVendedorVentas !== 'Todos' ||
    filtroMetodoPagoVentas !== 'Todos' ||
    filtroEstadoVentas !== 'Todos' ||
    busquedaVentas.trim() !== '';

  // Resumen dinámico adaptado al subconjunto filtrado
  const resumenFiltradoVentas = React.useMemo(() => {
    if (!hayFiltrosVentasActivos) {
      return resumenActivoVentas;
    }
    const totalRecaudado = listaFiltradaVentas.reduce(
      (acc, v) => acc + (v.estado !== 'cancelada' ? v.total : 0),
      0
    );
    const cantidadVentas = listaFiltradaVentas.length;
    const ticketPromedio =
      cantidadVentas > 0 ? Math.round(totalRecaudado / cantidadVentas) : 0;
    const unidadesTotales = listaFiltradaVentas.reduce(
      (acc, v) => acc + (v.estado !== 'cancelada' ? v.cantidadItems : 0),
      0
    );
    return {
      totalRecaudado,
      cantidadVentas,
      ticketPromedio,
      unidadesTotales,
    };
  }, [hayFiltrosVentasActivos, resumenActivoVentas, listaFiltradaVentas]);

  const totalVentas = listaFiltradaVentas.length;
  const totalPaginasVentas =
    Math.ceil(totalVentas / itemsPorPaginaVentas) || 1;
  const inicioVentas = (paginaVentas - 1) * itemsPorPaginaVentas;
  const ventasPaginadas = listaFiltradaVentas.slice(
    inicioVentas,
    inicioVentas + itemsPorPaginaVentas
  );

  const getKpiIcon = (index: number) => {
    switch (index) {
      case 0:
        return <CurrencyDollar className="h-4 w-4" weight="duotone" />;
      case 1:
        return <Receipt className="h-4 w-4" weight="duotone" />;
      case 2:
        return <ShoppingBag className="h-4 w-4" weight="duotone" />;
      case 3:
      default:
        return <Package className="h-4 w-4" weight="duotone" />;
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

  const getEstadoBadge = (estado: EstadoVenta) => {
    switch (estado) {
      case 'completada':
        return <Badge variant="success" className="text-xs font-medium capitalize">Completada</Badge>;
      case 'pendiente':
        return (
          <Badge
            variant="outline"
            className="text-xs font-medium capitalize bg-amber-50 text-amber-700 border-amber-300"
          >
            Pendiente
          </Badge>
        );
      case 'cancelada':
        return (
          <Badge
            variant="outline"
            className="text-xs font-medium capitalize bg-rose-50 text-rose-700 border-rose-300"
          >
            Cancelada
          </Badge>
        );
      default:
        return <Badge variant="secondary" className="text-xs font-medium capitalize">{estado}</Badge>;
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

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center p-1 bg-[#F8F7F2] rounded-lg border border-[#E8E6DF]">
              <CalendarBlank className="h-4 w-4 text-[#2A7A78] ml-2 mr-1 shrink-0" weight="duotone" />
              <span className="text-xs font-semibold text-[#657373] mr-2 hidden sm:inline">Período:</span>
              <div className="flex items-center gap-1">
                {[
                  { id: 'diario', label: 'Hoy' },
                  { id: 'semanal', label: 'Esta Semana' },
                  { id: 'mensual', label: 'Este Mes' },
                  { id: 'ultimos_30_dias', label: 'Últimos 30d' },
                ].map((op) => {
                  const esActivo = periodoMetricasActivo === op.id;
                  const esPorDefecto = configuracionMetricas?.periodoPorDefecto === op.id;
                  return (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => cambiarPeriodoMetricas(op.id as PeriodoMetricas)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                        esActivo
                          ? 'bg-white text-[#2A7A78] font-bold shadow-2xs border border-[#E8E6DF]'
                          : 'text-[#657373] hover:text-[#1C2424] hover:bg-white/50'
                      }`}
                      title={esPorDefecto ? `${op.label} (Preferencia base configurada en el sistema)` : op.label}
                    >
                      <span>{op.label}</span>
                      {esPorDefecto && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            esActivo ? 'bg-[#2A7A78]' : 'bg-[#2A7A78]/50'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>


        {/* ==================================================================== */}
        {/* 1. TARJETAS KPI DE RENDIMIENTO FINANCIERO Y MENSUAL                  */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpisActivos.map((kpi, idx) => (
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
        {/* 2. ANALÍTICA VISUAL: EVOLUCIÓN TEMPORAL & MÉTODOS DE PAGO (SHADCN/UI) */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Gráfico 1: Evolución Temporal de Recaudación (AreaChart) */}
          <div className="lg:col-span-8">
            <Card className="h-full flex flex-col justify-between border-[#E8E6DF] shadow-xs bg-white">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-3 border-b border-[#E8E6DF]">
                <div>
                  <div className="flex items-center gap-2">
                    <TrendUp className="h-5 w-5 text-[#2A7A78]" weight="bold" />
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
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`areachart-${periodoVentasTab}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-full h-full"
                  >
                    <ChartContainer
                      config={areaChartConfig}
                      className="h-72 w-full aspect-auto"
                    >
                      <AreaChart
                        data={
                          periodoVentasTab === 'semana'
                            ? data.graficos.tendenciaSemana
                            : data.graficos.tendenciaMes
                        }
                        margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="fillActual" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2A7A78" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#2A7A78" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="fillAnterior" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#94A3B8" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E6DF" />
                        <XAxis
                          dataKey="fecha"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          tick={{ fill: '#657373', fontSize: 11 }}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          tick={{ fill: '#657373', fontSize: 11 }}
                          tickFormatter={(value) => `$${(value / 1000).toLocaleString('es-AR')}k`}
                        />
                        <ChartTooltip
                          cursor={{ stroke: '#2A7A78', strokeWidth: 1, strokeDasharray: '4 4' }}
                          content={
                            <ChartTooltipContent
                              formatter={(value) => `$${Number(value).toLocaleString('es-AR')}`}
                            />
                          }
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Area
                          type="monotone"
                          dataKey="Período Anterior"
                          stroke="#94A3B8"
                          strokeWidth={1.5}
                          strokeDasharray="4 4"
                          fillOpacity={1}
                          fill="url(#fillAnterior)"
                        />
                        <Area
                          type="monotone"
                          dataKey="Recaudación Actual"
                          stroke="#2A7A78"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#fillActual)"
                        />
                      </AreaChart>
                    </ChartContainer>
                  </motion.div>
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico 2: Distribución por Métodos de Pago (DonutChart) */}
          <div className="lg:col-span-4">
            <Card className="h-full flex flex-col justify-between border-[#E8E6DF] shadow-xs bg-white">
              <CardHeader className="pb-3 border-b border-[#E8E6DF]">
                <div className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-[#2A7A78]" weight="duotone" />
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
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`donut-${periodoVentasTab}`}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.2 }}
                      className="w-full flex justify-center"
                    >
                      <ChartContainer
                        config={metodosPagoChartConfig}
                        className="mx-auto aspect-square max-h-[200px] w-full"
                      >
                        <PieChart>
                          <ChartTooltip
                            cursor={false}
                            content={
                              <ChartTooltipContent
                                hideLabel
                                formatter={(value, name) => (
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-[#1C2424]">{name}:</span>
                                    <span className="font-bold text-[#2A7A78]">
                                      ${Number(value).toLocaleString('es-AR')}
                                    </span>
                                  </div>
                                )}
                              />
                            }
                          />
                          <Pie
                            data={
                              periodoVentasTab === 'semana'
                                ? data.graficos.distribucionPagosSemana
                                : data.graficos.distribucionPagosMes
                            }
                            dataKey="monto"
                            nameKey="metodo"
                            innerRadius={48}
                            outerRadius={75}
                            paddingAngle={3}
                            strokeWidth={2}
                            stroke="#ffffff"
                          >
                            {(periodoVentasTab === 'semana'
                              ? data.graficos.distribucionPagosSemana
                              : data.graficos.distribucionPagosMes
                            ).map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORES_METODOS[entry.metodo] || '#2A7A78'}
                              />
                            ))}
                          </Pie>
                        </PieChart>
                      </ChartContainer>
                    </motion.div>
                  </AnimatePresence>
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
                <ChartBar className="h-5 w-5 text-[#2A7A78]" weight="duotone" />
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
                            tickFormatter={(val) => `$${(val / 1000).toLocaleString('es-AR')}k`}
                          />
                          <ChartTooltip
                            cursor={{ fill: '#F3F4F6', opacity: 0.5 }}
                            content={
                              <ChartTooltipContent
                                formatter={(value) => `$${Number(value).toLocaleString('es-AR')}`}
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
                            tickFormatter={(val) => `$${(val / 1000).toLocaleString('es-AR')}k`}
                          />
                          <ChartTooltip
                            cursor={{ fill: '#F3F4F6', opacity: 0.5 }}
                            content={
                              <ChartTooltipContent
                                formatter={(value) => `$${Number(value).toLocaleString('es-AR')}`}
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
            {/* Métricas Resumen del Período / Filtro */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg border border-[#E8E6DF] bg-[#F8F7F2]/60">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#657373] uppercase tracking-wider block">
                    Total Facturado
                  </span>
                  {hayFiltrosVentasActivos && (
                    <span className="text-[10px] font-semibold py-0.5 px-1.5 rounded-full border border-[#2A7A78]/30 text-[#2A7A78] bg-[#E2F1F0]">
                      Filtrado
                    </span>
                  )}
                </div>
                <span className="text-lg font-bold text-[#1C2424] mt-0.5 block">
                  ${resumenFiltradoVentas.totalRecaudado.toLocaleString('es-AR')}
                </span>
              </div>

              <div className="p-3 rounded-lg border border-[#E8E6DF] bg-[#F8F7F2]/60">
                <span className="text-[11px] font-semibold text-[#657373] uppercase tracking-wider block">
                  Transacciones
                </span>
                <span className="text-lg font-bold text-[#1C2424] mt-0.5 block">
                  {resumenFiltradoVentas.cantidadVentas} ventas
                </span>
              </div>

              <div className="p-3 rounded-lg border border-[#E8E6DF] bg-[#F8F7F2]/60">
                <span className="text-[11px] font-semibold text-[#657373] uppercase tracking-wider block">
                  Ticket Promedio
                </span>
                <span className="text-lg font-bold text-[#1C2424] mt-0.5 block">
                  ${resumenFiltradoVentas.ticketPromedio.toLocaleString('es-AR')}
                </span>
              </div>

              <div className="p-3 rounded-lg border border-[#E8E6DF] bg-[#F8F7F2]/60">
                <span className="text-[11px] font-semibold text-[#657373] uppercase tracking-wider block">
                  Unidades Despachadas
                </span>
                <span className="text-lg font-bold text-[#1C2424] mt-0.5 block">
                  {resumenFiltradoVentas.unidadesTotales} un.
                </span>
              </div>
            </div>

            {/* Gráfico shadcn/ui BarChart: Comportamiento y Ritmo de Ventas */}
            <div className="p-4 rounded-lg border border-[#E8E6DF] bg-[#F8F7F2]/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#1C2424] uppercase tracking-wider flex items-center gap-1.5">
                  <ChartBar className="h-4 w-4 text-[#2A7A78]" weight="duotone" />
                  Ritmo de Facturación {periodoVentasTab === 'semana' ? 'Diario (Esta Semana)' : 'Semanal (Este Mes)'}
                </span>
                <span className="text-xs text-[#657373]">
                  Valores expresados en ARS ($)
                </span>
              </div>
              <ChartContainer
                config={ritmoVentasChartConfig}
                className="h-64 w-full aspect-auto mt-3"
              >
                <BarChart
                  data={
                    periodoVentasTab === 'semana'
                      ? data.graficos.barrasVentasSemana
                      : data.graficos.barrasVentasMes
                  }
                  margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E6DF" />
                  <XAxis
                    dataKey="periodo"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fill: '#657373', fontSize: 11 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fill: '#657373', fontSize: 11 }}
                    tickFormatter={(val) => `$${(val / 1000).toLocaleString('es-AR')}k`}
                  />
                  <ChartTooltip
                    cursor={{ fill: '#F3F4F6', opacity: 0.5 }}
                    content={
                      <ChartTooltipContent
                        formatter={(value) => `$${Number(value).toLocaleString('es-AR')}`}
                      />
                    }
                  />
                  <Bar
                    dataKey="Monto Facturado"
                    fill="#2A7A78"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={45}
                  />
                </BarChart>
              </ChartContainer>
            </div>

            {/* Barra de Filtros Interactivos para la Tabla de Ventas */}
            <div className="p-3 bg-[#F8F7F2]/80 rounded-xl border border-[#E8E6DF] space-y-2.5">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
                {/* 1. Input de Búsqueda Rápida */}
                <div className="relative flex-1 min-w-[220px]">
                  <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#657373]" />
                  <Input
                    type="text"
                    placeholder="Buscar por comprobante o vendedor..."
                    value={busquedaVentas}
                    onChange={(e) => cambiarBusquedaVentas(e.target.value)}
                    className="pl-9 pr-8 h-9 text-xs bg-white border-[#E8E6DF] focus:border-[#2A7A78] focus:ring-[#2A7A78]/20"
                  />
                  {busquedaVentas && (
                    <button
                      type="button"
                      onClick={() => cambiarBusquedaVentas('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#657373] hover:text-[#1C2424] cursor-pointer"
                      title="Borrar búsqueda"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* 2. Selectores de Filtro: Vendedor, Método de Pago, Estado */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Selector Vendedor */}
                  <div className="w-full sm:w-44">
                    <Select
                      value={filtroVendedorVentas}
                      onValueChange={cambiarFiltroVendedorVentas}
                    >
                      <SelectTrigger className="h-9 text-xs bg-white border-[#E8E6DF]">
                        <div className="flex items-center gap-1.5 truncate">
                          <Users className="h-3.5 w-3.5 text-[#2A7A78] shrink-0" weight="duotone" />
                          <span className="truncate">
                            {filtroVendedorVentas === 'Todos'
                              ? 'Todos los vendedores'
                              : filtroVendedorVentas}
                          </span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {vendedoresDisponibles.map((v) => (
                          <SelectItem key={v} value={v} className="text-xs">
                            {v === 'Todos' ? 'Todos los vendedores' : v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Selector Método de Pago */}
                  <div className="w-full sm:w-40">
                    <Select
                      value={filtroMetodoPagoVentas}
                      onValueChange={cambiarFiltroMetodoPagoVentas}
                    >
                      <SelectTrigger className="h-9 text-xs bg-white border-[#E8E6DF]">
                        <div className="flex items-center gap-1.5 truncate">
                          <CreditCard className="h-3.5 w-3.5 text-[#2A7A78] shrink-0" weight="duotone" />
                          <span className="truncate">
                            {filtroMetodoPagoVentas === 'Todos'
                              ? 'Todos los pagos'
                              : filtroMetodoPagoVentas === 'efectivo'
                              ? 'Efectivo'
                              : filtroMetodoPagoVentas === 'tarjeta_debito'
                              ? 'Tarjeta Débito'
                              : filtroMetodoPagoVentas === 'tarjeta_credito'
                              ? 'Tarjeta Crédito'
                              : filtroMetodoPagoVentas === 'transferencia'
                              ? 'Transferencia'
                              : filtroMetodoPagoVentas === 'mercado_pago'
                              ? 'Mercado Pago'
                              : filtroMetodoPagoVentas}
                          </span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Todos" className="text-xs">Todos los pagos</SelectItem>
                        <SelectItem value="efectivo" className="text-xs">Efectivo</SelectItem>
                        <SelectItem value="tarjeta_debito" className="text-xs">Tarjeta Débito</SelectItem>
                        <SelectItem value="tarjeta_credito" className="text-xs">Tarjeta Crédito</SelectItem>
                        <SelectItem value="transferencia" className="text-xs">Transferencia</SelectItem>
                        <SelectItem value="mercado_pago" className="text-xs">Mercado Pago</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Selector Estado */}
                  <div className="w-full sm:w-36">
                    <Select
                      value={filtroEstadoVentas}
                      onValueChange={cambiarFiltroEstadoVentas}
                    >
                      <SelectTrigger className="h-9 text-xs bg-white border-[#E8E6DF]">
                        <div className="flex items-center gap-1.5 truncate">
                          <Funnel className="h-3.5 w-3.5 text-[#2A7A78] shrink-0" weight="duotone" />
                          <span className="truncate">
                            {filtroEstadoVentas === 'Todos'
                              ? 'Todos los estados'
                              : filtroEstadoVentas === 'completada'
                              ? 'Completadas'
                              : filtroEstadoVentas === 'pendiente'
                              ? 'Pendientes'
                              : 'Canceladas'}
                          </span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Todos" className="text-xs">Todos los estados</SelectItem>
                        <SelectItem value="completada" className="text-xs">Completadas</SelectItem>
                        <SelectItem value="pendiente" className="text-xs">Pendientes</SelectItem>
                        <SelectItem value="cancelada" className="text-xs">Canceladas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Botón Reset de Filtros */}
                  {hayFiltrosVentasActivos && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={limpiarFiltrosVentas}
                      className="h-9 px-3 text-xs text-[#657373] hover:text-[#1C2424] border-[#E8E6DF] hover:bg-white active:scale-95 transition-all duration-150 cursor-pointer"
                      title="Restablecer todos los filtros"
                    >
                      <ArrowCounterClockwise className="h-3.5 w-3.5 mr-1.5" />
                      Limpiar
                    </Button>
                  )}
                </div>
              </div>

              {/* Indicador de Filtros Activos */}
              {hayFiltrosVentasActivos && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs pt-1 px-1 border-t border-[#E8E6DF]/70 text-[#657373] gap-1">
                  <span>
                    Filtros aplicados: <strong className="text-[#1C2424]">{totalVentas}</strong> operaciones encontradas de{' '}
                    <strong className="text-[#1C2424]">{listaActivaVentas.length}</strong> registradas en el período.
                  </span>
                  <span className="text-[11px] text-[#2A7A78] font-medium">
                    Métricas del panel recalculadas
                  </span>
                </div>
              )}
            </div>

            {/* Tabla de Detalle de Ventas con animación de transición */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`ventas-${periodoVentasTab}-${filtroVendedorVentas}-${filtroMetodoPagoVentas}-${filtroEstadoVentas}`}
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
                      {ventasPaginadas.length > 0 ? (
                        ventasPaginadas.map((v) => (
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
                              {getEstadoBadge(v.estado)}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="h-32 text-center text-[#657373]">
                            <div className="flex flex-col items-center justify-center gap-2 py-4">
                              <Funnel className="h-6 w-6 text-[#94A3B8]" weight="duotone" />
                              <p className="text-sm font-semibold text-[#1C2424]">
                                No se encontraron transacciones
                              </p>
                              <p className="text-xs text-[#657373]">
                                Ninguna venta coincide con los criterios de filtrado seleccionados.
                              </p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={limpiarFiltrosVentas}
                                className="h-7 px-3 text-xs mt-1 border-[#E8E6DF] hover:bg-[#F8F7F2] cursor-pointer"
                              >
                                Restablecer filtros
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
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
                      de <span className="font-semibold text-[#1C2424]">{totalVentas}</span> ventas{' '}
                      {hayFiltrosVentasActivos
                        ? `(filtradas de ${listaActivaVentas.length})`
                        : `(${periodoVentasTab === 'semana' ? 'esta semana' : 'este mes'})`}
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
                        <CaretLeft className="h-3.5 w-3.5 mr-1" />
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
                        <CaretRight className="h-3.5 w-3.5 ml-1" />
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
