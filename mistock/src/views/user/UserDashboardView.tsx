'use client';

/**
 * ====================================================================
 * VISTA: VENTAS Y OPERACIONES / TERMINAL DE CAJA (POS) (Patrón MVC - View)
 * ====================================================================
 * 
 * Propósito:
 * Proporcionar una pantalla ágil, moderna y precisa para la operación diaria en caja:
 * - Indicadores clave de la jornada (recaudación total, cantidad de tickets y stock disponible).
 * - Búsqueda en tiempo real por denominación, SKU/código y filtro por taxonomía/categorías.
 * - Sistema de paginación integrado para navegación fluida del catálogo.
 * - Despacho con opción de registro de venta en mostrador (Efectivo con cálculo reactivo de vuelto).
 * - Historial visual de ventas recientes con método de cobro e importe.
 */

import React, { useState } from 'react';
import {
  Search,
  ShoppingCart,
  Package,
  Check,
  Clock,
  DollarSign,
  AlertCircle,
  Banknote,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useUserDashboardController } from '@/controllers/userControllers/userDashboardController';
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
import { ModalVentaEfectivo } from './ModalVentaEfectivo';
import { ModalDetalleVenta } from './ModalDetalleVenta';
import { ProductoRapidoPOS, VentaRecientePOS } from '@/models/modelos_vista/dashboardModel';

interface UserDashboardViewProps {
  controller: ReturnType<typeof useUserDashboardController>;
}

