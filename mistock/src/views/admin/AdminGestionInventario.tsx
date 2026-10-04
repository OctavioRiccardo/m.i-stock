'use client';

/**
 * ====================================================================
 * VISTA: GESTIÓN DE INVENTARIO (Patrón MVC - View)
 * ====================================================================
 */

import React, { useState } from 'react';
import { motion, MotionConfig } from 'motion/react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import {
  Plus,
  Check,
  AlertCircle,
  Barcode,
  FolderPlus,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Tag,
  PackagePlus,
  Archive,
  FileEdit,
  ArrowLeft,
  Search,
  RotateCcw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Filter,
  Boxes,
  PackageCheck,
  X,
} from 'lucide-react';
import {
  useAdminInventarioController,
  FiltroNivelStock,
} from '@/controllers/adminControllers/inventarioController';
import {
  FormularioCargaProducto,
  valoresInicialesCargaProducto,
} from '@/models/modelos_vista/cargaProductoModel';
import { Producto, UnidadMedida } from '@/models/modelos_dominio/productoModel';
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
    productos,
    categoriaFiltroHub,
    setCategoriaFiltroHub,
    filtroStockHub,
    setFiltroStockHub,
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
  } = controller;

  // Auto-animaciones para tablas (transiciones suaves al filtrar, paginar o actualizar)
  const [inventarioTableBodyRef] = useAutoAnimate<HTMLTableSectionElement>({ duration: 200, easing: 'ease-out' });
  const [bajasTableBodyRef] = useAutoAnimate<HTMLTableSectionElement>({ duration: 200, easing: 'ease-out' });
  const [modificarTableBodyRef] = useAutoAnimate<HTMLTableSectionElement>({ duration: 200, easing: 'ease-out' });

  // Cálculos de Paginación para el Catálogo de Inventario
  const totalPaginasInventario = Math.max(1, Math.ceil(productosFiltradosHub.length / itemsPorPaginaInventario));
  const inicioInventario = (paginaInventario - 1) * itemsPorPaginaInventario;
  const productosPaginadosHub = productosFiltradosHub.slice(
    inicioInventario,
    inicioInventario + itemsPorPaginaInventario
  );

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
  const [formData, setFormData] = useState<FormularioCargaProducto>(valoresInicialesCargaProducto);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormularioCargaProducto, string>>>({});

  const setFieldValue = <K extends keyof FormularioCargaProducto>(field: K, value: FormularioCargaProducto[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const categoriaSeleccionada = categorias.find((c) => c.id === formData.categoriaId);

  // Rentabilidad calculada en tiempo real
  const costo = Number(formData.precioCosto) || 0;
  const venta = Number(formData.precioVenta) || 0;
  const gananciaNeta = venta - costo;
  const margenPorcentaje = costo > 0 ? ((gananciaNeta / costo) * 100).toFixed(1) : '100.0';
  const esRentable = venta >= costo;

  // ==========================================
  // ESTADOS: SECCIÓN BAJAS
  // ==========================================
  const [busquedaBaja, setBusquedaBaja] = useState('');
  const [filtroEstadoBaja, setFiltroEstadoBaja] = useState<'todos' | 'activos' | 'inactivos'>('activos');
  const [productoABajar, setProductoABajar] = useState<Producto | null>(null);
  const [motivoBaja, setMotivoBaja] = useState('');

  // ==========================================
  // ESTADOS: SECCIÓN MODIFICAR
  // ==========================================
  const [busquedaModificar, setBusquedaModificar] = useState('');
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

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleCrearCategoria = () => {
    if (!nuevaCatNombre.trim()) {
      setErrorCat('El nombre de la categoría es obligatorio.');
      return;
    }

    const nueva = agregarCategoria(nuevaCatNombre, nuevaCatDesc);
    setFieldValue('categoriaId', nueva.id);
    setNuevaCatNombre('');
    setNuevaCatDesc('');
    setErrorCat(null);
    setModalCatOpened(false);
  };

  const handleGenerarSku = () => {
    const prefijo = categoriaSeleccionada
      ? categoriaSeleccionada.nombre.slice(0, 3).toUpperCase()
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

  // ==========================================
  // FILTRADO DE PRODUCTOS
  // ==========================================
  const productosFiltradosBaja = productos.filter((p) => {
    const coincideTexto =
      p.nombre.toLowerCase().includes(busquedaBaja.toLowerCase()) ||
      p.codigo.toLowerCase().includes(busquedaBaja.toLowerCase()) ||
      (p.categoria?.nombre || '').toLowerCase().includes(busquedaBaja.toLowerCase());

    if (filtroEstadoBaja === 'activos') return coincideTexto && p.activo;
    if (filtroEstadoBaja === 'inactivos') return coincideTexto && !p.activo;
    return coincideTexto;
  });

  const productosFiltradosModificar = productos.filter((p) => {
    return (
      p.nombre.toLowerCase().includes(busquedaModificar.toLowerCase()) ||
      p.codigo.toLowerCase().includes(busquedaModificar.toLowerCase()) ||
      (p.categoria?.nombre || '').toLowerCase().includes(busquedaModificar.toLowerCase())
    );
  });

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
          CASO 1: PANTALLA PRINCIPAL / HUB (3 TARJETAS DE OPCIÓN)
          ==================================================================== */}
      {seccionActiva === 'menu' && (
        <div className="space-y-8">
          {/* Encabezado Principal */}
          <div>
            <h1 className="text-2xl font-bold text-[#1C2424] tracking-tight">
              Gestión de Inventario
            </h1>
            <p className="text-sm text-[#657373]">
              Selecciona una operación para administrar el catálogo comercial y existencias de productos.
            </p>
          </div>

          {/* Grid de las 3 Tarjetas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tarjeta 1: Cargar Producto Nuevo */}
            <Card
              onClick={() => setSeccionActiva('alta')}
              className="flex flex-col justify-between cursor-pointer border-[#E8E6DF] hover:border-[#2A7A78] hover:shadow-md transition-all duration-200 group"
            >
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E2F1F0] text-[#2A7A78] group-hover:scale-105 transition-transform">
                    <PackagePlus className="h-6 w-6" />
                  </div>
                  <Badge variant="default" className="text-xs">
                    Alta
                  </Badge>
                </div>
                <div>
                  <CardTitle className="text-lg group-hover:text-[#2A7A78] transition-colors">
                    Cargar Producto Nuevo
                  </CardTitle>
                  <CardDescription className="pt-2 text-xs leading-relaxed text-[#657373]">
                    Registra un nuevo artículo asociándolo a una categoría, definiendo costos, precios de venta y existencias iniciales.
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>

            {/* Tarjeta 2: Dar de Baja un Producto */}
            <Card
              onClick={() => setSeccionActiva('baja')}
              className="flex flex-col justify-between cursor-pointer border-[#E8E6DF] hover:border-red-500 hover:shadow-md transition-all duration-200 group"
            >
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600 group-hover:scale-105 transition-transform">
                    <Archive className="h-6 w-6" />
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    Baja de un producto
                  </Badge>
                </div>
                <div>
                  <CardTitle className="text-lg group-hover:text-red-600 transition-colors">
                    Dar de Baja un Producto
                  </CardTitle>
                  <CardDescription className="pt-2 text-xs leading-relaxed text-[#657373]">
                    Retira de la comercialización artículos vencidos, dañados o discontinuados sin perder su trazabilidad histórica.
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>

            {/* Tarjeta 3: Modificar Producto Existente */}
            <Card
              onClick={() => setSeccionActiva('modificar')}
              className="flex flex-col justify-between cursor-pointer border-[#E8E6DF] hover:border-[#2A7A78] hover:shadow-md transition-all duration-200 group"
            >
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 group-hover:scale-105 transition-transform">
                    <FileEdit className="h-6 w-6" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Edición
                  </Badge>
                </div>
                <div>
                  <CardTitle className="text-lg group-hover:text-[#2A7A78] transition-colors">
                    Modificar Producto Existente
                  </CardTitle>
                  <CardDescription className="pt-2 text-xs leading-relaxed text-[#657373]">
                    Actualiza precios de venta, costos de reposición, umbrales de alerta de stock mínimo o datos descriptivos.
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* ====================================================================
              DIAGNÓSTICO Y CONTROL DE SALUD DEL INVENTARIO
              ==================================================================== */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-[#1C2424] flex items-center gap-2">
                  <Boxes className="h-4 w-4 text-[#2A7A78]" />
                  Diagnóstico y Control de Stock
                </h2>
                <p className="text-xs text-[#657373]">
                  Monitoreo de existencias en tiempo real, alertas de desabastecimiento y cálculo de reposición.
                </p>
              </div>

              {filtroStockHub !== 'todos' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFiltroStockHub('todos')}
                  className="h-8 text-xs border-[#E8E6DF] text-[#657373] hover:text-[#1C2424]"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Restablecer filtro de stock
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
                      Atención: {metricasStockHub.criticos} {metricasStockHub.criticos === 1 ? 'producto requiere' : 'productos requieren'} revisión inmediata por stock crítico
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
                    className="h-8 text-xs font-medium bg-rose-600 hover:bg-rose-700 text-white"
                    onClick={() => setFiltroStockHub('critico')}
                  >
                    Ver críticos ({metricasStockHub.criticos})
                  </Button>
                  {filtroStockHub === 'critico' && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs bg-white text-rose-700 border-rose-300 hover:bg-rose-50"
                      onClick={() => setFiltroStockHub('todos')}
                    >
                      Mostrar todos
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Grid de Métricas de Salud de Stock */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
              {/* Crítico */}
              <button
                type="button"
                onClick={() => setFiltroStockHub(filtroStockHub === 'critico' ? 'todos' : 'critico')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  filtroStockHub === 'critico'
                    ? 'border-rose-500 bg-rose-50/80 shadow-xs ring-2 ring-rose-500/20'
                    : 'border-[#E8E6DF] bg-white hover:border-rose-300 hover:bg-rose-50/30'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-[#657373]">
                  <span className="font-medium text-rose-700">Stock Crítico</span>
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-rose-700">{metricasStockHub.criticos}</span>
                  <span className="text-[11px] text-[#657373]">≤ stock mínimo</span>
                </div>
                <p className="text-[11px] text-rose-600/90 mt-1">
                  {filtroStockHub === 'critico' ? 'Filtro activo' : 'Clic para filtrar'}
                </p>
              </button>

              {/* Bajas Unidades */}
              <button
                type="button"
                onClick={() => setFiltroStockHub(filtroStockHub === 'bajo' ? 'todos' : 'bajo')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  filtroStockHub === 'bajo'
                    ? 'border-amber-500 bg-amber-50/80 shadow-xs ring-2 ring-amber-500/20'
                    : 'border-[#E8E6DF] bg-white hover:border-amber-300 hover:bg-amber-50/30'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-[#657373]">
                  <span className="font-medium text-amber-700">Bajas Unidades</span>
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-amber-700">{metricasStockHub.bajasUnidades}</span>
                  <span className="text-[11px] text-[#657373]">≤ 1.5x mínimo</span>
                </div>
                <p className="text-[11px] text-amber-600/90 mt-1">
                  {filtroStockHub === 'bajo' ? 'Filtro activo' : 'Clic para filtrar'}
                </p>
              </button>

              {/* Agotados */}
              <button
                type="button"
                onClick={() => setFiltroStockHub(filtroStockHub === 'agotado' ? 'todos' : 'agotado')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  filtroStockHub === 'agotado'
                    ? 'border-red-600 bg-red-50/80 shadow-xs ring-2 ring-red-600/20'
                    : 'border-[#E8E6DF] bg-white hover:border-red-300 hover:bg-red-50/30'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-[#657373]">
                  <span className="font-medium text-red-700">Sin Existencias</span>
                  <Archive className="h-3.5 w-3.5 text-red-600" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-red-700">{metricasStockHub.agotados}</span>
                  <span className="text-[11px] text-[#657373]">0 unidades</span>
                </div>
                <p className="text-[11px] text-red-600/90 mt-1">
                  {filtroStockHub === 'agotado' ? 'Filtro activo' : 'Clic para filtrar'}
                </p>
              </button>

              {/* Óptimo */}
              <button
                type="button"
                onClick={() => setFiltroStockHub(filtroStockHub === 'optimo' ? 'todos' : 'optimo')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  filtroStockHub === 'optimo'
                    ? 'border-[#2A7A78] bg-[#E2F1F0]/50 shadow-xs ring-2 ring-[#2A7A78]/20'
                    : 'border-[#E8E6DF] bg-white hover:border-[#2A7A78]/40 hover:bg-[#E2F1F0]/20'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-[#657373]">
                  <span className="font-medium text-[#2A7A78]">Stock Óptimo</span>
                  <PackageCheck className="h-3.5 w-3.5 text-[#2A7A78]" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-[#2A7A78]">{metricasStockHub.optimos}</span>
                  <span className="text-[11px] text-[#657373]">&gt; mínimo</span>
                </div>
                <p className="text-[11px] text-[#2A7A78]/90 mt-1">
                  {filtroStockHub === 'optimo' ? 'Filtro activo' : 'Clic para filtrar'}
                </p>
              </button>
            </div>
          </div>

          {/* ====================================================================
              LISTADO Y FILTRO DE PRODUCTOS POR CATEGORÍA Y EXISTENCIAS
              ==================================================================== */}
          <Card className="border-[#E8E6DF] shadow-sm">
            <CardHeader className="pb-4 border-b border-[#E8E6DF] space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-bold text-[#1C2424]">
                      Listado de Productos del Inventario
                    </CardTitle>
                    <Badge variant="default" className="text-xs">
                      {productosFiltradosHub.length}{' '}
                      {productosFiltradosHub.length === 1 ? 'artículo' : 'artículos'}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#657373] mt-1">
                    Administra existencias físicas, umbrales de alerta y estado operativo por categoría.
                  </p>
                </div>

                {/* Controles de Filtrado: Selector de Categoría, Nivel de Stock, Buscador y Reset */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  {/* Selector Dropdown de Categoría */}
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
                          Todas las categorías ({productos.length})
                        </SelectItem>
                        {categorias.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nombre} ({conteosPorCategoria[c.id] || 0})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Selector Dropdown de Nivel de Stock */}
                  <div className="w-full sm:w-48">
                    <Select
                      value={filtroStockHub}
                      onValueChange={(val) => setFiltroStockHub(val as FiltroNivelStock)}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Nivel de stock" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos los niveles ({productos.length})</SelectItem>
                        <SelectItem value="critico">
                          Crítico / Reponer ({metricasStockHub.criticos})
                        </SelectItem>
                        <SelectItem value="bajo">
                          Bajas unidades ({metricasStockHub.bajasUnidades})
                        </SelectItem>
                        <SelectItem value="agotado">
                          Agotados ({metricasStockHub.agotados})
                        </SelectItem>
                        <SelectItem value="optimo">
                          Óptimo ({metricasStockHub.optimos})
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Campo de búsqueda opcional */}
                  <div className="relative w-full sm:w-44">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#657373]" />
                    <Input
                      placeholder="Buscar SKU o nombre..."
                      value={busquedaHub}
                      onChange={(e) => setBusquedaHub(e.target.value)}
                      className="h-9 pl-8 text-xs"
                    />
                  </div>

                  {/* Botón Restablecer Filtros si hay alguno activo */}
                  {(categoriaFiltroHub !== 'todas' || filtroStockHub !== 'todos' || busquedaHub.trim() !== '') && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={limpiarFiltrosHub}
                      className="h-9 text-xs text-[#657373] hover:text-[#1C2424] px-2.5"
                      title="Restablecer todos los filtros"
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" />
                      Limpiar
                    </Button>
                  )}
                </div>
              </div>

              {/* Botones Pill de Selección Rápida de Categorías */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1">
                <span className="text-[11px] font-semibold text-[#657373] uppercase tracking-wider mr-1 shrink-0">
                  Categoría:
                </span>
                <button
                  type="button"
                  onClick={() => setCategoriaFiltroHub('todas')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    categoriaFiltroHub === 'todas'
                      ? 'bg-[#2A7A78] text-white shadow-sm'
                      : 'bg-[#F8F7F2] text-[#657373] hover:text-[#1C2424] hover:bg-[#E8E6DF]'
                  }`}
                >
                  Todas
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      categoriaFiltroHub === 'todas'
                        ? 'bg-white/20 text-white'
                        : 'bg-[#E8E6DF] text-[#657373]'
                    }`}
                  >
                    {productos.length}
                  </span>
                </button>

                {categorias.map((cat) => {
                  const activa = categoriaFiltroHub === cat.id;
                  const cantidad = conteosPorCategoria[cat.id] || 0;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoriaFiltroHub(cat.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                        activa
                          ? 'bg-[#2A7A78] text-white shadow-sm'
                          : 'bg-[#F8F7F2] text-[#657373] hover:text-[#1C2424] hover:bg-[#E8E6DF]'
                      }`}
                    >
                      {cat.nombre}
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                          activa
                            ? 'bg-white/20 text-white'
                            : 'bg-[#E8E6DF] text-[#657373]'
                        }`}
                      >
                        {cantidad}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Barra de Filtros Rápidos de Nivel de Stock */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-[#E8E6DF]/60">
                <span className="text-[11px] font-semibold text-[#657373] uppercase tracking-wider mr-1 flex items-center gap-1 shrink-0">
                  <Filter className="h-3 w-3" />
                  Estado Stock:
                </span>
                <button
                  type="button"
                  onClick={() => setFiltroStockHub('todos')}
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    filtroStockHub === 'todos'
                      ? 'bg-[#1C2424] text-white shadow-xs'
                      : 'bg-[#F8F7F2] text-[#657373] hover:bg-[#E8E6DF]'
                  }`}
                >
                  Todos ({productos.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroStockHub('critico')}
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    filtroStockHub === 'critico'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
                  }`}
                >
                  <AlertTriangle className="h-3 w-3" />
                  Críticos ({metricasStockHub.criticos})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroStockHub('bajo')}
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    filtroStockHub === 'bajo'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60'
                  }`}
                >
                  <AlertCircle className="h-3 w-3" />
                  Bajas unidades ({metricasStockHub.bajasUnidades})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroStockHub('agotado')}
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    filtroStockHub === 'agotado'
                      ? 'bg-red-700 text-white shadow-xs'
                      : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200/60'
                  }`}
                >
                  Agotados ({metricasStockHub.agotados})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroStockHub('optimo')}
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    filtroStockHub === 'optimo'
                      ? 'bg-[#2A7A78] text-white shadow-xs'
                      : 'bg-[#E2F1F0] text-[#2A7A78] hover:bg-[#cbeae8]'
                  }`}
                >
                  <PackageCheck className="h-3 w-3" />
                  Óptimos ({metricasStockHub.optimos})
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {productosFiltradosHub.length === 0 ? (
                /* Estado cuando no hay productos registrados o coincidentes con los filtros */
                <div className="py-12 text-center flex flex-col items-center justify-center space-y-3 px-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F8F7F2] text-[#657373]">
                    <Search className="h-6 w-6" />
                  </div>
                  <div className="max-w-md">
                    <p className="font-semibold text-sm text-[#1C2424]">
                      No se encontraron productos coincidentes
                    </p>
                    <p className="text-xs text-[#657373] mt-1">
                      No hay artículos que coincidan con la categoría, el nivel de stock o la búsqueda textual aplicada.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={limpiarFiltrosHub}
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                      Restablecer filtros
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="text-xs bg-[#2A7A78] text-white hover:bg-[#2A7A78]/90"
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
                  {/* Tabla de Productos de la Categoría */}
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
                      const esCritico = prod.stockActual <= prod.stockMinimo;
                      const esBajo = !esCritico && prod.stockActual <= prod.stockMinimo * 1.5;
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
                              <Badge variant="secondary" className="text-xs text-[#657373] bg-[#F8F7F2] border-[#E8E6DF]">
                                Inactivo / Baja
                              </Badge>
                            ) : esAgotado ? (
                              <Badge variant="destructive" className="text-xs flex items-center gap-1 w-fit border-red-300 bg-red-100/90 text-red-800">
                                <Archive className="h-3 w-3 text-red-700" />
                                Agotado
                              </Badge>
                            ) : esCritico ? (
                              <Badge variant="destructive" className="text-xs flex items-center gap-1 w-fit border-rose-200 bg-rose-50 text-rose-700">
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
                                className="h-7 text-xs px-2 text-[#2A7A78] hover:bg-[#E2F1F0]"
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
                                  className="h-7 text-xs px-2 text-red-600 hover:bg-red-50 border-red-200"
                                  onClick={() => setProductoABajar(prod)}
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
                                  className="h-7 text-xs px-2 text-[#2A7A78] hover:bg-[#E2F1F0]"
                                  onClick={() => reactivarProducto(prod.id)}
                                  title="Reactivar este producto"
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
                        {Math.min(inicioInventario + itemsPorPaginaInventario, productosFiltradosHub.length)}
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
                        onClick={() => setPaginaInventario((p) => Math.min(p + 1, totalPaginasInventario))}
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
          CASO 2: FORMULARIO DE CARGA DE PRODUCTO (Sin marcas de pasos)
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
                  className="gap-1.5 text-[#657373] hover:text-[#1C2424]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Volver a opciones</span>
                </Button>
                <Badge variant="default">Carga de Producto</Badge>
              </div>
              <h1 className="text-2xl font-bold text-[#1C2424] tracking-tight mt-2">
                Cargar Producto Nuevo
              </h1>
              <p className="text-sm text-[#657373]">
                Ingresa los datos comerciales, existencias y costos para incorporar el artículo al catálogo.
              </p>
            </div>
          </div>

          {/* Formulario Unificado */}
          <Card>
            <CardHeader className="border-b border-[#E8E6DF] pb-4">
              <CardTitle className="text-base font-bold text-[#1C2424]">
                Formulario de Producto
              </CardTitle>
              <CardDescription className="text-xs text-[#657373]">
                Completa los campos obligatorios para dar de alta el producto en el sistema.
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
                      className="gap-1.5 text-xs text-[#2A7A78] border-[#2A7A78]/30 hover:bg-[#E2F1F0]"
                      onClick={() => setModalCatOpened(true)}
                    >
                      <FolderPlus className="h-3.5 w-3.5" />
                      <span>+ Nueva Categoría</span>
                    </Button>
                  </div>

                  <select
                    value={formData.categoriaId}
                    onChange={(e) => setFieldValue('categoriaId', e.target.value)}
                    className={`flex h-10 w-full rounded-lg border bg-white px-3 py-1 text-sm text-[#1C2424] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A7A78]/20 focus-visible:border-[#2A7A78] ${fieldErrors.categoriaId ? 'border-red-500' : 'border-[#E8E6DF]'
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
                        className="text-[11px] text-[#2A7A78] hover:underline flex items-center gap-1 font-medium"
                      >
                        <RefreshCw className="h-3 w-3" /> Auto
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        placeholder="Ej: 779001 o SKU-101"
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
                          value={formData.precioVenta || ''}
                          onChange={(e) => setFieldValue('precioVenta', parseFloat(e.target.value) || 0)}
                          error={fieldErrors.precioVenta}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-[#E8E6DF]">
                      <div>
                        <p className="text-xs text-[#657373]">Ganancia neta x unidad</p>
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

                  {/* Stock y Almacén */}
                  <div className="p-4 rounded-xl border border-[#E8E6DF] bg-[#F8F7F2]/60 space-y-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#2A7A78]">
                      Control de Stock y Almacén
                    </span>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[#1C2424]">Stock Inicial *</label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="1"
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
                          value={formData.stockMinimo}
                          onChange={(e) => setFieldValue('stockMinimo', parseInt(e.target.value) || 0)}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[#1C2424]">Ubicación en Depósito</label>
                        <Input
                          placeholder="Ej: Pasillo 2 - Estante B"
                          value={formData.ubicacion}
                          onChange={(e) => setFieldValue('ubicacion', e.target.value)}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[#1C2424]">Proveedor / Distribuidor</label>
                        <Input
                          placeholder="Ej: Distribuidora Norte"
                          value={formData.proveedor}
                          onChange={(e) => setFieldValue('proveedor', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Acciones del Formulario */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormData(valoresInicialesCargaProducto)}
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
          CASO 3: DAR DE BAJA PRODUCTOS
          ==================================================================== */}
      {seccionActiva === 'baja' && (
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
                  className="gap-1.5 text-[#657373] hover:text-[#1C2424]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Volver a opciones</span>
                </Button>
                <Badge variant="destructive">Bajas de Catálogo</Badge>
              </div>
              <h1 className="text-2xl font-bold text-[#1C2424] tracking-tight mt-2">
                Dar de Baja un Producto
              </h1>
              <p className="text-sm text-[#657373]">
                Desactiva productos del inventario activo. El historial se conserva para auditoría y reportes.
              </p>
            </div>
          </div>

          {/* Filtros y Buscador */}
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Input
                  placeholder="Buscar por código, nombre o categoría..."
                  value={busquedaBaja}
                  onChange={(e) => setBusquedaBaja(e.target.value)}
                  className="pl-9"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#657373]" />
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Button
                  size="sm"
                  variant={filtroEstadoBaja === 'activos' ? 'default' : 'outline'}
                  onClick={() => setFiltroEstadoBaja('activos')}
                >
                  Activos
                </Button>
                <Button
                  size="sm"
                  variant={filtroEstadoBaja === 'inactivos' ? 'default' : 'outline'}
                  onClick={() => setFiltroEstadoBaja('inactivos')}
                >
                  Dados de Baja
                </Button>
                <Button
                  size="sm"
                  variant={filtroEstadoBaja === 'todos' ? 'default' : 'outline'}
                  onClick={() => setFiltroEstadoBaja('todos')}
                >
                  Todos
                </Button>
              </div>
            </div>
          </Card>

          {/* Tabla de Productos para Baja */}
          <Card>
            <CardHeader className="pb-3 border-b border-[#E8E6DF]">
              <CardTitle className="text-base font-bold text-[#1C2424]">
                Productos ({productosFiltradosBaja.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Stock Actual</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody ref={bajasTableBodyRef}>
                  {productosFiltradosBaja.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-sm text-[#657373]">
                        No se encontraron productos con el filtro aplicado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    productosFiltradosBaja.map((prod) => (
                      <TableRow key={prod.id}>
                        <TableCell className="font-mono text-xs font-bold text-[#1C2424]">
                          {prod.codigo}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-sm text-[#1C2424]">{prod.nombre}</div>
                          {prod.descripcion && (
                            <div className="text-xs text-[#657373] line-clamp-1">{prod.descripcion}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">{prod.categoria?.nombre || 'General'}</Badge>
                        </TableCell>
                        <TableCell className="font-medium text-[#1C2424]">
                          {prod.stockActual} {prod.unidadMedida}
                        </TableCell>
                        <TableCell>
                          <Badge variant={prod.activo ? 'success' : 'destructive'}>
                            {prod.activo ? 'Activo' : 'Dado de baja'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {prod.activo ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setProductoABajar(prod);
                                setMotivoBaja('');
                              }}
                              className="gap-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Dar de Baja</span>
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => reactivarProducto(prod.id)}
                              className="gap-1 text-[#2A7A78] border-[#2A7A78]/30 hover:bg-[#E2F1F0]"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span>Reactivar</span>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ====================================================================
          CASO 4: MODIFICAR PRODUCTO EXISTENTE
          ==================================================================== */}
      {seccionActiva === 'modificar' && (
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
                  className="gap-1.5 text-[#657373] hover:text-[#1C2424]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Volver a opciones</span>
                </Button>
                <Badge variant="secondary">Edición de Catálogo</Badge>
              </div>
              <h1 className="text-2xl font-bold text-[#1C2424] tracking-tight mt-2">
                Modificar Producto Existente
              </h1>
              <p className="text-sm text-[#657373]">
                Selecciona un artículo para actualizar precios de venta, costos, existencias mínimas o descripciones.
              </p>
            </div>
          </div>

          {/* Buscador */}
          <Card className="p-4">
            <div className="relative w-full sm:w-96">
              <Input
                placeholder="Buscar por código, nombre o categoría..."
                value={busquedaModificar}
                onChange={(e) => setBusquedaModificar(e.target.value)}
                className="pl-9"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#657373]" />
            </div>
          </Card>

          {/* Tabla de Selección para Editar */}
          <Card>
            <CardHeader className="pb-3 border-b border-[#E8E6DF]">
              <CardTitle className="text-base font-bold text-[#1C2424]">
                Catálogo de Artículos ({productosFiltradosModificar.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Costo ($)</TableHead>
                    <TableHead>Venta ($)</TableHead>
                    <TableHead>Stock Actual</TableHead>
                    <TableHead>Stock Mínimo</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody ref={modificarTableBodyRef}>
                  {productosFiltradosModificar.map((prod) => (
                    <TableRow key={prod.id}>
                      <TableCell className="font-mono text-xs font-bold text-[#1C2424]">
                        {prod.codigo}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-sm text-[#1C2424]">{prod.nombre}</div>
                        {prod.descripcion && (
                          <div className="text-xs text-[#657373] line-clamp-1">{prod.descripcion}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">{prod.categoria?.nombre || 'General'}</Badge>
                      </TableCell>
                      <TableCell className="text-[#657373]">
                        ${prod.precioCosto.toLocaleString('es-AR')}
                      </TableCell>
                      <TableCell className="font-bold text-[#1C2424]">
                        ${prod.precioVenta.toLocaleString('es-AR')}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-semibold text-sm ${
                            prod.stockActual <= prod.stockMinimo
                              ? 'text-rose-600 font-bold'
                              : 'text-[#1C2424]'
                          }`}
                        >
                          {prod.stockActual}
                        </span>{' '}
                        <span className="text-xs text-[#657373]">{prod.unidadMedida}</span>
                      </TableCell>
                      <TableCell className="text-[#657373]">
                        {prod.stockMinimo} {prod.unidadMedida}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleAbrirEdicion(prod)}
                          className="gap-1.5"
                        >
                          <FileEdit className="h-3.5 w-3.5" />
                          <span>Editar</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                  Stock actual en depósito: <strong>{productoABajar.stockActual} {productoABajar.unidadMedida}</strong>
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1C2424] uppercase tracking-wider">
                  Motivo de la Baja (Opcional)
                </label>
                <Input
                  placeholder="Ej: Mercadería discontinuada por proveedor, rotura, vencimiento"
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
          MODAL: MODIFICAR PRODUCTO EXISTENTE
          ==================================================================== */}
      <Dialog open={modalEditarOpened} onOpenChange={setModalEditarOpened}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Modificar Producto</DialogTitle>
            <DialogDescription>
              Actualiza los valores comerciales del artículo. Los cambios impactarán de inmediato en el catálogo.
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
                    value={formEdicion.precioVenta}
                    onChange={(e) =>
                      setFormEdicion((prev) => ({ ...prev, precioVenta: parseFloat(e.target.value) || 0 }))
                    }
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#1C2424] uppercase tracking-wider">
                    Stock Físico Actual *
                  </label>
                  <Input
                    type="number"
                    min="0"
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
                    value={formEdicion.stockMinimo}
                    onChange={(e) =>
                      setFormEdicion((prev) => ({ ...prev, stockMinimo: parseInt(e.target.value) || 0 }))
                    }
                  />
                </div>

                <div className="space-y-1.5">
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
                  <span>Guardar Cambios</span>
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

