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
                        ? "Escanear código de barras o buscar producto (Enter para agregar)..."
                        : "Buscar producto por código o nombre..."
                      : "Caja cerrada · Abrir la caja desde la barra superior para operar"
                  }
                  value={searchQuery}
                  maxLength={120}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="pl-9 h-10 text-xs"
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
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Comprobar el código escaneado o el filtro de categoría.
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
                      whileTap={deshabilitado ? {} : { scale: 0.985 }}
                      onClick={() => !deshabilitado && agregarAlCarrito(product, 1)}
                      className={`p-3 rounded-xl border transition-[background-color,border-color] duration-150 flex flex-col justify-between relative group ${
                        deshabilitado
                          ? 'bg-muted/50 border-border opacity-60 cursor-not-allowed'
                          : itemEnCarrito
                          ? 'bg-secondary/50 border-primary cursor-pointer'
                          : 'bg-card border-border hover:border-primary/70 hover:bg-background/60 cursor-pointer'
                      }`}
                    >
                      {itemEnCarrito && (
                        <div className="absolute top-2 right-2 flex items-center justify-center h-5 px-2 rounded-full bg-primary text-primary-foreground font-mono tabular-nums text-[10px] font-bold">
                          {itemEnCarrito.cantidad} en ticket
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0">
                            {product.categoria}
                          </Badge>
                          <span className="text-[10px] font-mono text-foreground-subtle">{product.codigo}</span>
                        </div>
                        <h4 className="font-semibold text-xs text-foreground line-clamp-2 leading-snug">
                          {product.nombre}
                        </h4>

                        {/* Indicador de Unidades Disponibles */}
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="text-[11px] text-muted-foreground">Stock:</span>
                          <span
                            className={`text-[11px] font-mono tabular-nums font-semibold px-2 py-0.5 rounded-md inline-flex items-center ${
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

                      <div className="pt-2.5 mt-2 border-t border-border/70 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-[0.06em] font-semibold block leading-none">Precio</span>
                          <span className="text-sm font-bold font-mono tabular-nums text-foreground">
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
                          className={`min-h-8 px-2.5 text-xs font-semibold gap-1 ${
                            deshabilitado
                              ? 'bg-muted text-muted-foreground cursor-not-allowed shadow-none'
                              : ''
                          }`}
                        >
                          <Plus className="h-3.5 w-3.5" weight="bold" />
                          <span>
                            {!controller.cajaAbierta
                              ? 'Cerrada'
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
                          className={deshabilitado ? 'opacity-60 bg-muted/40' : ''}
                        >
                          <TableCell className="py-2 text-xs font-mono text-muted-foreground">
                            {product.codigo}
                          </TableCell>
                          <TableCell className="py-2">
                            <span className="text-xs font-semibold text-foreground block">
                              {product.nombre}
                            </span>
                          </TableCell>
                          <TableCell className="py-2">
                            <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0">
                              {product.categoria}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2.5 text-right">
                            <span
                              className={`text-xs font-mono tabular-nums font-semibold px-2 py-0.5 rounded-md inline-block ${
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
                          <TableCell className="py-2.5 text-right font-mono font-bold tabular-nums text-sm text-foreground">
                            {monedaSimbolo} {product.precio.toLocaleString('es-AR')}
                          </TableCell>
                          <TableCell className="py-2.5 text-right">
                            <Button
                              size="sm"
                              disabled={deshabilitado}
                              onClick={() => !deshabilitado && agregarAlCarrito(product, 1)}
                              className={`min-h-8 px-3 text-xs font-semibold gap-1 ${
                                deshabilitado
                                  ? 'bg-muted text-muted-foreground cursor-not-allowed shadow-none'
                                  : ''
                              }`}
                            >
                              <Plus className="h-3.5 w-3.5" weight="bold" />
                              <span>
                                {!controller.cajaAbierta
                                  ? 'Cerrada'
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
      {/* COLUMNA DERECHA: COMPROBANTE TÉRMICO VIVO (ELEMENTO FIRMA POS)     */}
      {/* ================================================================== */}
      <div className="lg:col-span-5 sticky top-4">
        <Card className="overflow-hidden">
          <div className="h-1 w-full bg-primary" aria-hidden="true" />
          <div className="p-4 border-b border-border/80 bg-background/70 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-primary">
                <ShoppingCart className="h-4 w-4" weight="duotone" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground leading-tight tracking-[-0.01em]">
                  Ticket en Curso
                </h3>
                <span className="font-mono tabular-nums text-[11px] text-muted-foreground">
                  {cantidadArticulosCarrito} {cantidadArticulosCarrito === 1 ? 'ítem' : 'ítems'}
                </span>
              </div>
            </div>

            {carrito.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                disabled={!controller.cajaAbierta}
                onClick={vaciarCarrito}
                className="min-h-8 px-2.5 text-xs text-red-700 hover:text-red-800 hover:bg-red-50 gap-1"
                title="Vaciar ticket completo"
              >
                <Trash className="h-3.5 w-3.5" />
                <span>Vaciar</span>
              </Button>
            )}
          </div>

          <CardContent className="p-4 space-y-3.5">
            {carrito.length === 0 ? (
              <div className="py-12 px-4 text-center border border-dashed border-border rounded-xl bg-background/40 space-y-2">
                <div className="flex h-11 w-11 mx-auto items-center justify-center rounded-full bg-muted text-foreground-subtle">
                  <ShoppingCart className="h-5 w-5" weight="duotone" />
                </div>
                <p className="text-sm font-semibold text-foreground">Ticket listo y vacío</p>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Escanear un código de barras o seleccionar productos del catálogo para iniciar una venta.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {carrito.map((item) => (
                    <motion.div
                      key={item.producto.id}
                      initial={{ opacity: 0, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.12 }}
                      className="p-3 rounded-lg border border-border/80 bg-background/50 hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold text-foreground truncate">
                            {item.producto.nombre}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground font-mono tabular-nums">
                            <span>{item.producto.codigo}</span>
                            <span className="text-border">·</span>
                            <span>{monedaSimbolo} {item.producto.precio.toLocaleString('es-AR')} c/u</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={!controller.cajaAbierta}
                          onClick={() => removerItemCarrito(item.producto.id)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Quitar artículo"
                          aria-label={`Quitar ${item.producto.nombre}`}
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-dashed border-border">
                        {/* Selector de Cantidad táctil POS */}
                        <div className="flex items-center border border-border rounded-lg bg-card overflow-hidden">
                          <button
                            type="button"
                            disabled={!controller.cajaAbierta}
                            onClick={() => actualizarCantidadItem(item.producto.id, item.cantidad - 1)}
                            className="h-8 w-8 flex items-center justify-center hover:bg-muted text-foreground cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Restar 1"
                            aria-label="Restar 1 unidad"
                          >
                            <Minus className="h-3.5 w-3.5" weight="bold" />
                          </button>
                          <span className="min-w-12 px-2 py-1 text-center font-mono tabular-nums text-xs font-bold text-secondary-foreground bg-secondary/70 border-x border-border select-none">
                            {item.cantidad}
                          </span>
                          <button
                            type="button"
                            disabled={!controller.cajaAbierta}
                            onClick={() => actualizarCantidadItem(item.producto.id, item.cantidad + 1)}
                            className="h-8 w-8 flex items-center justify-center hover:bg-muted text-foreground cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Sumar 1"
                            aria-label="Sumar 1 unidad"
                          >
                            <Plus className="h-3.5 w-3.5" weight="bold" />
                          </button>
                        </div>

                        {/* Subtotal del Renglón */}
                        <div className="text-right">
                          <span className="font-mono tabular-nums text-sm font-bold text-foreground">
                            {monedaSimbolo} {item.subtotal.toLocaleString('es-AR')}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Resumen Financiero estilo Comprobante Térmico y Botón de Cobro */}
            <div className="pt-3.5 receipt-divider space-y-3.5">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal ({cantidadArticulosCarrito} {cantidadArticulosCarrito === 1 ? 'artículo' : 'artículos'})</span>
                  <span className="font-mono tabular-nums font-semibold text-foreground-secondary">
                    {monedaSimbolo} {totalCarrito.toLocaleString('es-AR')}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-2.5 receipt-divider">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
                    Total a cobrar
                  </span>
                  <span className="text-3xl font-bold font-mono tabular-nums text-foreground tracking-[-0.03em]">
                    {monedaSimbolo} {totalCarrito.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              {/* Botón Principal de Cobro o Caja Cerrada */}
              {!controller.cajaAbierta ? (
                <Button
                  type="button"
                  disabled
                  className="w-full min-h-12 text-sm bg-muted text-muted-foreground font-semibold gap-2 cursor-not-allowed shadow-none"
                >
                  <Lock className="h-4 w-4" weight="bold" />
                  <span>Caja Cerrada</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  size="lg"
                  disabled={carrito.length === 0}
                  onClick={onAbrirCobro}
                  className="w-full min-h-12 text-sm font-bold gap-2"
                >
                  <Money className="h-5 w-5" weight="bold" />
                  <span>Cobrar Ticket</span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
