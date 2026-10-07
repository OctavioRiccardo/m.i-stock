'use client';

/**
 * ====================================================================
 * SUB-VISTA POS: CONSULTOR DE PRECIOS & DISPONIBILIDAD (ModuloConsultorPrecios)
 * ====================================================================
 * 
 * Propósito:
 * Módulo especializado para atención rápida y verificación de precios sin riesgo:
 * 1. El cliente pregunta el precio de un artículo o disponibilidad de stock.
 * 2. El vendedor escanea o busca el producto sin modificar el ticket de venta en curso.
 * 3. Muestra una ficha destacada con el precio gigante, stock en salón y estado comercial.
 * 4. Ofrece la opción de cargarlo al ticket si el cliente decide llevarlo.
 */

import React, { useRef, useState } from 'react';
import {
  Barcode,
  Tag,
  Package,
  Plus,
  CheckCircle,
  WarningCircle,
  MagnifyingGlass,
  ArrowRight,
  ArrowsClockwise,
  Sparkle,
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
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
import { useUserDashboardController } from '@/controllers/userControllers/userDashboardController';
import { ProductoRapidoPOS } from '@/models/modelos_vista/dashboardModel';

interface ModuloConsultorPreciosProps {
  controller: ReturnType<typeof useUserDashboardController>;
}

export function ModuloConsultorPrecios({ controller }: ModuloConsultorPreciosProps) {
  const {
    busquedaPrecios,
    setBusquedaPrecios,
    productoConsultado,
    setProductoConsultado,
    consultarProducto,
    productosConsultorFiltrados,
    monedaSimbolo,
    agregarAlCarrito,
  } = controller;

  const [agregadoMensaje, setAgregadoMensaje] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      consultarProducto(busquedaPrecios);
    }
  };

  const handleSeleccionarProducto = (prod: ProductoRapidoPOS) => {
    setProductoConsultado(prod);
    setBusquedaPrecios(prod.codigo);
  };

  const handleAgregarAlTicket = (prod: ProductoRapidoPOS) => {
    const exito = agregarAlCarrito(prod, 1);
    if (exito) {
      setAgregadoMensaje(`¡"${prod.nombre}" agregado al ticket de venta actual!`);
      setTimeout(() => setAgregadoMensaje(null), 3000);
    }
  };

  const handleLimpiarConsulta = () => {
    setProductoConsultado(null);
    setBusquedaPrecios('');
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header del Consultor */}
      <Card className="border-[#E8E6DF] shadow-xs bg-white">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2A7A78] text-white shadow-xs">
                <Tag className="h-5 w-5" weight="duotone" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#1C2424] tracking-tight">
                  Consultor de Precios y Disponibilidad
                </h2>
                <p className="text-xs text-[#657373]">
                  Verifique precios unitarios y existencias sin alterar el ticket activo del mostrador.
                </p>
              </div>
            </div>

            {productoConsultado && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLimpiarConsulta}
                className="text-xs h-8 text-[#657373] hover:text-[#1C2424] border-[#E8E6DF] cursor-pointer gap-1.5 self-end sm:self-auto"
              >
                <ArrowsClockwise className="h-3.5 w-3.5" />
                <span>Consultar otro artículo</span>
              </Button>
            )}
          </div>

          {/* Barra Hero de Escaneo / Búsqueda */}
          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                placeholder="Escanee código de barras o escriba el nombre del artículo (Enter para buscar)..."
                value={busquedaPrecios}
                onChange={(e) => {
                  setBusquedaPrecios(e.target.value);
                  if (e.target.value.trim() === '') {
                    setProductoConsultado(null);
                  }
                }}
                onKeyDown={handleKeyDown}
                className="pl-10 h-12 text-sm bg-[#F8F7F2]/50 border-[#E8E6DF] focus-visible:ring-[#2A7A78]"
                autoFocus
              />
              <Barcode className="absolute left-3.5 top-3.5 h-5 w-5 text-[#2A7A78]" />
              {busquedaPrecios && (
                <button
                  type="button"
                  onClick={handleLimpiarConsulta}
                  className="absolute right-3 top-3.5 text-xs text-[#657373] hover:text-[#1C2424] cursor-pointer"
                  title="Limpiar"
                >
                  ✕
                </button>
              )}
            </div>

            <Button
              type="button"
              onClick={() => consultarProducto(busquedaPrecios)}
              className="h-12 px-5 text-xs bg-[#2A7A78] hover:bg-[#205E5D] text-white font-bold cursor-pointer gap-2 shrink-0 shadow-xs"
            >
              <MagnifyingGlass className="h-4 w-4" weight="bold" />
              <span>Verificar</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alerta de confirmación de adición al ticket */}
      <AnimatePresence>
        {agregadoMensaje && (
          <motion.div
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            className="p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600" weight="fill" />
              <span>{agregadoMensaje}</span>
            </div>
            <span className="text-[10px] text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
              Ticket actualizado
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================================================================== */}
      {/* TARJETA DESTACADA: PRODUCTO CONSULTADO                                */}
      {/* ==================================================================== */}
      {productoConsultado ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-[#2A7A78] bg-linear-to-b from-white to-[#F8F7F2]/40 shadow-sm overflow-hidden">
            <div className="bg-[#E2F1F0] px-5 py-2.5 border-b border-[#2A7A78]/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-[#2A7A78]" weight="fill" />
                <span className="text-xs font-bold text-[#205E5D] uppercase tracking-wide">
                  Resultado de la Consulta
                </span>
              </div>
              <Badge variant="outline" className="border-[#2A7A78]/30 bg-white text-[#2A7A78] font-mono text-[11px]">
                SKU: {productoConsultado.codigo}
              </Badge>
            </div>

            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Columna Izquierda: Información del Producto */}
                <div className="md:col-span-7 space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs uppercase px-2 py-0.5 border-[#E8E6DF] text-[#657373]">
                      {productoConsultado.categoria}
                    </Badge>
                    {productoConsultado.oferta && (
                      <Badge variant="warning" className="text-xs gap-1 font-bold">
                        <Sparkle className="h-3 w-3" weight="fill" />
                        <span>En Promoción</span>
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-2xl font-black text-[#1C2424] tracking-tight leading-tight">
                    {productoConsultado.nombre}
                  </h3>

                  {productoConsultado.descripcion && (
                    <p className="text-xs text-[#657373]">
                      {productoConsultado.descripcion}
                    </p>
                  )}

                  {/* Estado de Existencias */}
                  <div className="p-3 rounded-xl bg-white border border-[#E8E6DF] inline-flex items-center gap-3">
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                        productoConsultado.stock <= 0
                          ? 'bg-red-100 text-red-600'
                          : productoConsultado.stock <= (productoConsultado.stockMinimo ?? 5)
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {productoConsultado.stock <= 0 ? (
                        <WarningCircle className="h-5 w-5" weight="fill" />
                      ) : (
                        <CheckCircle className="h-5 w-5" weight="fill" />
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] text-[#657373] uppercase font-semibold block leading-none">
                        Existencias en Salón
                      </span>
                      <span className="text-sm font-bold text-[#1C2424]">
                        {productoConsultado.stock <= 0
                          ? 'Agotado en Tienda'
                          : `${productoConsultado.stock} ${productoConsultado.unidadMedida || 'unidades'} disponibles`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Precio Prominente y Botón de Venta */}
                <div className="md:col-span-5 bg-white p-5 rounded-2xl border border-[#E8E6DF] text-center space-y-4 shadow-2xs">
                  <div>
                    <span className="text-xs uppercase tracking-wider font-semibold text-[#657373] block mb-1">
                      Precio al Consumidor
                    </span>
                    <div className="text-4xl font-black text-emerald-800 tracking-tight">
                      {monedaSimbolo} {productoConsultado.precio.toLocaleString('es-AR')}
                    </div>
                    <span className="text-[11px] text-[#A0A8A8] mt-1 block">
                      Precio final por {productoConsultado.unidadMedida || 'unidad'} con impuestos incluidos
                    </span>
                  </div>

                  <div className="pt-3 border-t border-[#E8E6DF] space-y-2">
                    <Button
                      type="button"
                      onClick={() => handleAgregarAlTicket(productoConsultado)}
                      disabled={productoConsultado.stock <= 0}
                      className="w-full h-11 text-xs bg-[#2A7A78] hover:bg-[#205E5D] text-white font-bold gap-2 cursor-pointer shadow-xs disabled:opacity-40"
                    >
                      <Plus className="h-4 w-4" weight="bold" />
                      <span>Cargar al Ticket Actual</span>
                    </Button>
                    <p className="text-[10px] text-[#657373]">
                      Añade 1 unidad al ticket en curso de la caja principal
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : null}

      {/* ==================================================================== */}
      {/* CATÁLOGO RÁPIDO DE CONSULTA / SUGERENCIAS                            */}
      {/* ==================================================================== */}
      <Card className="border-[#E8E6DF] shadow-xs bg-white">
        <CardHeader className="pb-3 border-b border-[#E8E6DF]">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-bold text-[#1C2424] uppercase tracking-wider flex items-center gap-1.5">
              <Package className="h-4 w-4 text-[#2A7A78]" weight="duotone" />
              <span>Sugerencias del Catálogo para Consulta</span>
            </CardTitle>
            <span className="text-[11px] text-[#657373]">
              Haga clic en cualquier fila para consultar el precio
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F8F7F2]/60">
                  <TableHead className="text-xs">Código</TableHead>
                  <TableHead className="text-xs">Artículo</TableHead>
                  <TableHead className="text-xs">Categoría</TableHead>
                  <TableHead className="text-xs text-right">Existencias</TableHead>
                  <TableHead className="text-xs text-right">Precio</TableHead>
                  <TableHead className="text-xs text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productosConsultorFiltrados.map((prod) => (
                  <TableRow
                    key={prod.id}
                    onClick={() => handleSeleccionarProducto(prod)}
                    className="hover:bg-[#E2F1F0]/30 cursor-pointer transition-colors"
                  >
                    <TableCell className="py-2.5 text-xs font-mono text-[#657373]">
                      {prod.codigo}
                    </TableCell>
                    <TableCell className="py-2.5">
                      <span className="text-xs font-semibold text-[#1C2424] block">
                        {prod.nombre}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0 border-[#E8E6DF] text-[#657373]">
                        {prod.categoria}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2.5 text-right">
                      <span
                        className={`text-xs font-semibold ${
                          prod.stock <= 0
                            ? 'text-red-600'
                            : prod.stock <= (prod.stockMinimo ?? 5)
                            ? 'text-amber-600'
                            : 'text-emerald-700'
                        }`}
                      >
                        {prod.stock <= 0 ? 'Sin stock' : `${prod.stock} un.`}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5 text-right font-black text-xs text-[#1C2424]">
                      {monedaSimbolo} {prod.precio.toLocaleString('es-AR')}
                    </TableCell>
                    <TableCell className="py-2.5 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSeleccionarProducto(prod);
                        }}
                        className="h-7 px-2 text-xs text-[#2A7A78] hover:text-[#205E5D] hover:bg-[#E2F1F0] gap-1 cursor-pointer font-medium"
                      >
                        <span>Ver Precio</span>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
