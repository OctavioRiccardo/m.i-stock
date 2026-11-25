'use client';

import React, { useState } from 'react';
import {
  Plus,
  Barcode,
  FolderPlus,
  ArrowsClockwise as RefreshCw,
  TrendUp as TrendingUp,
  TrendDown as TrendingDown,
  Tag,
  ArrowLeft,
} from '@phosphor-icons/react';
import { useAdminInventarioController } from '@/controllers/adminControllers/inventarioController';
import {
  FormularioCargaProducto,
  valoresInicialesCargaProducto,
} from '@/models/modelos_vista/cargaProductoModel';
import { UnidadMedida } from '@/models/modelos_dominio/productoModel';
import {
  LIMITES_TEXTO,
  MAX_PRECIO_DB,
  MAX_STOCK_DB,
  esSkuValido,
  sanitizarDecimalInput,
  parsearDecimalSeguro,
  sanitizarEnteroInput,
  sanitizarSkuInput,
} from '@/lib/validaciones';
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

const unidadesDisponibles: { value: UnidadMedida; label: string }[] = [
  { value: 'unidad', label: 'Unidad (un.)' },
  { value: 'kg', label: 'Kilogramo (kg)' },
  { value: 'gramo', label: 'Gramo (g)' },
  { value: 'litro', label: 'Litro (L)' },
  { value: 'metro', label: 'Metro (m)' },
  { value: 'paquete', label: 'Paquete / Pack' },
];

interface SeccionAltaProductoAdminProps {
  controller: ReturnType<typeof useAdminInventarioController>;
  categoriaRecienCreadaId: string | null;
  onAbrirModalCategoria: () => void;
}

export function SeccionAltaProductoAdmin({
  controller,
  categoriaRecienCreadaId,
  onAbrirModalCategoria,
}: SeccionAltaProductoAdminProps) {
  const { setSeccionActiva, categorias, loading, guardarProducto, config } = controller;

  const setModalCatOpened = (open: boolean) => {
    if (open) onAbrirModalCategoria();
  };

  const umbralDefault =
    config?.inventario?.umbralMinimoPorDefecto ?? valoresInicialesCargaProducto.stockMinimo;
  const [formData, setFormData] = useState<FormularioCargaProducto>(() => ({
    ...valoresInicialesCargaProducto,
    stockMinimo: umbralDefault,
  }));
  const [precioCostoInput, setPrecioCostoInput] = useState<string>('');
  const [precioVentaInput, setPrecioVentaInput] = useState<string>('');
  const [stockInicialInput, setStockInicialInput] = useState<string>(
    String(valoresInicialesCargaProducto.stockInicial)
  );
  const [stockMinimoInput, setStockMinimoInput] = useState<string>(String(umbralDefault));
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof FormularioCargaProducto, string>>
  >({});

  const [prevCatCreada, setPrevCatCreada] = useState<string | null>(categoriaRecienCreadaId);
  if (categoriaRecienCreadaId !== prevCatCreada) {
    setPrevCatCreada(categoriaRecienCreadaId);
    if (categoriaRecienCreadaId) {
      setFormData((prev) => ({ ...prev, categoriaId: categoriaRecienCreadaId }));
      setFieldErrors((prev) => ({ ...prev, categoriaId: undefined }));
    }
  }

  const setFieldValue = <K extends keyof FormularioCargaProducto>(
    field: K,
    value: FormularioCargaProducto[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const categoriaSeleccionada = categorias.find((c) => c.id === formData.categoriaId);

  const costo = Number(formData.precioCosto) || 0;
  const venta = Number(formData.precioVenta) || 0;
  const gananciaNeta = venta - costo;
  const margenPorcentaje = costo > 0 ? ((gananciaNeta / costo) * 100).toFixed(1) : '100.0';
  const esRentable = venta >= costo;

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
      errors.categoriaId = 'Seleccionar una categoría para el producto.';
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
      const nuevoUmbral =
        config?.inventario?.umbralMinimoPorDefecto ?? valoresInicialesCargaProducto.stockMinimo;
      setFormData({
        ...valoresInicialesCargaProducto,
        categoriaId: catPrevia,
        stockMinimo: nuevoUmbral,
      });
      setPrecioCostoInput('');
      setPrecioVentaInput('');
      setStockInicialInput(String(valoresInicialesCargaProducto.stockInicial));
      setStockMinimoInput(String(nuevoUmbral));
      setFieldErrors({});
    }
  };

  return (
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
                <p className="text-sm text-muted-foreground">
                  Completar los datos comerciales, existencias iniciales y costos para incorporar el producto al catálogo.
                </p>
              </div>
            </div>

            {/* Formulario Unificado (solo campos persistidos en el modelo de dominio) */}
            <Card>
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="text-base font-bold text-foreground">
                  Formulario de Producto
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Completar los campos obligatorios (*) para registrar el producto y sincronizarlo con el mostrador.
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
                      <option value="">Seleccionar una categoría...</option>
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
                          onChange={(e) => setFieldValue('codigo', sanitizarSkuInput(e.target.value))}
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
                        onChange={(e) => setFieldValue('nombre', e.target.value.replace(/\s{2,}/g, ' '))}
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
                            type="text"
                            inputMode="decimal"
                            placeholder="0.00"
                            value={precioCostoInput}
                            onChange={(e) => {
                              const limpio = sanitizarDecimalInput(e.target.value);
                              setPrecioCostoInput(limpio);
                              setFieldValue('precioCosto', parsearDecimalSeguro(limpio));
                            }}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-[#1C2424]">Precio Venta ($) *</label>
                          <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="0.00"
                            value={precioVentaInput}
                            onChange={(e) => {
                              const limpio = sanitizarDecimalInput(e.target.value);
                              setPrecioVentaInput(limpio);
                              setFieldValue('precioVenta', parsearDecimalSeguro(limpio));
                            }}
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
                              type="text"
                              inputMode="numeric"
                              placeholder="0"
                              value={stockInicialInput}
                              onChange={(e) => {
                                const limpio = sanitizarEnteroInput(e.target.value, MAX_STOCK_DB);
                                setStockInicialInput(limpio);
                                setFieldValue('stockInicial', limpio === '' ? 0 : parseInt(limpio, 10));
                              }}
                              onBlur={() => {
                                if (stockInicialInput === '') setStockInicialInput('0');
                              }}
                              error={fieldErrors.stockInicial}
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[#1C2424]">Stock Mínimo (Alerta) *</label>
                            <Input
                              type="text"
                              inputMode="numeric"
                              placeholder="5"
                              value={stockMinimoInput}
                              onChange={(e) => {
                                const limpio = sanitizarEnteroInput(e.target.value, MAX_STOCK_DB);
                                setStockMinimoInput(limpio);
                                setFieldValue('stockMinimo', limpio === '' ? 0 : parseInt(limpio, 10));
                              }}
                              onBlur={() => {
                                if (stockMinimoInput === '') setStockMinimoInput('0');
                              }}
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
                      onClick={() => {
                        const nuevoUmbral =
                          config?.inventario?.umbralMinimoPorDefecto ??
                          valoresInicialesCargaProducto.stockMinimo;
                        setFormData({
                          ...valoresInicialesCargaProducto,
                          stockMinimo: nuevoUmbral,
                        });
                        setPrecioCostoInput('');
                        setPrecioVentaInput('');
                        setStockInicialInput(String(valoresInicialesCargaProducto.stockInicial));
                        setStockMinimoInput(String(nuevoUmbral));
                        setFieldErrors({});
                      }}
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
  );
}
