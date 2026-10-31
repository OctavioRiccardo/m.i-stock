'use client';

/**
 * ====================================================================
 * VISTA: GESTIÓN DE INVENTARIO (Patrón MVC - View)
 * ====================================================================
 * 
 * Propósito:
 * Centralizar en una única consola operativa libre de duplicaciones el
 * alta de productos y categorías, el diagnóstico de salud de stock con
 * filtrado directo, la reposición/edición comercial y las bajas lógicas.
 */

import React, { useState } from 'react';
import { motion, MotionConfig } from 'motion/react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import {
  Plus,
  Check,
  WarningCircle as AlertCircle,
  Barcode,
  FolderPlus,
  ArrowsClockwise as RefreshCw,
  TrendUp as TrendingUp,
  TrendDown as TrendingDown,
  Tag,
  Package as PackagePlus,
  Archive,
  PencilSimple as FileEdit,
  ArrowLeft,
  MagnifyingGlass as Search,
  ArrowCounterClockwise as RotateCcw,
  Trash as Trash2,
  CaretLeft as ChevronLeft,
  CaretRight as ChevronRight,
  Warning as AlertTriangle,
  Package as Boxes,
  CheckCircle as PackageCheck,
  X,
} from '@phosphor-icons/react';
import {
  useAdminInventarioController,
  FiltroEstadoComercial,
} from '@/controllers/adminControllers/inventarioController';
import {
  FormularioCargaProducto,
  valoresInicialesCargaProducto,
} from '@/models/modelos_vista/cargaProductoModel';
import { Producto, UnidadMedida } from '@/models/modelos_dominio/productoModel';
import { LIMITES_TEXTO, MAX_PRECIO_DB, MAX_STOCK_DB, esSkuValido } from '@/lib/validaciones';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AdminGestionInventarioProps {
  controller: ReturnType<typeof useAdminInventarioController>;
}

// Opciones predefinidas para la unidad de medida
const unidadesDisponibles: { value: UnidadMedida; label: string }[] = [
  { value: 'unidad', label: 'Unidad (un.)' },
  { value: 'kg', label: 'Kilogramo (kg)' },
  { value: 'gramo', label: 'Gramo (g)' },
  { value: 'litro', label: 'Litro (L)' },
  { value: 'metro', label: 'Metro (m)' },
  { value: 'paquete', label: 'Paquete / Pack' },
];

