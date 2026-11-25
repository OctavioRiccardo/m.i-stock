'use client';

import React, { useState } from 'react';
import {
  Check,
  WarningCircle as AlertCircle,
  FolderPlus,
  TrendUp as TrendingUp,
  TrendDown as TrendingDown,
  Trash as Trash2,
} from '@phosphor-icons/react';
import { useAdminInventarioController } from '@/controllers/adminControllers/inventarioController';
import { Producto, UnidadMedida } from '@/models/modelos_dominio/productoModel';
import {
  LIMITES_TEXTO,
  MAX_STOCK_DB,
  sanitizarDecimalInput,
  parsearDecimalSeguro,
  sanitizarEnteroInput,
  sanitizarSkuInput,
} from '@/lib/validaciones';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const unidadesDisponibles: { value: UnidadMedida; label: string }[] = [
  { value: 'unidad', label: 'Unidad (un.)' },
  { value: 'kg', label: 'Kilogramo (kg)' },
  { value: 'gramo', label: 'Gramo (g)' },
  { value: 'litro', label: 'Litro (L)' },
  { value: 'metro', label: 'Metro (m)' },
  { value: 'paquete', label: 'Paquete / Pack' },
];

interface ModalesInventarioAdminProps {
  controller: ReturnType<typeof useAdminInventarioController>;
  modalCatOpened: boolean;
  setModalCatOpened: (open: boolean) => void;
  onCategoriaCreada: (categoriaId: string) => void;
  productoABajar: Producto | null;
  setProductoABajar: (prod: Producto | null) => void;
  productoAEditar: Producto | null;
  setProductoAEditar: (prod: Producto | null) => void;
}

