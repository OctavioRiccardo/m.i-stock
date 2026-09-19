'use client';

/**
 * ====================================================================
 * VISTA: GESTIÓN DE INVENTARIO Y ALTA DE PRODUCTOS (Patrón MVC - View)
 * ====================================================================
 * 
 * Propósito:
 * Proveer una interfaz visual intuitiva y guiada para la carga de productos
 * y administración de categorías del catálogo.
 * 
 * Cumplimiento de Regla de Negocio:
 * "El producto no puede existir sin una categoría definida."
 * La vista implementa un flujo en dos pasos obligatorios:
 * - Paso 1: Selección o creación inmediata de la categoría contenedora.
 * - Paso 2: Habilitación del formulario detallado de producto y cálculo de márgenes.
 * 
 * Rol en la Arquitectura:
 * - Es la capa "V" (View).
 * - Delega la validación de duplicados y la persistencia en `useAdminInventarioController`.
 */

import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  Check,
  AlertCircle,
  Barcode,
  FolderPlus,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Building2,
  Tag,
} from 'lucide-react';
import { useAdminInventarioController } from '@/controllers/adminControllers/inventarioController';
import {
  FormularioCargaProducto,
  valoresInicialesCargaProducto,
} from '@/models/modelos_vista/cargaProductoModel';
import { UnidadMedida } from '@/models/modelos_dominio/productoModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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

interface AdminGestionInventarioProps {
  controller: ReturnType<typeof useAdminInventarioController>;
}

// Opciones predefinidas de fraccionamiento para el selector de unidades
const unidadesDisponibles: { value: UnidadMedida; label: string }[] = [
  { value: 'unidad', label: 'Unidad (un.)' },
  { value: 'kg', label: 'Kilogramo (kg)' },
  { value: 'gramo', label: 'Gramo (g)' },
  { value: 'litro', label: 'Litro (L)' },
  { value: 'metro', label: 'Metro (m)' },
  { value: 'paquete', label: 'Paquete / Pack' },
];

