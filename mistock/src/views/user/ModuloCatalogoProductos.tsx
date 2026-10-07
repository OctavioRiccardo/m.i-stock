'use client';

/**
 * ====================================================================
 * SUB-VISTA POS: CATÁLOGO GENERAL DE PRODUCTOS (ModuloCatalogoProductos)
 * ====================================================================
 * 
 * Propósito:
 * Exploración visual y consulta general del catálogo con existencias en tiempo real:
 * 1. Visualización clara de todos los artículos comercializados por el negocio.
 * 2. Disponibilidad de stock en tiempo real (Disponible, Stock Bajo, Agotado).
 * 3. Búsqueda multicriterio (nombre, código/SKU o rubro) y filtrado por categoría.
 * 4. Botón directo de carga al ticket de venta para despachos desde el catálogo.
 * 5. Adaptable a cualquier modelo comercial (mostrador, kiosco, almacén o tienda).
 */

import React, { useState } from 'react';
import {
  Package,
  CheckCircle,
  WarningCircle,
  MagnifyingGlass,
  Funnel,
  SquaresFour,
  ListBullets,
  Plus,
  CaretLeft,
  CaretRight,
  Sparkle,
  Stack,
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { ProductoRapidoPOS } from '@/models/modelos_vista/dashboardModel';

interface ModuloCatalogoProductosProps {
  controller: ReturnType<typeof useUserDashboardController>;
}

export function ModuloCatalogoProductos({ controller }: ModuloCatalogoProductosProps) {
  const {
    data,
    categorias,
    conteosPorCategoria,
    busquedaCatalogo,
    setBusquedaCatalogo,
    categoriaFiltroCatalogo,
    setCategoriaFiltroCatalogo,
    disponibilidadFiltroCatalogo,
    setDisponibilidadFiltroCatalogo,
    paginaCatalogo,
    setPaginaCatalogo,
    itemsPorPaginaCatalogo,
    totalPaginasCatalogo,
    inicioPaginacionCatalogo,
    productosCatalogoFiltrados,
    productosCatalogoPaginados,
    totalUnidadesEnStock,
    productosAgotadosCount,
    productosConStockCount,
    monedaSimbolo,
    permitirVentaSinStock,
    agregarAlCarrito,
    carrito,
  } = controller;

  const [modoVista, setModoVista] = useState<'grid' | 'table'>('grid');
  const [agregadoFeedback, setAgregadoFeedback] = useState<string | null>(null);

  const handleAgregar = (producto: ProductoRapidoPOS) => {
    const exito = agregarAlCarrito(producto, 1);
    if (exito) {
      setAgregadoFeedback(`"${producto.nombre}" agregado al ticket.`);
      setTimeout(() => setAgregadoFeedback(null), 2500);
    }
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* ==================================================================== */}
      {/* RESUMEN SUPERIOR: MÉTRICAS DEL CATÁLOGO EN TIEMPO REAL               */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-[#E8E6DF] bg-white shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2A7A78] text-white shadow-xs">
              <Package className="h-5 w-5" weight="duotone" />
            </div>
            <div>
              <span className="text-[10px] text-[#657373] uppercase font-bold block">
                Artículos en Catálogo
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-[#1C2424]">
                  {data.productosPopulares.length}
                </span>
                <span className="text-[11px] text-[#657373]">productos activos</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E8E6DF] bg-white shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <Stack className="h-5 w-5" weight="duotone" />
            </div>
            <div>
              <span className="text-[10px] text-emerald-800 uppercase font-bold block">
                Total Unidades en Stock
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-emerald-900">
                  {totalUnidadesEnStock.toLocaleString('es-AR')}
                </span>
                <span className="text-[11px] text-emerald-700">unidades disponibles</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E8E6DF] bg-white shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-xs ${
                productosAgotadosCount > 0 ? 'bg-amber-500' : 'bg-[#2A7A78]'
              }`}
            >
              {productosAgotadosCount > 0 ? (
                <WarningCircle className="h-5 w-5" weight="duotone" />
              ) : (
                <CheckCircle className="h-5 w-5" weight="duotone" />
              )}
            </div>
            <div>
              <span className="text-[10px] text-[#657373] uppercase font-bold block">
                Estado del Inventario
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-[#1C2424]">
                  {productosConStockCount}
                </span>
                <span className="text-[11px] text-[#657373]">
                  con stock {productosAgotadosCount > 0 ? `(${productosAgotadosCount} agotados)` : ''}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerta flotante de feedback al agregar */}
      <AnimatePresence>
        {agregadoFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600" weight="fill" />
              <span>{agregadoFeedback}</span>
            </div>
            <span className="text-[10px] text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
              Ticket actualizado
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================================================================== */}
      {/* BANDEJA DEL CATÁLOGO: BÚSQUEDA, FILTROS Y VISTAS                     */}
      {/* ==================================================================== */}
      <Card className="border-[#E8E6DF] shadow-xs bg-white">
        <CardHeader className="pb-3 border-b border-[#E8E6DF] bg-[#F8F7F2]/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-[#2A7A78]" weight="duotone" />
              <div>
                <CardTitle className="text-sm font-bold text-[#1C2424]">
                  Catálogo General de Productos
                </CardTitle>
                <p className="text-[11px] text-[#657373]">
                  Catálogo completo del negocio con precios finales y existencias físicas al día.
                </p>
              </div>
            </div>

            {/* Alternador de Vista (Cuadrícula vs Tabla) */}
            <div className="flex items-center border border-[#E8E6DF] rounded-lg bg-white p-0.5 shrink-0 shadow-2xs self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setModoVista('grid')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1 text-xs ${
                  modoVista === 'grid'
                    ? 'bg-[#2A7A78] text-white font-medium'
                    : 'text-[#657373] hover:text-[#1C2424]'
                }`}
                title="Vista tarjetas visuales"
              >
                <SquaresFour className="h-4 w-4" weight={modoVista === 'grid' ? 'bold' : 'regular'} />
                <span className="hidden sm:inline">Tarjetas</span>
              </button>
              <button
                type="button"
                onClick={() => setModoVista('table')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1 text-xs ${
                  modoVista === 'table'
                    ? 'bg-[#2A7A78] text-white font-medium'
                    : 'text-[#657373] hover:text-[#1C2424]'
                }`}
                title="Vista tabla detallada"
              >
                <ListBullets className="h-4 w-4" weight={modoVista === 'table' ? 'bold' : 'regular'} />
                <span className="hidden sm:inline">Tabla</span>
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {/* Fila de Búsqueda y Filtros de Categoría y Disponibilidad */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
            {/* Buscador */}
            <div className="relative flex-1">
              <Input
                placeholder="Buscar artículo por nombre, código o rubro..."
                value={busquedaCatalogo}
                onChange={(e) => setBusquedaCatalogo(e.target.value)}
                className="pl-9 h-10 text-xs bg-white border-[#E8E6DF] focus-visible:ring-[#2A7A78]"
              />
              <MagnifyingGlass className="absolute left-3 top-3 h-4 w-4 text-[#657373]" />
              {busquedaCatalogo && (
                <button
                  type="button"
                  onClick={() => setBusquedaCatalogo('')}
                  className="absolute right-3 top-2.5 text-xs text-[#657373] hover:text-[#1C2424] cursor-pointer"
                  title="Limpiar"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Selector Desplegable de Categorías */}
            <div className="w-full sm:w-56 shrink-0">
              <Select
                value={categoriaFiltroCatalogo}
                onValueChange={(val) => setCategoriaFiltroCatalogo(val)}
              >
                <SelectTrigger className="h-10 text-xs bg-white border-[#E8E6DF] focus:ring-[#2A7A78] cursor-pointer">
                  <div className="flex items-center gap-1.5 truncate">
                    <Funnel className="h-3.5 w-3.5 text-[#2A7A78] shrink-0" weight="duotone" />
                    <SelectValue placeholder="Todas las categorías" />
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="todas">
                    Todas las categorías ({data.productosPopulares.length})
                  </SelectItem>
                  {categorias.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat} ({conteosPorCategoria[cat] || 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Píldoras de Filtro por Disponibilidad */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 shrink-0">
              <button
                type="button"
                onClick={() => setDisponibilidadFiltroCatalogo('todos')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                  disponibilidadFiltroCatalogo === 'todos'
                    ? 'bg-[#2A7A78] text-white font-semibold shadow-xs'
                    : 'bg-[#F8F7F2] text-[#657373] hover:text-[#1C2424] border border-[#E8E6DF]'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setDisponibilidadFiltroCatalogo('con_stock')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                  disponibilidadFiltroCatalogo === 'con_stock'
                    ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                    : 'bg-[#F8F7F2] text-[#657373] hover:text-emerald-800 border border-[#E8E6DF]'
                }`}
              >
                En Stock ({productosConStockCount})
              </button>
              <button
                type="button"
                onClick={() => setDisponibilidadFiltroCatalogo('agotados')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                  disponibilidadFiltroCatalogo === 'agotados'
                    ? 'bg-red-600 text-white font-semibold shadow-xs'
                    : 'bg-[#F8F7F2] text-[#657373] hover:text-red-700 border border-[#E8E6DF]'
                }`}
              >
                Agotados ({productosAgotadosCount})
              </button>
            </div>
          </div>

          {/* ================================================================ */}
          {/* CONTENIDO DEL CATÁLOGO (TARJETAS VISUALES O TABLA)              */}
          {/* ================================================================ */}
          {productosCatalogoFiltrados.length === 0 ? (
            <div className="py-14 px-4 text-center border border-dashed border-[#E8E6DF] rounded-xl space-y-2">
              <Package className="h-8 w-8 mx-auto text-[#A0A8A8]" weight="duotone" />
              <p className="text-xs font-bold text-[#1C2424]">
                No se encontraron productos coincidentes
              </p>
              <p className="text-[11px] text-[#657373] max-w-sm mx-auto">
                No hay artículos que coincidan con la búsqueda o el filtro de categoría seleccionado.
              </p>
              {(busquedaCatalogo || categoriaFiltroCatalogo !== 'todas' || disponibilidadFiltroCatalogo !== 'todos') && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setBusquedaCatalogo('');
                    setCategoriaFiltroCatalogo('todas');
                    setDisponibilidadFiltroCatalogo('todos');
                  }}
                  className="text-xs h-7 text-[#2A7A78] hover:underline cursor-pointer mt-1"
                >
                  Restablecer filtros
                </Button>
              )}
            </div>
          ) : modoVista === 'grid' ? (
            /* Vista Cuadrícula de Tarjetas Visuales */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {productosCatalogoPaginados.map((product) => {
                const sinStock = product.stock <= 0 && !permitirVentaSinStock;
                const enTicket = carrito.find((it) => it.producto.id === product.id);

                return (
                  <motion.div
                    key={product.id}
                    whileHover={{ y: -2 }}
                    className={`p-3.5 rounded-xl border bg-white flex flex-col justify-between transition-all shadow-2xs relative ${
                      enTicket
                        ? 'border-[#2A7A78] bg-[#E2F1F0]/20 ring-1 ring-[#2A7A78]/30'
                        : 'border-[#E8E6DF] hover:border-[#2A7A78]/60 hover:shadow-xs'
                    }`}
                  >
                    {/* Badge en ticket */}
                    {enTicket && (
                      <div className="absolute top-2 right-2 flex items-center justify-center h-5 px-1.5 rounded-full bg-[#2A7A78] text-white text-[10px] font-bold shadow-xs">
                        {enTicket.cantidad} en ticket
                      </div>
                    )}

                    <div>
                      {/* Categoría y Código */}
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0 border-[#E8E6DF] text-[#657373]">
                          {product.categoria}
                        </Badge>
                        <span className="text-[10px] font-mono text-[#A0A8A8]">{product.codigo}</span>
                      </div>

                      {/* Nombre y Promoción */}
                      <h4 className="font-bold text-xs text-[#1C2424] leading-tight line-clamp-2">
                        {product.nombre}
                      </h4>

                      {product.descripcion && (
                        <p className="text-[10px] text-[#657373] mt-1 line-clamp-2">
                          {product.descripcion}
                        </p>
                      )}

                      {/* Disponibilidad / Stock */}
                      <div className="mt-2.5 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-[#657373]">Stock disponible:</span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-md inline-flex items-center ${
                            product.stock <= 0
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : product.stock <= (product.stockMinimo ?? 5)
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {product.stock <= 0 ? 'Sin stock' : `${product.stock} un.`}
                        </span>
                      </div>
                    </div>

                    {/* Precio y Acción */}
                    <div className="pt-3 mt-2.5 border-t border-[#E8E6DF] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[#657373] uppercase font-semibold block leading-none">Precio</span>
                        <span className="text-base font-black text-[#1C2424]">
                          {monedaSimbolo} {product.precio.toLocaleString('es-AR')}
                        </span>
                      </div>

                      <Button
                        size="sm"
                        disabled={sinStock}
                        onClick={() => handleAgregar(product)}
                        className={`h-8 px-3 text-xs font-bold gap-1 shadow-xs transition-all cursor-pointer ${
                          sinStock
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        <Plus className="h-3.5 w-3.5" weight="bold" />
                        <span>{enTicket ? `Sumar (${enTicket.cantidad})` : 'Agregar'}</span>
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            /* Vista Tabla Detallada */
            <div className="rounded-lg border border-[#E8E6DF] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F8F7F2]/60">
                    <TableHead className="text-xs">Código</TableHead>
                    <TableHead className="text-xs">Artículo</TableHead>
                    <TableHead className="text-xs">Categoría</TableHead>
                    <TableHead className="text-xs text-center">Unidad</TableHead>
                    <TableHead className="text-xs text-center">Disponibilidad</TableHead>
                    <TableHead className="text-xs text-right">Precio Venta</TableHead>
                    <TableHead className="text-xs text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productosCatalogoPaginados.map((product) => {
                    const sinStock = product.stock <= 0 && !permitirVentaSinStock;
                    const enTicket = carrito.find((it) => it.producto.id === product.id);

                    return (
                      <TableRow
                        key={product.id}
                        className={`hover:bg-[#F8F7F2]/50 ${enTicket ? 'bg-[#E2F1F0]/20' : ''}`}
                      >
                        <TableCell className="py-2.5 text-xs font-mono text-[#657373]">
                          {product.codigo}
                        </TableCell>

                        <TableCell className="py-2.5">
                          <span className="text-xs font-bold text-[#1C2424] block">
                            {product.nombre}
                          </span>
                          {product.descripcion && (
                            <span className="text-[10px] text-[#A0A8A8] block truncate max-w-xs">
                              {product.descripcion}
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="py-2.5">
                          <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0 border-[#E8E6DF] text-[#657373]">
                            {product.categoria}
                          </Badge>
                        </TableCell>

                        <TableCell className="py-2.5 text-center text-xs text-[#657373]">
                          {product.unidadMedida || 'unidad'}
                        </TableCell>

                        <TableCell className="py-2.5 text-center">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-md inline-block ${
                              product.stock <= 0
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : product.stock <= (product.stockMinimo ?? 5)
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {product.stock <= 0 ? 'Sin stock' : `${product.stock} un.`}
                          </span>
                        </TableCell>

                        <TableCell className="py-2.5 text-right font-black text-sm text-[#1C2424]">
                          {monedaSimbolo} {product.precio.toLocaleString('es-AR')}
                        </TableCell>

                        <TableCell className="py-2.5 text-right">
                          <Button
                            size="sm"
                            disabled={sinStock}
                            onClick={() => handleAgregar(product)}
                            className={`h-7 px-3 text-xs font-bold gap-1 shadow-2xs cursor-pointer ${
                              sinStock
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                          >
                            <Plus className="h-3.5 w-3.5" weight="bold" />
                            <span>{enTicket ? `Sumar (${enTicket.cantidad})` : 'Agregar'}</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Paginación del Catálogo */}
          {productosCatalogoFiltrados.length > 0 && (
            <div className="flex items-center justify-between pt-2 border-t border-[#E8E6DF] text-xs text-[#657373]">
              <div>
                Mostrando {inicioPaginacionCatalogo + 1} a{' '}
                {Math.min(inicioPaginacionCatalogo + itemsPorPaginaCatalogo, productosCatalogoFiltrados.length)} de{' '}
                {productosCatalogoFiltrados.length} artículos
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPaginaCatalogo((p) => Math.max(p - 1, 1))}
                  disabled={paginaCatalogo <= 1}
                  className="h-7 px-2 text-xs border-[#E8E6DF] hover:bg-[#F8F7F2] text-[#1C2424] cursor-pointer"
                >
                  <CaretLeft className="h-3.5 w-3.5" />
                  <span>Ant.</span>
                </Button>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#F8F7F2] text-[#1C2424] border border-[#E8E6DF]">
                  {paginaCatalogo} / {totalPaginasCatalogo}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPaginaCatalogo((p) => Math.min(p + 1, totalPaginasCatalogo))}
                  disabled={paginaCatalogo >= totalPaginasCatalogo}
                  className="h-7 px-2 text-xs border-[#E8E6DF] hover:bg-[#F8F7F2] text-[#1C2424] cursor-pointer"
                >
                  <span>Sig.</span>
                  <CaretRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