export function ModalesInventarioAdmin({
  controller,
  modalCatOpened,
  setModalCatOpened,
  onCategoriaCreada,
  productoABajar,
  setProductoABajar,
  productoAEditar,
  setProductoAEditar,
}: ModalesInventarioAdminProps) {
  const { categorias, agregarCategoria, darDeBajaProducto, modificarProducto, config } = controller;

  const [nuevaCatNombre, setNuevaCatNombre] = useState('');
  const [nuevaCatDesc, setNuevaCatDesc] = useState('');
  const [errorCat, setErrorCat] = useState<string | null>(null);
  const [motivoBaja, setMotivoBaja] = useState('');

  const bajaProdId = productoABajar?.id ?? '';
  const [prevBajaProdId, setPrevBajaProdId] = useState<string>(bajaProdId);
  if (bajaProdId !== prevBajaProdId) {
    setPrevBajaProdId(bajaProdId);
    setMotivoBaja('');
  }

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
  const [editPrecioCostoInput, setEditPrecioCostoInput] = useState<string>('');
  const [editPrecioVentaInput, setEditPrecioVentaInput] = useState<string>('');
  const [editStockActualInput, setEditStockActualInput] = useState<string>('');
  const [editStockMinimoInput, setEditStockMinimoInput] = useState<string>('');

  const modalEditarOpened = Boolean(productoAEditar);
  const setModalEditarOpened = (open: boolean) => {
    if (!open) setProductoAEditar(null);
  };

  const editProdId = productoAEditar?.id ?? '';
  const [prevEditProdId, setPrevEditProdId] = useState<string>(editProdId);
  if (editProdId !== prevEditProdId) {
    setPrevEditProdId(editProdId);
    if (productoAEditar) {
      setFormEdicion({
        nombre: productoAEditar.nombre,
        codigo: productoAEditar.codigo,
        categoriaId: productoAEditar.categoriaId,
        unidadMedida: productoAEditar.unidadMedida || 'unidad',
        precioCosto: productoAEditar.precioCosto,
        precioVenta: productoAEditar.precioVenta,
        stockActual: productoAEditar.stockActual,
        stockMinimo: productoAEditar.stockMinimo,
        descripcion: productoAEditar.descripcion || '',
      });
      setEditPrecioCostoInput(String(productoAEditar.precioCosto));
      setEditPrecioVentaInput(String(productoAEditar.precioVenta));
      setEditStockActualInput(String(productoAEditar.stockActual));
      setEditStockMinimoInput(String(productoAEditar.stockMinimo));
    }
  }

  const costoEdicion = Number(formEdicion.precioCosto) || 0;
  const ventaEdicion = Number(formEdicion.precioVenta) || 0;
  const gananciaEdicion = ventaEdicion - costoEdicion;
  const margenEdicion =
    costoEdicion > 0 ? ((gananciaEdicion / costoEdicion) * 100).toFixed(1) : '100.0';
  const esRentableEdicion = ventaEdicion >= costoEdicion;

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
    onCategoriaCreada(res.categoria.id);
    setNuevaCatNombre('');
    setNuevaCatDesc('');
    setErrorCat(null);
    setModalCatOpened(false);
  };

  const handleConfirmarBaja = () => {
    if (!productoABajar) return;
    darDeBajaProducto(productoABajar.id, motivoBaja);
    setProductoABajar(null);
    setMotivoBaja('');
  };

  const handleGuardarEdicion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoAEditar) return;
    const exito = modificarProducto(productoAEditar.id, formEdicion);
    if (exito) {
      setProductoAEditar(null);
    }
  };

  return (
    <>
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
                  onChange={(e) => setNuevaCatNombre(e.target.value.replace(/\s{2,}/g, ' '))}
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
              <DialogTitle>¿Dar de baja este producto?</DialogTitle>
              <DialogDescription>
                El producto se retirará del catálogo activo y dejará de estar disponible para la venta en mostrador.
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
                      onChange={(e) =>
                        setFormEdicion((prev) => ({
                          ...prev,
                          nombre: e.target.value.replace(/\s{2,}/g, ' '),
                        }))
                      }
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
                      onChange={(e) =>
                        setFormEdicion((prev) => ({
                          ...prev,
                          codigo: sanitizarSkuInput(e.target.value),
                        }))
                      }
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
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={editPrecioCostoInput}
                      onChange={(e) => {
                        const limpio = sanitizarDecimalInput(e.target.value);
                        setEditPrecioCostoInput(limpio);
                        setFormEdicion((prev) => ({
                          ...prev,
                          precioCosto: parsearDecimalSeguro(limpio),
                        }));
                      }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#1C2424] uppercase tracking-wider">
                      Precio de Venta ($) *
                    </label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={editPrecioVentaInput}
                      onChange={(e) => {
                        const limpio = sanitizarDecimalInput(e.target.value);
                        setEditPrecioVentaInput(limpio);
                        setFormEdicion((prev) => ({
                          ...prev,
                          precioVenta: parsearDecimalSeguro(limpio),
                        }));
                      }}
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
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={editStockActualInput}
                      onChange={(e) => {
                        const limpio = sanitizarEnteroInput(e.target.value, MAX_STOCK_DB);
                        setEditStockActualInput(limpio);
                        setFormEdicion((prev) => ({
                          ...prev,
                          stockActual: limpio === '' ? 0 : parseInt(limpio, 10),
                        }));
                      }}
                      onBlur={() => {
                        if (editStockActualInput === '') setEditStockActualInput('0');
                      }}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#1C2424] uppercase tracking-wider">
                      Stock Mínimo (Alerta)
                    </label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="5"
                      value={editStockMinimoInput}
                      onChange={(e) => {
                        const limpio = sanitizarEnteroInput(e.target.value, MAX_STOCK_DB);
                        setEditStockMinimoInput(limpio);
                        setFormEdicion((prev) => ({
                          ...prev,
                          stockMinimo: limpio === '' ? 0 : parseInt(limpio, 10),
                        }));
                      }}
                      onBlur={() => {
                        if (editStockMinimoInput === '') setEditStockMinimoInput('0');
                      }}
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
    </>
  );
}
