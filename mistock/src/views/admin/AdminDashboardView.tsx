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
} from 'lucide-react';
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
  } = controller;

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


  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Title & Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1C2424] tracking-tight">
          Panel del Administrador
        </h1>
        <p className="text-sm text-[#657373]">
          Métricas clave de rendimiento, alertas de reposición y control operativo.
        </p>
      </div>

      {/* Alert Banner */}
      {alertResolvedMsg && (
        <Alert variant="success">
          <Check className="h-4 w-4" />
          <AlertTitle>Acción Registrada</AlertTitle>
          <AlertDescription>{alertResolvedMsg}</AlertDescription>
        </Alert>
      )}

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.kpiMetrics.map((kpi, idx) => (
          <Card key={idx} className="p-5">
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
                <TableBody>
                  {alertasPaginadas.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell className="font-semibold">{alert.productName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{alert.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">{alert.currentStock} un.</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{alert.minThreshold} un.</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleRestockAlert(alert.id)}
                          className="gap-1.5"
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
                      className="h-7 px-2.5 text-xs text-[#1C2424] border-[#E8E6DF] hover:bg-[#F8F7F2]"
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
                      className="h-7 px-2.5 text-xs text-[#1C2424] border-[#E8E6DF] hover:bg-[#F8F7F2]"
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
              <div className="flex items-center justify-between p-3 rounded-lg border border-[#E8E6DF] bg-white">
                <div>
                  <p className="text-sm font-semibold text-[#1C2424]">Octavio Riccardo (Dueño)</p>
                  <p className="text-xs text-[#657373]">Rol: Administrador Total</p>
                </div>
                <Badge variant="default">Admin</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-[#E8E6DF] bg-white">
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

          {/* Segmented Control de pestañas */}
          <div className="inline-flex items-center p-1 bg-[#F8F7F2] rounded-lg border border-[#E8E6DF] self-start md:self-auto">
            <button
              type="button"
              onClick={() => cambiarTabRotacion('mas_vendidos')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                rotacionTab === 'mas_vendidos'
                  ? 'bg-white text-[#2A7A78] shadow-xs'
                  : 'text-[#657373] hover:text-[#1C2424]'
              }`}
            >
              Más Vendidos
            </button>

            <button
              type="button"
              onClick={() => cambiarTabRotacion('menos_vendidos')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                rotacionTab === 'menos_vendidos'
                  ? 'bg-white text-[#2A7A78] shadow-xs'
                  : 'text-[#657373] hover:text-[#1C2424]'
              }`}
            >
              Menos Vendidos
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {/* Vista 1: Solo Más Vendidos */}
          {rotacionTab === 'mas_vendidos' && (
            <div className="space-y-3">
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
                <TableBody>
                  {productosRotacionPaginados.map((prod, idx) => {
                    const esStockBajo = prod.stockActual <= 10;
                    return (
                      <TableRow key={prod.id}>
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
                      className="h-7 px-2.5 text-xs text-[#1C2424] border-[#E8E6DF] hover:bg-[#F8F7F2]"
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
                      className="h-7 px-2.5 text-xs text-[#1C2424] border-[#E8E6DF] hover:bg-[#F8F7F2]"
                      onClick={() => setPaginaRotacion((p) => Math.min(p + 1, totalPaginasRotacion))}
                      disabled={paginaRotacion >= totalPaginasRotacion}
                    >
                      Siguiente
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Vista 2: Solo Menos Vendidos */}
          {rotacionTab === 'menos_vendidos' && (
            <div className="space-y-3">
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
                <TableBody>
                  {productosRotacionPaginados.map((prod, idx) => (
                    <TableRow key={prod.id}>
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
                      className="h-7 px-2.5 text-xs text-[#1C2424] border-[#E8E6DF] hover:bg-[#F8F7F2]"
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
                      className="h-7 px-2.5 text-xs text-[#1C2424] border-[#E8E6DF] hover:bg-[#F8F7F2]"
                      onClick={() => setPaginaRotacion((p) => Math.min(p + 1, totalPaginasRotacion))}
                      disabled={paginaRotacion >= totalPaginasRotacion}
                    >
                      Siguiente
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