export function AdminGestionInventarioView({ controller }: AdminGestionInventarioProps) {
  const {
    seccionActiva,
    setSeccionActiva,
    categorias,
    categoriaFiltroHub,
    setCategoriaFiltroHub,
    filtroStockHub,
    setFiltroStockHub,
    filtroEstadoHub,
    setFiltroEstadoHub,
    busquedaHub,
    setBusquedaHub,
    conteosPorCategoria,
    productosFiltradosHub,
    metricasStockHub,
    limpiarFiltrosHub,
    paginaInventario,
    setPaginaInventario,
    itemsPorPaginaInventario,
    loading,
    mensajeExito,
    mensajeError,
    agregarCategoria,
    guardarProducto,
    darDeBajaProducto,
    reactivarProducto,
    modificarProducto,
    limpiarMensajes,
    config,
  } = controller;

  // Auto-animaciones para transiciones suaves en la tabla unificada
  const [inventarioTableBodyRef] = useAutoAnimate<HTMLTableSectionElement>({
    duration: 200,
    easing: 'ease-out',
  });

  // Paginación del catálogo operativo
  const totalPaginasInventario = Math.max(
    1,
    Math.ceil(productosFiltradosHub.length / itemsPorPaginaInventario)
  );
  const inicioInventario = (paginaInventario - 1) * itemsPorPaginaInventario;
  const productosPaginadosHub = productosFiltradosHub.slice(
    inicioInventario,
    inicioInventario + itemsPorPaginaInventario
  );

  const hayFiltrosHubActivos =
    categoriaFiltroHub !== 'todas' ||
    filtroStockHub !== 'todos' ||
    filtroEstadoHub !== 'activos' ||
    busquedaHub.trim() !== '';

  // ==========================================
  // ESTADOS: MODAL DE NUEVA CATEGORÍA
  // ==========================================
  const [modalCatOpened, setModalCatOpened] = useState(false);
  const [nuevaCatNombre, setNuevaCatNombre] = useState('');
  const [nuevaCatDesc, setNuevaCatDesc] = useState('');
  const [errorCat, setErrorCat] = useState<string | null>(null);

  // ==========================================
  // ESTADOS: FORMULARIO DE ALTA
  // ==========================================
  const [formData, setFormData] = useState<FormularioCargaProducto>(() => ({
    ...valoresInicialesCargaProducto,
    stockMinimo: config?.inventario?.umbralMinimoPorDefecto ?? valoresInicialesCargaProducto.stockMinimo,
  }));
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormularioCargaProducto, string>>>({});

  const setFieldValue = <K extends keyof FormularioCargaProducto>(
    field: K,
    value: FormularioCargaProducto[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const categoriaSeleccionada = categorias.find((c) => c.id === formData.categoriaId);

  // Rentabilidad calculada en tiempo real (Alta)
  const costo = Number(formData.precioCosto) || 0;
  const venta = Number(formData.precioVenta) || 0;
  const gananciaNeta = venta - costo;
  const margenPorcentaje = costo > 0 ? ((gananciaNeta / costo) * 100).toFixed(1) : '100.0';
  const esRentable = venta >= costo;

  // ==========================================
  // ESTADOS: MODALES DE BAJA Y EDICIÓN
  // ==========================================
  const [productoABajar, setProductoABajar] = useState<Producto | null>(null);
  const [motivoBaja, setMotivoBaja] = useState('');

  const [modalEditarOpened, setModalEditarOpened] = useState(false);
  const [productoAEditar, setProductoAEditar] = useState<Producto | null>(null);
  const [formEdicion, setFormEdicion] = useState<{
    nombre: string;
    codigo: string;
    categoriaId: string;
    unidadMedida: UnidadMedida;
    precioCosto: number;
    precioVenta: number;
    stockActual: number;
    stockMinimo: number;
    descripcion: string;
  }>({
    nombre: '',
    codigo: '',
    categoriaId: '',
    unidadMedida: 'unidad',
    precioCosto: 0,
    precioVenta: 0,
    stockActual: 0,
    stockMinimo: 0,
    descripcion: '',
  });

  // Rentabilidad calculada en tiempo real (Edición)
  const costoEdicion = Number(formEdicion.precioCosto) || 0;
  const ventaEdicion = Number(formEdicion.precioVenta) || 0;
  const gananciaEdicion = ventaEdicion - costoEdicion;
  const margenEdicion = costoEdicion > 0 ? ((gananciaEdicion / costoEdicion) * 100).toFixed(1) : '100.0';
  const esRentableEdicion = ventaEdicion >= costoEdicion;

  // ==========================================
  // HANDLERS
  // ==========================================
  const handleCrearCategoria = () => {
    if (!nuevaCatNombre.trim()) {
      setErrorCat('El nombre de la categoría es obligatorio.');
      return;
    }

    const res = agregarCategoria(nuevaCatNombre, nuevaCatDesc);
    if (!res.exito || !res.categoria) {
      setErrorCat(res.mensaje);
      return;
    }
    const nueva = res.categoria;
    if (seccionActiva === 'alta') {
      setFieldValue('categoriaId', nueva.id);
    }
    setNuevaCatNombre('');
    setNuevaCatDesc('');
    setErrorCat(null);
    setModalCatOpened(false);
  };

  const handleGenerarSku = () => {
    const prefijo = categoriaSeleccionada
      ? categoriaSeleccionada.nombre
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^A-Za-z0-9]/g, '')
          .slice(0, 3)
          .toUpperCase() || 'SKU'
      : 'SKU';
    const num = Math.floor(1000 + Math.random() * 9000);
    setFieldValue('codigo', `${prefijo}-${num}`);
  };

  const handleSubmitAlta = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Partial<Record<keyof FormularioCargaProducto, string>> = {};
    if (!formData.categoriaId || formData.categoriaId.trim() === '') {
      errors.categoriaId = 'Debe seleccionar una categoría para el producto.';
    }
    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre del producto es obligatorio.';
    }
    if (!formData.codigo.trim()) {
      errors.codigo = 'El código de barras / SKU es obligatorio.';
    }
    if (formData.precioVenta <= 0) {
      errors.precioVenta = 'El precio de venta debe ser mayor a 0.';
    }
    if (formData.stockInicial < 0) {
      errors.stockInicial = 'El stock inicial no puede ser negativo.';
    }

    if (formData.codigo.trim() && !esSkuValido(formData.codigo)) {
      errors.codigo = `El SKU debe tener entre ${LIMITES_TEXTO.SKU_MIN} y ${LIMITES_TEXTO.SKU_MAX} caracteres (sin espacios).`;
    }
    if (formData.precioCosto < 0 || formData.precioCosto > MAX_PRECIO_DB) {
      errors.precioCosto = `El costo debe estar entre $0 y $${MAX_PRECIO_DB.toLocaleString('es-AR')}.`;
    }
    if (formData.precioVenta > MAX_PRECIO_DB) {
      errors.precioVenta = `El precio no puede superar $${MAX_PRECIO_DB.toLocaleString('es-AR')}.`;
    }
    if (formData.stockInicial > MAX_STOCK_DB) {
      errors.stockInicial = `El stock no puede superar ${MAX_STOCK_DB.toLocaleString('es-AR')} unidades.`;
    }
    if (formData.stockMinimo < 0 || formData.stockMinimo > MAX_STOCK_DB) {
      errors.stockMinimo = `El stock mínimo debe estar entre 0 y ${MAX_STOCK_DB.toLocaleString('es-AR')}.`;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const res = guardarProducto(formData);
    if (res.exito) {
      const catPrevia = formData.categoriaId;
      setFormData({
        ...valoresInicialesCargaProducto,
        categoriaId: catPrevia,
        stockMinimo: config?.inventario?.umbralMinimoPorDefecto ?? valoresInicialesCargaProducto.stockMinimo,
      });
      setFieldErrors({});
    }
  };

  const handleConfirmarBaja = () => {
    if (!productoABajar) return;
    darDeBajaProducto(productoABajar.id, motivoBaja);
    setProductoABajar(null);
    setMotivoBaja('');
  };

  const handleAbrirEdicion = (prod: Producto) => {
    setProductoAEditar(prod);
    setFormEdicion({
      nombre: prod.nombre,
      codigo: prod.codigo,
      categoriaId: prod.categoriaId,
      unidadMedida: prod.unidadMedida || 'unidad',
      precioCosto: prod.precioCosto,
      precioVenta: prod.precioVenta,
      stockActual: prod.stockActual,
      stockMinimo: prod.stockMinimo,
      descripcion: prod.descripcion || '',
    });
    setModalEditarOpened(true);
  };

  const handleGuardarEdicion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoAEditar) return;

    const exito = modificarProducto(productoAEditar.id, formEdicion);
    if (exito) {
      setModalEditarOpened(false);
      setProductoAEditar(null);
    }
  };

  const totalBaseEstado =
    filtroEstadoHub === 'activos'
      ? metricasStockHub.activos
      : filtroEstadoHub === 'inactivos'
      ? metricasStockHub.inactivos
      : metricasStockHub.total;

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Alertas Globales de Notificación */}
        {mensajeExito && (
          <Alert variant="success" className="cursor-pointer shadow-sm" onClick={limpiarMensajes}>
            <Check className="h-4 w-4" />
            <AlertTitle>Operación Exitosa</AlertTitle>
            <AlertDescription>{mensajeExito}</AlertDescription>
          </Alert>
        )}

        {mensajeError && (
          <Alert variant="destructive" className="cursor-pointer shadow-sm" onClick={limpiarMensajes}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Atención</AlertTitle>
            <AlertDescription>{mensajeError}</AlertDescription>
          </Alert>
        )}

        {/* ====================================================================
          CASO 1: HUB OPERATIVO UNIFICADO DE INVENTARIO
          ==================================================================== */}
        {seccionActiva === 'menu' && (
          <div className="space-y-6">
            {/* Encabezado Principal con Acciones Directas */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#1C2424] tracking-tight">
                  Gestión de Inventario
                </h1>
                <p className="text-sm text-[#657373] mt-0.5">
                  Administración operativa del catálogo comercial: altas, reposición de stock, edición de precios y bajas lógicas.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModalCatOpened(true)}
                  className="text-xs border-[#2A7A78]/30 text-[#2A7A78] hover:bg-[#E2F1F0] gap-1.5 cursor-pointer"
                >
                  <FolderPlus className="h-4 w-4" weight="duotone" />
                  <span>Nueva Categoría</span>
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    if (categoriaFiltroHub !== 'todas') {
                      setFieldValue('categoriaId', categoriaFiltroHub);
                    }
                    setSeccionActiva('alta');
                  }}
                  className="bg-[#2A7A78] hover:bg-[#205E5C] text-white shadow-sm text-xs gap-1.5 cursor-pointer"
                >
                  <Plus className="h-4 w-4" weight="bold" />
                  <span>Nuevo Producto</span>
                </Button>
              </div>
            </div>

            {/* ====================================================================
              DIAGNÓSTICO Y CONTROL DE SALUD DEL INVENTARIO (Filtro Único de Stock)
              ==================================================================== */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-[#1C2424] flex items-center gap-2">
                    <Boxes className="h-4 w-4 text-[#2A7A78]" />
                    Diagnóstico y Control de Stock
                  </h2>
                  <p className="text-xs text-[#657373]">
                    Selecciona una tarjeta para filtrar instantáneamente los artículos según su estado de abastecimiento.
                  </p>
                </div>

                {filtroStockHub !== 'todos' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFiltroStockHub('todos')}
                    className="h-8 text-xs border-[#E8E6DF] text-[#657373] hover:text-[#1C2424] cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    Ver todos los niveles
                  </Button>
                )}
              </div>

              {/* Banner de Alerta Crítica si hay artículos en riesgo */}
              {metricasStockHub.criticos > 0 && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600 mt-0.5">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-rose-900">
                        Atención: {metricasStockHub.criticos}{' '}
                        {metricasStockHub.criticos === 1 ? 'producto requiere' : 'productos requieren'} revisión inmediata por stock crítico
                      </h3>
                      <p className="text-xs text-rose-700 mt-0.5">
                        Las existencias físicas están iguales o por debajo del umbral mínimo configurado. Filtra para priorizar órdenes de compra o reponer unidades.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 text-xs font-medium bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                      onClick={() => setFiltroStockHub(filtroStockHub === 'critico' ? 'todos' : 'critico')}
                    >
                      {filtroStockHub === 'critico' ? 'Mostrar todos' : `Ver críticos (${metricasStockHub.criticos})`}
                    </Button>
                  </div>
                </div>
              )}

              {/* Grid de Métricas de Salud de Stock (4 estados mutuamente excluyentes) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                {/* Crítico */}
                <button
                  type="button"
                  aria-pressed={filtroStockHub === 'critico'}
                  onClick={() => setFiltroStockHub(filtroStockHub === 'critico' ? 'todos' : 'critico')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40 ${
                    filtroStockHub === 'critico'
                      ? 'border-rose-500 bg-rose-50/80 shadow-xs ring-2 ring-rose-500/20'
                      : 'border-[#E8E6DF] bg-white hover:border-rose-300 hover:bg-rose-50/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-rose-700">Stock Crítico</span>
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-2xl font-extrabold tracking-tight tabular-nums text-rose-700">
                      {metricasStockHub.criticos}
                    </span>
                    <span className="text-xs font-medium text-rose-700/80">
                      {metricasStockHub.criticos === 1 ? 'producto' : 'productos'}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#657373]">
                    Igual o por debajo del stock mínimo
                  </p>
                  <p className="mt-2 text-[11px] font-medium text-rose-600/90">
                    {filtroStockHub === 'critico' ? 'Filtro activo • Clic para quitar' : 'Clic para filtrar'}
                  </p>
                </button>

                {/* Bajas Unidades */}
                <button
                  type="button"
                  aria-pressed={filtroStockHub === 'bajo'}
                  onClick={() => setFiltroStockHub(filtroStockHub === 'bajo' ? 'todos' : 'bajo')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 ${
                    filtroStockHub === 'bajo'
                      ? 'border-amber-500 bg-amber-50/80 shadow-xs ring-2 ring-amber-500/20'
                      : 'border-[#E8E6DF] bg-white hover:border-amber-300 hover:bg-amber-50/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-amber-700">Bajas Unidades</span>
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-2xl font-extrabold tracking-tight tabular-nums text-amber-700">
                      {metricasStockHub.bajasUnidades}
                    </span>
                    <span className="text-xs font-medium text-amber-700/80">
                      {metricasStockHub.bajasUnidades === 1 ? 'producto' : 'productos'}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#657373]">
                    Próximos al umbral mínimo
                  </p>
                  <p className="mt-2 text-[11px] font-medium text-amber-600/90">
                    {filtroStockHub === 'bajo' ? 'Filtro activo • Clic para quitar' : 'Clic para filtrar'}
                  </p>
                </button>

                {/* Agotados */}
                <button
                  type="button"
                  aria-pressed={filtroStockHub === 'agotado'}
                  onClick={() => setFiltroStockHub(filtroStockHub === 'agotado' ? 'todos' : 'agotado')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-red-600/40 ${
                    filtroStockHub === 'agotado'
                      ? 'border-red-600 bg-red-50/80 shadow-xs ring-2 ring-red-600/20'
                      : 'border-[#E8E6DF] bg-white hover:border-red-300 hover:bg-red-50/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-red-700">Sin Existencias</span>
                    <Archive className="h-4 w-4 text-red-600 shrink-0" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-2xl font-extrabold tracking-tight tabular-nums text-red-700">
                      {metricasStockHub.agotados}
                    </span>
                    <span className="text-xs font-medium text-red-700/80">
                      {metricasStockHub.agotados === 1 ? 'producto' : 'productos'}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#657373]">
                    Stock agotado en depósito
                  </p>
                  <p className="mt-2 text-[11px] font-medium text-red-600/90">
                    {filtroStockHub === 'agotado' ? 'Filtro activo • Clic para quitar' : 'Clic para filtrar'}
                  </p>
                </button>

                {/* Óptimo */}
                <button
                  type="button"
                  aria-pressed={filtroStockHub === 'optimo'}
                  onClick={() => setFiltroStockHub(filtroStockHub === 'optimo' ? 'todos' : 'optimo')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#2A7A78]/40 ${
                    filtroStockHub === 'optimo'
                      ? 'border-[#2A7A78] bg-[#E2F1F0]/50 shadow-xs ring-2 ring-[#2A7A78]/20'
                      : 'border-[#E8E6DF] bg-white hover:border-[#2A7A78]/40 hover:bg-[#E2F1F0]/20'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-[#2A7A78]">Stock Óptimo</span>
                    <PackageCheck className="h-4 w-4 text-[#2A7A78] shrink-0" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-2xl font-extrabold tracking-tight tabular-nums text-[#2A7A78]">
                      {metricasStockHub.optimos}
                    </span>
                    <span className="text-xs font-medium text-[#2A7A78]/80">
                      {metricasStockHub.optimos === 1 ? 'producto' : 'productos'}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#657373]">
                    Abastecimiento saludable
                  </p>
                  <p className="mt-2 text-[11px] font-medium text-[#2A7A78]/90">
                    {filtroStockHub === 'optimo' ? 'Filtro activo • Clic para quitar' : 'Clic para filtrar'}
                  </p>
                </button>
              </div>
            </div>

            {/* ====================================================================
              CATÁLOGO OPERATIVO UNIFICADO (1 control por dimensión de filtrado)
              ==================================================================== */}
            <Card className="border-[#E8E6DF] shadow-sm">
              <CardHeader className="pb-4 border-b border-[#E8E6DF]">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-base font-bold text-[#1C2424]">
                        Catálogo Operativo de Productos
                      </CardTitle>
                      <Badge variant="default" className="text-xs">
                        {productosFiltradosHub.length}{' '}
                        {productosFiltradosHub.length === 1 ? 'artículo' : 'artículos'}
                      </Badge>
                      {filtroStockHub !== 'todos' && (
                        <Badge variant="outline" className="text-xs border-[#2A7A78]/40 text-[#2A7A78] bg-[#E2F1F0]/50">
                          Nivel: {filtroStockHub === 'critico'
                            ? 'Stock Crítico'
                            : filtroStockHub === 'bajo'
                            ? 'Bajas Unidades'
                            : filtroStockHub === 'agotado'
                            ? 'Sin Existencias'
                            : 'Stock Óptimo'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-[#657373] mt-1">
                      Edita precios, repone existencias físicas, o da de baja y reactiva productos desde la misma tabla.
                    </p>
                  </div>

                  {/* Barra compacta sin duplicidades: Búsqueda + Categoría + Estado Comercial + Limpiar */}
                  <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5">
                    {/* Buscador por SKU, nombre o categoría */}
                    <div className="relative w-full sm:w-56">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#657373]" />
                      <Input
                        placeholder="Buscar SKU o producto..."
                        maxLength={LIMITES_TEXTO.NOMBRE_PRODUCTO_MAX}
                        value={busquedaHub}
                        onChange={(e) => setBusquedaHub(e.target.value)}
                        className="h-9 pl-8 pr-7 text-xs"
                      />
                      {busquedaHub && (
                        <button
                          type="button"
                          onClick={() => setBusquedaHub('')}
                          className="absolute right-2 top-2.5 text-[#657373] hover:text-[#1C2424] cursor-pointer"
                          title="Borrar búsqueda"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Filtro único de Categoría */}
                    <div className="w-full sm:w-52">
                      <Select
                        value={categoriaFiltroHub}
                        onValueChange={(val) => setCategoriaFiltroHub(val)}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Todas las categorías" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todas">
                            Todas las categorías ({totalBaseEstado})
                          </SelectItem>
                          {categorias.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.nombre} ({conteosPorCategoria[c.id] || 0})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Filtro de Estado Comercial (reemplaza la subpantalla duplicada de Bajas) */}
                    <div className="w-full sm:w-44">
                      <Select
                        value={filtroEstadoHub}
                        onValueChange={(val) => setFiltroEstadoHub(val as FiltroEstadoComercial)}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Estado comercial" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="activos">
                            Activos ({metricasStockHub.activos})
                          </SelectItem>
                          <SelectItem value="inactivos">
                            Dados de Baja ({metricasStockHub.inactivos})
                          </SelectItem>
                          <SelectItem value="todos">
                            Todos ({metricasStockHub.total})
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {hayFiltrosHubActivos && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={limpiarFiltrosHub}
                        className="h-9 text-xs text-[#657373] hover:text-[#1C2424] px-2.5 cursor-pointer"
                        title="Restablecer todos los filtros"
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1" />
                        Limpiar
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {productosFiltradosHub.length === 0 ? (
                  <div className="py-12 text-center flex flex-col items-center justify-center space-y-3 px-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F8F7F2] text-[#657373]">
                      <Search className="h-6 w-6" />
                    </div>
                    <div className="max-w-md">
                      <p className="font-semibold text-sm text-[#1C2424]">
                        No se encontraron productos coincidentes
                      </p>
                      <p className="text-xs text-[#657373] mt-1">
                        No hay artículos que coincidan con la categoría, estado comercial, nivel de stock o búsqueda aplicada.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      {hayFiltrosHubActivos && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="text-xs cursor-pointer"
                          onClick={limpiarFiltrosHub}
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                          Restablecer filtros
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        className="text-xs bg-[#2A7A78] text-white hover:bg-[#2A7A78]/90 cursor-pointer"
                        onClick={() => {
                          if (categoriaFiltroHub !== 'todas') {
                            setFieldValue('categoriaId', categoriaFiltroHub);
                          }
                          setSeccionActiva('alta');
                        }}
                      >
                        <PackagePlus className="h-3.5 w-3.5 mr-1.5" />
                        Cargar producto nuevo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código / SKU</TableHead>
                          <TableHead>Producto</TableHead>
                          <TableHead>Categoría</TableHead>
                          <TableHead>Precio Venta</TableHead>
                          <TableHead>Stock Actual</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody ref={inventarioTableBodyRef}>
                        {productosPaginadosHub.map((prod) => {
                          const esAgotado = prod.stockActual === 0;
                          const esCritico = !esAgotado && prod.stockActual <= prod.stockMinimo;
                          const esBajo = !esAgotado && !esCritico && prod.stockActual <= prod.stockMinimo * 1.5;
                          const deficit = Math.max(0, prod.stockMinimo - prod.stockActual);

                          return (
                            <TableRow key={prod.id} className="hover:bg-[#F8F7F2]/50">
                              <TableCell className="font-mono text-xs font-bold text-[#1C2424]">
                                {prod.codigo}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-semibold text-sm text-[#1C2424]">{prod.nombre}</p>
                                  {prod.descripcion && (
                                    <p className="text-xs text-[#657373] line-clamp-1">{prod.descripcion}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="default" className="text-xs">
                                  {prod.categoria?.nombre || 'General'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm font-bold text-[#1C2424]">
                                  ${prod.precioVenta.toLocaleString('es-AR')}
                                </div>
                                {prod.precioCosto > 0 && (
                                  <div className="text-[11px] text-[#657373]">
                                    Costo: ${prod.precioCosto.toLocaleString('es-AR')}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`text-sm font-bold ${
                                        esAgotado
                                          ? 'text-red-700'
                                          : esCritico
                                          ? 'text-rose-600'
                                          : esBajo
                                          ? 'text-amber-600'
                                          : 'text-[#1C2424]'
                                      }`}
                                    >
                                      {prod.stockActual}
                                    </span>
                                    <span className="text-xs text-[#657373]">
                                      {prod.unidadMedida}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-[#657373]">
                                    Mínimo: {prod.stockMinimo} {prod.unidadMedida}
                                  </div>
                                  {deficit > 0 && prod.activo && (
                                    <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                      <AlertTriangle className="h-2.5 w-2.5" />
                                      Déficit: {deficit} {prod.unidadMedida}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {!prod.activo ? (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs text-[#657373] bg-[#F8F7F2] border-[#E8E6DF]"
                                  >
                                    Dado de Baja
                                  </Badge>
                                ) : esAgotado ? (
                                  <Badge
                                    variant="destructive"
                                    className="text-xs flex items-center gap-1 w-fit border-red-300 bg-red-100/90 text-red-800"
                                  >
                                    <Archive className="h-3 w-3 text-red-700" />
                                    Agotado
                                  </Badge>
                                ) : esCritico ? (
                                  <Badge
                                    variant="destructive"
                                    className="text-xs flex items-center gap-1 w-fit border-rose-200 bg-rose-50 text-rose-700"
                                  >
                                    <AlertTriangle className="h-3 w-3 text-rose-600" />
                                    Crítico / Reponer
                                  </Badge>
                                ) : esBajo ? (
                                  <Badge variant="warning" className="text-xs flex items-center gap-1 w-fit">
                                    <AlertCircle className="h-3 w-3" />
                                    Bajas unidades
                                  </Badge>
                                ) : (
                                  <Badge variant="success" className="text-xs flex items-center gap-1 w-fit">
                                    <PackageCheck className="h-3 w-3" />
                                    Óptimo
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs px-2 text-[#2A7A78] hover:bg-[#E2F1F0] cursor-pointer"
                                    onClick={() => handleAbrirEdicion(prod)}
                                    title="Modificar datos o reponer existencias físicas"
                                  >
                                    <FileEdit className="h-3.5 w-3.5 mr-1" />
                                    Reponer / Editar
                                  </Button>
                                  {prod.activo ? (
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs px-2 text-red-600 hover:bg-red-50 border-red-200 cursor-pointer"
                                      onClick={() => {
                                        setProductoABajar(prod);
                                        setMotivoBaja('');
                                      }}
                                      title="Dar de baja este producto"
                                    >
                                      <Archive className="h-3.5 w-3.5 mr-1" />
                                      Baja
                                    </Button>
                                  ) : (
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs px-2 text-[#2A7A78] hover:bg-[#E2F1F0] cursor-pointer"
                                      onClick={() => reactivarProducto(prod.id)}
                                      title="Reactivar este producto en el catálogo activo"
                                    >
                                      <RotateCcw className="h-3.5 w-3.5 mr-1" />
                                      Reactivar
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>

                    {/* Paginación del Catálogo de Inventario */}
                    {productosFiltradosHub.length > 0 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 px-4 pb-3 border-t border-[#E8E6DF] text-xs text-[#657373]">
                        <div>
                          Mostrando <span className="font-semibold text-[#1C2424]">{inicioInventario + 1}</span> a{' '}
                          <span className="font-semibold text-[#1C2424]">
                            {Math.min(
                              inicioInventario + itemsPorPaginaInventario,
                              productosFiltradosHub.length
                            )}
                          </span>{' '}
                          de <span className="font-semibold text-[#1C2424]">{productosFiltradosHub.length}</span> productos
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 px-2.5 text-xs text-[#1C2424] border-[#E8E6DF] hover:bg-[#F8F7F2] active:scale-95 transition-all duration-150 cursor-pointer"
                            onClick={() => setPaginaInventario((p) => Math.max(p - 1, 1))}
                            disabled={paginaInventario <= 1}
                          >
                            <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                            Anterior
                          </Button>
                          <span className="px-2 font-medium text-[#1C2424]">
                            {paginaInventario} / {totalPaginasInventario}
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 px-2.5 text-xs text-[#1C2424] border-[#E8E6DF] hover:bg-[#F8F7F2] active:scale-95 transition-all duration-150 cursor-pointer"
                            onClick={() =>
                              setPaginaInventario((p) => Math.min(p + 1, totalPaginasInventario))
                            }
                            disabled={paginaInventario >= totalPaginasInventario}
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
          </div>
        )}

        {/* ====================================================================
          CASO 2: FORMULARIO DE CARGA DE PRODUCTO NUEVO
          ==================================================================== */}
        {seccionActiva === 'alta' && (
          <div className="space-y-6">
            {/* Cabecera con Botón Volver */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSeccionActiva('menu')}
                    className="gap-1.5 text-[#657373] hover:text-[#1C2424] cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Volver al catálogo</span>
                  </Button>
                  <Badge variant="default">Alta de Producto</Badge>
                </div>
                <h1 className="text-2xl font-bold text-[#1C2424] tracking-tight mt-2">
                  Cargar Producto Nuevo
                </h1>
                <p className="text-sm text-[#657373]">
                  Ingresa los datos comerciales, existencias iniciales y costos para incorporar el artículo al catálogo.
                </p>
              </div>
            </div>

            {/* Formulario Unificado (solo campos persistidos en el modelo de dominio) */}
            <Card>
              <CardHeader className="border-b border-[#E8E6DF] pb-4">
                <CardTitle className="text-base font-bold text-[#1C2424]">
                  Formulario de Producto
                </CardTitle>
                <CardDescription className="text-xs text-[#657373]">
                  Completa los campos obligatorios (*) para registrar el artículo y sincronizarlo con el mostrador.
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-6">
                <form onSubmit={handleSubmitAlta} className="space-y-6">
                  {/* Categoría Obligatoria */}
                  <div className="p-4 rounded-xl border border-[#E8E6DF] bg-[#F8F7F2]/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#1C2424] uppercase tracking-wider flex items-center gap-1.5">
                        <Tag className="h-4 w-4 text-[#2A7A78]" />
                        <span>Categoría *</span>
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs text-[#2A7A78] border-[#2A7A78]/30 hover:bg-[#E2F1F0] cursor-pointer"
                        onClick={() => setModalCatOpened(true)}
                      >
                        <FolderPlus className="h-3.5 w-3.5" />
                        <span>+ Nueva Categoría</span>
                      </Button>
                    </div>

                    <select
                      value={formData.categoriaId}
                      onChange={(e) => setFieldValue('categoriaId', e.target.value)}
                      className={`flex h-10 w-full rounded-lg border bg-white px-3 py-1 text-sm text-[#1C2424] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A7A78]/20 focus-visible:border-[#2A7A78] ${
                        fieldErrors.categoriaId ? 'border-red-500' : 'border-[#E8E6DF]'
                      }`}
                    >
                      <option value="">-- Selecciona una categoría existente --</option>
                      {categorias.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre} {c.descripcion ? `(${c.descripcion})` : ''}
                        </option>
                      ))}
                    </select>

                    {fieldErrors.categoriaId && (
                      <p className="text-xs text-red-600 font-medium">{fieldErrors.categoriaId}</p>
                    )}

                    {categoriaSeleccionada && (
                      <p className="text-xs text-[#657373]">
                        Categoría activa: <strong className="text-[#1C2424]">{categoriaSeleccionada.nombre}</strong>
                        {categoriaSeleccionada.descripcion && ` — ${categoriaSeleccionada.descripcion}`}
                      </p>
                    )}
                  </div>

                  {/* Datos de Identificación */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    {/* Código / SKU */}
                    <div className="sm:col-span-4 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-[#1C2424] uppercase tracking-wider">
                          Código de Barras / SKU *
                        </label>
                        <button
                          type="button"
                          onClick={handleGenerarSku}
                          className="text-[11px] text-[#2A7A78] hover:underline flex items-center gap-1 font-medium cursor-pointer"
                        >
                          <RefreshCw className="h-3 w-3" /> Auto
                        </button>
                      </div>
                      <div className="relative">
                        <Input
                          placeholder="Ej: 779001 o SKU-101"
                          minLength={LIMITES_TEXTO.SKU_MIN}
                          maxLength={LIMITES_TEXTO.SKU_MAX}
                          value={formData.codigo}
                          onChange={(e) => setFieldValue('codigo', e.target.value)}
                          error={fieldErrors.codigo}
                          className="pl-9"
                        />
                        <Barcode className="absolute left-3 top-2.5 h-4 w-4 text-[#657373]" />
                      </div>
                    </div>

                    {/* Nombre */}
                    <div className="sm:col-span-5 space-y-1.5">
                      <label className="text-xs font-semibold text-[#1C2424] uppercase tracking-wider">
                        Nombre del Producto *
                      </label>
                      <Input
                        placeholder="Ej: Aceite de Girasol 1.5L"
                        minLength={LIMITES_TEXTO.NOMBRE_PRODUCTO_MIN}
                        maxLength={LIMITES_TEXTO.NOMBRE_PRODUCTO_MAX}
                        value={formData.nombre}
                        onChange={(e) => setFieldValue('nombre', e.target.value)}
                        error={fieldErrors.nombre}
                      />
                    </div>

                    {/* Unidad de Medida */}
                    <div className="sm:col-span-3 space-y-1.5">
                      <label className="text-xs font-semibold text-[#1C2424] uppercase tracking-wider">
                        Unidad de Medida *
                      </label>
                      <select
                        value={formData.unidadMedida}
                        onChange={(e) => setFieldValue('unidadMedida', e.target.value as UnidadMedida)}
                        className="flex h-9 w-full rounded-lg border border-[#E8E6DF] bg-white px-3 py-1 text-sm text-[#1C2424] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A7A78]/20 focus-visible:border-[#2A7A78]"
                      >
                        {unidadesDisponibles.map((u) => (
                          <option key={u.value} value={u.value}>
                            {u.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Descripción */}
                    <div className="sm:col-span-12 space-y-1.5">
                      <label className="text-xs font-semibold text-[#1C2424] uppercase tracking-wider">
                        Descripción (Opcional)
                      </label>
                      <Textarea
                        placeholder="Detalles sobre presentación, marca, contenido neto..."
                        maxLength={LIMITES_TEXTO.DESCRIPCION_MAX}
                        value={formData.descripcion}
                        onChange={(e) => setFieldValue('descripcion', e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Precios y Stock */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Precios & Rentabilidad */}
                    <div className="p-4 rounded-xl border border-[#E8E6DF] bg-[#F8F7F2]/60 space-y-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#2A7A78]">
                        Precios y Márgenes
                      </span>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-[#1C2424]">Precio Costo ($)</label>
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="0"
                            max={MAX_PRECIO_DB}
                            value={formData.precioCosto || ''}
                            onChange={(e) => setFieldValue('precioCosto', parseFloat(e.target.value) || 0)}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-[#1C2424]">Precio Venta ($) *</label>
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="0"
                            max={MAX_PRECIO_DB}
                            value={formData.precioVenta || ''}
                            onChange={(e) => setFieldValue('precioVenta', parseFloat(e.target.value) || 0)}
                            error={fieldErrors.precioVenta}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-[#E8E6DF]">
                        <div>
                          <p className="text-xs text-[#657373]">Ganancia neta x unidad</p>
                          {!esRentable && config?.inventario?.alertarMargenNegativo && venta > 0 && (
                            <p className="text-[10px] font-semibold text-red-600">
                              ¡Alerta! Margen negativo (venta menor al costo)
                            </p>
                          )}
                          <p className={`text-sm font-bold ${esRentable ? 'text-[#2A7A78]' : 'text-red-600'}`}>
                            ${gananciaNeta.toLocaleString('es-AR')}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-[#657373]">Margen s/costo</p>
                          <Badge variant={esRentable ? 'success' : 'destructive'} className="gap-1">
                            {esRentable ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {margenPorcentaje}%
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Control de Stock (solo campos reales persistidos) */}
                    <div className="p-4 rounded-xl border border-[#E8E6DF] bg-[#F8F7F2]/60 space-y-4 flex flex-col justify-between">
                      <div className="space-y-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#2A7A78]">
                          Existencias y Umbral de Reposición
                        </span>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[#1C2424]">Stock Inicial *</label>
                            <Input
                              type="number"
                              min="0"
                              placeholder="1"
                              max={MAX_STOCK_DB}
                              step={1}
                              value={formData.stockInicial}
                              onChange={(e) => setFieldValue('stockInicial', parseInt(e.target.value) || 0)}
                              error={fieldErrors.stockInicial}
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[#1C2424]">Stock Mínimo (Alerta) *</label>
                            <Input
                              type="number"
                              min="0"
                              placeholder="5"
                              max={MAX_STOCK_DB}
                              step={1}
                              value={formData.stockMinimo}
                              onChange={(e) => setFieldValue('stockMinimo', parseInt(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-white border border-[#E8E6DF] text-xs text-[#657373]">
                        Cuando el stock físico sea menor o igual a{' '}
                        <strong className="text-[#1C2424]">{formData.stockMinimo} {formData.unidadMedida}</strong>, el sistema activará automáticamente la alerta de reposición crítica.
                      </div>
                    </div>
                  </div>

                  {/* Acciones del Formulario */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setFormData({
                          ...valoresInicialesCargaProducto,
                          stockMinimo:
                            config?.inventario?.umbralMinimoPorDefecto ??
                            valoresInicialesCargaProducto.stockMinimo,
                        })
                      }
                      disabled={loading}
                    >
                      Limpiar Formulario
                    </Button>
                    <Button type="submit" size="default" loading={loading} className="gap-2">
                      <Plus className="h-4 w-4" />
                      <span>Guardar Producto</span>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ====================================================================
          MODAL: CREAR NUEVA CATEGORÍA
          ==================================================================== */}
        <Dialog open={modalCatOpened} onOpenChange={setModalCatOpened}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Categoría</DialogTitle>
              <DialogDescription>
                La categoría define el grupo comercial al que pertenecerán los artículos.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {errorCat && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errorCat}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1C2424] uppercase tracking-wider">
                  Nombre de la Categoría *
                </label>
                <Input
                  placeholder="Ej: Ferretería, Congelados, Perfumería"
                  minLength={LIMITES_TEXTO.NOMBRE_CATEGORIA_MIN}
                  maxLength={LIMITES_TEXTO.NOMBRE_CATEGORIA_MAX}
                  value={nuevaCatNombre}
                  onChange={(e) => setNuevaCatNombre(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1C2424] uppercase tracking-wider">
                  Descripción (Opcional)
                </label>
                <Textarea
                  placeholder="Breve descripción de los productos que engloba"
                  maxLength={LIMITES_TEXTO.DESCRIPCION_MAX}
                  value={nuevaCatDesc}
                  onChange={(e) => setNuevaCatDesc(e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setModalCatOpened(false);
                  setErrorCat(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="button" onClick={handleCrearCategoria} className="gap-1.5">
                <FolderPlus className="h-4 w-4" />
                <span>Crear Categoría</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ====================================================================
          MODAL: CONFIRMACIÓN DE BAJA DE PRODUCTO
          ==================================================================== */}
        <Dialog open={!!productoABajar} onOpenChange={(open) => !open && setProductoABajar(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Baja de Producto</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas retirar este producto del catálogo comercial activo?
              </DialogDescription>
            </DialogHeader>

            {productoABajar && (
              <div className="space-y-4 py-2">
                <div className="p-3 rounded-lg border border-[#E8E6DF] bg-[#F8F7F2]">
                  <p className="text-sm font-bold text-[#1C2424]">{productoABajar.nombre}</p>
                  <p className="text-xs text-[#657373]">
                    Código: {productoABajar.codigo} • Categoría: {productoABajar.categoria?.nombre || 'General'}
                  </p>
                  <p className="text-xs text-[#657373] mt-1">
                    Stock actual en depósito:{' '}
                    <strong>
                      {productoABajar.stockActual} {productoABajar.unidadMedida}
                    </strong>
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#1C2424] uppercase tracking-wider">
                    Motivo de la Baja (Opcional)
                  </label>
                  <Input
                    placeholder="Ej: Mercadería discontinuada por proveedor, rotura"
                    maxLength={LIMITES_TEXTO.OBSERVACIONES_MAX}
                    value={motivoBaja}
                    onChange={(e) => setMotivoBaja(e.target.value)}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setProductoABajar(null)}>
                Cancelar
              </Button>
              <Button type="button" variant="destructive" onClick={handleConfirmarBaja} className="gap-1.5">
                <Trash2 className="h-4 w-4" />
                <span>Confirmar Baja</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ====================================================================
          MODAL: MODIFICAR / REPONER PRODUCTO EXISTENTE
          ==================================================================== */}
        <Dialog open={modalEditarOpened} onOpenChange={setModalEditarOpened}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Reponer o Modificar Producto</DialogTitle>
              <DialogDescription>
                Actualiza existencias físicas, precios o datos comerciales. Los cambios impactan de inmediato en caja.
              </DialogDescription>
            </DialogHeader>

            {productoAEditar && (
              <form onSubmit={handleGuardarEdicion} className="space-y-4 py-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-[#1C2424] uppercase tracking-wider">
                      Nombre del Producto *
                    </label>
                    <Input
                      minLength={LIMITES_TEXTO.NOMBRE_PRODUCTO_MIN}
                      maxLength={LIMITES_TEXTO.NOMBRE_PRODUCTO_MAX}
                      value={formEdicion.nombre}
                      onChange={(e) => setFormEdicion((prev) => ({ ...prev, nombre: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#1C2424] uppercase tracking-wider">
                      Código / SKU *
                    </label>
                    <Input
                      minLength={LIMITES_TEXTO.SKU_MIN}
                      maxLength={LIMITES_TEXTO.SKU_MAX}
                      value={formEdicion.codigo}
                      onChange={(e) => setFormEdicion((prev) => ({ ...prev, codigo: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#1C2424] uppercase tracking-wider">
                      Categoría *
                    </label>
                    <select
                      value={formEdicion.categoriaId}
                      onChange={(e) => setFormEdicion((prev) => ({ ...prev, categoriaId: e.target.value }))}
                      className="flex h-9 w-full rounded-lg border border-[#E8E6DF] bg-white px-3 py-1 text-sm text-[#1C2424] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A7A78]/20 focus-visible:border-[#2A7A78]"
                    >
                      {categorias.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#1C2424] uppercase tracking-wider">
                      Precio de Costo ($)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      max={MAX_PRECIO_DB}
                      value={formEdicion.precioCosto}
                      onChange={(e) =>
                        setFormEdicion((prev) => ({ ...prev, precioCosto: parseFloat(e.target.value) || 0 }))
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#1C2424] uppercase tracking-wider">
                      Precio de Venta ($) *
                    </label>
                    <Input
                      type="number"
                      min="1"
                      step="any"
                      max={MAX_PRECIO_DB}
                      value={formEdicion.precioVenta}
                      onChange={(e) =>
                        setFormEdicion((prev) => ({ ...prev, precioVenta: parseFloat(e.target.value) || 0 }))
                      }
                      required
                    />
                  </div>

                  {/* Vista previa de margen en vivo también en Edición */}
                  <div className="sm:col-span-2 flex items-center justify-between px-3 py-2 rounded-lg bg-[#F8F7F2] border border-[#E8E6DF]">
                    <div>
                      <span className="text-xs text-[#657373]">Ganancia unitaria: </span>
                      <strong className={`text-xs ${esRentableEdicion ? 'text-[#2A7A78]' : 'text-red-600'}`}>
                        ${gananciaEdicion.toLocaleString('es-AR')}
                      </strong>
                      {!esRentableEdicion && config?.inventario?.alertarMargenNegativo && ventaEdicion > 0 && (
                        <span className="block text-[11px] font-semibold text-red-600">
                          ¡Alerta! El precio de venta es inferior al costo de reposición.
                        </span>
                      )}
                    </div>
                    <Badge variant={esRentableEdicion ? 'success' : 'destructive'} className="gap-1 text-xs">
                      {esRentableEdicion ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {margenEdicion}%
                    </Badge>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#1C2424] uppercase tracking-wider">
                      Stock Físico Actual *
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max={MAX_STOCK_DB}
                      step={1}
                      value={formEdicion.stockActual}
                      onChange={(e) =>
                        setFormEdicion((prev) => ({ ...prev, stockActual: parseInt(e.target.value) || 0 }))
                      }
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#1C2424] uppercase tracking-wider">
                      Stock Mínimo (Alerta)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max={MAX_STOCK_DB}
                      step={1}
                      value={formEdicion.stockMinimo}
                      onChange={(e) =>
                        setFormEdicion((prev) => ({ ...prev, stockMinimo: parseInt(e.target.value) || 0 }))
                      }
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-[#1C2424] uppercase tracking-wider">
                      Unidad de Medida
                    </label>
                    <select
                      value={formEdicion.unidadMedida}
                      onChange={(e) =>
                        setFormEdicion((prev) => ({ ...prev, unidadMedida: e.target.value as UnidadMedida }))
                      }
                      className="flex h-9 w-full rounded-lg border border-[#E8E6DF] bg-white px-3 py-1 text-sm text-[#1C2424] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A7A78]/20 focus-visible:border-[#2A7A78]"
                    >
                      {unidadesDisponibles.map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-[#1C2424] uppercase tracking-wider">
                      Descripción
                    </label>
                    <Textarea
                      maxLength={LIMITES_TEXTO.DESCRIPCION_MAX}
                      value={formEdicion.descripcion}
                      onChange={(e) => setFormEdicion((prev) => ({ ...prev, descripcion: e.target.value }))}
                      rows={2}
                    />
                  </div>
                </div>

                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setModalEditarOpened(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="gap-1.5">
                    <Check className="h-4 w-4" />
                    <span>Aplicar Cambios</span>
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </MotionConfig>
  );
}

// Alias de compatibilidad hacia atrás
export const AdminGestionInventario = AdminGestionInventarioView;
