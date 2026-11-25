'use client';

import React from 'react';
import { motion } from 'motion/react';
import {
  SlidersHorizontal,
  Package,
  Warning,
  Question,
  CheckCircle,
  ChartLineUp,
  CalendarCheck,
} from '@phosphor-icons/react';
import { useAdminConfiguracionController } from '@/controllers/adminControllers/configuracionController';
import { PeriodoMetricas, InicioSemana } from '@/models/modelos_vista/configuracionModel';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { sanitizarEnteroInput } from '@/lib/validaciones';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SwitchToggle } from './SwitchToggle';

interface TabInventarioYMetricasConfigProps {
  controller: ReturnType<typeof useAdminConfiguracionController>;
  campoEditandoVacio: string | null;
  setCampoEditandoVacio: (campo: string | null) => void;
}

export function TabInventarioYMetricasConfig({
  controller,
  campoEditandoVacio,
  setCampoEditandoVacio,
}: TabInventarioYMetricasConfigProps) {
  const { config, pestañaActiva, actualizarInventario, actualizarMetricas } = controller;

  return (
    <>
        {pestañaActiva === 'inventario' && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Card 1: Umbral de Stock de Seguridad */}
            <Card className="border-[#E8E6DF] shadow-sm">
              <CardHeader className="pb-3 border-b border-[#E8E6DF]">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-[#2A7A78]" weight="duotone" />
                  <CardTitle className="text-sm font-bold text-[#1C2424]">
                    Umbrales de Existencias Mínimas
                  </CardTitle>
                </div>
                <p className="text-xs text-[#657373]">
                  Valores predeterminados asignados para advertencias de desabastecimiento.
                </p>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1C2424] mb-1">
                    Umbral Mínimo por Defecto (Unidades)
                  </label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={
                        campoEditandoVacio === 'umbralMinimo'
                          ? ''
                          : String(config.inventario.umbralMinimoPorDefecto || 1)
                      }
                      onChange={(e) => {
                        const limpio = sanitizarEnteroInput(e.target.value, 1000);
                        if (limpio === '' || limpio === '0') {
                          setCampoEditandoVacio('umbralMinimo');
                        } else {
                          setCampoEditandoVacio(null);
                          actualizarInventario({
                            umbralMinimoPorDefecto: Math.max(1, parseInt(limpio, 10)),
                          });
                        }
                      }}
                      onBlur={() => setCampoEditandoVacio(null)}
                      className="h-9 text-xs w-32"
                    />
                    <span className="text-xs text-[#657373]">unidades de seguridad</span>
                  </div>
                  <p className="text-xs text-[#657373] mt-2">
                    Cuando se dé de alta un nuevo producto en <strong>Gestión de Inventario</strong>, el campo de stock mínimo iniciará con esta cifra. Los productos activos cuyo stock sea menor o igual a su mínimo se marcarán automáticamente como <strong>Stock Crítico</strong>.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[#F8F7F2] border border-[#E8E6DF] flex items-start gap-2.5">
                  <Question className="h-4 w-4 text-[#657373] mt-0.5 flex-shrink-0" weight="duotone" />
                  <p className="text-[11px] text-[#657373]">
                    El diagnóstico de existencias se monitorea de forma unificada en <strong>Gestión de Inventario</strong> e <strong>Inventario Global</strong> en 4 niveles: Sin Stock, Stock Crítico, Bajas Unidades y Stock Óptimo.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Validaciones y Control de Calidad */}
            <Card className="border-[#E8E6DF] shadow-sm">
              <CardHeader className="pb-3 border-b border-[#E8E6DF]">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-[#2A7A78]" weight="duotone" />
                  <CardTitle className="text-sm font-bold text-[#1C2424]">
                    Integridad y Control de Precios
                  </CardTitle>
                </div>
                <p className="text-xs text-[#657373]">
                  Restricciones para evitar errores contables al crear o editar mercadería.
                </p>
              </CardHeader>
              <CardContent className="p-4 space-y-5">
                {/* Switch: Margen Negativo */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Warning className="h-4 w-4 text-amber-600" weight="duotone" />
                      <p className="text-xs font-semibold text-[#1C2424]">
                        Alerta de Margen Negativo o Nulo
                      </p>
                    </div>
                    <p className="text-xs text-[#657373] mt-1">
                      Advierte visualmente al administrador durante el alta o modificación si el precio de venta es menor o igual al costo de reposición.
                    </p>
                  </div>
                  <SwitchToggle
                    id="toggle-margen"
                    checked={config.inventario.alertarMargenNegativo}
                    onChange={(val) => actualizarInventario({ alertarMargenNegativo: val })}
                    label="Alerta de margen negativo"
                  />
                </div>

                <div className="border-t border-[#E8E6DF] pt-4">
                  {/* Categoría obligatoria para mantener el catálogo ordenado */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="h-4 w-4 text-emerald-600" weight="duotone" />
                        <p className="text-xs font-semibold text-[#1C2424]">
                          Categoría Obligatoria
                        </p>
                      </div>
                      <p className="text-xs text-[#657373] mt-1">
                        Cada producto que cargues debe pertenecer a una categoría (por ejemplo, Bebidas o Almacén) para mantener organizado tu inventario.
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-300 bg-emerald-50 shrink-0">
                      Siempre activo
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ==================================================================== */}
        {/* PESTAÑA 4: CRITERIOS DE MEDICIÓN & KPIS                              */}
        {/* ==================================================================== */}
        {pestañaActiva === 'metricas' && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* 1. Selector de Período Predeterminado */}
            <Card className="border-[#E8E6DF] shadow-sm">
              <CardHeader className="pb-3 border-b border-[#E8E6DF]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ChartLineUp className="h-4 w-4 text-[#2A7A78]" weight="duotone" />
                    <CardTitle className="text-sm font-semibold text-[#1C2424]">
                      Período Base Predeterminado del Dashboard
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs border-[#E8E6DF] text-[#657373]">
                    Visualización Inicial
                  </Badge>
                </div>
                <p className="text-xs text-[#657373] mt-1">
                  Define qué ventana de tiempo gobierna inicialmente todas las métricas, gráficos y rankings cuando el Administrador accede a <strong>Métricas</strong>.
                </p>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    {
                      id: 'mensual',
                      titulo: 'Mes Calendario (Recomendado)',
                      descripcion: 'Desde el día de corte mensual en curso. Ideal para balances mensuales y control contable.',
                      badge: 'Balance Mensual',
                    },
                    {
                      id: 'semanal',
                      titulo: 'Semana en Curso',
                      descripcion: 'Monitorea la semana actual completa. Ideal para comercios de alta rotación (minimercados, almacenes).',
                      badge: 'Rotación Alta',
                    },
                    {
                      id: 'diario',
                      titulo: 'Jornada de Hoy (Diario)',
                      descripcion: 'Enfocado en las ventas y caja del día en vivo, comparado contra la jornada de ayer.',
                      badge: 'En Vivo',
                    },
                    {
                      id: 'ultimos_30_dias',
                      titulo: 'Últimos 30 Días (Ventana Móvil)',
                      descripcion: 'Ventana continua de 30 días deslizantes. Evita la caída a cero de métricas el primer día del mes.',
                      badge: 'Continuo',
                    },
                  ].map((opcion) => {
                    const esSeleccionado = config.metricas.periodoPorDefecto === opcion.id;
                    return (
                      <div
                        key={opcion.id}
                        onClick={() => actualizarMetricas({ periodoPorDefecto: opcion.id as PeriodoMetricas })}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                          esSeleccionado
                            ? 'border-[#2A7A78] bg-[#E2F1F0]/30 shadow-2xs ring-1 ring-[#2A7A78]/20'
                            : 'border-[#E8E6DF] bg-white hover:border-[#2A7A78]/50 hover:bg-[#F8F7F2]/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-4 w-4 rounded-full border flex items-center justify-center transition-colors ${
                                esSeleccionado
                                  ? 'border-[#2A7A78] bg-[#2A7A78]'
                                  : 'border-[#D5D3C8] bg-white'
                              }`}
                            >
                              {esSeleccionado && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                            </div>
                            <span className="text-xs font-bold text-[#1C2424]">
                              {opcion.titulo}
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 font-medium ${
                              esSeleccionado
                                ? 'border-[#2A7A78]/40 bg-white text-[#2A7A78]'
                                : 'border-[#E8E6DF] text-[#657373]'
                            }`}
                          >
                            {opcion.badge}
                          </Badge>
                        </div>
                        <p className="text-xs text-[#657373] mt-2 ml-6">
                          {opcion.descripcion}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* 2. Ciclos de Tiempo y Comparativas */}
            <Card className="border-[#E8E6DF] shadow-sm">
              <CardHeader className="pb-3 border-b border-[#E8E6DF]">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-[#2A7A78]" weight="duotone" />
                  <CardTitle className="text-sm font-semibold text-[#1C2424]">
                    Parámetros de Calendario & Ciclos de Corte
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Inicio de la Semana */}
                  <div>
                    <label className="block text-xs font-semibold text-[#1C2424] mb-1">
                      Inicio de la Semana Laboral
                    </label>
                    <select
                      value={config.metricas.inicioSemana}
                      onChange={(e) => actualizarMetricas({ inicioSemana: e.target.value as InicioSemana })}
                      className="w-full text-xs rounded-lg border border-[#E8E6DF] bg-white px-3 py-2 text-[#1C2424] focus:outline-none focus:ring-1 focus:ring-[#2A7A78] focus:border-[#2A7A78]"
                    >
                      <option value="lunes">Lunes (Estándar comercial habitual)</option>
                      <option value="domingo">Domingo (Estándar calendario tradicional)</option>
                    </select>
                    <p className="text-[11px] text-[#657373] mt-1">
                      Define a partir de qué día se agrupan los gráficos de tendencia semanal.
                    </p>
                  </div>

                  {/* Día de Corte Mensual */}
                  <div>
                    <label className="block text-xs font-semibold text-[#1C2424] mb-1">
                      Día de Corte Mensual (1 al 28)
                    </label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={
                        campoEditandoVacio === 'diaCorte'
                          ? ''
                          : String(config.metricas.diaCorteMensual || 1)
                      }
                      onChange={(e) => {
                        const limpio = sanitizarEnteroInput(e.target.value, 28);
                        if (limpio === '' || limpio === '0') {
                          setCampoEditandoVacio('diaCorte');
                        } else {
                          setCampoEditandoVacio(null);
                          actualizarMetricas({ diaCorteMensual: Math.max(1, parseInt(limpio, 10)) });
                        }
                      }}
                      onBlur={() => setCampoEditandoVacio(null)}
                      className="text-xs h-9"
                    />
                    <p className="text-[11px] text-[#657373] mt-1">
                      Día del mes donde inicia el balance contable (habitualmente el día 1).
                    </p>
                  </div>
                </div>

                {/* Comparación de Tendencia vs Período Anterior */}
                <div className="pt-3 border-t border-[#E8E6DF] flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#1C2424]">
                      Comparativa porcentual vs. período anterior
                    </p>
                    <p className="text-xs text-[#657373] mt-0.5">
                      Muestra indicadores con la variación porcentual real y la curva comparativa contra la ventana temporal previa.
                    </p>
                  </div>
                  <SwitchToggle
                    id="toggle-comparar-periodo"
                    checked={Boolean(config.metricas.compararPeriodoAnterior)}
                    onChange={(val) => actualizarMetricas({ compararPeriodoAnterior: val })}
                    label="Comparativa de período anterior"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
    </>
  );
}
