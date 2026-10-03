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

import { useState, useMemo, useEffect } from 'react';
import { UserDashboardData, ProductoRapidoPOS, VentaRecientePOS } from '@/models/modelos_vista/dashboardModel';
import { initialProductos } from '@/models/mock_data/inventarioMock';
import { useInventarioData, inventarioService } from '@/services/inventarioService';
import { MetodoPago, DetalleVenta } from '@/models/modelos_dominio/ventaModel';
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
 * Datos simulados iniciales para la terminal de ventas del cajero con renglones (DetalleVenta).
 */
const initialMockUserData: UserDashboardData = {
  ventasDelDia: 14,
  recaudacionDelDia: 48500,
  totalProductosEnStock: initialProductosPOS.reduce((acc, p) => acc + p.stock, 0),
  ventasRecientes: [
    {
      id: 'VNT-101',
      hora: '10:45',
      fecha: '26/09/2026',
      montoTotal: 3500,
      cantidadItems: 2,
      metodoPago: 'efectivo',
      vendedor: 'Lucas Benítez',
      items: [
        {
          id: 'DET-101-1',
          ventaId: 'VNT-101',
          productoId: 'prod-1',
          nombreProducto: 'Aceite de Girasol 1.5L',
          codigoProducto: '779001',
          cantidad: 1,
          precioUnitario: 2450,
          subtotal: 2450,
        },
        {
          id: 'DET-101-2',
          ventaId: 'VNT-101',
          productoId: 'prod-2',
          nombreProducto: 'Fideos Guiseros 500g',
          codigoProducto: '779002',
          cantidad: 1,
          precioUnitario: 1050,
          subtotal: 1050,
        },
      ],
      estado: 'completada',
    },
    {
      id: 'VNT-102',
      hora: '11:15',
      fecha: '26/09/2026',
      montoTotal: 12000,
      cantidadItems: 5,
      metodoPago: 'tarjeta_debito',
      vendedor: 'Camila Fernández',
      items: [
        {
          id: 'DET-102-1',
          ventaId: 'VNT-102',
          productoId: 'prod-7',
          nombreProducto: 'Jabón Líquido Ropa 3L',
          codigoProducto: '779007',
          cantidad: 2,
          precioUnitario: 4500,
          subtotal: 9000,
        },
        {
          id: 'DET-102-2',
          ventaId: 'VNT-102',
          productoId: 'prod-8',
          nombreProducto: 'Lavandina Clásica 1L',
          codigoProducto: '779008',
          cantidad: 3,
          precioUnitario: 1000,
          subtotal: 3000,
        },
      ],
      estado: 'completada',
    },
    {
      id: 'VNT-103',
      hora: '12:00',
      fecha: '26/09/2026',
      montoTotal: 4800,
      cantidadItems: 4,
      metodoPago: 'transferencia',
      vendedor: 'Lucas Benítez',
      items: [
        {
          id: 'DET-103-1',
          ventaId: 'VNT-103',
          productoId: 'prod-5',
          nombreProducto: 'Leche Entera Larga Vida 1L',
          codigoProducto: '779005',
          cantidad: 4,
          precioUnitario: 1200,
          subtotal: 4800,
        },
      ],
      estado: 'completada',
    },
    {
      id: 'VNT-104',
      hora: '13:20',
      fecha: '26/09/2026',
      montoTotal: 5800,
      cantidadItems: 2,
      metodoPago: 'efectivo',
      vendedor: 'Mateo Rossi',
      items: [
        {
          id: 'DET-104-1',
          ventaId: 'VNT-104',
          productoId: 'prod-4',
          nombreProducto: 'Café Tostado Molido 250g',
          codigoProducto: '779004',
          cantidad: 2,
          precioUnitario: 2900,
          subtotal: 5800,
        },
      ],
      estado: 'completada',
    },
    {
      id: 'VNT-105',
      hora: '14:10',
      fecha: '26/09/2026',
      montoTotal: 2700,
      cantidadItems: 2,
      metodoPago: 'efectivo',
      vendedor: 'Camila Fernández',
      items: [
        {
          id: 'DET-105-1',
          ventaId: 'VNT-105',
          productoId: 'prod-6',
          nombreProducto: 'Galletitas Surtidas 400g',
          codigoProducto: '779006',
          cantidad: 2,
          precioUnitario: 1350,
          subtotal: 2700,
        },
      ],
      estado: 'completada',
    },
    {
      id: 'VNT-106',
      hora: '15:05',
      fecha: '26/09/2026',
      montoTotal: 7200,
      cantidadItems: 3,
      metodoPago: 'tarjeta_credito',
      vendedor: 'Lucas Benítez',
      items: [
        {
          id: 'DET-106-1',
          ventaId: 'VNT-106',
          productoId: 'prod-9',
          nombreProducto: 'Detergente Lavavajillas 750ml',
          codigoProducto: '779009',
          cantidad: 1,
          precioUnitario: 1800,
          subtotal: 1800,
        },
        {
          id: 'DET-106-2',
          ventaId: 'VNT-106',
          productoId: 'prod-10',
          nombreProducto: 'Papel Higiénico 4u',
          codigoProducto: '779010',
          cantidad: 2,
          precioUnitario: 2700,
          subtotal: 5400,
        },
      ],
      estado: 'completada',
    },
    {
      id: 'VNT-107',
      hora: '16:30',
      fecha: '26/09/2026',
      montoTotal: 3600,
      cantidadItems: 3,
      metodoPago: 'efectivo',
      vendedor: 'Mateo Rossi',
      items: [
        {
          id: 'DET-107-1',
          ventaId: 'VNT-107',
          productoId: 'prod-11',
          nombreProducto: 'Gaseosa Cola 1.5L',
          codigoProducto: '779011',
          cantidad: 3,
          precioUnitario: 1200,
          subtotal: 3600,
        },
      ],
      estado: 'completada',
    },
  ],
  productosPopulares: initialProductosPOS,
};

