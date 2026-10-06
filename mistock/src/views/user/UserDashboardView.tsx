'use client';

/**
 * ====================================================================
 * VISTA: TERMINAL DE VENTAS Y OPERACIONES (POS MOSTRADOR) (MVC - View)
 * ====================================================================
 * 
 * Propósito:
 * Pantalla de trabajo principal para el empleado / cajero de mostrador:
 * 1. Búsqueda y escáner de código de barras ultrarrápido con adición directa al ticket (Enter).
 * 2. Catálogo ágil con alternador de vista táctil (Cuadrícula POS) o compacta (Lista).
 * 3. Ticket actual multi-producto en tiempo real con selector de cantidades y subtotales.
 * 4. Cobro inmediato con múltiples medios de pago, cálculo reactivo de vuelto y emisión de ticket.
 * 5. Historial colapsable de ventas de la jornada para reimpresión ágil de comprobantes.
 */

import React, { useState, useRef } from 'react';
import {
  Barcode,
  MagnifyingGlass,
  ShoppingCart,
  Package,
  CheckCircle,
  Clock,
  CurrencyDollar,
  WarningCircle,
  Money,
  Funnel,
  CaretDown,
  CaretLeft,
  CaretRight,
  Receipt,
  Trash,
  Plus,
  Minus,
  SquaresFour,
  ListBullets,
  ArrowCounterClockwise,
  CreditCard,
  QrCode,
  Tag,
} from '@phosphor-icons/react';
import { useUserDashboardController } from '@/controllers/userControllers/userDashboardController';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
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
import { ModalCobroTicket } from './ModalCobroTicket';
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
    monedaSimbolo,
    permitirVentaSinStock,
    config,
    // Operativa del Ticket / Carrito
    carrito,
    totalCarrito,
    cantidadArticulosCarrito,
    agregarAlCarrito,
    actualizarCantidadItem,
    removerItemCarrito,
    vaciarCarrito,
    procesarVentaTicket,
  } = controller;

  // Estados de interfaz
  const [modoVistaCatalogo, setModoVistaCatalogo] = useState<'grid' | 'table'>('grid');
  const [isModalCobroOpen, setIsModalCobroOpen] = useState<boolean>(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState<VentaRecientePOS | null>(null);
  const [mostrarHistorial, setMostrarHistorial] = useState<boolean>(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  /**
   * Manejo de escáner de código de barras o Enter en el buscador:
   * Si el cajero presiona Enter y hay una coincidencia exacta de código o 1 solo producto filtrado,
   * lo añade inmediatamente al ticket y limpia el buscador para el siguiente artículo.
   */
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const query = searchQuery.trim().toLowerCase();
      if (!query) return;

      // Buscar coincidencia exacta por código de barra primero
      const exactCodeMatch = data.productosPopulares.find(
        (p) => p.codigo.toLowerCase() === query
      );

      if (exactCodeMatch) {
        agregarAlCarrito(exactCodeMatch, 1);
        setSearchQuery('');
        return;
      }

      // Si no es código exacto pero queda 1 solo producto filtrado
      if (filteredProducts.length === 1) {
        agregarAlCarrito(filteredProducts[0], 1);
        setSearchQuery('');
        return;
      }
    }
  };

  /**
   * Callback cuando se completa una venta para opcionalmente abrir el visor de ticket térmico.
   */
  const handleVentaCompletada = (venta: VentaRecientePOS) => {
    setVentaSeleccionada(venta);
  };

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="max-w-7xl mx-auto space-y-4"
      >
        {/* ==================================================================== */}
        {/* BARRA SUPERIOR: ESTADO DE CAJA & RESUMEN DE TURNO                     */}
        {/* ==================================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-[#E8E6DF] bg-white shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2A7A78] text-white shadow-xs">
              <ShoppingCart className="h-5 w-5" weight="duotone" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-[#1C2424] tracking-tight">
                  Terminal de Cobro en Mostrador
                </h1>
                <Badge variant="outline" className="text-[10px] font-bold text-[#2A7A78] border-[#2A7A78]/30 bg-[#E2F1F0]/50">
                  Caja N° {config.pos.numeroCaja || 1}
                </Badge>
                {permitirVentaSinStock && (
                  <Badge variant="warning" className="text-[10px]">
                    Sin límite stock
                  </Badge>
                )}
              </div>
              <p className="text-xs text-[#657373]">
                Punto de Venta operativo • Escaneo de código de barras y cobro inmediato.
              </p>
            </div>
          </div>

          {/* Mini-KPIs del Turno Actual */}
          <div className="flex items-center gap-3 self-end sm:self-auto text-xs">
            <div className="px-3 py-1.5 rounded-lg bg-[#F8F7F2] border border-[#E8E6DF] text-right">
              <span className="text-[10px] text-[#657373] uppercase font-semibold block">
                Recaudación Hoy
              </span>
              <span className="font-bold text-[#1C2424]">
                {monedaSimbolo} {data.recaudacionDelDia.toLocaleString('es-AR')}
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-[#F8F7F2] border border-[#E8E6DF] text-right">
              <span className="text-[10px] text-[#657373] uppercase font-semibold block">
                Tickets Hoy
              </span>
              <span className="font-bold text-[#1C2424]">
                {data.ventasDelDia} tickets
              </span>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setMostrarHistorial(!mostrarHistorial)}
              className="text-xs h-9 border-[#E8E6DF] text-[#1C2424] hover:bg-[#F8F7F2] cursor-pointer gap-1.5"
            >
              <Receipt className="h-4 w-4 text-[#2A7A78]" weight="duotone" />
              <span>{mostrarHistorial ? 'Ocultar Historial' : 'Ver Ventas'}</span>
            </Button>
          </div>
        </div>

        {/* Notificaciones de Operación */}
        <AnimatePresence>
          {saleSuccessMessage && (
            <motion.div
              key="alert-sale-success"
              initial={{ opacity: 0, height: 0, y: -6 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -6 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <Alert variant="success" className="shadow-xs border-emerald-300 bg-emerald-50">
                <CheckCircle className="h-4 w-4 text-emerald-700" weight="fill" />
                <AlertTitle className="text-emerald-900 font-bold">Cobro Registrado con Éxito</AlertTitle>
                <AlertDescription className="text-emerald-800 text-xs">{saleSuccessMessage}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          {saleErrorMessage && (
            <motion.div
              key="alert-sale-error"
              initial={{ opacity: 0, height: 0, y: -6 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -6 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <Alert variant="destructive" className="shadow-xs">
                <WarningCircle className="h-4 w-4 text-red-600" weight="fill" />
                <AlertTitle className="font-bold">Aviso de Operación</AlertTitle>
                <AlertDescription className="text-xs">{saleErrorMessage}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ==================================================================== */}
        {/* ÁREA PRINCIPAL: PANTALLA DIVIDIDA POS (CATÁLOGO + TICKET ACTIVO)       */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* ================================================================== */}
          {/* COLUMNA IZQUIERDA: CATÁLOGO Y BUSCADOR RÁPIDO (7 de 12 columnas)    */}
          {/* ================================================================== */}
          <div className="lg:col-span-7 space-y-3">
            <Card className="border-[#E8E6DF] shadow-xs">
              <CardContent className="p-4 space-y-3">
                {/* Buscador de Código de Barras y Nombre */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      ref={searchInputRef}
                      placeholder="Escanear código de barras o buscar por nombre (presione Enter para agregar)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      className="pl-9 h-10 text-xs bg-white border-[#E8E6DF] focus-visible:ring-[#2A7A78]"
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

                  {/* Alternador de Vista (Cuadrícula Táctil vs Tabla Lista) */}
                  <div className="flex items-center border border-[#E8E6DF] rounded-lg bg-white p-0.5 shrink-0 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setModoVistaCatalogo('grid')}
                      className={`p-1.5 rounded-md transition-colors cursor-pointer ${
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
                      className={`p-1.5 rounded-md transition-colors cursor-pointer ${
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

                {/* Píldoras de Categorías Rápidas */}
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
                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${
                      categoriaFiltro === 'todas' ? 'bg-white/20 text-white' : 'bg-[#E8E6DF] text-[#657373]'
                    }`}>
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
                        <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${
                          esActiva ? 'bg-white/20 text-white' : 'bg-[#E8E6DF] text-[#657373]'
                        }`}>
                          {cantidad}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* ============================================================== */}
                {/* CONTENIDO DEL CATÁLOGO (GRID TÁCTIL O TABLA COMPACTA)           */}
                {/* ============================================================== */}
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
                  /* VISTA 1: CUADRÍCULA TÁCTIL (GRID POS) */
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[500px] overflow-y-auto p-0.5">
                    {productosPaginados.map((prod) => {
                      const sinStock = prod.stock <= 0 && !permitirVentaSinStock;
                      const umbral = prod.stockMinimo ?? 5;
                      const esStockBajo = prod.stock > 0 && prod.stock <= umbral;

                      return (
                        <motion.div
                          key={prod.id}
                          whileHover={{ y: -2, scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => !sinStock && agregarAlCarrito(prod, 1)}
                          className={`p-3 rounded-xl border transition-all text-left flex flex-col justify-between shadow-2xs ${
                            sinStock
                              ? 'border-gray-200 bg-gray-50/60 opacity-60 cursor-not-allowed'
                              : 'border-[#E8E6DF] bg-white hover:border-[#2A7A78] hover:shadow-xs cursor-pointer'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-1 mb-1">
                              <span className="text-[10px] font-semibold text-[#657373] uppercase tracking-wider truncate">
                                {prod.categoria}
                              </span>
                              <Badge
                                variant={
                                  prod.stock <= 0
                                    ? 'destructive'
                                    : esStockBajo
                                    ? 'warning'
                                    : 'outline'
                                }
                                className="text-[9px] px-1.5 py-0 shrink-0"
                              >
                                {prod.stock <= 0 ? 'Sin stock' : `${prod.stock} un.`}
                              </Badge>
                            </div>
                            <h3 className="text-xs font-bold text-[#1C2424] leading-snug line-clamp-2">
                              {prod.nombre}
                            </h3>
                            <p className="text-[10px] text-[#657373] mt-0.5 font-mono">
                              Cód: {prod.codigo}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-[#E8E6DF]/60">
                            <span className="text-sm font-black text-[#1C2424]">
                              {monedaSimbolo} {prod.precio.toLocaleString('es-AR')}
                            </span>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E2F1F0] text-[#2A7A78] group-hover:bg-[#2A7A78] group-hover:text-white transition-colors">
                              <Plus className="h-3.5 w-3.5" weight="bold" />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  /* VISTA 2: LISTA / TABLA COMPACTA */
                  <div className="rounded-lg border border-[#E8E6DF] overflow-hidden max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#F8F7F2]/60">
                          <TableHead className="text-xs">Producto / Cód.</TableHead>
                          <TableHead className="text-xs">Stock</TableHead>
                          <TableHead className="text-xs">Precio</TableHead>
                          <TableHead className="text-right text-xs">Acción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productosPaginados.map((prod) => {
                          const sinStock = prod.stock <= 0 && !permitirVentaSinStock;
                          const umbral = prod.stockMinimo ?? 5;
                          const esStockBajo = prod.stock > 0 && prod.stock <= umbral;

                          return (
                            <TableRow key={prod.id} className="hover:bg-[#F8F7F2]/50">
                              <TableCell className="py-2">
                                <div className="font-semibold text-xs text-[#1C2424]">{prod.nombre}</div>
                                <div className="text-[10px] text-[#657373]">
                                  {prod.categoria} • Cód: {prod.codigo}
                                </div>
                              </TableCell>
                              <TableCell className="py-2">
                                <Badge
                                  variant={
                                    prod.stock <= 0
                                      ? 'destructive'
                                      : esStockBajo
                                      ? 'warning'
                                      : 'outline'
                                  }
                                  className="text-[10px]"
                                >
                                  {prod.stock <= 0 ? '0 un.' : `${prod.stock} un.`}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-2 font-bold text-xs text-[#1C2424]">
                                {monedaSimbolo} {prod.precio.toLocaleString('es-AR')}
                              </TableCell>
                              <TableCell className="py-2 text-right">
                                <Button
                                  size="sm"
                                  type="button"
                                  disabled={sinStock}
                                  onClick={() => agregarAlCarrito(prod, 1)}
                                  className="h-7 px-2.5 text-xs bg-[#2A7A78] hover:bg-[#205E5D] text-white shadow-2xs gap-1 cursor-pointer font-medium disabled:opacity-40"
                                >
                                  <Plus className="h-3 w-3" weight="bold" />
                                  <span>Agregar</span>
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
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPagina((p) => Math.max(p - 1, 1))}
                        disabled={pagina <= 1}
                        className="h-7 px-2 text-xs border-[#E8E6DF] hover:bg-[#F8F7F2] text-[#1C2424] disabled:opacity-40 cursor-pointer gap-1"
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
                        className="h-7 px-2 text-xs border-[#E8E6DF] hover:bg-[#F8F7F2] text-[#1C2424] disabled:opacity-40 cursor-pointer gap-1"
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
          {/* COLUMNA DERECHA: TICKET ACTUAL EN MOSTRADOR (5 de 12 columnas)       */}
          {/* ================================================================== */}
          <div className="lg:col-span-5 space-y-3">
            <Card className="border-[#E8E6DF] shadow-sm sticky top-4">
              <CardHeader className="pb-3 border-b border-[#E8E6DF] bg-[#F8F7F2]/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-[#2A7A78]" weight="duotone" />
                    <div>
                      <CardTitle className="text-sm font-bold text-[#1C2424]">
                        Ticket en Mostrador
                      </CardTitle>
                      <p className="text-[11px] text-[#657373]">
                        Orden de venta en curso para el cliente actual
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-xs font-bold text-[#2A7A78] border-[#2A7A78]/30 bg-[#E2F1F0]/50">
                      {cantidadArticulosCarrito} {cantidadArticulosCarrito === 1 ? 'ítem' : 'ítems'}
                    </Badge>
                    {carrito.length > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={vaciarCarrito}
                        className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer gap-1"
                        title="Vaciar ticket"
                      >
                        <Trash className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only">Vaciar</span>
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                {/* Lista de Renglones en el Carrito */}
                {carrito.length === 0 ? (
                  <div className="py-12 px-4 text-center border border-dashed border-[#E8E6DF] rounded-xl space-y-2">
                    <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-[#E2F1F0] text-[#2A7A78]">
                      <ShoppingCart className="h-6 w-6" weight="duotone" />
                    </div>
                    <p className="text-xs font-bold text-[#1C2424]">El ticket está vacío</p>
                    <p className="text-[11px] text-[#657373] max-w-xs mx-auto">
                      Escanee un código de barras o seleccione productos del catálogo izquierdo para armar la venta.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    <AnimatePresence initial={false}>
                      {carrito.map((item) => (
                        <motion.div
                          key={item.producto.id}
                          layout
                          initial={{ opacity: 0, y: 4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                          transition={{ duration: 0.2 }}
                          className="p-2.5 rounded-xl border border-[#E8E6DF] bg-white shadow-2xs hover:border-[#2A7A78]/40 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-xs font-bold text-[#1C2424] leading-snug">
                                {item.producto.nombre}
                              </p>
                              <p className="text-[10px] text-[#657373] font-mono mt-0.5">
                                Cód: {item.producto.codigo} • P. Unit: {monedaSimbolo} {item.producto.precio.toLocaleString('es-AR')}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => removerItemCarrito(item.producto.id)}
                              className="text-[#657373] hover:text-red-600 transition-colors p-1 cursor-pointer"
                              title="Quitar artículo"
                            >
                              <Trash className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between pt-2 mt-1.5 border-t border-[#E8E6DF]/50">
                            {/* Selector de Cantidad +/- */}
                            <div className="flex items-center border border-[#E8E6DF] rounded-lg bg-[#F8F7F2]/60 overflow-hidden">
                              <button
                                type="button"
                                onClick={() => actualizarCantidadItem(item.producto.id, item.cantidad - 1)}
                                className="h-7 w-7 flex items-center justify-center hover:bg-[#E8E6DF] text-[#1C2424] cursor-pointer transition-colors"
                                title="Restar 1"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-8 text-center text-xs font-bold text-[#1C2424] select-none">
                                {item.cantidad}
                              </span>
                              <button
                                type="button"
                                onClick={() => actualizarCantidadItem(item.producto.id, item.cantidad + 1)}
                                className="h-7 w-7 flex items-center justify-center hover:bg-[#E8E6DF] text-[#1C2424] cursor-pointer transition-colors"
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

                  {/* Botón Principal de Cobro */}
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="button"
                      disabled={carrito.length === 0}
                      onClick={() => setIsModalCobroOpen(true)}
                      className="w-full h-12 text-sm bg-emerald-700 hover:bg-emerald-800 text-white font-bold gap-2 cursor-pointer disabled:opacity-40 shadow-sm transition-all"
                    >
                      <Money className="h-5 w-5" weight="bold" />
                      <span>Cobrar Ticket ({monedaSimbolo} {totalCarrito.toLocaleString('es-AR')})</span>
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* SECCIÓN COLAPSABLE: VENTAS RECIENTES DE LA JORNADA                     */}
        {/* ==================================================================== */}
        {mostrarHistorial && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            id="historial"
          >
            <Card className="border-[#E8E6DF] shadow-xs">
              <CardHeader className="pb-3 border-b border-[#E8E6DF]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-[#2A7A78]" weight="duotone" />
                    <CardTitle className="text-sm font-bold text-[#1C2424]">
                      Historial de Ventas Recientes en Caja
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs text-[#2A7A78] border-[#2A7A78]/30 bg-[#E2F1F0]/50 font-semibold">
                    {data.ventasRecientes.length} tickets emitidos
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {ventasRecientesPaginadas.map((sale) => {
                    const esEfectivo = sale.metodoPago === 'efectivo';
                    const esMercadoPago = sale.metodoPago === 'mercado_pago';

                    return (
                      <div
                        key={sale.id}
                        onClick={() => setVentaSeleccionada(sale)}
                        className="p-3 rounded-lg border border-[#E8E6DF] bg-white hover:border-[#2A7A78] cursor-pointer shadow-2xs transition-all hover:bg-[#F8F7F2]/60"
                        title="Ver detalle del comprobante / reimprimir ticket"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-[#1C2424]">{sale.id}</span>
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
                            {esMercadoPago ? 'Mercado Pago' : sale.metodoPago?.replace('_', ' ') || 'Efectivo'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs mt-2">
                          <span className="text-[11px] text-[#657373]">{sale.hora} • {sale.cantidadItems} ítems</span>
                          <span className="font-bold text-[#2A7A78]">
                            {monedaSimbolo} {sale.montoTotal.toLocaleString('es-AR')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Paginación de Ventas */}
                {data.ventasRecientes.length > 0 && (
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#E8E6DF] text-xs text-[#657373]">
                    <div>
                      Mostrando {inicioPaginacionVentas + 1} a{' '}
                      {Math.min(inicioPaginacionVentas + itemsPorPaginaVentas, data.ventasRecientes.length)} de{' '}
                      {data.ventasRecientes.length} tickets
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPaginaVentas((p) => Math.max(p - 1, 1))}
                        disabled={paginaVentas <= 1}
                        className="h-7 px-2 text-xs border-[#E8E6DF] hover:bg-[#F8F7F2] text-[#1C2424] cursor-pointer"
                      >
                        <CaretLeft className="h-3.5 w-3.5" />
                        <span>Ant.</span>
                      </Button>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#F8F7F2] text-[#1C2424] border border-[#E8E6DF]">
                        {paginaVentas} / {totalPaginasVentas}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPaginaVentas((p) => Math.min(p + 1, totalPaginasVentas))}
                        disabled={paginaVentas >= totalPaginasVentas}
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
          </motion.div>
        )}

        {/* Modal de Cobro Multi-Ítem del Ticket */}
        <ModalCobroTicket
          isOpen={isModalCobroOpen}
          onClose={() => setIsModalCobroOpen(false)}
          items={carrito}
          total={totalCarrito}
          monedaSimbolo={monedaSimbolo}
          onConfirmarCobro={procesarVentaTicket}
          onVentaCompletada={handleVentaCompletada}
        />

        {/* Modal de Detalle de Venta y Ticket Térmico de 80mm */}
        <ModalDetalleVenta
          isOpen={!!ventaSeleccionada}
          onClose={() => setVentaSeleccionada(null)}
          venta={ventaSeleccionada}
          monedaSimbolo={monedaSimbolo}
        />
      </motion.div>
    </MotionConfig>
  );
}
