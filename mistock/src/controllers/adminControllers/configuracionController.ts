'use client';

/**
 * ====================================================================
 * CONTROLADOR: CONFIGURACIÓN GENERAL DEL SISTEMA (Patrón MVC - Controller)
 * ====================================================================
 * 
 * Propósito:
 * Administrar la parametrización del negocio, datos de facturación para el POS,
 * métodos de cobro habilitados, umbrales de stock y exportación de respaldos.
 */

import { useState } from 'react';
import {
  ConfiguracionCompleta,
  ConfiguracionNegocio,
  ConfiguracionPOS,
  ConfiguracionInventario,
  MetodosPagoConfig,
  valoresPorDefectoConfiguracion,
} from '@/models/modelos_vista/configuracionModel';
import { initialProductos } from '@/models/mock_data/inventarioMock';

export type PestañaConfiguracion = 'negocio' | 'pos' | 'inventario' | 'respaldos';

const STORAGE_KEY = 'mistock_configuracion_v1';

export function useAdminConfiguracionController() {
  const [config, setConfig] = useState<ConfiguracionCompleta>(() => {
    if (typeof window === 'undefined') {
      return valoresPorDefectoConfiguracion;
    }
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...valoresPorDefectoConfiguracion,
          ...parsed,
          negocio: { ...valoresPorDefectoConfiguracion.negocio, ...(parsed.negocio || {}) },
          pos: { ...valoresPorDefectoConfiguracion.pos, ...(parsed.pos || {}) },
          inventario: { ...valoresPorDefectoConfiguracion.inventario, ...(parsed.inventario || {}) },
        };
      }
    } catch {
      // Fallback a valores por defecto silenciosamente
    }
    return valoresPorDefectoConfiguracion;
  });
  const [pestañaActiva, setPestañaActiva] = useState<PestañaConfiguracion>('negocio');
  const [guardando, setGuardando] = useState<boolean>(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const limpiarMensajes = () => {
    setMensajeExito(null);
    setMensajeError(null);
  };

  /**
   * Actualiza los datos comerciales de la empresa y del ticket.
   */
  const actualizarNegocio = (datos: Partial<ConfiguracionNegocio>) => {
    setConfig((prev) => ({
      ...prev,
      negocio: { ...prev.negocio, ...datos },
    }));
  };

  /**
   * Actualiza los parámetros de operación de caja.
   */
  const actualizarPOS = (datos: Partial<ConfiguracionPOS>) => {
    setConfig((prev) => ({
      ...prev,
      pos: { ...prev.pos, ...datos },
    }));
  };

  /**
   * Alterna un método de pago habilitado (ej: débito, crédito, QR).
   */
  const toggleMetodoPago = (metodo: keyof MetodosPagoConfig) => {
    setConfig((prev) => {
      const actual = prev.pos.metodosPagoHabilitados[metodo];
      // Regla: No permitir deshabilitar todos los métodos a la vez
      const habilitados = Object.values({
        ...prev.pos.metodosPagoHabilitados,
        [metodo]: !actual,
      }).filter(Boolean).length;

      if (habilitados === 0) {
        setMensajeError('Debe quedar al menos un método de cobro habilitado para la caja.');
        setTimeout(() => setMensajeError(null), 3500);
        return prev;
      }

      return {
        ...prev,
        pos: {
          ...prev.pos,
          metodosPagoHabilitados: {
            ...prev.pos.metodosPagoHabilitados,
            [metodo]: !actual,
          },
        },
      };
    });
  };

  /**
   * Actualiza las directivas y umbrales de inventario.
   */
  const actualizarInventario = (datos: Partial<ConfiguracionInventario>) => {
    setConfig((prev) => ({
      ...prev,
      inventario: { ...prev.inventario, ...datos },
    }));
  };

  /**
   * Guarda los cambios en el almacenamiento persistente.
   */
  const guardarCambios = () => {
    setGuardando(true);
    setMensajeError(null);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      setGuardando(false);
      setMensajeExito('Configuración guardada exitosamente.');
      setTimeout(() => setMensajeExito(null), 3500);
    } catch {
      setGuardando(false);
      setMensajeError('Error al guardar la configuración en el almacenamiento local.');
    }
  };

  /**
   * Restablece todos los parámetros a los valores por defecto de fábrica.
   */
  const restablecerPorDefecto = () => {
    setConfig(valoresPorDefectoConfiguracion);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    setMensajeExito('Se restablecieron los valores predeterminados de fábrica.');
    setTimeout(() => setMensajeExito(null), 3500);
  };

  /**
   * Descarga el catálogo completo de productos en formato CSV estándar.
   */
  const exportarCatalogoCSV = () => {
    try {
      const headers = ['SKU', 'Producto', 'Categoría', 'Precio Costo', 'Precio Venta', 'Stock Actual', 'Stock Mínimo', 'Unidad Medida', 'Estado'];
      const rows = initialProductos.map((p) => [
        `"${p.codigo}"`,
        `"${p.nombre.replace(/"/g, '""')}"`,
        `"${(p.categoria?.nombre || 'General').replace(/"/g, '""')}"`,
        p.precioCosto,
        p.precioVenta,
        p.stockActual,
        p.stockMinimo,
        `"${p.unidadMedida}"`,
        p.activo ? '"Activo"' : '"Inactivo"',
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `catalogo_productos_mistock_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setMensajeExito('Catálogo exportado exitosamente a formato CSV.');
      setTimeout(() => setMensajeExito(null), 3500);
    } catch {
      setMensajeError('No se pudo generar el archivo de exportación del catálogo.');
    }
  };

  /**
   * Descarga el resumen contable de ventas en formato CSV.
   */
  const exportarVentasCSV = () => {
    try {
      const headers = ['Comprobante', 'Fecha', 'Vendedor', 'Método Pago', 'Total Facturado', 'Estado'];
      const demoVentas = [
        ['"VNT-1001"', '"2026-09-25 10:30"', '"Lucas Benítez"', '"Efectivo"', 4500, '"Completada"'],
        ['"VNT-1002"', '"2026-09-25 11:15"', '"Camila Fernández"', '"Tarjeta Débito"', 12800, '"Completada"'],
        ['"VNT-1003"', '"2026-09-25 12:40"', '"Mateo Rossi"', '"Transferencia QR"', 6900, '"Completada"'],
        ['"VNT-1004"', '"2026-09-25 14:10"', '"Lucas Benítez"', '"Efectivo"', 2450, '"Completada"'],
        ['"VNT-1005"', '"2026-09-25 16:00"', '"Camila Fernández"', '"Tarjeta Crédito"', 8900, '"Completada"'],
      ];

      const csvContent = '\uFEFF' + [headers.join(','), ...demoVentas.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `registro_ventas_mistock_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setMensajeExito('Histórico de ventas exportado exitosamente a formato CSV.');
      setTimeout(() => setMensajeExito(null), 3500);
    } catch {
      setMensajeError('No se pudo generar el archivo de exportación de ventas.');
    }
  };

  return {
    config,
    pestañaActiva,
    setPestañaActiva,
    guardando,
    mensajeExito,
    mensajeError,
    actualizarNegocio,
    actualizarPOS,
    toggleMetodoPago,
    actualizarInventario,
    guardarCambios,
    restablecerPorDefecto,
    exportarCatalogoCSV,
    exportarVentasCSV,
    limpiarMensajes,
  };
}