export function AdminGestionInventario({ controller }: AdminGestionInventarioProps) {
  const {
    categorias,
    productos,
    loading,
    mensajeExito,
    mensajeError,
    agregarCategoria,
    guardarProducto,
    limpiarMensajes,
  } = controller;

  // Estado del modal para nueva categoría
  const [modalCatOpened, setModalCatOpened] = useState(false);
  const [nuevaCatNombre, setNuevaCatNombre] = useState('');
  const [nuevaCatDesc, setNuevaCatDesc] = useState('');
  const [errorCat, setErrorCat] = useState<string | null>(null);

  // Formulario de carga
  const [formData, setFormData] = useState<FormularioCargaProducto>(valoresInicialesCargaProducto);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormularioCargaProducto, string>>>({});

  const setFieldValue = <K extends keyof FormularioCargaProducto>(field: K, value: FormularioCargaProducto[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const categoriaSeleccionada = categorias.find((c) => c.id === formData.categoriaId);

  // Cálculo en vivo de rentabilidad
  const costo = Number(formData.precioCosto) || 0;
  const venta = Number(formData.precioVenta) || 0;
  const gananciaNeta = venta - costo;
  const margenPorcentaje = costo > 0 ? ((gananciaNeta / costo) * 100).toFixed(1) : '100.0';
  const esRentable = venta >= costo;

  // Crear categoría al vuelo
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

  // Generar SKU automático
  const handleGenerarSku = () => {
    const prefijo = categoriaSeleccionada
      ? categoriaSeleccionada.nombre.slice(0, 3).toUpperCase()
      : 'SKU';
    const num = Math.floor(1000 + Math.random() * 9000);
    setFieldValue('codigo', `${prefijo}-${num}`);
  };

  // Validación y Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Partial<Record<keyof FormularioCargaProducto, string>> = {};
    if (!formData.categoriaId || formData.categoriaId.trim() === '') {
      errors.categoriaId = 'El producto debe pertenecer a una categoría definida obligatoriamente.';
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
        categoriaId: catPrevia, // Mantiene la categoría activa para carga rápida
      });
      setFieldErrors({});
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-[#1C2424] tracking-tight">
          Gestión de Inventario
        </h1>
        <p className="text-sm text-[#657373]">
          Alta y carga de productos organizados estrictamente por categoría de negocio.
        </p>
      </div>

      {/* Alertas Globales */}
      {mensajeExito && (
        <Alert variant="success" className="cursor-pointer" onClick={limpiarMensajes}>
          <Check className="h-4 w-4" />
          <AlertTitle>Operación Exitosa</AlertTitle>
          <AlertDescription>{mensajeExito}</AlertDescription>
        </Alert>
      )}

      {mensajeError && (
        <Alert variant="destructive" className="cursor-pointer" onClick={limpiarMensajes}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Atención</AlertTitle>
          <AlertDescription>{mensajeError}</AlertDescription>
        </Alert>
      )}

      {/* PASO 1: CATEGORÍA OBLIGATORIA */}
      <Card className="border-l-4 border-l-[#2A7A78]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-[#2A7A78]" />
              <CardTitle className="text-base font-bold text-[#1C2424]">
                Paso 1: Definir la Categoría del Producto
              </CardTitle>
            </div>
            <Badge variant="default">Paso Obligatorio</Badge>
          </div>
          <p className="text-xs text-[#657373]">
            En miStock, <strong>un producto no puede existir sin una categoría definida</strong>. Selecciona a qué categoría pertenecerá este producto o crea una nueva.
          </p>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-9 space-y-1.5">
              <label className="text-xs font-semibold text-[#1C2424] uppercase tracking-wider">
                Categoría de Destino *
              </label>
              <select
                value={formData.categoriaId}
                onChange={(e) => setFieldValue('categoriaId', e.target.value)}
                className={`flex h-9 w-full rounded-lg border bg-white px-3 py-1 text-sm text-[#1C2424] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A7A78]/20 focus-visible:border-[#2A7A78] ${fieldErrors.categoriaId ? 'border-red-500' : 'border-[#E8E6DF]'
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
            </div>

            <div className="sm:col-span-3">
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 border-[#2A7A78]/30 text-[#2A7A78] hover:bg-[#E2F1F0]"
                onClick={() => setModalCatOpened(true)}
              >
                <FolderPlus className="h-4 w-4" />
                <span>+ Nueva Categoría</span>
              </Button>
            </div>
          </div>

          {categoriaSeleccionada && (
            <div className="flex items-center gap-2 pt-1">
              <Badge variant="default" className="text-xs py-1">
                Categoría seleccionada: {categoriaSeleccionada.nombre}
              </Badge>
              {categoriaSeleccionada.descripcion && (
                <span className="text-xs text-[#657373] italic">
                  — {categoriaSeleccionada.descripcion}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* PASO 2: DATOS DEL PRODUCTO */}
      <Card>
        <CardHeader className="pb-3 border-b border-[#E8E6DF]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Boxes className="h-5 w-5 text-[#2A7A78]" />
              <CardTitle className="text-base font-bold text-[#1C2424]">
                Paso 2: Datos del Producto
              </CardTitle>
            </div>
            {!formData.categoriaId && (
              <Badge variant="warning">
                Selecciona una categoría arriba para continuar
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-5">
          <form onSubmit={handleSubmit} className="space-y-6">
            <fieldset
              disabled={!formData.categoriaId}
              className={`space-y-6 ${!formData.categoriaId ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {/* Bloque: Identificación */}
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
                      title="Generar código automático"
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
                    Descripción / Especificaciones (Opcional)
                  </label>
                  <Textarea
                    placeholder="Detalles sobre presentación, marca, contenido neto..."
                    value={formData.descripcion}
                    onChange={(e) => setFieldValue('descripcion', e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              {/* Bloque: Precios & Control de Stock */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Precios & Rentabilidad */}
                <div className="p-4 rounded-xl border border-dashed border-[#E8E6DF] bg-[#F8F7F2]/60 space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#2A7A78]">
                    Precios y Márgenes Comerciales
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#1C2424]">
                        Precio de Costo ($)
                      </label>
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
                      <label className="text-xs font-medium text-[#1C2424]">
                        Precio de Venta ($) *
                      </label>
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

                {/* Stock & Depósito */}
                <div className="p-4 rounded-xl border border-dashed border-[#E8E6DF] bg-[#F8F7F2]/60 space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#2A7A78]">
                    Control de Stock y Almacén
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#1C2424]">
                        Stock Inicial *
                      </label>
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
                      <label className="text-xs font-medium text-[#1C2424]">
                        Stock Mínimo (Alerta) *
                      </label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="5"
                        value={formData.stockMinimo}
                        onChange={(e) => setFieldValue('stockMinimo', parseInt(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#1C2424]">
                        Ubicación en Depósito
                      </label>
                      <Input
                        placeholder="Ej: Pasillo 2 - Estante B"
                        value={formData.ubicacion}
                        onChange={(e) => setFieldValue('ubicacion', e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#1C2424]">
                        Proveedor / Distribuidor
                      </label>
                      <Input
                        placeholder="Ej: Distribuidora Norte"
                        value={formData.proveedor}
                        onChange={(e) => setFieldValue('proveedor', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormData(valoresInicialesCargaProducto)}
                  disabled={loading}
                >
                  Limpiar Formulario
                </Button>
                <Button
                  type="submit"
                  size="default"
                  loading={loading}
                  disabled={!formData.categoriaId}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>
                    {categoriaSeleccionada
                      ? `Guardar Producto en "${categoriaSeleccionada.nombre}"`
                      : 'Guardar Producto en Inventario'}
                  </span>
                </Button>
              </div>
            </fieldset>
          </form>
        </CardContent>
      </Card>

      {/* TABLA DE PRODUCTOS EN INVENTARIO */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-bold text-[#1C2424]">
              Productos en Inventario ({productos.length})
            </CardTitle>
            <p className="text-xs text-[#657373]">
              Catálogo actual organizado por categoría.
            </p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E2F1F0] text-[#2A7A78]">
            <Building2 className="h-4 w-4" />
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Costo</TableHead>
                <TableHead>Precio Venta</TableHead>
                <TableHead>Stock Actual</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productos.map((prod) => {
                const esCritico = prod.stockActual <= prod.stockMinimo;
                return (
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
                      <span className={`font-bold ${esCritico ? 'text-red-600' : 'text-[#1C2424]'}`}>
                        {prod.stockActual} {prod.unidadMedida || 'un.'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={esCritico ? 'destructive' : 'success'}>
                        {esCritico ? 'Stock Crítico' : 'Normal'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MODAL PARA CREAR NUEVA CATEGORÍA */}
      <Dialog open={modalCatOpened} onOpenChange={setModalCatOpened}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nueva Categoría</DialogTitle>
            <DialogDescription>
              Recuerda que los productos se cargan asociados a una categoría específica.
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
                placeholder="Breve descripción de los productos de esta categoría"
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
    </div>
  );
}
