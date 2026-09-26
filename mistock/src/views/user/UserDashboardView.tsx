'use client';

/**
 * ====================================================================
 * VISTA: TERMINAL DE VENTAS Y CAJA (POS) (Patrón MVC - View)
 * ====================================================================
 * 
 * Propósito:
 * Proporcionar una pantalla ágil, moderna y precisa para la operación diaria en caja:
 * - Indicadores clave de la jornada (recaudación total, cantidad de ventas).
 * - Búsqueda en tiempo real por nombre, código de barras o categoría.
 * - Botón de venta rápida con descuento inmediato de stock y respeto a la regla de venta sin stock.
 * - Selección rápida del método de cobro (Efectivo, Débito, Crédito, Transferencia).
 * - Historial visual de ventas recientes con método de cobro e importe.
 */

import React from 'react';
import {
  Search,
  ShoppingCart,
  Package,
  Check,
  Clock,
  Plus,
  DollarSign,
  AlertCircle,
  Banknote,
  CreditCard,
  Smartphone,
} from 'lucide-react';
import { useUserDashboardController } from '@/controllers/userControllers/userDashboardController';
import { MetodoPago } from '@/models/modelos_dominio/ventaModel';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface UserDashboardViewProps {
  controller: ReturnType<typeof useUserDashboardController>;
}

