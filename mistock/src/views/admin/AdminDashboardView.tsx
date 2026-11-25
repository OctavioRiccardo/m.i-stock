'use client';

/**
 * ====================================================================
 * VISTA: MÉTRICAS Y KPIS DE RENDIMIENTO DEL NEGOCIO (Patrón MVC - View)
 * ====================================================================
 *
 * Propósito:
 * Renderizar el panel analítico ejecutivo de M.I Stock gobernado por un
 * único selector de período global, delegando rotación e historial a
 * subcomponentes en `src/views/admin/dashboard/`.
 */

import React from 'react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import {
  TrendUp,
  Receipt,
  ChartPie as PieChartIcon,
  CurrencyDollar,
  ShoppingBag,
  Package,
  CalendarBlank,
} from '@phosphor-icons/react';
import {
  Area,
  AreaChart,
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
import { PeriodoMetricas } from '@/models/modelos_vista/configuracionModel';
import { useAdminDashboardController } from '@/controllers/adminControllers/dashboardController';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SeccionRotacionDashboard } from './dashboard/SeccionRotacionDashboard';
import { SeccionHistorialVentasAdmin } from './dashboard/SeccionHistorialVentasAdmin';

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
  Efectivo: {
    label: 'Efectivo',
    color: '#2A7A78',
  },
  Transferencia: {
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
  Efectivo: '#2A7A78',
  Transferencia: '#F59E0B',
  'Tarjeta Débito/Crédito': '#6366F1',
};

interface AdminDashboardViewProps {
  controller: ReturnType<typeof useAdminDashboardController>;
}