export function UserDashboardView({ controller }: UserDashboardViewProps) {
  const {
    data,
    searchQuery,
    setSearchQuery,
    categoriaFiltro,
    setCategoriaFiltro,
    categorias,
    conteosPorCategoria,
    pagina,
    setPagina,
    totalPaginas,
    inicioPaginacion,
    itemsPorPagina,
    filteredProducts,
    productosPaginados,
    paginaVentas,
    setPaginaVentas,
    totalPaginasVentas,
    inicioPaginacionVentas,
    itemsPorPaginaVentas,
    ventasRecientesPaginadas,
    saleSuccessMessage,
    saleErrorMessage,
    registrarVentaEfectivo,
    monedaSimbolo,
    permitirVentaSinStock,
  } = controller;

  // Estados para apertura y control de modales
  const [productoEfectivo, setProductoEfectivo] = useState<ProductoRapidoPOS | null>(null);
  const [ventaSeleccionada, setVentaSeleccionada] = useState<VentaRecientePOS | null>(null);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1C2424] tracking-tight">
            Ventas y Operaciones
          </h1>
          <p className="text-sm text-[#657373] mt-1">
            Consulta ágil de catálogo, despacho en mostrador y registro inmediato de cobros en Efectivo.
          </p>
        </div>

        {permitirVentaSinStock && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Badge variant="warning" className="text-xs font-medium">
              Venta sin stock habilitada
            </Badge>
          </div>
        )}
      </div>

      {/* Notificaciones de Operación */}
      {saleSuccessMessage && (
        <Alert variant="success" className="shadow-xs border-emerald-300 bg-emerald-50">
          <Check className="h-4 w-4 text-emerald-700" />
          <AlertTitle className="text-emerald-900 font-bold">Cobro Registrado</AlertTitle>
          <AlertDescription className="text-emerald-800 text-xs">{saleSuccessMessage}</AlertDescription>
        </Alert>
      )}

      {saleErrorMessage && (
        <Alert variant="destructive" className="shadow-xs">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-bold">Operación No Permitida</AlertTitle>
          <AlertDescription className="text-xs">{saleErrorMessage}</AlertDescription>
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

      {/* Grid Principal: Catálogo y Despacho + Ventas Recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Catálogo y Despacho */}
        <div id="productos" className="lg:col-span-7 scroll-mt-20">
          <Card className="border-[#E8E6DF] shadow-xs">
            <CardHeader className="pb-3 border-b border-[#E8E6DF]">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-[#1C2424]">
                    Catálogo y Despacho
                  </CardTitle>
                  <p className="text-xs text-[#657373] mt-0.5">
                    Seleccione el producto para registrar el cobro en mostrador.
                  </p>
                </div>
                <Badge variant="outline" className="text-xs text-[#657373]">
                  {filteredProducts.length} productos
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-3.5">
              {/* Controles de Búsqueda y Filtro por Categorías */}
              <div className="space-y-2.5">
                <div className="flex flex-col sm:flex-row gap-2">
                  {/* Input de Búsqueda por Nombre o SKU */}
                  <div className="relative flex-1">
                    <Input
                      placeholder="Buscar por nombre, código de barra (ej. 779001)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9 text-xs bg-white"
                    />
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#657373]" />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-2.5 text-xs text-[#657373] hover:text-[#1C2424] cursor-pointer"
                        title="Limpiar búsqueda"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Selector Desplegable de Categorías */}
                  <div className="w-full sm:w-48 shrink-0">
                    <div className="relative">
                      <select
                        value={categoriaFiltro}
                        aria-label="Filtrar por categoría"
                        onChange={(e) => setCategoriaFiltro(e.target.value)}
                        className="w-full h-9 pl-8 pr-7 text-xs bg-white border border-[#E8E6DF] rounded-lg text-[#1C2424] font-medium focus:outline-none focus:ring-2 focus:ring-[#2A7A78]/20 focus:border-[#2A7A78] appearance-none cursor-pointer"
                      >
                        <option value="todas">Todas las categorías ({data.productosPopulares.length})</option>
                        {categorias.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat} ({conteosPorCategoria[cat] || 0})
                          </option>
                        ))}
                      </select>
                      <Filter className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#657373] pointer-events-none" />
                      <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-[#657373] pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Pastillas / Botones Pill de Categorías Rápidas */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => setCategoriaFiltro('todas')}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
                      categoriaFiltro === 'todas'
                        ? 'bg-[#2A7A78] text-white shadow-xs font-semibold'
                        : 'bg-[#F8F7F2] text-[#657373] hover:text-[#1C2424] hover:bg-[#E8E6DF] border border-[#E8E6DF]'
                    }`}
                  >
                    <span>Todas</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[9px] ${
                        categoriaFiltro === 'todas' ? 'bg-white/20 text-white' : 'bg-[#E8E6DF] text-[#657373]'
                      }`}
                    >
                      {data.productosPopulares.length}
                    </span>
                  </button>

                  {categorias.map((cat) => {
                    const esActiva = categoriaFiltro.toLowerCase() === cat.toLowerCase();
                    const cantidad = conteosPorCategoria[cat] || 0;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategoriaFiltro(cat)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                          esActiva
                            ? 'bg-[#2A7A78] text-white shadow-xs font-semibold'
                            : 'bg-[#F8F7F2] text-[#657373] hover:text-[#1C2424] hover:bg-[#E8E6DF] border border-[#E8E6DF]'
                        }`}
                      >
                        <span>{cat}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[9px] ${
                            esActiva ? 'bg-white/20 text-white' : 'bg-[#E8E6DF] text-[#657373]'
                          }`}
                        >
                          {cantidad}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tabla de Productos Paginados */}
              <div className="rounded-lg border border-[#E8E6DF] overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Producto</TableHead>
                      <TableHead className="text-xs">Precio Unit.</TableHead>
                      <TableHead className="text-xs">Disponibilidad</TableHead>
                      <TableHead className="text-right text-xs">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productosPaginados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-32 text-center text-[#657373]">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Package className="h-6 w-6 text-[#A0A8A8]" />
                            <p className="text-xs font-medium">No se encontraron productos para esta búsqueda o categoría.</p>
                            {(searchQuery || categoriaFiltro !== 'todas') && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSearchQuery('');
                                  setCategoriaFiltro('todas');
                                }}
                                className="text-xs h-7 text-[#2A7A78] hover:underline cursor-pointer"
                              >
                                Limpiar filtros
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      productosPaginados.map((prod) => {
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
                                type="button"
                                onClick={() => setProductoEfectivo(prod)}
                                disabled={botonDeshabilitado}
                                className="h-7 px-3 text-xs bg-[#1C2424] hover:bg-[#2A3636] text-white shadow-xs gap-1.5 cursor-pointer disabled:opacity-50 font-medium"
                                title="Registrar venta en efectivo con cálculo de vuelto"
                              >
                                <Banknote className="h-3.5 w-3.5 text-emerald-400" />
                                <span>Efectivo</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Barra de Paginación */}
              {filteredProducts.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-[#657373]">
                  <div>
                    Mostrando{' '}
                    <span className="font-semibold text-[#1C2424]">
                      {inicioPaginacion + 1}
                    </span>{' '}
                    a{' '}
                    <span className="font-semibold text-[#1C2424]">
                      {Math.min(inicioPaginacion + itemsPorPagina, filteredProducts.length)}
                    </span>{' '}
                    de{' '}
                    <span className="font-semibold text-[#1C2424]">{filteredProducts.length}</span>{' '}
                    productos
                    {categoriaFiltro !== 'todas' && (
                      <span className="ml-1 text-[11px] text-[#2A7A78] font-medium">
                        (en categoría: {categoriaFiltro})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPagina((p) => Math.max(p - 1, 1))}
                      disabled={pagina <= 1}
                      className="h-7 px-2 text-xs border-[#E8E6DF] hover:bg-[#F8F7F2] text-[#1C2424] disabled:opacity-40 cursor-pointer gap-1"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      <span>Anterior</span>
                    </Button>

                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-[#F8F7F2] text-[#1C2424] border border-[#E8E6DF]">
                      {pagina} / {totalPaginas}
                    </span>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPagina((p) => Math.min(p + 1, totalPaginas))}
                      disabled={pagina >= totalPaginas}
                      className="h-7 px-2 text-xs border-[#E8E6DF] hover:bg-[#F8F7F2] text-[#1C2424] disabled:opacity-40 cursor-pointer gap-1"
                    >
                      <span>Siguiente</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Ventas Recientes */}
        <div id="historial" className="lg:col-span-5 scroll-mt-20">
          <Card className="border-[#E8E6DF] shadow-xs">
            <CardHeader className="pb-3 border-b border-[#E8E6DF]">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-[#1C2424]">
                    Ventas Recientes en Caja
                  </CardTitle>
                  <p className="text-[11px] text-[#657373] mt-0.5">
                    Haga clic en cualquier ticket para ver su detalle de renglones.
                  </p>
                </div>
                <Badge variant="outline" className="text-xs text-[#2A7A78] border-[#2A7A78] bg-[#E2F1F0]/50 font-semibold">
                  {data.ventasRecientes.length} tickets
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-2.5">
              {ventasRecientesPaginadas.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#657373]">
                  No hay ventas registradas en la jornada.
                </div>
              ) : (
                ventasRecientesPaginadas.map((sale) => {
                  const esEfectivo = sale.metodoPago === 'efectivo';
                  const esMercadoPago = sale.metodoPago === 'mercado_pago';

                  return (
                    <div
                      key={sale.id}
                      onClick={() => setVentaSeleccionada(sale)}
                      className="flex items-center justify-between p-3 rounded-lg border border-[#E8E6DF] bg-white hover:border-[#2A7A78] hover:bg-[#F8F7F2]/60 cursor-pointer shadow-xs transition-all group"
                      title="Ver detalle del comprobante"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-[#1C2424] group-hover:text-[#2A7A78] transition-colors">
                            {sale.id}
                          </p>
                          {sale.metodoPago && (
                            <Badge
                              variant="outline"
                              className={`text-[9px] uppercase px-1.5 py-0 font-semibold ${
                                esEfectivo
                                  ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                                  : esMercadoPago
                                  ? 'border-[#009EE3]/50 text-[#009EE3] bg-[#009EE3]/10'
                                  : 'border-[#E8E6DF] text-[#657373]'
                              }`}
                            >
                              {esMercadoPago ? 'Mercado Pago' : sale.metodoPago.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-[#657373] mt-0.5 flex items-center gap-1.5">
                          <span>Hora: {sale.hora}</span>
                          <span>•</span>
                          <span>{sale.cantidadItems} ítem(s)</span>
                          <span className="text-[#2A7A78] opacity-0 group-hover:opacity-100 transition-opacity font-medium ml-1">
                            (Ver detalle ➔)
                          </span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-[#2A7A78] block">
                          {monedaSimbolo} {sale.montoTotal.toLocaleString('es-AR')}
                        </span>
                        <span className="text-[10px] text-[#657373] group-hover:text-[#2A7A78] transition-colors">
                          Ver ítems
                        </span>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Barra de Paginación de Ventas Recientes */}
              {data.ventasRecientes.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-[#E8E6DF] text-xs text-[#657373]">
                  <div>
                    Mostrando{' '}
                    <span className="font-semibold text-[#1C2424]">
                      {inicioPaginacionVentas + 1}
                    </span>{' '}
                    a{' '}
                    <span className="font-semibold text-[#1C2424]">
                      {Math.min(inicioPaginacionVentas + itemsPorPaginaVentas, data.ventasRecientes.length)}
                    </span>{' '}
                    de{' '}
                    <span className="font-semibold text-[#1C2424]">{data.ventasRecientes.length}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPaginaVentas((p) => Math.max(p - 1, 1))}
                      disabled={paginaVentas <= 1}
                      className="h-7 px-2 text-xs border-[#E8E6DF] hover:bg-[#F8F7F2] text-[#1C2424] disabled:opacity-40 cursor-pointer gap-1"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      <span>Anterior</span>
                    </Button>

                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#F8F7F2] text-[#1C2424] border border-[#E8E6DF]">
                      {paginaVentas} / {totalPaginasVentas}
                    </span>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPaginaVentas((p) => Math.min(p + 1, totalPaginasVentas))}
                      disabled={paginaVentas >= totalPaginasVentas}
                      className="h-7 px-2 text-xs border-[#E8E6DF] hover:bg-[#F8F7F2] text-[#1C2424] disabled:opacity-40 cursor-pointer gap-1"
                    >
                      <span>Siguiente</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Cobro en Efectivo */}
      <ModalVentaEfectivo
        isOpen={!!productoEfectivo}
        onClose={() => setProductoEfectivo(null)}
        producto={productoEfectivo}
        monedaSimbolo={monedaSimbolo}
        permitirVentaSinStock={permitirVentaSinStock}
        onConfirmar={registrarVentaEfectivo}
      />

      {/* Modal de Detalle de Venta (Entidad detalle_ventas) */}
      <ModalDetalleVenta
        isOpen={!!ventaSeleccionada}
        onClose={() => setVentaSeleccionada(null)}
        venta={ventaSeleccionada}
        monedaSimbolo={monedaSimbolo}
      />
    </div>
  );
}