export function UserDashboardView({ controller }: UserDashboardViewProps) {
  const {
    data,
    searchQuery,
    setSearchQuery,
    filteredProducts,
    saleSuccessMessage,
    saleErrorMessage,
    handleQuickSale,
    monedaSimbolo,
    metodoSeleccionado,
    setMetodoSeleccionado,
    permitirVentaSinStock,
    config,
  } = controller;

  const metodosDisponibles: Array<{ id: MetodoPago; label: string; icon: React.ElementType; habilitado: boolean }> = [
    { id: 'efectivo', label: 'Efectivo', icon: Banknote, habilitado: config.pos.metodosPagoHabilitados.efectivo },
    { id: 'tarjeta_debito', label: 'Débito', icon: CreditCard, habilitado: config.pos.metodosPagoHabilitados.tarjeta_debito },
    { id: 'tarjeta_credito', label: 'Crédito', icon: CreditCard, habilitado: config.pos.metodosPagoHabilitados.tarjeta_credito },
    { id: 'transferencia', label: 'QR / Transf.', icon: Smartphone, habilitado: config.pos.metodosPagoHabilitados.transferencia },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#1C2424] tracking-tight">
              Punto de Venta (POS)
            </h1>
            <Badge variant="outline" className="text-[#2A7A78] border-[#2A7A78] bg-[#E2F1F0]/50 text-xs">
              Línea de Caja
            </Badge>
          </div>
          <p className="text-sm text-[#657373] mt-1">
            Consulta ágil de catálogo, despacho en mostrador y registro inmediato de cobros.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {permitirVentaSinStock && (
            <Badge variant="warning" className="text-xs">
              Venta sin stock habilitada
            </Badge>
          )}
          <Badge variant="default" className="text-xs py-1 px-3">
            Caja Abierta
          </Badge>
        </div>
      </div>

      {/* Selector de Método de Cobro Activo */}
      <Card className="border-[#E8E6DF] shadow-xs">
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#1C2424] uppercase tracking-wider">
                Método de Cobro en Caja:
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {metodosDisponibles
                .filter((m) => m.habilitado)
                .map((m) => {
                  const Icon = m.icon;
                  const esActivo = metodoSeleccionado === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMetodoSeleccionado(m.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        esActivo
                          ? 'bg-[#2A7A78] text-white shadow-xs font-semibold'
                          : 'bg-[#F8F7F2] text-[#657373] hover:text-[#1C2424] hover:bg-[#E8E6DF]/50 border border-[#E8E6DF]'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notificaciones de Operación */}
      {saleSuccessMessage && (
        <Alert variant="success" className="shadow-xs">
          <Check className="h-4 w-4" />
          <AlertTitle>Cobro Registrado</AlertTitle>
          <AlertDescription>{saleSuccessMessage}</AlertDescription>
        </Alert>
      )}

      {saleErrorMessage && (
        <Alert variant="destructive" className="shadow-xs">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Operación No Permitida</AlertTitle>
          <AlertDescription>{saleErrorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Indicadores KPI del Turno */}
      <div id="resumen" className="grid grid-cols-1 sm:grid-cols-3 gap-4 scroll-mt-20">
        <Card className="p-5 border-[#E8E6DF] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#657373]">
              Tickets Cobrados Hoy
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E2F1F0] text-[#2A7A78]">
              <ShoppingCart className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#1C2424] tracking-tight mt-3">
            {data.ventasDelDia}
          </p>
        </Card>

        <Card className="p-5 border-[#E8E6DF] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#657373]">
              Recaudación de la Caja
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E2F1F0] text-[#2A7A78]">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#1C2424] tracking-tight mt-3">
            {monedaSimbolo} {data.recaudacionDelDia.toLocaleString('es-AR')}
          </p>
        </Card>

        <Card className="p-5 border-[#E8E6DF] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#657373]">
              Unidades Disponibles
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E2F1F0] text-[#2A7A78]">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#1C2424] tracking-tight mt-3">
            {data.totalProductosEnStock} unidades
          </p>
        </Card>
      </div>

      {/* Grid Principal: Catálogo Rápido + Ventas Recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Catálogo y Registro Rápido */}
        <div id="productos" className="lg:col-span-7 scroll-mt-20">
          <Card className="border-[#E8E6DF] shadow-xs">
            <CardHeader className="pb-3 border-b border-[#E8E6DF]">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-[#1C2424]">
                  Catálogo y Despacho Rápido
                </CardTitle>
                <Badge variant="outline" className="text-xs text-[#657373]">
                  {filteredProducts.length} productos
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              <div className="relative">
                <Input
                  placeholder="Buscar por nombre, código de barra (ej. 779001) o categoría..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#657373]" />
              </div>

              <div className="rounded-lg border border-[#E8E6DF] overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Producto</TableHead>
                      <TableHead className="text-xs">Precio</TableHead>
                      <TableHead className="text-xs">Disponibilidad</TableHead>
                      <TableHead className="text-right text-xs">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((prod) => {
                      const umbral = prod.stockMinimo ?? 5;
                      const badgeVariant =
                        prod.stock <= 0
                          ? 'destructive'
                          : prod.stock <= umbral
                          ? 'warning'
                          : 'success';

                      const badgeText =
                        prod.stock <= 0
                          ? 'Sin stock'
                          : prod.stock <= umbral
                          ? `${prod.stock} un. (Bajo)`
                          : `${prod.stock} un.`;

                      const botonDeshabilitado = prod.stock <= 0 && !permitirVentaSinStock;

                      return (
                        <TableRow key={prod.id} className="hover:bg-[#F8F7F2]/50">
                          <TableCell>
                            <div className="font-semibold text-xs text-[#1C2424]">{prod.nombre}</div>
                            <div className="text-[11px] text-[#657373]">
                              {prod.categoria} • Cód: {prod.codigo}
                            </div>
                          </TableCell>
                          <TableCell className="font-bold text-xs text-[#1C2424]">
                            {monedaSimbolo} {prod.precio.toLocaleString('es-AR')}
                          </TableCell>
                          <TableCell>
                            <Badge variant={badgeVariant} className="text-[10px]">
                              {badgeText}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => handleQuickSale(prod.id)}
                              disabled={botonDeshabilitado}
                              className="h-7 px-2.5 text-xs bg-[#2A7A78] hover:bg-[#205E5C] text-white shadow-xs gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <Plus className="h-3 w-3" />
                              <span>Vender</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ventas Recientes */}
        <div id="historial" className="lg:col-span-5 scroll-mt-20">
          <Card className="border-[#E8E6DF] shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[#E8E6DF]">
              <CardTitle className="text-base font-bold text-[#1C2424]">
                Ventas Recientes en Caja
              </CardTitle>
              <Clock className="h-4 w-4 text-[#2A7A78]" />
            </CardHeader>

            <CardContent className="pt-4 space-y-3">
              {data.ventasRecientes.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-[#E8E6DF] bg-white hover:bg-[#F8F7F2]/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-[#1C2424]">{sale.id}</p>
                      {sale.metodoPago && (
                        <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0">
                          {sale.metodoPago.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-[#657373] mt-0.5">
                      Hora: {sale.hora} • {sale.cantidadItems} ítem(s)
                    </p>
                  </div>
                  <span className="text-sm font-extrabold text-[#2A7A78]">
                    {monedaSimbolo} {sale.montoTotal.toLocaleString('es-AR')}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
