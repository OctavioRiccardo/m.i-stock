'use client';

/**
 * ====================================================================
 * VISTA: PANEL PRINCIPAL DEL ADMINISTRADOR (Patrón MVC - View)
 * ====================================================================
 * 
 * Propósito:
 * Renderizar de forma puramente declarativa las métricas financieras,
 * los indicadores clave (KPIs) y la tabla de reposición de stock crítico.
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
  AlertTriangle,
  Users,
  Check,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Receipt,
} from 'lucide-react';
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

/**
 * Props esperadas por la vista del panel del Administrador.
 * Recibe el controlador fuertemente tipado.
 */
interface AdminDashboardViewProps {
  controller: ReturnType<typeof useAdminDashboardController>;
}

/**
 * Componente de Vista del Panel de Administración.
 */
export function AdminDashboardView({ controller }: AdminDashboardViewProps) {
  const {
    data,
    alertResolvedMsg,
    handleRestockAlert,
    rotacionTab,
    cambiarTabRotacion,
    paginaStockCritico,
    setPaginaStockCritico,
    itemsPorPaginaStock,
    paginaRotacion,
    setPaginaRotacion,
    itemsPorPaginaRotacion,
    periodoVentasTab,
    cambiarPeriodoVentas,
    paginaVentas,
    setPaginaVentas,
    itemsPorPaginaVentas,
  } = controller;

  // Referencias para auto-animación en tablas (transiciones suaves en paginación y reposición)
  const [stockTableBodyRef] = useAutoAnimate<HTMLTableSectionElement>({ duration: 220, easing: 'ease-out' });
  const [masVendidosTableBodyRef] = useAutoAnimate<HTMLTableSectionElement>({ duration: 220, easing: 'ease-out' });
  const [menosVendidosTableBodyRef] = useAutoAnimate<HTMLTableSectionElement>({ duration: 220, easing: 'ease-out' });
  const [ventasTableBodyRef] = useAutoAnimate<HTMLTableSectionElement>({ duration: 220, easing: 'ease-out' });

  // Cálculos de Paginación para Alertas de Stock Crítico
  const totalStockAlerts = data.stockAlerts.length;
  const totalPaginasStock = Math.ceil(totalStockAlerts / itemsPorPaginaStock) || 1;
  const inicioStock = (paginaStockCritico - 1) * itemsPorPaginaStock;
  const alertasPaginadas = data.stockAlerts.slice(
    inicioStock,
    inicioStock + itemsPorPaginaStock
  );

  // Cálculos de Paginación para Rotación de Stock
  const listaActivaRotacion =
    rotacionTab === 'mas_vendidos'
      ? data.productosMasVendidos
      : data.productosMenosVendidos;
  const totalRotacion = listaActivaRotacion.length;
  const totalPaginasRotacion =
    Math.ceil(totalRotacion / itemsPorPaginaRotacion) || 1;
  const inicioRotacion = (paginaRotacion - 1) * itemsPorPaginaRotacion;
  const productosRotacionPaginados = listaActivaRotacion.slice(
    inicioRotacion,
    inicioRotacion + itemsPorPaginaRotacion
  );

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
        {/* Title & Header */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <h1 className="text-2xl font-bold text-[#1C2424] tracking-tight">
            Panel del Administrador
          </h1>
          <p className="text-sm text-[#657373]">
            Métricas clave de rendimiento, alertas de reposición y control operativo.
          </p>
        </motion.div>

        {/* Alert Banner con AnimatePresence */}
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

        {/* KPI Metrics Grid con animación staggered sutil */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.kpiMetrics.map((kpi, idx) => (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: idx * 0.05, ease: 'easeOut' }}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
            >
              <Card className="p-5 h-full transition-shadow duration-200 hover:shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#657373]">
                    {kpi.title}
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E2F1F0] text-[#2A7A78]">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                </div>

                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-[#1C2424] tracking-tight">
                    {kpi.value}
                  </span>
                  {kpi.changePercentage && (
                    <Badge
                      variant={kpi.status === 'positive' ? 'success' : kpi.status === 'negative' ? 'destructive' : 'secondary'}
                      className="gap-1 font-medium"
                    >
                      {kpi.status === 'positive' ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : kpi.status === 'negative' ? (
                        <TrendingDown className="h-3 w-3" />
                      ) : null}
                      {kpi.changePercentage}
                    </Badge>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Alertas de Stock Crítico */}
        <div className="lg:col-span-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <CardTitle className="text-base font-bold">
                  Stock Crítico
                </CardTitle>
              </div>
              <Badge variant="destructive">Atención requerida</Badge>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Stock Actual</TableHead>
                    <TableHead>Mínimo</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody ref={stockTableBodyRef}>
                  {alertasPaginadas.map((alert) => (
                    <TableRow key={alert.id} className="transition-colors">
                      <TableCell className="font-semibold">{alert.nombreProducto}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{alert.categoria}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">{alert.stockActual} un.</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{alert.umbralMinimo} un.</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleRestockAlert(alert.id)}
                          className="gap-1.5 active:scale-95 transition-all duration-150 cursor-pointer"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>Reponer</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginación de Stock Crítico */}
              {totalStockAlerts > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 px-4 pb-3 border-t border-[#E8E6DF] text-xs text-[#657373]">
                  <div>
                    Mostrando <span className="font-semibold text-[#1C2424]">{inicioStock + 1}</span> a{' '}
                    <span className="font-semibold text-[#1C2424]">
                      {Math.min(inicioStock + itemsPorPaginaStock, totalStockAlerts)}
                    </span>{' '}
                    de <span className="font-semibold text-[#1C2424]">{totalStockAlerts}</span> alertas
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 px-2.5 text-xs text-[#1C2424] border-[#E8E6DF] hover:bg-[#F8F7F2] active:scale-95 transition-all duration-150 cursor-pointer"
                      onClick={() => setPaginaStockCritico((p) => Math.max(p - 1, 1))}
                      disabled={paginaStockCritico <= 1}
                    >
                      <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                      Anterior
                    </Button>
                    <span className="px-2 font-medium text-[#1C2424]">
                      {paginaStockCritico} / {totalPaginasStock}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 px-2.5 text-xs text-[#1C2424] border-[#E8E6DF] hover:bg-[#F8F7F2] active:scale-95 transition-all duration-150 cursor-pointer"
                      onClick={() => setPaginaStockCritico((p) => Math.min(p + 1, totalPaginasStock))}
                      disabled={paginaStockCritico >= totalPaginasStock}
                    >
                      Siguiente
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Control de Usuarios */}
        <div className="lg:col-span-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[#2A7A78]" />
                <CardTitle className="text-base font-bold">Control de Usuarios</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-[#E8E6DF] bg-white transition-colors duration-150 hover:border-[#2A7A78]/30 hover:bg-[#F8F7F2]/40">
                <div>
                  <p className="text-sm font-semibold text-[#1C2424]">Octavio Riccardo (Dueño)</p>
                  <p className="text-xs text-[#657373]">Rol: Administrador Total</p>
                </div>
                <Badge variant="default">Admin</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-[#E8E6DF] bg-white transition-colors duration-150 hover:border-[#2A7A78]/30 hover:bg-[#F8F7F2]/40">
                <div>
                  <p className="text-sm font-semibold text-[#1C2424]">Empleado Turno Mañana</p>
                  <p className="text-xs text-[#657373]">Rol: Cajero / Operador</p>
                </div>
                <Badge variant="secondary">Usuario</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tarjeta de Rotación: Productos Más Vendidos y Menos Vendidos */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between pb-4 gap-3 border-b border-[#E8E6DF]">
          <div>
            <CardTitle className="text-base font-bold text-[#1C2424]">
              Rotación de Productos y Stock
            </CardTitle>
            <p className="text-xs text-[#657373] mt-1">
              Monitoreo de artículos con mayor demanda comercial vs. productos con bajo movimiento o stock inmovilizado.
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

        <CardContent className="pt-4 overflow-hidden">
          <AnimatePresence mode="wait">
            {/* Vista 1: Solo Más Vendidos */}
            {rotacionTab === 'mas_vendidos' && (
              <motion.div
                key="tab-mas-vendidos"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="space-y-3"
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center">#</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Unidades Vendidas</TableHead>
                      <TableHead>Monto Recaudado</TableHead>
                      <TableHead>Stock Actual</TableHead>
                      <TableHead className="text-right">Atención de Stock</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody ref={masVendidosTableBodyRef}>
                    {productosRotacionPaginados.map((prod, idx) => {
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
                            <Badge variant="default" className="text-xs">
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
                                Stock Bajo / Reponer
                              </Badge>
                            ) : (
                              <Badge variant="success" className="text-xs">
                                Stock Óptimo
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Paginación de Más Vendidos */}
                {totalRotacion > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 px-1 border-t border-[#E8E6DF] text-xs text-[#657373]">
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

            {/* Vista 2: Solo Menos Vendidos */}
            {rotacionTab === 'menos_vendidos' && (
              <motion.div
                key="tab-menos-vendidos"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="space-y-3"
              >
                <Table>
                  <TableHeader>
                    <TableRow>
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
                    {productosRotacionPaginados.map((prod, idx) => (
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
                    ))}
                  </TableBody>
                </Table>

                {/* Paginación de Menos Vendidos */}
                {totalRotacion > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 px-1 border-t border-[#E8E6DF] text-xs text-[#657373]">
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

      {/* Tarjeta de Detalle de Ventas: Semana y Mes */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between pb-4 gap-3 border-b border-[#E8E6DF]">
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-[#2A7A78]" />
              <CardTitle className="text-base font-bold text-[#1C2424]">
                Detalle de Ventas
              </CardTitle>
            </div>
            <p className="text-xs text-[#657373] mt-1">
              Registro pormenorizado de operaciones comerciales facturadas durante el período.
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

        <CardContent className="pt-4 overflow-hidden space-y-4">
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
              <Table>
                <TableHeader>
                  <TableRow>
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

              {/* Paginación de Detalle de Ventas */}
              {totalVentas > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 px-1 border-t border-[#E8E6DF] text-xs text-[#657373]">
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
