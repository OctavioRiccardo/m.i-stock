'use client';

/**
 * ====================================================================
 * CONTROLADOR: CONFIGURACIÓN GENERAL DEL SISTEMA (Patrón MVC - Controller)
 * ====================================================================
 * 
 * Propósito:
 * Administrar la parametrización del negocio, datos de facturación para el POS,
 * métodos de cobro habilitados, umbrales de stock, métricas en vivo de base de datos
 * y exportación de respaldos CSV sincronizados con Supabase PostgreSQL.
 */

import { useState, useMemo, useEffect } from 'react';
import {
  ConfiguracionNegocio,
  ConfiguracionPOS,
  ConfiguracionInventario,
  ConfiguracionMetricas,
  MetodosPagoConfig,
} from '@/models/modelos_vista/configuracionModel';
import { configuracionService, useConfiguracionData } from '@/services/configuracionService';
import { inventarioService, useInventarioData } from '@/services/inventarioService';
import { supabaseService } from '@/services/supabaseService';
import {
  VENTAS_STORAGE_KEY,
  inicializarVentasCliente,
  recalcularVentasStore,
} from '@/controllers/userControllers/userDashboardController';

export type PestañaConfiguracion = 'negocio' | 'pos' | 'inventario' | 'metricas' | 'respaldos';

const ULTIMO_RESPALDO_STORAGE_KEY = 'mistock_ultimo_respaldo_csv';

export function useAdminConfiguracionController() {
  const config = useConfiguracionData();
  const { productos, categorias } = useInventarioData();

  const [pestañaActiva, setPestañaActiva] = useState<PestañaConfiguracion>('negocio');
  const [guardando, setGuardando] = useState<boolean>(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const [totalVentas, setTotalVentas] = useState<number>(
    () => (inicializarVentasCliente().ventasRecientes || []).length
  );

  const [ultimoRespaldoCSV, setUltimoRespaldoCSV] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(ULTIMO_RESPALDO_STORAGE_KEY);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    let mounted = true;
    void inventarioService.sincronizarConSupabase();
    void configuracionService.sincronizarConSupabase();

    const sincronizarConteoVentas = () => {
      setTotalVentas((inicializarVentasCliente().ventasRecientes || []).length);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', sincronizarConteoVentas);
      window.addEventListener('mistock_ventas_updated', sincronizarConteoVentas);
    }

    supabaseService
      .fetchVentasWithStatus()
      .then((res) => {
        if (!mounted || !res.ok) return;
        const actualizado = recalcularVentasStore(res.items);
        setTotalVentas(res.items.length);
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.setItem(VENTAS_STORAGE_KEY, JSON.stringify(actualizado));
          } catch {}
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', sincronizarConteoVentas);
        window.removeEventListener('mistock_ventas_updated', sincronizarConteoVentas);
      }
    };
  }, []);

  const registrarTimestampRespaldo = () => {
    const ahora = new Date();
    const marca = `${ahora.toLocaleDateString('es-AR')} ${ahora.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    setUltimoRespaldoCSV(marca);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(ULTIMO_RESPALDO_STORAGE_KEY, marca);
      } catch {}
    }
  };

  // Estadísticas reales de registros almacenados en Supabase
  const estadisticasSistema = useMemo(
    () => ({
      totalProductos: productos.length,
      totalCategorias: categorias.length,
      totalVentas,
      totalRegistros: productos.length + categorias.length + totalVentas,
      ultimoRespaldoCSV,
    }),
    [productos.length, categorias.length, totalVentas, ultimoRespaldoCSV]
  );

  const limpiarMensajes = () => {
    setMensajeExito(null);
    setMensajeError(null);
  };

  const actualizarNegocio = (datos: Partial<ConfiguracionNegocio>) => {
    configuracionService.actualizarNegocio(datos);
  };

  const actualizarPOS = (datos: Partial<ConfiguracionPOS>) => {
    configuracionService.actualizarPOS(datos);
  };

  const toggleMetodoPago = (metodo: keyof MetodosPagoConfig) => {
    const res = configuracionService.toggleMetodoPago(metodo);
    if (!res.exito && res.mensaje) {
      setMensajeError(res.mensaje);
      setTimeout(() => setMensajeError(null), 3500);
    }
  };

  const actualizarInventario = (datos: Partial<ConfiguracionInventario>) => {
    configuracionService.actualizarInventario(datos);
  };

  const actualizarMetricas = (datos: Partial<ConfiguracionMetricas>) => {
    configuracionService.actualizarMetricas(datos);
  };

  const guardarCambios = () => {
    setGuardando(true);
    setMensajeError(null);

    try {
      configuracionService.guardarConfiguracion(config);
      setGuardando(false);
      setMensajeExito('Configuración sincronizada con la base de datos y el mostrador.');
      setTimeout(() => setMensajeExito(null), 3500);
    } catch {
      setGuardando(false);
      setMensajeError('Error al guardar la configuración.');
    }
  };

  const restablecerPorDefecto = () => {
    configuracionService.restablecerPorDefecto();
    setMensajeExito('Se restablecieron los valores predeterminados de fábrica.');
    setTimeout(() => setMensajeExito(null), 3500);
  };

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

      registrarTimestampRespaldo();
      setMensajeExito('Catálogo exportado exitosamente a formato CSV.');
      setTimeout(() => setMensajeExito(null), 3500);
    } catch {
      setMensajeError('No se pudo generar el archivo de exportación del catálogo.');
    }
  };

  const exportarVentasCSV = () => {
    try {
      const headers = ['Comprobante', 'Fecha y Hora', 'Vendedor', 'Método Pago', 'Cantidad Ítems', 'Total Facturado', 'Estado'];
      const ventasReales = inicializarVentasCliente().ventasRecientes || [];

      const rows = ventasReales.map((v) => {
        const fechaHora = `${v.fecha || new Date().toLocaleDateString('es-AR')} ${v.hora || ''}`.trim();
        const vendedor = (v.vendedor || 'Cajero').replace(/"/g, '""');
        const metodo = String(v.metodoPago || 'efectivo').replace(/_/g, ' ');
        const estado = v.estado === 'cancelada' ? 'Cancelada' : 'Completada';
        return [
          `"${v.id}"`,
          `"${fechaHora}"`,
          `"${vendedor}"`,
          `"${metodo}"`,
          v.cantidadItems || 1,
          v.montoTotal || 0,
          `"${estado}"`,
        ];
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `registro_ventas_mistock_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      registrarTimestampRespaldo();
      setMensajeExito(
        `Histórico de ventas exportado exitosamente a formato CSV (${ventasReales.length} registros).`
      );
      setTimeout(() => setMensajeExito(null), 3500);
    } catch {
      setMensajeError('No se pudo generar el archivo de exportación de ventas.');
    }
  };

  return {
    config,
    estadisticasSistema,
    pestañaActiva,
    setPestañaActiva,
    guardando,
    mensajeExito,
    mensajeError,
    actualizarNegocio,
    actualizarPOS,
    toggleMetodoPago,
    actualizarInventario,
    actualizarMetricas,
    guardarCambios,
    restablecerPorDefecto,
    exportarCatalogoCSV,
    exportarVentasCSV,
    limpiarMensajes,
  };
}
