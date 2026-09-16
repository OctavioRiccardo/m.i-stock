'use client';

import React from 'react';
import {
  BarChart3,
  AlertTriangle,
  Users,
  Check,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useAdminDashboardController } from '@/controllers/adminControllers/adminDashboardController';
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
  const { data, alertResolvedMsg, handleRestockAlert } = controller;

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
                  Alertas de Stock Crítico ({data.lowStockCount})
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
                  {data.stockAlerts.map((alert) => (
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
    </div>
  );
}