export function AdminDashboardView({ controller }: AdminDashboardViewProps) {
  const {
    data,
    periodoMetricasActivo,
    etiquetaPeriodoActivo,
    cambiarPeriodoMetricas,
    configuracionMetricas,
    kpisActivos,
    monedaSimbolo,
  } = controller;

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

  return (
    <MotionConfig reducedMotion="user">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Encabezado Principal con Único Selector Global de Período */}
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary mb-1">
              Resumen Financiero
            </p>
            <h1 className="text-2xl font-bold text-foreground tracking-[-0.02em]">
              Métricas de Negocio
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Monitoreo financiero sincronizado por período: recaudación, cobros, rotación y operaciones.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center p-1 bg-muted/80 rounded-lg border border-border">
              <CalendarBlank className="h-4 w-4 text-primary ml-2 mr-1 shrink-0" weight="duotone" />
              <span className="text-xs font-semibold text-muted-foreground mr-2 hidden sm:inline">Período:</span>
              <div className="flex items-center gap-0.5">
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
                      className={`px-2.5 py-1.5 rounded-md text-xs transition-[background-color,color,box-shadow] duration-150 cursor-pointer flex items-center gap-1.5 ${
                        esActivo
                          ? 'bg-card text-primary font-semibold shadow-[0_1px_2px_rgba(28,36,36,0.08)]'
                          : 'font-medium text-muted-foreground hover:text-foreground hover:bg-card/50'
                      }`}
                      title={esPorDefecto ? `${op.label} (Preferencia base configurada en el sistema)` : op.label}
                    >
                      <span>{op.label}</span>
                      {esPorDefecto && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            esActivo ? 'bg-primary' : 'bg-primary/45'
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
        {/* 1. JERARQUÍA KPI ASIMÉTRICA: MÉTRICA HERO + TIRA DE SOPORTE          */}
        {/* ==================================================================== */}
        {kpisActivos.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* Métrica Rectora (Hero KPI) */}
            <motion.div
              key={kpisActivos[0].title}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
              className="lg:col-span-5"
            >
              <Card className="h-full overflow-hidden flex flex-col justify-between relative">
                <div className="absolute inset-y-0 left-0 w-1 bg-primary" aria-hidden="true" />
                <div className="p-5 sm:p-6 pl-6 sm:pl-7 flex flex-col justify-between h-full gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground block">
                        {kpisActivos[0].title}
                      </span>
                      <span className="text-xs text-foreground-subtle mt-0.5 block">
                        {etiquetaPeriodoActivo}
                      </span>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary shrink-0">
                      {getKpiIcon(0)}
                    </div>
                  </div>

                  <div>
                    <span className="text-3xl sm:text-[34px] font-bold font-mono tabular-nums text-foreground tracking-[-0.03em] leading-none block">
                      {kpisActivos[0].value}
                    </span>
                    {kpisActivos[0].changePercentage && (
                      <div className="mt-3 flex items-center gap-2">
                        <Badge
                          variant={
                            kpisActivos[0].status === 'positive'
                              ? 'success'
                              : kpisActivos[0].status === 'negative'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className="font-mono tabular-nums font-semibold text-xs px-2 py-0.5"
                        >
                          {kpisActivos[0].changePercentage}
                        </Badge>
                        <span className="text-xs text-muted-foreground">vs. período anterior</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Tira de Métricas Secundarias (Libro Mayor) */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: 0.05, ease: [0.23, 1, 0.32, 1] }}
              className="lg:col-span-7"
            >
              <Card className="h-full">
                <div className="grid grid-cols-1 sm:grid-cols-3 h-full divide-y sm:divide-y-0 sm:divide-x divide-border/80">
                  {kpisActivos.slice(1).map((kpi, subIdx) => {
                    const idx = subIdx + 1;
                    return (
                      <div
                        key={kpi.title}
                        className="p-5 flex flex-col justify-between gap-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                            {kpi.title}
                          </span>
                          <span className="text-primary/80 shrink-0">
                            {getKpiIcon(idx)}
                          </span>
                        </div>

                        <div>
                          <span className="text-2xl font-bold font-mono tabular-nums text-foreground tracking-[-0.02em] block">
                            {kpi.value}
                          </span>
                          {kpi.changePercentage && (
                            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                              <Badge
                                variant={
                                  kpi.status === 'positive'
                                    ? 'success'
                                    : kpi.status === 'negative'
                                    ? 'destructive'
                                    : 'secondary'
                                }
                                className="font-mono tabular-nums font-semibold text-[11px] px-1.5 py-0.5"
                              >
                                {kpi.changePercentage}
                              </Badge>
                              <span className="text-[11px] text-foreground-subtle">vs. ant.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </motion.div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* 2. ANALÍTICA VISUAL: EVOLUCIÓN TEMPORAL & MÉTODOS DE PAGO             */}
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

                <Badge
                  variant="outline"
                  className="self-start sm:self-auto bg-[#F8F7F2] text-[#2A7A78] border-[#E8E6DF] font-semibold text-xs px-2.5 py-1 flex items-center gap-1.5"
                >
                  <CalendarBlank className="h-3.5 w-3.5" weight="duotone" />
                  {etiquetaPeriodoActivo}
                </Badge>
              </CardHeader>

              <CardContent className="pt-4 flex-1">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`areachart-${periodoMetricasActivo}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-full h-full"
                  >
                    {data.graficos.tendenciaActiva.length > 0 ? (
                      <ChartContainer
                        config={areaChartConfig}
                        className="h-72 w-full aspect-auto"
                      >
                        <AreaChart
                          data={data.graficos.tendenciaActiva}
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
                            tickFormatter={(value) => `${monedaSimbolo}${(value / 1000).toLocaleString('es-AR')}k`}
                          />
                          <ChartTooltip
                            cursor={{ stroke: '#2A7A78', strokeWidth: 1, strokeDasharray: '4 4' }}
                            content={
                              <ChartTooltipContent
                                formatter={(value) => `${monedaSimbolo}${Number(value).toLocaleString('es-AR')}`}
                              />
                            }
                          />
                          <ChartLegend content={<ChartLegendContent />} />
                          {configuracionMetricas?.compararPeriodoAnterior !== false && (
                            <Area
                              type="monotone"
                              dataKey="Período Anterior"
                              stroke="#94A3B8"
                              strokeWidth={1.5}
                              strokeDasharray="4 4"
                              fillOpacity={1}
                              fill="url(#fillAnterior)"
                            />
                          )}
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
                    ) : (
                      <div className="h-72 flex flex-col items-center justify-center text-center px-4 bg-[#F8F7F2]/50 rounded-xl border border-dashed border-[#E8E6DF]">
                        <TrendUp className="h-7 w-7 text-[#94A3B8] mb-2" weight="duotone" />
                        <p className="text-sm font-semibold text-[#1C2424]">
                          Sin facturación registrada en {etiquetaPeriodoActivo.toLowerCase()}
                        </p>
                        <p className="text-xs text-[#657373] mt-1 max-w-sm">
                          Aún no se contabilizaron operaciones completadas en esta ventana temporal para trazar la curva evolutiva.
                        </p>
                      </div>
                    )}
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
                  Participación en ingresos ({etiquetaPeriodoActivo})
                </p>
              </CardHeader>

              <CardContent className="pt-4 flex-1 flex flex-col justify-between">
                {data.graficos.distribucionPagosActiva.length > 0 ? (
                  <>
                    <div className="flex-1 flex items-center justify-center py-2 w-full">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`donut-${periodoMetricasActivo}`}
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
                                          {monedaSimbolo}{Number(value).toLocaleString('es-AR')}
                                        </span>
                                      </div>
                                    )}
                                  />
                                }
                              />
                              <Pie
                                data={data.graficos.distribucionPagosActiva}
                                dataKey="monto"
                                nameKey="metodo"
                                innerRadius={48}
                                outerRadius={75}
                                paddingAngle={3}
                                strokeWidth={2}
                                stroke="#ffffff"
                              >
                                {data.graficos.distribucionPagosActiva.map((entry, index) => (
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
                      {data.graficos.distribucionPagosActiva.map((pago) => (
                        <div key={pago.metodo} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: COLORES_METODOS[pago.metodo] || '#2A7A78' }}
                            />
                            <span className="text-[#657373] font-medium">{pago.metodo}</span>
                          </div>
                          <span className="font-bold text-[#1C2424]">
                            {monedaSimbolo}{pago.monto.toLocaleString('es-AR')} ({pago.porcentaje}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 min-h-[240px] flex flex-col items-center justify-center text-center px-4 bg-[#F8F7F2]/50 rounded-xl border border-dashed border-[#E8E6DF]">
                    <PieChartIcon className="h-7 w-7 text-[#94A3B8] mb-2" weight="duotone" />
                    <p className="text-sm font-semibold text-[#1C2424]">
                      Sin cobros en {etiquetaPeriodoActivo.toLowerCase()}
                    </p>
                    <p className="text-xs text-[#657373] mt-1">
                      La distribución por medio de pago aparecerá al registrar ventas en caja.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <SeccionRotacionDashboard controller={controller} />

        <SeccionHistorialVentasAdmin controller={controller} />
      </div>
    </MotionConfig>
  );
}
