'use client';

/**
 * ====================================================================
 * CONTROLADOR: CONFIGURACIÓN GENERAL DEL SISTEMA (Patrón MVC - Controller)
 * ====================================================================
 * 
 * Propósito:
 * Administrar la parametrización del negocio, datos de facturación para el POS,
 * métodos de cobro habilitados, umbrales de stock y exportación de respaldos.
 * Conectado reactivamente con `configuracionService` como Single Source of Truth.
 */

import { useState } from 'react';
import {
  ConfiguracionNegocio,
  ConfiguracionPOS,
  ConfiguracionInventario,
  MetodosPagoConfig,
} from '@/models/modelos_vista/configuracionModel';
import { configuracionService, useConfiguracionData } from '@/services/configuracionService';
import { inventarioService } from '@/services/inventarioService';

export type PestañaConfiguracion = 'negocio' | 'pos' | 'inventario' | 'respaldos';

export function useAdminConfiguracionController() {
  const config = useConfiguracionData();
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
    configuracionService.actualizarNegocio(datos);
  };

  /**
   * Actualiza los parámetros de operación de caja y hardware.
   */
  const actualizarPOS = (datos: Partial<ConfiguracionPOS>) => {
    configuracionService.actualizarPOS(datos);
  };

  /**
   * Alterna un método de pago habilitado (ej: débito, crédito, QR, mercado pago).
   */
  const toggleMetodoPago = (metodo: keyof MetodosPagoConfig) => {
    const res = configuracionService.toggleMetodoPago(metodo);
    if (!res.exito && res.mensaje) {
      setMensajeError(res.mensaje);
      setTimeout(() => setMensajeError(null), 3500);
    }
  };

  /**
   * Actualiza las directivas y umbrales de inventario.
   */
  const actualizarInventario = (datos: Partial<ConfiguracionInventario>) => {
    configuracionService.actualizarInventario(datos);
  };

  /**
   * Guarda los cambios en el almacenamiento persistente.
   */
  const guardarCambios = () => {
    setGuardando(true);
    setMensajeError(null);

    try {
      configuracionService.guardarConfiguracion(config);
      setGuardando(false);
      setMensajeExito('Configuración guardada exitosamente y sincronizada en tiempo real con el mostrador.');
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
    configuracionService.restablecerPorDefecto();
    setMensajeExito('Se restablecieron los valores predeterminados de fábrica.');
    setTimeout(() => setMensajeExito(null), 3500);
  };

  /**
   * Descarga el catálogo completo de productos en formato CSV estándar.
   */
  const exportarCatalogoCSV = () => {
    try {
      const headers = ['SKU', 'Producto', 'Categoría', 'Precio Costo', 'Precio Venta', 'Stock Actual', 'Stock Mínimo', 'Unidad Medida', 'Estado'];
      const rows = inventarioService.getProductos().map((p) => [
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
