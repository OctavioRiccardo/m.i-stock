'use client';

/**
 * ====================================================================
 * VISTA: INVENTARIO GLOBAL POR CATEGORÍAS (Patrón MVC - View)
 * ====================================================================
 * 
 * Propósito:
 * Proporcionar una pantalla integral para consultar, explorar y auditar
 * el catálogo completo de productos clasificados por familias de categorías.
 * 
 * Rol en la Arquitectura:
 * - Capa View ("V") consumida por la ruta `/admininventarioglobal`.
 * - Totalmente declarativa; delega el estado y las operaciones a `useAdminInventarioGlobalController`.
 */

import React from 'react';
import Link from 'next/link';
import { motion, MotionConfig } from 'motion/react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import {
  Layers,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  PackageCheck,
  DollarSign,
  Package,
  ExternalLink,
  X,
  Boxes,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import {
  useAdminInventarioGlobalController,
  FiltroEstadoStock,
  CriterioOrdenInventario,
} from '@/controllers/adminControllers/inventarioGlobalController';
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

interface AdminInventarioGlobalViewProps {
  controller: ReturnType<typeof useAdminInventarioGlobalController>;
}

export function AdminInventarioGlobalView({ controller }: AdminInventarioGlobalViewProps) {
  const {
    categorias,
    categoriaSeleccionada,
    setCategoriaSeleccionada,
    categoriaActualObj,
    metricasCategoriaActual,
    busqueda,
    setBusqueda,
    filtroStock,
    setFiltroStock,
    ordenarPor,
    setOrdenarPor,
    pagina,
    setPagina,
    totalPaginas,
    inicioPaginacion,
    itemsPorPagina,
    conteosPorCategoria,
    metricasGlobales,
    productosFiltrados,
    productosPaginados,
    limpiarFiltros,
  } = controller;

  // Referencia para transiciones suaves al filtrar, ordenar o cambiar de página
  const [tableBodyRef] = useAutoAnimate<HTMLTableSectionElement>({ duration: 200, easing: 'ease-out' });

  const hayFiltrosActivos =
    categoriaSeleccionada !== 'todas' || busqueda.trim() !== '' || filtroStock !== 'todos';

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Encabezado Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E2F1F0] text-[#2A7A78]">
                <Layers className="h-4 w-4" />
              </div>
              <h1 className="text-2xl font-bold text-[#1C2424] tracking-tight">
                Inventario Global
              </h1>
            </div>
            <p className="text-sm text-[#657373] mt-1">
              Explora y audita el catálogo completo de productos organizado por familias de categorías.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              asChild
              size="sm"
              className="bg-[#2A7A78] hover:bg-[#205E5C] text-white shadow-sm gap-1.5"
            >
              <Link href="/admingestioninven">
                <Boxes className="h-4 w-4" />
                <span>Gestión de Inventario</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Tarjetas KPI de Resumen Global */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Artículos */}
          <Card className="p-4 border-[#E8E6DF] shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#657373]">
                Total de Artículos
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E2F1F0] text-[#2A7A78]">
                <Package className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-[#1C2424] tracking-tight mt-2">
              {metricasGlobales.totalProductos}
            </p>
            <p className="text-xs text-[#657373] mt-1">
              En {metricasGlobales.totalCategorias} categorías comerciales
            </p>
          </Card>

          {/* Card 2: Existencias Físicas */}
          <Card className="p-4 border-[#E8E6DF] shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#657373]">
                Unidades en Stock
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E2F1F0] text-[#2A7A78]">
                <PackageCheck className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-[#1C2424] tracking-tight mt-2">
              {metricasGlobales.unidadesTotales.toLocaleString('es-AR')}
            </p>
            <p className="text-xs text-[#657373] mt-1">
              Unidades físicas disponibles
            </p>
          </Card>

          {/* Card 3: Valuación del Inventario */}
          <Card className="p-4 border-[#E8E6DF] shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#657373]">
                Valuación Comercial
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E2F1F0] text-[#2A7A78]">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-[#1C2424] tracking-tight mt-2">
              ${metricasGlobales.valuacionVenta.toLocaleString('es-AR')}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-[#657373] mt-1">
              <span>Costo: ${metricasGlobales.valuacionCosto.toLocaleString('es-AR')}</span>
              <span className="text-emerald-700 font-semibold">(+{metricasGlobales.margenEstimadoPorcentaje}%)</span>
            </div>
          </Card>

          {/* Card 4: Alertas de Stock */}
          <Card className="p-4 border-[#E8E6DF] shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#657373]">
                Salud de Stock
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-2xl font-extrabold text-[#1C2424] tracking-tight">
                {metricasGlobales.articulosCriticos}
              </p>
              <span className="text-xs text-amber-700 font-semibold">críticos</span>
              {metricasGlobales.articulosSinStock > 0 && (
                <>
                  <span className="text-xs text-[#657373]">•</span>
                  <span className="text-xs text-red-600 font-semibold">
                    {metricasGlobales.articulosSinStock} agotados
                  </span>
                </>
              )}
            </div>
            <p className="text-xs text-[#657373] mt-1">
              Monitoreo contra umbrales mínimos
            </p>
          </Card>
        </div>

        {/* ====================================================================
            SELECTOR DE CATEGORÍAS (Barra interactiva de Pills / Tabs)
            ==================================================================== */}
        <Card className="border-[#E8E6DF] shadow-sm">
          <CardHeader className="pb-3 border-b border-[#E8E6DF]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base font-bold text-[#1C2424]">
                  Familias de Categorías
                </CardTitle>
                <p className="text-xs text-[#657373] mt-0.5">
                  Selecciona una categoría para examinar sus artículos o consulta el catálogo completo.
                </p>
              </div>

              {hayFiltrosActivos && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={limpiarFiltros}
                  className="h-7 text-xs text-[#657373] hover:text-[#1C2424] gap-1 self-start sm:self-auto cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Limpiar filtros</span>
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-4 space-y-4">
            {/* Barra horizontal con botones de categoría */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {/* Botón "Todas" */}
              <button
                type="button"
                onClick={() => setCategoriaSeleccionada('todas')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  categoriaSeleccionada === 'todas'
                    ? 'bg-[#2A7A78] text-white shadow-sm'
                    : 'bg-[#F8F7F2] text-[#657373] hover:text-[#1C2424] hover:bg-[#E8E6DF]'
                }`}
              >
                <span>Todas las Categorías</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    categoriaSeleccionada === 'todas'
                      ? 'bg-white/20 text-white'
                      : 'bg-[#E8E6DF] text-[#1C2424]'
                  }`}
                >
                  {metricasGlobales.totalProductos}
                </span>
              </button>

              {/* Botones de cada categoría */}
              {categorias.map((cat) => {
                const esActiva = categoriaSeleccionada === cat.id;
                const cantidad = conteosPorCategoria[cat.id] || 0;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoriaSeleccionada(cat.id)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                      esActiva
                        ? 'bg-[#2A7A78] text-white shadow-sm'
                        : 'bg-[#F8F7F2] text-[#657373] hover:text-[#1C2424] hover:bg-[#E8E6DF]'
                    }`}
                  >
                    <span>{cat.nombre}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        esActiva
                          ? 'bg-white/20 text-white'
                          : 'bg-[#E8E6DF] text-[#1C2424]'
                      }`}
                    >
                      {cantidad}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Banner Informativo cuando hay una categoría específica seleccionada */}
            {categoriaActualObj && metricasCategoriaActual && (
              <div className="p-4 rounded-xl bg-[#E2F1F0]/50 border border-[#2A7A78]/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-[#2A7A78] text-white text-xs">
                      Categoría Activa
                    </Badge>
                    <h3 className="font-bold text-[#1C2424] text-base">
                      {categoriaActualObj.nombre}
                    </h3>
                  </div>
                  {categoriaActualObj.descripcion && (
                    <p className="text-xs text-[#657373]">
                      {categoriaActualObj.descripcion}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div className="bg-white px-3 py-1.5 rounded-lg border border-[#E8E6DF] shadow-xs">
                    <span className="text-[#657373]">Artículos: </span>
                    <span className="font-bold text-[#1C2424]">
                      {metricasCategoriaActual.totalArticulos}
                    </span>
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-lg border border-[#E8E6DF] shadow-xs">
                    <span className="text-[#657373]">Unidades en Stock: </span>
                    <span className="font-bold text-[#1C2424]">
                      {metricasCategoriaActual.unidadesTotales}
                    </span>
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-lg border border-[#E8E6DF] shadow-xs">
                    <span className="text-[#657373]">Valuación Venta: </span>
                    <span className="font-bold text-[#2A7A78]">
                      ${metricasCategoriaActual.valorVentaTotal.toLocaleString('es-AR')}
                    </span>
                  </div>
                  {metricasCategoriaActual.articulosCriticos > 0 && (
                    <div className="bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 shadow-xs text-amber-700">
                      <span className="font-bold">
                        {metricasCategoriaActual.articulosCriticos}
                      </span>{' '}
                      en alerta de reposición
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ====================================================================
            TABLA Y BARRA DE FILTROS DEL CATÁLOGO
            ==================================================================== */}
        <Card className="border-[#E8E6DF] shadow-sm">
          <CardHeader className="pb-4 border-b border-[#E8E6DF] space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-bold text-[#1C2424]">
                    Productos en {categoriaActualObj ? categoriaActualObj.nombre : 'Todas las Categorías'}
                  </CardTitle>
                  <Badge variant="default" className="text-xs">
                    {productosFiltrados.length}{' '}
                    {productosFiltrados.length === 1 ? 'producto' : 'productos'}
                  </Badge>
                </div>
                <p className="text-xs text-[#657373] mt-0.5">
                  Lista detallada con precios de costo, venta, existencias actuales y umbrales mínimos.
                </p>
              </div>

              {/* Controles: Buscador, Filtro de Stock y Ordenamiento */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                {/* Buscador de texto */}
                <div className="relative w-full sm:w-56">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#657373]" />
                  <Input
                    placeholder="Buscar por SKU o nombre..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="h-9 pl-8 text-xs"
                  />
                </div>

                {/* Filtro por estado de stock */}
                <div className="w-full sm:w-44">
                  <Select
                    value={filtroStock}
                    onValueChange={(val) => setFiltroStock(val as FiltroEstadoStock)}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <Filter className="h-3.5 w-3.5 mr-1 text-[#657373]" />
                      <SelectValue placeholder="Estado de stock" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los estados</SelectItem>
                      <SelectItem value="normal">Stock Óptimo</SelectItem>
                      <SelectItem value="critico">Stock Crítico</SelectItem>
                      <SelectItem value="sin_stock">Sin Stock (Agotados)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Selector de ordenamiento */}
                <div className="w-full sm:w-44">
                  <Select
                    value={ordenarPor}
                    onValueChange={(val) => setOrdenarPor(val as CriterioOrdenInventario)}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <ArrowUpDown className="h-3.5 w-3.5 mr-1 text-[#657373]" />
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nombre_asc">Nombre (A-Z)</SelectItem>
                      <SelectItem value="nombre_desc">Nombre (Z-A)</SelectItem>
                      <SelectItem value="precio_desc">Mayor Precio Venta</SelectItem>
                      <SelectItem value="precio_asc">Menor Precio Venta</SelectItem>
                      <SelectItem value="stock_desc">Mayor Existencia</SelectItem>
                      <SelectItem value="stock_asc">Menor Existencia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {productosFiltrados.length === 0 ? (
              /* Estado vacío cuando ningún producto coincide con los filtros */
              <div className="py-16 text-center flex flex-col items-center justify-center space-y-3 px-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F8F7F2] text-[#657373]">
                  <Search className="h-6 w-6" />
                </div>
                <div className="max-w-md">
                  <p className="font-semibold text-sm text-[#1C2424]">
                    No se encontraron productos coincidentes
                  </p>
                  <p className="text-xs text-[#657373] mt-1">
                    {hayFiltrosActivos
                      ? 'Prueba modificando el término de búsqueda o restableciendo los filtros de categoría y stock.'
                      : 'Aún no hay productos registrados en esta sección.'}
                  </p>
                </div>
                {hayFiltrosActivos && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-2 text-xs border-[#2A7A78] text-[#2A7A78] hover:bg-[#E2F1F0]"
                    onClick={limpiarFiltros}
                  >
                    Restablecer todos los filtros
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Tabla de Productos */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código / SKU</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Precio Costo</TableHead>
                      <TableHead>Precio Venta</TableHead>
                      <TableHead>Stock / Mínimo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Operación</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody ref={tableBodyRef}>
                    {productosPaginados.map((prod) => {
                      const sinStock = prod.stockActual === 0;
                      const esBajoStock = !sinStock && prod.stockActual <= prod.stockMinimo;
                      const margenUnitario = prod.precioVenta - prod.precioCosto;
                      const porcentajeMargen =
                        prod.precioCosto > 0
                          ? ((margenUnitario / prod.precioCosto) * 100).toFixed(0)
                          : '100';

                      return (
                        <TableRow key={prod.id} className="hover:bg-[#F8F7F2]/50 transition-colors">
                          {/* Código SKU */}
                          <TableCell className="font-mono text-xs font-bold text-[#1C2424]">
                            {prod.codigo}
                          </TableCell>

                          {/* Nombre y descripción */}
                          <TableCell>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-sm text-[#1C2424]">
                                  {prod.nombre}
                                </span>
                                {prod.oferta && (
                                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-[10px] px-1.5 py-0">
                                    Oferta
                                  </Badge>
                                )}
                              </div>
                              {prod.descripcion && (
                                <p className="text-xs text-[#657373] line-clamp-1 mt-0.5">
                                  {prod.descripcion}
                                </p>
                              )}
                            </div>
                          </TableCell>

                          {/* Categoría */}
                          <TableCell>
                            <button
                              type="button"
                              onClick={() => setCategoriaSeleccionada(prod.categoriaId)}
                              title={`Filtrar solo categoría ${prod.categoria?.nombre || 'General'}`}
                              className="cursor-pointer"
                            >
                              <Badge
                                variant="default"
                                className="text-xs hover:bg-[#205E5C] transition-colors"
                              >
                                {prod.categoria?.nombre || 'General'}
                              </Badge>
                            </button>
                          </TableCell>

                          {/* Precio Costo */}
                          <TableCell className="text-xs text-[#657373]">
                            ${prod.precioCosto.toLocaleString('es-AR')}
                          </TableCell>

                          {/* Precio Venta y Margen */}
                          <TableCell>
                            <div className="text-sm font-bold text-[#1C2424]">
                              ${prod.precioVenta.toLocaleString('es-AR')}
                            </div>
                            <div className="text-[11px] text-emerald-700 font-medium">
                              +{porcentajeMargen}% ganancia
                            </div>
                          </TableCell>

                          {/* Stock y Umbral Mínimo */}
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`font-bold text-sm ${
                                  sinStock
                                    ? 'text-red-600'
                                    : esBajoStock
                                    ? 'text-amber-700'
                                    : 'text-[#1C2424]'
                                }`}
                              >
                                {prod.stockActual}
                              </span>
                              <span className="text-xs text-[#657373]">{prod.unidadMedida}</span>
                            </div>
                            <div className="text-[11px] text-[#657373]">
                              Mínimo: {prod.stockMinimo} {prod.unidadMedida}
                            </div>
                          </TableCell>

                          {/* Badge de Estado de Stock */}
                          <TableCell>
                            {sinStock ? (
                              <Badge variant="destructive" className="text-xs">
                                Sin Stock
                              </Badge>
                            ) : esBajoStock ? (
                              <Badge
                                variant="destructive"
                                className="text-xs bg-amber-600 hover:bg-amber-600"
                              >
                                Stock Crítico
                              </Badge>
                            ) : (
                              <Badge variant="success" className="text-xs">
                                Óptimo
                              </Badge>
                            )}
                          </TableCell>

                          {/* Acciones */}
                          <TableCell className="text-right">
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs px-2.5 text-[#2A7A78] hover:bg-[#E2F1F0] border-[#E8E6DF] gap-1"
                              title="Editar en Gestión de Inventario"
                            >
                              <Link href="/admingestioninven">
                                <ExternalLink className="h-3 w-3" />
                                <span>Gestionar</span>
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Paginación de Inventario Global */}
                {productosFiltrados.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 px-4 pb-3 border-t border-[#E8E6DF] text-xs text-[#657373]">
                    <div>
                      Mostrando <span className="font-semibold text-[#1C2424]">{inicioPaginacion + 1}</span> a{' '}
                      <span className="font-semibold text-[#1C2424]">
                        {Math.min(inicioPaginacion + itemsPorPagina, productosFiltrados.length)}
                      </span>{' '}
                      de <span className="font-semibold text-[#1C2424]">{productosFiltrados.length}</span> productos
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-xs text-[#1C2424] border-[#E8E6DF] hover:bg-[#F8F7F2] active:scale-95 transition-all duration-150 cursor-pointer"
                        onClick={() => setPagina(Math.max(pagina - 1, 1))}
                        disabled={pagina <= 1}
                      >
                        <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                        Anterior
                      </Button>
                      <span className="px-2 font-medium text-[#1C2424]">
                        {pagina} / {totalPaginas}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-xs text-[#1C2424] border-[#E8E6DF] hover:bg-[#F8F7F2] active:scale-95 transition-all duration-150 cursor-pointer"
                        onClick={() => setPagina(Math.min(pagina + 1, totalPaginas))}
                        disabled={pagina >= totalPaginas}
                      >
                        Siguiente
                        <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </MotionConfig>
  );
}