export function useUserDashboardController() {
  const { productos: storeProductos } = useInventarioData();

  // Mapeo reactivo del catálogo en tiempo real sincronizado con Inventario Central
  const productosPopulares: ProductoRapidoPOS[] = useMemo(() => {
    return storeProductos
      .filter((p) => p.activo)
      .map((p) => ({
        id: p.id,
        nombre: p.nombre,
        categoria: p.categoria?.nombre || 'General',
        precio: p.precioVenta,
        stock: p.stockActual,
        stockMinimo: p.stockMinimo,
        codigo: p.codigo,
      }));
  }, [storeProductos]);

  const [ventasState, setVentasState] = useState({
    ventasDelDia: initialMockUserData.ventasDelDia,
    recaudacionDelDia: initialMockUserData.recaudacionDelDia,
    ventasRecientes: initialMockUserData.ventasRecientes,
  });

  const data: UserDashboardData = useMemo(() => ({
    ventasDelDia: ventasState.ventasDelDia,
    recaudacionDelDia: ventasState.recaudacionDelDia,
    totalProductosEnStock: productosPopulares.reduce((acc, p) => acc + p.stock, 0),
    ventasRecientes: ventasState.ventasRecientes,
    productosPopulares,
  }), [ventasState, productosPopulares]);
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

  // Filtro por categoría y paginación
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas');
  const [pagina, setPagina] = useState<number>(1);
  const itemsPorPagina = 6;

  // Extracción dinámica de categorías disponibles
  const categorias = useMemo(() => {
    const cats = Array.from(new Set(data.productosPopulares.map((p) => p.categoria))).filter(Boolean);
    return cats.sort();
  }, [data.productosPopulares]);

  // Conteo de productos por categoría
  const conteosPorCategoria = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of data.productosPopulares) {
      counts[p.categoria] = (counts[p.categoria] || 0) + 1;
    }
    return counts;
  }, [data.productosPopulares]);

  // Reset de página al cambiar filtros
  useEffect(() => {
    setPagina(1);
  }, [searchQuery, categoriaFiltro]);

  // Filtrado reactivo en tiempo real para búsqueda instantánea en el punto de venta
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtroCat = categoriaFiltro.toLowerCase();

    return data.productosPopulares.filter((product) => {
      const coincideTexto =
        !query ||
        product.nombre.toLowerCase().includes(query) ||
        product.codigo.toLowerCase().includes(query) ||
        product.categoria.toLowerCase().includes(query);

      const coincideCategoria =
        filtroCat === 'todas' ||
        product.categoria.toLowerCase() === filtroCat;

      return coincideTexto && coincideCategoria;
    });
  }, [data.productosPopulares, searchQuery, categoriaFiltro]);

  // Cálculos de paginación para Catálogo
  const totalPaginas = Math.max(1, Math.ceil(filteredProducts.length / itemsPorPagina));
  const inicioPaginacion = (pagina - 1) * itemsPorPagina;
  const productosPaginados = filteredProducts.slice(
    inicioPaginacion,
    inicioPaginacion + itemsPorPagina
  );

  // Paginación para Ventas Recientes en Caja
  const [paginaVentas, setPaginaVentas] = useState<number>(1);
  const itemsPorPaginaVentas = 4;
  const totalPaginasVentas = Math.max(1, Math.ceil(data.ventasRecientes.length / itemsPorPaginaVentas));
  const inicioPaginacionVentas = (paginaVentas - 1) * itemsPorPaginaVentas;
  const ventasRecientesPaginadas = data.ventasRecientes.slice(
    inicioPaginacionVentas,
    inicioPaginacionVentas + itemsPorPaginaVentas
  );

  /**
   * Registra una venta en efectivo especificando cantidad y monto recibido para cálculo de vuelto.
   */
  const registrarVentaEfectivo = (
    productId: string,
    cantidad: number = 1,
    montoRecibido?: number
  ): boolean => {
    setLoading(true);
    setSaleErrorMessage(null);
    setSaleSuccessMessage(null);

    const product = data.productosPopulares.find((p) => p.id === productId);

    if (!product) {
      setLoading(false);
      return false;
    }

    if (cantidad <= 0) {
      setSaleErrorMessage('La cantidad a vender debe ser de al menos 1 unidad.');
      setLoading(false);
      setTimeout(() => setSaleErrorMessage(null), 3500);
      return false;
    }

    if (product.stock < cantidad && !permitirVentaSinStock) {
      setSaleErrorMessage(
        `Stock insuficiente para "${product.nombre}". Disponible: ${product.stock} un. Solicitado: ${cantidad} un.`
      );
      setLoading(false);
      setTimeout(() => setSaleErrorMessage(null), 4000);
      return false;
    }

    const totalVenta = product.precio * cantidad;
    const vuelto = montoRecibido !== undefined && montoRecibido >= totalVenta ? montoRecibido - totalVenta : 0;

    const ventaId = `VNT-${Date.now().toString().slice(-4)}`;
    const nuevoDetalle: DetalleVenta = {
      id: `DET-${Date.now().toString().slice(-4)}`,
      ventaId: ventaId,
      productoId: product.id,
      nombreProducto: product.nombre,
      codigoProducto: product.codigo,
      cantidad: cantidad,
      precioUnitario: product.precio,
      subtotal: totalVenta,
    };

    const newSale: VentaRecientePOS = {
      id: ventaId,
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fecha: new Date().toLocaleDateString('es-AR'),
      montoTotal: totalVenta,
      cantidadItems: cantidad,
      metodoPago: 'efectivo',
      vendedor: 'Cajero en Turno',
      items: [nuevoDetalle],
      pagos: [
        {
          id: `PAG-${Date.now().toString().slice(-4)}`,
          ventaId: ventaId,
          metodo: 'efectivo',
          total: totalVenta,
        },
      ],
      estado: 'completada',
    };

    // Descuenta stock en el almacén central de inventario
    inventarioService.descontarStock(productId, cantidad);

    setVentasState((prev) => ({
      ...prev,
      ventasDelDia: prev.ventasDelDia + 1,
      recaudacionDelDia: prev.recaudacionDelDia + totalVenta,
      ventasRecientes: [newSale, ...prev.ventasRecientes],
    }));

    // Asegurar que la nueva venta aparezca en la primera página
    setPaginaVentas(1);

    const textoVuelto = vuelto > 0 ? ` • Vuelto entregado: ${monedaSimbolo} ${vuelto.toLocaleString('es-AR')}` : '';
    setSaleSuccessMessage(
      `Venta en efectivo registrada: ${cantidad}x ${product.nombre} (${monedaSimbolo} ${totalVenta.toLocaleString('es-AR')})${textoVuelto}`
    );
    setLoading(false);
    setTimeout(() => setSaleSuccessMessage(null), 4000);
    return true;
  };

  /**
   * Registra una venta mediante Mercado Pago (QR / Transferencia).
   */
  const registrarVentaMercadoPago = (
    productId: string,
    cantidad: number = 1
  ): boolean => {
    setLoading(true);
    setSaleErrorMessage(null);
    setSaleSuccessMessage(null);

    const product = data.productosPopulares.find((p) => p.id === productId);

    if (!product) {
      setLoading(false);
      return false;
    }

    if (cantidad <= 0) {
      setSaleErrorMessage('La cantidad a vender debe ser de al menos 1 unidad.');
      setLoading(false);
      setTimeout(() => setSaleErrorMessage(null), 3500);
      return false;
    }

    if (product.stock < cantidad && !permitirVentaSinStock) {
      setSaleErrorMessage(
        `Stock insuficiente para "${product.nombre}". Disponible: ${product.stock} un. Solicitado: ${cantidad} un.`
      );
      setLoading(false);
      setTimeout(() => setSaleErrorMessage(null), 4000);
      return false;
    }

    const totalVenta = product.precio * cantidad;

    const ventaId = `VNT-${Date.now().toString().slice(-4)}`;
    const nuevoDetalle = {
      id: `DET-${Date.now().toString().slice(-4)}`,
      ventaId: ventaId,
      productoId: product.id,
      nombreProducto: product.nombre,
      codigoProducto: product.codigo,
      cantidad: cantidad,
      precioUnitario: product.precio,
      subtotal: totalVenta,
    };

    const newSale: VentaRecientePOS = {
      id: ventaId,
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fecha: new Date().toLocaleDateString('es-AR'),
      montoTotal: totalVenta,
      cantidadItems: cantidad,
      metodoPago: 'mercado_pago',
      vendedor: 'Cajero en Turno',
      items: [nuevoDetalle],
      pagos: [
        {
          id: `PAG-${Date.now().toString().slice(-4)}`,
          ventaId: ventaId,
          metodo: 'mercado_pago',
          total: totalVenta,
        },
      ],
      estado: 'completada',
    };

    // Descuenta stock en el almacén central de inventario
    inventarioService.descontarStock(productId, cantidad);

    setVentasState((prev) => ({
      ...prev,
      ventasDelDia: prev.ventasDelDia + 1,
      recaudacionDelDia: prev.recaudacionDelDia + totalVenta,
      ventasRecientes: [newSale, ...prev.ventasRecientes],
    }));

    setPaginaVentas(1);

    setSaleSuccessMessage(
      `Venta con Mercado Pago registrada: ${cantidad}x ${product.nombre} (${monedaSimbolo} ${totalVenta.toLocaleString('es-AR')}) • Cobro acreditado vía QR`
    );
    setLoading(false);
    setTimeout(() => setSaleSuccessMessage(null), 4000);
    return true;
  };

  /**
   * Procesa una venta rápida de 1 unidad del producto seleccionado (compatibilidad).
   */
  const handleQuickSale = (productId: string, metodoOverride?: MetodoPago) => {
    const metodo = metodoOverride || metodoSeleccionado;
    if (metodo === 'mercado_pago') {
      return registrarVentaMercadoPago(productId, 1);
    }
    return registrarVentaEfectivo(productId, 1);
  };

  return {
    data,
    loading,
    searchQuery,
    setSearchQuery,
    categoriaFiltro,
    setCategoriaFiltro,
    categorias,
    conteosPorCategoria,
    pagina,
    setPagina,
    totalPaginas,
    inicioPaginacion,
    itemsPorPagina,
    filteredProducts,
    productosPaginados,
    paginaVentas,
    setPaginaVentas,
    totalPaginasVentas,
    inicioPaginacionVentas,
    itemsPorPaginaVentas,
    ventasRecientesPaginadas,
    saleSuccessMessage,
    saleErrorMessage,
    handleQuickSale,
    registrarVentaEfectivo,
    registrarVentaMercadoPago,
    monedaSimbolo,
    metodoSeleccionado,
    setMetodoSeleccionado,
    permitirVentaSinStock,
    config,
  };
}
