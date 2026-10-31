'use client';

/**
 * ====================================================================
 * SUB-VISTA POS: TERMINAL DE COBRO EN MOSTRADOR (ModuloTerminalCobro)
 * ====================================================================
 * 
 * Propósito:
 * Pantalla de trabajo táctil y de alta velocidad para el cajero:
 * 1. Escaneo por código de barras o búsqueda de texto con Enter-to-cart (según modoEscanerRapido).
 * 2. Catálogo con alternador de vista táctil (Cuadrícula POS) o compacta (Tabla).
 * 3. Selector de categorías dinámico.
 * 4. Carrito / Ticket multi-ítem con modificación de cantidades y subtotales en vivo.
 * 5. Botón de checkout ágil hacia el modal de cobro multi-método.
 */

import React, { useRef } from 'react';
import {
  Barcode,
  Package,
  ShoppingCart,
  Trash,
  Plus,
  Minus,
  SquaresFour,
  ListBullets,
  Funnel,
  CaretLeft,
  CaretRight,
  Money,
  Lock,
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
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

interface ModuloTerminalCobroProps {
  controller: ReturnType<typeof useUserDashboardController>;
  onAbrirCobro: () => void;
}

export function ModuloTerminalCobro({
  controller,
  onAbrirCobro,
}: ModuloTerminalCobroProps) {
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
    monedaSimbolo,
    permitirVentaSinStock,
    config,
    // Carrito
    carrito,
    totalCarrito,
    cantidadArticulosCarrito,
    agregarAlCarrito,
    actualizarCantidadItem,
    removerItemCarrito,
    vaciarCarrito,
  } = controller;

  const [modoVistaCatalogo, setModoVistaCatalogo] = React.useState<'grid' | 'table'>('grid');
  const searchInputRef = useRef<HTMLInputElement>(null);

  /**
   * Manejo de escáner de código de barras o tecla Enter en el buscador:
   * Si el modo escáner rápido está activo y hay una coincidencia exacta de código de barras
   * o queda un solo producto filtrado, lo agrega inmediatamente al ticket y limpia el buscador.
   */
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!controller.cajaAbierta) return;
      if (!config.pos.modoEscanerRapido) return;
      const query = searchQuery.trim().toLowerCase();
      if (!query) return;

      const exactCodeMatch = data.productosPopulares.find(
        (p) => p.codigo.toLowerCase() === query
      );

      if (exactCodeMatch) {
        agregarAlCarrito(exactCodeMatch, 1);
        setSearchQuery('');
        return;
      }

      if (filteredProducts.length === 1) {
        agregarAlCarrito(filteredProducts[0], 1);
        setSearchQuery('');
        return;
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* ================================================================== */}
      {/* COLUMNA IZQUIERDA: CATÁLOGO Y BUSCADOR RÁPIDO (7 de 12 cols)       */}
      {/* ================================================================== */}
      <div className="lg:col-span-7 space-y-3">
        <Card className="border-[#E8E6DF] shadow-xs">
          <CardContent className="p-4 space-y-3">
            {/* Buscador + Dropdown de Categorías + Alternador de Vista */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {/* Buscador de Código de Barras y Nombre */}
              <div className="relative flex-1">
                <Input
                  ref={searchInputRef}
                  disabled={!controller.cajaAbierta}
                  placeholder={
                    controller.cajaAbierta
                      ? config.pos.modoEscanerRapido
                        ? "Escanear código de barras o buscar por nombre (presione Enter)..."
                        : "Buscar producto por código o nombre..."
                      : "Caja cerrada • Abra la caja desde la barra superior para operar"
                  }
                  value={searchQuery}
                  maxLength={120}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="pl-9 h-10 text-xs bg-white border-[#E8E6DF] focus-visible:ring-[#2A7A78] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                  autoFocus
                />
                <Barcode className="absolute left-3 top-2.5 h-5 w-5 text-[#657373]" />
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

              {/* Lista Desplegable con Todas las Categorías */}
              <div className="w-full sm:w-52 shrink-0">
                <Select
                  value={categoriaFiltro}
                  onValueChange={(val) => setCategoriaFiltro(val)}
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

              {/* Alternador de Vista (Cuadrícula Táctil vs Tabla Lista) */}
              <div className="flex items-center border border-[#E8E6DF] rounded-lg bg-white p-0.5 shrink-0 shadow-2xs self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setModoVistaCatalogo('grid')}
                  className={`p-2 rounded-md transition-colors cursor-pointer ${
                    modoVistaCatalogo === 'grid'
                      ? 'bg-[#2A7A78] text-white'
                      : 'text-[#657373] hover:text-[#1C2424]'
                  }`}
                  title="Vista cuadrícula táctil"
                >
                  <SquaresFour className="h-4 w-4" weight={modoVistaCatalogo === 'grid' ? 'bold' : 'regular'} />
                </button>
                <button
                  type="button"
                  onClick={() => setModoVistaCatalogo('table')}
                  className={`p-2 rounded-md transition-colors cursor-pointer ${
                    modoVistaCatalogo === 'table'
                      ? 'bg-[#2A7A78] text-white'
                      : 'text-[#657373] hover:text-[#1C2424]'
                  }`}
                  title="Vista lista compacta"
                >
                  <ListBullets className="h-4 w-4" weight={modoVistaCatalogo === 'table' ? 'bold' : 'regular'} />
                </button>
              </div>
            </div>

            {/* Contenido del Catálogo: Cuadrícula vs Tabla */}
            {filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-[#657373] border border-dashed border-[#E8E6DF] rounded-xl">
                <Package className="h-8 w-8 mx-auto text-[#A0A8A8] mb-1.5" weight="duotone" />
                <p className="text-xs font-medium">No se encontraron productos coincidentes.</p>
                <p className="text-[11px] text-[#A0A8A8] mt-0.5">
                  Verifique el código escaneado o la categoría seleccionada.
                </p>
                {(searchQuery || categoriaFiltro !== 'todas') && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSearchQuery('');
                      setCategoriaFiltro('todas');
                    }}
                    className="text-xs h-7 text-[#2A7A78] hover:underline cursor-pointer mt-2"
                  >
                    Limpiar filtros
                  </Button>
                )}
              </div>
            ) : modoVistaCatalogo === 'grid' ? (
              /* Vista Cuadrícula */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {productosPaginados.map((product) => {
                  const sinStock = product.stock <= 0 && !permitirVentaSinStock;
                  const deshabilitado = sinStock || !controller.cajaAbierta;
                  const itemEnCarrito = carrito.find((it) => it.producto.id === product.id);

                  return (
                    <motion.div
                      key={product.id}
                      whileHover={deshabilitado ? {} : { y: -2, scale: 1.01 }}
                      whileTap={deshabilitado ? {} : { scale: 0.98 }}
                      onClick={() => !deshabilitado && agregarAlCarrito(product, 1)}
                      className={`p-3 rounded-xl border transition-all flex flex-col justify-between relative group ${
                        deshabilitado
                          ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
                          : itemEnCarrito
                          ? 'bg-[#E2F1F0]/40 border-[#2A7A78] shadow-xs cursor-pointer'
                          : 'bg-white border-[#E8E6DF] hover:border-[#2A7A78] hover:bg-[#F8F7F2]/60 shadow-2xs cursor-pointer'
                      }`}
                    >
                      {itemEnCarrito && (
                        <div className="absolute top-2 right-2 flex items-center justify-center h-5 px-1.5 rounded-full bg-[#2A7A78] text-white text-[10px] font-bold shadow-xs">
                          {itemEnCarrito.cantidad} en ticket
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0 border-[#E8E6DF] text-[#657373]">
                            {product.categoria}
                          </Badge>
                          <span className="text-[10px] font-mono text-[#A0A8A8]">{product.codigo}</span>
                        </div>
                        <h4 className="font-semibold text-xs text-[#1C2424] line-clamp-2 leading-tight">
                          {product.nombre}
                        </h4>

                        {/* Indicador de Unidades Disponibles */}
                        <div className="mt-2 flex items-center justify-between text-xs">
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

                      <div className="pt-2.5 mt-2 border-t border-[#E8E6DF]/60 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-[#657373] uppercase font-semibold block leading-none">Precio</span>
                          <span className="text-sm font-black text-[#1C2424]">
                            {monedaSimbolo} {product.precio.toLocaleString('es-AR')}
                          </span>
                        </div>

                        <Button
                          type="button"
                          size="sm"
                          disabled={deshabilitado}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!deshabilitado) agregarAlCarrito(product, 1);
                          }}
                          className={`h-7 px-2.5 text-xs font-bold gap-1 shadow-xs transition-all ${
                            deshabilitado
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                          }`}
                        >
                          <Plus className="h-3.5 w-3.5" weight="bold" />
                          <span>
                            {!controller.cajaAbierta
                              ? 'Caja cerrada'
                              : itemEnCarrito
                              ? `Sumar (${itemEnCarrito.cantidad})`
                              : 'Agregar'}
                          </span>
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              /* Vista Tabla Compacta */
              <div className="rounded-lg border border-[#E8E6DF] overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#F8F7F2]/60">
                      <TableHead className="text-xs">Código</TableHead>
                      <TableHead className="text-xs">Producto</TableHead>
                      <TableHead className="text-xs">Categoría</TableHead>
                      <TableHead className="text-xs text-right">Stock</TableHead>
                      <TableHead className="text-xs text-right">Precio</TableHead>
                      <TableHead className="text-xs text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productosPaginados.map((product) => {
                      const sinStock = product.stock <= 0 && !permitirVentaSinStock;
                      const deshabilitado = sinStock || !controller.cajaAbierta;
                      const itemEnCarrito = carrito.find((it) => it.producto.id === product.id);

                      return (
                        <TableRow
                          key={product.id}
                          className={`hover:bg-[#F8F7F2]/50 ${deshabilitado ? 'opacity-60 bg-gray-50/50' : ''}`}
                        >
                          <TableCell className="py-2 text-xs font-mono text-[#657373]">
                            {product.codigo}
                          </TableCell>
                          <TableCell className="py-2">
                            <span className="text-xs font-semibold text-[#1C2424] block">
                              {product.nombre}
                            </span>
                          </TableCell>
                          <TableCell className="py-2">
                            <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0 border-[#E8E6DF] text-[#657373]">
                              {product.categoria}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2.5 text-right">
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
                              disabled={deshabilitado}
                              onClick={() => !deshabilitado && agregarAlCarrito(product, 1)}
                              className={`h-7 px-3 text-xs font-bold gap-1 shadow-2xs ${
                                deshabilitado
                                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                              }`}
                            >
                              <Plus className="h-3.5 w-3.5" weight="bold" />
                              <span>
                                {!controller.cajaAbierta
                                  ? 'Caja cerrada'
                                  : itemEnCarrito
                                  ? `Sumar (${itemEnCarrito.cantidad})`
                                  : 'Agregar'}
                              </span>
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
            {filteredProducts.length > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-[#E8E6DF] text-xs text-[#657373]">
                <div>
                  Mostrando {inicioPaginacion + 1} a{' '}
                  {Math.min(inicioPaginacion + itemsPorPagina, filteredProducts.length)} de{' '}
                  {filteredProducts.length} productos
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPagina((p) => Math.max(p - 1, 1))}
                    disabled={pagina <= 1}
                    className="h-7 px-2 text-xs border-[#E8E6DF] hover:bg-[#F8F7F2] text-[#1C2424] cursor-pointer"
                  >
                    <CaretLeft className="h-3.5 w-3.5" />
                    <span>Ant.</span>
                  </Button>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#F8F7F2] text-[#1C2424] border border-[#E8E6DF]">
                    {pagina} / {totalPaginas}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPagina((p) => Math.min(p + 1, totalPaginas))}
                    disabled={pagina >= totalPaginas}
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

      {/* ================================================================== */}
      {/* COLUMNA DERECHA: TICKET / CARRITO DE VENTA ACTIVO (5 de 12 cols)    */}
      {/* ================================================================== */}
      <div className="lg:col-span-5 sticky top-4">
        <Card className="border-[#E8E6DF] shadow-sm bg-white overflow-hidden">
          <div className="p-3.5 border-b border-[#E8E6DF] bg-[#F8F7F2]/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2A7A78] text-white">
                <ShoppingCart className="h-4 w-4" weight="duotone" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1C2424] leading-tight">
                  Ticket de Venta en Curso
                </h3>
                <span className="text-[11px] text-[#657373]">
                  {cantidadArticulosCarrito} {cantidadArticulosCarrito === 1 ? 'artículo' : 'artículos'} agregados
                </span>
              </div>
            </div>

            {carrito.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                disabled={!controller.cajaAbierta}
                onClick={vaciarCarrito}
                className="h-7 px-2 text-[11px] text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Vaciar ticket completo"
              >
                <Trash className="h-3.5 w-3.5" />
                <span>Vaciar</span>
              </Button>
            )}
          </div>

          <CardContent className="p-3.5 space-y-3">
            {carrito.length === 0 ? (
              <div className="py-12 px-4 text-center border border-dashed border-[#E8E6DF] rounded-xl space-y-2">
                <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-[#F8F7F2] text-[#A0A8A8]">
                  <ShoppingCart className="h-6 w-6" weight="duotone" />
                </div>
                <p className="text-xs font-bold text-[#1C2424]">El ticket está listo y vacío</p>
                <p className="text-[11px] text-[#657373] max-w-xs mx-auto">
                  Escanee un código de barras o seleccione productos del catálogo para comenzar a registrar la venta.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {carrito.map((item) => (
                    <motion.div
                      key={item.producto.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="p-2.5 rounded-lg border border-[#E8E6DF] bg-white hover:border-[#2A7A78]/50 shadow-2xs transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-[#1C2424] truncate">
                            {item.producto.nombre}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#657373]">
                            <span className="font-mono">{item.producto.codigo}</span>
                            <span>•</span>
                            <span>{monedaSimbolo} {item.producto.precio.toLocaleString('es-AR')} c/u</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={!controller.cajaAbierta}
                          onClick={() => removerItemCarrito(item.producto.id)}
                          className="text-[#657373] hover:text-red-600 transition-colors p-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Quitar artículo"
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-2 mt-1.5 border-t border-[#E8E6DF]/50">
                        {/* Selector de Cantidad */}
                        <div className="flex items-center border border-[#E8E6DF] rounded-lg bg-[#F8F7F2]/60 overflow-hidden shadow-2xs">
                          <button
                            type="button"
                            disabled={!controller.cajaAbierta}
                            onClick={() => actualizarCantidadItem(item.producto.id, item.cantidad - 1)}
                            className="h-7 w-7 flex items-center justify-center hover:bg-[#E8E6DF] text-[#1C2424] cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Restar 1"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="min-w-11 px-1.5 py-0.5 text-center text-xs font-black text-emerald-950 bg-emerald-50 border-x border-[#E8E6DF] select-none">
                            {item.cantidad} un.
                          </span>
                          <button
                            type="button"
                            disabled={!controller.cajaAbierta}
                            onClick={() => actualizarCantidadItem(item.producto.id, item.cantidad + 1)}
                            className="h-7 w-7 flex items-center justify-center hover:bg-[#E8E6DF] text-[#1C2424] cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Sumar 1"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Subtotal del Renglón */}
                        <div className="text-right">
                          <span className="text-xs font-black text-[#1C2424]">
                            {monedaSimbolo} {item.subtotal.toLocaleString('es-AR')}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Resumen Financiero y Botón de Cobro */}
            <div className="pt-3 border-t border-[#E8E6DF] space-y-3">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-[#657373]">
                  <span>Subtotal ({cantidadArticulosCarrito} artículos):</span>
                  <span className="font-semibold text-[#1C2424]">
                    {monedaSimbolo} {totalCarrito.toLocaleString('es-AR')}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-1 border-t border-dashed border-[#E8E6DF]">
                  <span className="text-sm font-bold text-[#1C2424]">TOTAL A COBRAR:</span>
                  <span className="text-2xl font-black text-emerald-800 tracking-tight">
                    {monedaSimbolo} {totalCarrito.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              {/* Botón Principal de Cobro o Caja Cerrada */}
              {!controller.cajaAbierta ? (
                <Button
                  type="button"
                  disabled
                  className="w-full h-12 text-sm bg-gray-200 text-gray-500 font-bold gap-2 cursor-not-allowed shadow-none"
                >
                  <Lock className="h-5 w-5" weight="bold" />
                  <span>Caja Cerrada</span>
                </Button>
              ) : (
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="button"
                    disabled={carrito.length === 0}
                    onClick={onAbrirCobro}
                    className="w-full h-12 text-sm bg-emerald-700 hover:bg-emerald-800 text-white font-bold gap-2 cursor-pointer disabled:opacity-40 shadow-sm transition-all"
                  >
                    <Money className="h-5 w-5" weight="bold" />
                    <span>Cobrar Ticket</span>
                  </Button>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
