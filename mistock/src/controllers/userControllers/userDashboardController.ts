'use client';

/**
 * ====================================================================
 * CONTROLADOR DEL PANEL DE CAJERO / TERMINAL DE VENTAS (POS) (Patrón MVC)
 * ====================================================================
 * 
 * Propósito:
 * Gestionar la operativa diaria en el punto de venta (POS) para el rol Vendedor/Cajero:
 * - Búsqueda rápida en el catálogo maestro unificado.
 * - Registro ágil de ventas con selección de medio de cobro habilitado.
 * - Respeto a las directivas de configuración global (moneda, venta sin stock).
 * - Descuento automático de stock y seguimiento de métricas diarias de caja.
 */

import { useState } from 'react';
import { UserDashboardData, ProductoRapidoPOS, VentaRecientePOS } from '@/models/modelos_vista/dashboardModel';
import { initialProductos } from '@/models/mock_data/inventarioMock';
import { MetodoPago } from '@/models/modelos_dominio/ventaModel';
import {
  ConfiguracionCompleta,
  valoresPorDefectoConfiguracion,
} from '@/models/modelos_vista/configuracionModel';

const CONFIG_STORAGE_KEY = 'mistock_configuracion_v1';

/**
 * Mapeo de artículos del catálogo maestro para listas rápidas en el mostrador.
 */
const initialProductosPOS: ProductoRapidoPOS[] = initialProductos.map((p) => ({
  id: p.id,
  nombre: p.nombre,
  categoria: p.categoria?.nombre || 'General',
  precio: p.precioVenta,
  stock: p.stockActual,
  stockMinimo: p.stockMinimo,
  codigo: p.codigo,
}));

/**
 * Datos simulados iniciales para la terminal de ventas del cajero.
 */
const initialMockUserData: UserDashboardData = {
  ventasDelDia: 14,
  recaudacionDelDia: 48500,
  totalProductosEnStock: initialProductosPOS.reduce((acc, p) => acc + p.stock, 0),
  ventasRecientes: [
    { id: 'VNT-101', hora: '10:45', montoTotal: 3500, cantidadItems: 2, metodoPago: 'efectivo' },
    { id: 'VNT-102', hora: '11:15', montoTotal: 12000, cantidadItems: 5, metodoPago: 'tarjeta_debito' },
    { id: 'VNT-103', hora: '12:00', montoTotal: 4800, cantidadItems: 1, metodoPago: 'transferencia' },
  ],
  productosPopulares: initialProductosPOS,
};

export function useUserDashboardController() {
  const [data, setData] = useState<UserDashboardData>(initialMockUserData);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [saleSuccessMessage, setSaleSuccessMessage] = useState<string | null>(null);
  const [saleErrorMessage, setSaleErrorMessage] = useState<string | null>(null);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<MetodoPago>('efectivo');

  // Lectura lazy de configuración global guardada por el Administrador
  const [config] = useState<ConfiguracionCompleta>(() => {
    if (typeof window === 'undefined') return valoresPorDefectoConfiguracion;
    try {
      const stored = window.localStorage.getItem(CONFIG_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...valoresPorDefectoConfiguracion,
          ...parsed,
          negocio: { ...valoresPorDefectoConfiguracion.negocio, ...(parsed.negocio || {}) },
          pos: { ...valoresPorDefectoConfiguracion.pos, ...(parsed.pos || {}) },
        };
      }
    } catch {
      // Fallback
    }
    return valoresPorDefectoConfiguracion;
  });

  const monedaSimbolo = config.negocio.monedaSimbolo || '$';
  const permitirVentaSinStock = config.pos.permitirVentaSinStock;

  // Filtrado reactivo en tiempo real para búsqueda instantánea en el punto de venta
  const filteredProducts = data.productosPopulares.filter(
    (product) =>
      product.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.codigo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.categoria.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /**
   * Procesa una venta rápida de 1 unidad del producto seleccionado:
   * 1. Verifica disponibilidad de stock según la directiva `permitirVentaSinStock`.
   * 2. Decrementa en 1 unidad el stock actual del producto (permite negativo solo si está habilitado).
   * 3. Incrementa el contador de ventas del día y el total monetario recaudado.
   * 4. Registra la transacción con timestamp local y método de pago utilizado.
   */
  const handleQuickSale = (productId: string, metodoOverride?: MetodoPago) => {
    setLoading(true);
    setSaleErrorMessage(null);
    setSaleSuccessMessage(null);

    const product = data.productosPopulares.find((p) => p.id === productId);

    if (!product) {
      setLoading(false);
      return;
    }

    // Validación de existencia de stock conforme a la directiva de configuración
    if (product.stock <= 0 && !permitirVentaSinStock) {
      setSaleErrorMessage(`Stock agotado para "${product.nombre}". La venta sin stock está bloqueada en la configuración del sistema.`);
      setLoading(false);
      setTimeout(() => setSaleErrorMessage(null), 4000);
      return;
    }

    const metodoPagoUsado = metodoOverride || metodoSeleccionado;

    // Decremento reactivo de stock en el catálogo local
    const updatedProducts = data.productosPopulares.map((p) =>
      p.id === productId ? { ...p, stock: p.stock - 1 } : p
    );

    // Creación del comprobante de venta reciente
    const newSale: VentaRecientePOS = {
      id: `VNT-${Date.now().toString().slice(-4)}`,
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      montoTotal: product.precio,
      cantidadItems: 1,
      metodoPago: metodoPagoUsado,
    };

    // Actualización de indicadores diarios del cajero
    setData((prev) => ({
      ...prev,
      ventasDelDia: prev.ventasDelDia + 1,
      recaudacionDelDia: prev.recaudacionDelDia + product.precio,
      totalProductosEnStock: Math.max(0, prev.totalProductosEnStock - 1),
      productosPopulares: updatedProducts,
      ventasRecientes: [newSale, ...prev.ventasRecientes],
    }));

    setSaleSuccessMessage(
      `Venta cobrada: ${product.nombre} (${monedaSimbolo} ${product.precio.toLocaleString('es-AR')}) vía ${metodoPagoUsado.replace('_', ' ')}`
    );
    setLoading(false);

    // Limpieza automática del banner de confirmación a los 3.5 segundos
    setTimeout(() => setSaleSuccessMessage(null), 3500);
  };

  return {
    data,
    loading,
    searchQuery,
    setSearchQuery,
    filteredProducts,
    saleSuccessMessage,
    saleErrorMessage,
    handleQuickSale,
    monedaSimbolo,
    metodoSeleccionado,
    setMetodoSeleccionado,
    permitirVentaSinStock,
    config,
  };
}
