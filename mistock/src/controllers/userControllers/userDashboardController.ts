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
import { useRouter, useSearchParams } from 'next/navigation';
import {
  UserDashboardData,
  ProductoRapidoPOS,
  VentaRecientePOS,
  ItemCarritoPOS,
  PestanaOperativaPOS,
} from '@/models/modelos_vista/dashboardModel';
import { initialProductos } from '@/models/mock_data/inventarioMock';
import { useInventarioData, inventarioService } from '@/services/inventarioService';
import { MetodoPago, DetalleVenta } from '@/models/modelos_dominio/ventaModel';
import { useConfiguracionData } from '@/services/configuracionService';
import {
  ArqueoCajaDTO,
  ResumenMediosPagoCierre,
  EstadoBalanceCaja,
} from '@/models/modelos_vista/cierreCajaModel';

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
  descripcion: p.descripcion,
  unidadMedida: p.unidadMedida,
  oferta: p.oferta,
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
    {
      id: 'VNT-108',
      hora: '17:15',
      fecha: '26/09/2026',
      montoTotal: 6900,
      cantidadItems: 2,
      metodoPago: 'mercado_pago',
      vendedor: 'Camila Fernández',
      items: [
        {
          id: 'DET-108-1',
          ventaId: 'VNT-108',
          productoId: 'prod-1',
          nombreProducto: 'Aceite de Girasol 1.5L',
          codigoProducto: '779001',
          cantidad: 2,
          precioUnitario: 2450,
          subtotal: 4900,
        },
        {
          id: 'DET-108-2',
          ventaId: 'VNT-108',
          productoId: 'prod-3',
          nombreProducto: 'Arroz Largo Fino 1kg',
          codigoProducto: '779003',
          cantidad: 2,
          precioUnitario: 1000,
          subtotal: 2000,
        },
      ],
      estado: 'completada',
    },
  ],
  productosPopulares: initialProductosPOS,
};

export function useUserDashboardController() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Gestión reactiva de pestaña operativa (sincronizada con ?tab=...)
  const tabParam = (searchParams?.get('tab') as PestanaOperativaPOS) || 'caja';
  const [pestanaOperativa, setPestanaOperativaState] = useState<PestanaOperativaPOS>(
    ['caja', 'catalogo', 'precios', 'historial'].includes(tabParam) ? tabParam : 'caja'
  );

  // Sincronizar automáticamente si cambia el searchParam de la URL
  useEffect(() => {
    const param = searchParams?.get('tab') as PestanaOperativaPOS;
    if (param && ['caja', 'catalogo', 'precios', 'historial'].includes(param)) {
      setPestanaOperativaState(param);
    }
  }, [searchParams]);

  const setPestanaOperativa = (nuevaPestana: PestanaOperativaPOS) => {
    setPestanaOperativaState(nuevaPestana);
    router.push(`/dashboard?tab=${nuevaPestana}`);
  };

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
        descripcion: p.descripcion,
        unidadMedida: p.unidadMedida,
        oferta: p.oferta,
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

  // Suscripción reactiva en tiempo real a la configuración central del negocio
  const config = useConfiguracionData();

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

  // ====================================================================
  // FILTRADO Y PAGINACIÓN DE VENTAS RECIENTES EN CAJA
  // ====================================================================
  const [metodoPagoFiltroVentas, setMetodoPagoFiltroVentas] = useState<string>('todos');
  const [busquedaHistorial, setBusquedaHistorial] = useState<string>('');

  // Conteo de ventas por método de pago para píldoras de filtro
  const conteosPorMetodoPago = useMemo(() => {
    const counts: Record<string, number> = { todos: data.ventasRecientes.length };
    for (const v of data.ventasRecientes) {
      const m = v.metodoPago || 'efectivo';
      counts[m] = (counts[m] || 0) + 1;
    }
    return counts;
  }, [data.ventasRecientes]);

  // Filtrado reactivo de ventas según el método de pago seleccionado y término de búsqueda
  const ventasFiltradas = useMemo(() => {
    const query = busquedaHistorial.trim().toLowerCase();

    return data.ventasRecientes.filter((v) => {
      const coincideMetodo =
        metodoPagoFiltroVentas === 'todos' || (v.metodoPago || 'efectivo') === metodoPagoFiltroVentas;

      const coincideBusqueda =
        !query ||
        v.id.toLowerCase().includes(query) ||
        (v.vendedor && v.vendedor.toLowerCase().includes(query)) ||
        (v.items && v.items.some((it) => it.nombreProducto?.toLowerCase().includes(query)));

      return coincideMetodo && coincideBusqueda;
    });
  }, [data.ventasRecientes, metodoPagoFiltroVentas, busquedaHistorial]);

  // Reset de página al cambiar filtros en historial
  useEffect(() => {
    setPaginaVentas(1);
  }, [metodoPagoFiltroVentas, busquedaHistorial]);

  // Paginación para Ventas Recientes en Caja
  const [paginaVentas, setPaginaVentas] = useState<number>(1);
  const itemsPorPaginaVentas = 6;
  const totalPaginasVentas = Math.max(1, Math.ceil(ventasFiltradas.length / itemsPorPaginaVentas));
  const inicioPaginacionVentas = (paginaVentas - 1) * itemsPorPaginaVentas;
  const ventasRecientesPaginadas = ventasFiltradas.slice(
    inicioPaginacionVentas,
    inicioPaginacionVentas + itemsPorPaginaVentas
  );

  // ====================================================================
  // ====================================================================
  // OPERATIVA DE SESIÓN DE CAJA: APERTURA Y CIERRE (MONO-CAJA)
  // ====================================================================
  const [cajaAbierta, setCajaAbierta] = useState<boolean>(false);
  const [fondoInicial, setFondoInicial] = useState<number>(10000); // Fondo de gaveta inicial para dar cambio
  const [fechaApertura, setFechaApertura] = useState<string | null>(null);
  const [cajeroApertura, setCajeroApertura] = useState<string>('Lucas Benítez');
  const [observacionesApertura, setObservacionesApertura] = useState<string>('');
  const [isModalAperturaOpen, setIsModalAperturaOpen] = useState<boolean>(false);
  const [isModalArqueoOpen, setIsModalArqueoOpen] = useState<boolean>(false);
  const [isModalTicketCierreOpen, setIsModalTicketCierreOpen] = useState<boolean>(false);
  const [ultimoCierre, setUltimoCierre] = useState<ArqueoCajaDTO | null>(null);

  // Cargar sesión de caja persistida desde localStorage al montar
  useEffect(() => {
    try {
      const stored = localStorage.getItem('mistock_sesion_caja_v1');
      if (stored) {
        const sesion = JSON.parse(stored);
        if (sesion && typeof sesion.cajaAbierta === 'boolean') {
          setCajaAbierta(sesion.cajaAbierta);
          if (sesion.fondoInicial !== undefined) setFondoInicial(sesion.fondoInicial);
          if (sesion.fechaApertura) setFechaApertura(sesion.fechaApertura);
          if (sesion.cajeroApertura) setCajeroApertura(sesion.cajeroApertura);
          if (sesion.observacionesApertura) setObservacionesApertura(sesion.observacionesApertura);
          if (sesion.ultimoCierre) setUltimoCierre(sesion.ultimoCierre);
          return;
        }
      }
      // Por defecto la caja inicia cerrada requiriendo apertura explícita
      setCajaAbierta(false);
    } catch {
      setCajaAbierta(false);
    }
  }, []);

  /**
   * Ejecuta la Apertura de Caja para habilitar la operativa de ventas en el turno.
   */
  const abrirCaja = (montoInicial: number, observaciones?: string) => {
    const ahora = new Date();
    const fechaFormateada = ahora.toLocaleDateString('es-AR');
    const horaFormateada = ahora.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const strFechaApertura = `${fechaFormateada} ${horaFormateada}`;
    const cajeroActual = data.ventasRecientes[0]?.vendedor || 'Lucas Benítez';

    setCajaAbierta(true);
    setFondoInicial(montoInicial);
    setFechaApertura(strFechaApertura);
    setCajeroApertura(cajeroActual);
    setObservacionesApertura(observaciones || '');
    setIsModalAperturaOpen(false);

    try {
      localStorage.setItem(
        'mistock_sesion_caja_v1',
        JSON.stringify({
          cajaAbierta: true,
          fondoInicial: montoInicial,
          fechaApertura: strFechaApertura,
          cajeroApertura: cajeroActual,
          observacionesApertura: observaciones || '',
          ultimoCierre,
        })
      );
    } catch {
      // Silencioso
    }

    setSaleSuccessMessage(
      `Caja abierta con éxito. Fondo inicial: ${monedaSimbolo} ${montoInicial.toLocaleString('es-AR')}`
    );
    setTimeout(() => setSaleSuccessMessage(null), 4000);
  };

  // Desglose de ingresos por medio de cobro acumulado en el turno actual
  const resumenMediosTurno: ResumenMediosPagoCierre = useMemo(() => {
    const resumen: ResumenMediosPagoCierre = {
      efectivo: 0,
      mercadoPago: 0,
      tarjetaDebito: 0,
      tarjetaCredito: 0,
      transferencia: 0,
      otro: 0,
    };

    for (const v of data.ventasRecientes) {
      if (v.estado === 'cancelada') continue;
      const m = v.metodoPago;
      if (m === 'efectivo') resumen.efectivo += v.montoTotal;
      else if (m === 'mercado_pago') resumen.mercadoPago += v.montoTotal;
      else if (m === 'tarjeta_debito') resumen.tarjetaDebito += v.montoTotal;
      else if (m === 'tarjeta_credito') resumen.tarjetaCredito += v.montoTotal;
      else if (m === 'transferencia') resumen.transferencia += v.montoTotal;
      else resumen.otro += v.montoTotal;
    }

    return resumen;
  }, [data.ventasRecientes]);

  const totalVentasEfectivo = resumenMediosTurno.efectivo;
  const totalDigitales =
    resumenMediosTurno.mercadoPago +
    resumenMediosTurno.tarjetaDebito +
    resumenMediosTurno.tarjetaCredito +
    resumenMediosTurno.transferencia +
    resumenMediosTurno.otro;
  const granTotalRecaudado = totalVentasEfectivo + totalDigitales;
  const cantidadTicketsValidos = useMemo(
    () => data.ventasRecientes.filter((v) => v.estado !== 'cancelada').length,
    [data.ventasRecientes]
  );
  const efectivoEsperado = fondoInicial + totalVentasEfectivo;

  /**
   * Ejecuta la confirmación del Arqueo y emite el comprobante de Cierre de Caja (Z).
   */
  const confirmarCierreCaja = (efectivoReal: number, observaciones?: string): ArqueoCajaDTO => {
    const diferencia = efectivoReal - efectivoEsperado;
    let estadoBalance: EstadoBalanceCaja = 'exacto';
    if (diferencia > 0) estadoBalance = 'sobrante';
    else if (diferencia < 0) estadoBalance = 'faltante';

    const fechaHoy = new Date();
    const horaFormateada = fechaHoy.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const fechaFormateada = fechaHoy.toLocaleDateString('es-AR');

    const nuevoCierre: ArqueoCajaDTO = {
      idCierre: `CR-${Date.now().toString().slice(-6)}`,
      fechaApertura: fechaApertura || `${fechaFormateada} 08:30`,
      fechaCierre: `${fechaFormateada} ${horaFormateada}`,
      cajero: cajeroApertura || data.ventasRecientes[0]?.vendedor || 'Lucas Benítez',
      numeroCaja: config.pos.numeroCaja || 1,
      fondoInicial,
      totalVentasEfectivo,
      totalDigitales,
      granTotalRecaudado,
      cantidadTickets: cantidadTicketsValidos,
      efectivoEsperado,
      efectivoReal,
      diferencia,
      estadoBalance,
      desgloseMedios: resumenMediosTurno,
      observaciones: observaciones?.trim() || undefined,
    };

    setCajaAbierta(false);
    setUltimoCierre(nuevoCierre);
    setIsModalArqueoOpen(false);
    setIsModalTicketCierreOpen(true);

    try {
      localStorage.setItem(
        'mistock_sesion_caja_v1',
        JSON.stringify({
          cajaAbierta: false,
          fondoInicial,
          fechaApertura: null,
          cajeroApertura,
          observacionesApertura: '',
          ultimoCierre: nuevoCierre,
        })
      );
    } catch {
      // Silencioso
    }

    setSaleSuccessMessage(
      `Cierre de Caja ${nuevoCierre.idCierre} emitido. Diferencia: ${monedaSimbolo} ${diferencia.toLocaleString('es-AR')}`
    );
    setTimeout(() => setSaleSuccessMessage(null), 4000);

    return nuevoCierre;
  };

  // ====================================================================
  // ESTADO Y MÉTODOS: CONSULTOR DE PRECIOS & DISPONIBILIDAD
  // ====================================================================
  const [busquedaPrecios, setBusquedaPrecios] = useState<string>('');
  const [productoConsultado, setProductoConsultado] = useState<ProductoRapidoPOS | null>(null);

  /**
   * Consulta directa de un artículo por código de barras o nombre sin alterar el ticket activo.
   */
  const consultarProducto = (termino: string) => {
    const q = termino.trim().toLowerCase();
    if (!q) {
      setProductoConsultado(null);
      return;
    }

    // Coincidencia exacta por código
    const exacto = data.productosPopulares.find((p) => p.codigo.toLowerCase() === q);
    if (exacto) {
      setProductoConsultado(exacto);
      return;
    }

    // Coincidencia parcial por nombre o código
    const match = data.productosPopulares.find(
      (p) => p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q)
    );
    setProductoConsultado(match || null);
  };

  /**
   * Sugerencias filtradas en tiempo real para el consultor de precios.
   */
  const productosConsultorFiltrados = useMemo(() => {
    const q = busquedaPrecios.trim().toLowerCase();
    if (!q) return data.productosPopulares.slice(0, 8);
    return data.productosPopulares.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.codigo.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q)
    );
  }, [data.productosPopulares, busquedaPrecios]);

  // ====================================================================
  // ESTADO Y MÉTODOS: CATÁLOGO GENERAL CON DISPONIBILIDAD EN TIEMPO REAL
  // ====================================================================
  const [busquedaCatalogo, setBusquedaCatalogo] = useState<string>('');
  const [categoriaFiltroCatalogo, setCategoriaFiltroCatalogo] = useState<string>('todas');
  const [disponibilidadFiltroCatalogo, setDisponibilidadFiltroCatalogo] = useState<'todos' | 'con_stock' | 'agotados'>('todos');
  const [paginaCatalogo, setPaginaCatalogo] = useState<number>(1);
  const itemsPorPaginaCatalogo = 8;

  // Reset de página al cambiar filtros de catálogo
  useEffect(() => {
    setPaginaCatalogo(1);
  }, [busquedaCatalogo, categoriaFiltroCatalogo, disponibilidadFiltroCatalogo]);

  // Filtrado reactivo del catálogo general con disponibilidad
  const productosCatalogoFiltrados = useMemo(() => {
    const query = busquedaCatalogo.trim().toLowerCase();
    const catFiltro = categoriaFiltroCatalogo.toLowerCase();

    return data.productosPopulares.filter((p) => {
      const coincideBusqueda =
        !query ||
        p.nombre.toLowerCase().includes(query) ||
        p.codigo.toLowerCase().includes(query) ||
        p.categoria.toLowerCase().includes(query);

      const coincideCategoria =
        catFiltro === 'todas' || p.categoria.toLowerCase() === catFiltro;

      const coincideDisponibilidad =
        disponibilidadFiltroCatalogo === 'todos' ||
        (disponibilidadFiltroCatalogo === 'con_stock' && p.stock > 0) ||
        (disponibilidadFiltroCatalogo === 'agotados' && p.stock === 0);

      return coincideBusqueda && coincideCategoria && coincideDisponibilidad;
    });
  }, [data.productosPopulares, busquedaCatalogo, categoriaFiltroCatalogo, disponibilidadFiltroCatalogo]);

  const totalPaginasCatalogo = Math.max(1, Math.ceil(productosCatalogoFiltrados.length / itemsPorPaginaCatalogo));
  const inicioPaginacionCatalogo = (paginaCatalogo - 1) * itemsPorPaginaCatalogo;
  const productosCatalogoPaginados = productosCatalogoFiltrados.slice(
    inicioPaginacionCatalogo,
    inicioPaginacionCatalogo + itemsPorPaginaCatalogo
  );

  // Métricas agregadas de catálogo para el vendedor
  const totalUnidadesEnStock = useMemo(() => {
    return data.productosPopulares.reduce((acc, p) => acc + p.stock, 0);
  }, [data.productosPopulares]);

  const productosAgotadosCount = useMemo(() => {
    return data.productosPopulares.filter((p) => p.stock === 0).length;
  }, [data.productosPopulares]);

  const productosConStockCount = useMemo(() => {
    return data.productosPopulares.filter((p) => p.stock > 0).length;
  }, [data.productosPopulares]);

  // ====================================================================
  // OPERATIVA DE TICKET / CARRITO DE VENTA ACTIVO (POS EN MOSTRADOR)
  // ====================================================================
  const [carrito, setCarrito] = useState<ItemCarritoPOS[]>([]);

  // Totales calculados en tiempo real
  const totalCarrito = useMemo(() => {
    return carrito.reduce((acc, item) => acc + item.subtotal, 0);
  }, [carrito]);

  const cantidadArticulosCarrito = useMemo(() => {
    return carrito.reduce((acc, item) => acc + item.cantidad, 0);
  }, [carrito]);

  /**
   * Agrega un producto al carrito de la venta en curso (o incrementa su cantidad).
   */
  const agregarAlCarrito = (producto: ProductoRapidoPOS, cantidadAAgregar: number = 1): boolean => {
    if (producto.stock <= 0 && !permitirVentaSinStock) {
      setSaleErrorMessage(`"${producto.nombre}" no tiene unidades disponibles en stock.`);
      setTimeout(() => setSaleErrorMessage(null), 3000);
      return false;
    }

    setCarrito((prev) => {
      const index = prev.findIndex((item) => item.producto.id === producto.id);
      if (index >= 0) {
        const itemExistente = prev[index];
        const nuevaCantidad = itemExistente.cantidad + cantidadAAgregar;

        if (nuevaCantidad > producto.stock && !permitirVentaSinStock) {
          setSaleErrorMessage(
            `No se pueden agregar más unidades de "${producto.nombre}". Stock disponible: ${producto.stock} un.`
          );
          setTimeout(() => setSaleErrorMessage(null), 3000);
          return prev;
        }

        const actualizado = [...prev];
        actualizado[index] = {
          ...itemExistente,
          cantidad: nuevaCantidad,
          subtotal: nuevaCantidad * producto.precio,
        };
        return actualizado;
      } else {
        if (cantidadAAgregar > producto.stock && !permitirVentaSinStock) {
          setSaleErrorMessage(
            `Stock insuficiente para "${producto.nombre}". Disponible: ${producto.stock} un.`
          );
          setTimeout(() => setSaleErrorMessage(null), 3000);
          return prev;
        }

        return [
          ...prev,
          {
            producto,
            cantidad: cantidadAAgregar,
            subtotal: cantidadAAgregar * producto.precio,
          },
        ];
      }
    });
    return true;
  };

  /**
   * Modifica la cantidad de un ítem en el carrito.
   */
  const actualizarCantidadItem = (productoId: string, nuevaCantidad: number) => {
    if (nuevaCantidad <= 0) {
      removerItemCarrito(productoId);
      return;
    }

    setCarrito((prev) => {
      const index = prev.findIndex((item) => item.producto.id === productoId);
      if (index === -1) return prev;

      const item = prev[index];
      const prod = data.productosPopulares.find((p) => p.id === productoId) || item.producto;

      if (nuevaCantidad > prod.stock && !permitirVentaSinStock) {
        setSaleErrorMessage(
          `Stock máximo alcanzado para "${prod.nombre}". Disponible: ${prod.stock} un.`
        );
        setTimeout(() => setSaleErrorMessage(null), 3000);
        return prev;
      }

      const actualizado = [...prev];
      actualizado[index] = {
        ...item,
        cantidad: nuevaCantidad,
        subtotal: nuevaCantidad * item.producto.precio,
      };
      return actualizado;
    });
  };

  /**
   * Quita un renglón del carrito.
   */
  const removerItemCarrito = (productoId: string) => {
    setCarrito((prev) => prev.filter((item) => item.producto.id !== productoId));
  };

  /**
   * Vacía todos los ítems del ticket actual.
   */
  const vaciarCarrito = () => {
    setCarrito([]);
  };

  /**
   * Procesa y cobra el ticket completo con todos los productos del carrito.
   */
  const procesarVentaTicket = (
    metodoPago: MetodoPago = 'efectivo',
    montoRecibido?: number
  ): VentaRecientePOS | null => {
    if (!cajaAbierta) {
      setSaleErrorMessage('La caja está cerrada. Debe realizar la Apertura de Caja para habilitar el cobro de ventas.');
      setTimeout(() => setSaleErrorMessage(null), 4000);
      setIsModalAperturaOpen(true);
      return null;
    }

    if (carrito.length === 0) {
      setSaleErrorMessage('El ticket está vacío. Agregue productos antes de cobrar.');
      setTimeout(() => setSaleErrorMessage(null), 3000);
      return null;
    }

    // Validar stock de todos los renglones
    if (!permitirVentaSinStock) {
      for (const item of carrito) {
        const prod = data.productosPopulares.find((p) => p.id === item.producto.id);
        if (!prod || prod.stock < item.cantidad) {
          setSaleErrorMessage(
            `Stock insuficiente para "${item.producto.nombre}". Stock: ${prod?.stock ?? 0}, Requerido: ${item.cantidad}.`
          );
          setTimeout(() => setSaleErrorMessage(null), 4000);
          return null;
        }
      }
    }

    setLoading(true);
    setSaleErrorMessage(null);
    setSaleSuccessMessage(null);

    const totalVenta = totalCarrito;
    const vuelto =
      metodoPago === 'efectivo' && montoRecibido !== undefined && montoRecibido >= totalVenta
        ? montoRecibido - totalVenta
        : 0;

    const ventaId = `VNT-${Date.now().toString().slice(-4)}`;

    // Generar renglones DetalleVenta
    const itemsVenta: DetalleVenta[] = carrito.map((item, idx) => ({
      id: `DET-${Date.now().toString().slice(-4)}-${idx + 1}`,
      ventaId,
      productoId: item.producto.id,
      nombreProducto: item.producto.nombre,
      codigoProducto: item.producto.codigo,
      cantidad: item.cantidad,
      precioUnitario: item.producto.precio,
      subtotal: item.subtotal,
    }));

    const newSale: VentaRecientePOS = {
      id: ventaId,
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fecha: new Date().toLocaleDateString('es-AR'),
      montoTotal: totalVenta,
      cantidadItems: cantidadArticulosCarrito,
      metodoPago,
      vendedor: 'Cajero en Turno',
      items: itemsVenta,
      pagos: [
        {
          id: `PAG-${Date.now().toString().slice(-4)}`,
          ventaId,
          metodo: metodoPago,
          total: totalVenta,
        },
      ],
      estado: 'completada',
    };

    // Descontar existencias en el inventario central para cada renglón
    for (const item of carrito) {
      inventarioService.descontarStock(item.producto.id, item.cantidad);
    }

    setVentasState((prev) => ({
      ...prev,
      ventasDelDia: prev.ventasDelDia + 1,
      recaudacionDelDia: prev.recaudacionDelDia + totalVenta,
      ventasRecientes: [newSale, ...prev.ventasRecientes],
    }));

    setPaginaVentas(1);
    setCarrito([]);

    const textoMetodo =
      metodoPago === 'efectivo'
        ? 'Efectivo'
        : metodoPago === 'mercado_pago'
        ? 'Mercado Pago'
        : metodoPago === 'tarjeta_debito'
        ? 'Tarjeta Débito'
        : metodoPago === 'tarjeta_credito'
        ? 'Tarjeta Crédito'
        : 'Transferencia';

    const textoVuelto =
      metodoPago === 'efectivo' && vuelto > 0
        ? ` • Vuelto: ${monedaSimbolo} ${vuelto.toLocaleString('es-AR')}`
        : '';

    setSaleSuccessMessage(
      `Cobro registrado con éxito (${ventaId}): ${itemsVenta.length} ítems • Total: ${monedaSimbolo} ${totalVenta.toLocaleString('es-AR')} (${textoMetodo})${textoVuelto}`
    );
    setLoading(false);
    setTimeout(() => setSaleSuccessMessage(null), 4500);

    return newSale;
  };

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
    // Navegación de Pestañas Operativas
    pestanaOperativa,
    setPestanaOperativa,
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
    // Historial del Día y Filtros
    paginaVentas,
    setPaginaVentas,
    totalPaginasVentas,
    inicioPaginacionVentas,
    itemsPorPaginaVentas,
    ventasRecientesPaginadas,
    ventasFiltradas,
    metodoPagoFiltroVentas,
    setMetodoPagoFiltroVentas,
    conteosPorMetodoPago,
    busquedaHistorial,
    setBusquedaHistorial,
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
    // Operativa de Carrito / Ticket de Venta
    carrito,
    totalCarrito,
    cantidadArticulosCarrito,
    agregarAlCarrito,
    actualizarCantidadItem,
    removerItemCarrito,
    vaciarCarrito,
    procesarVentaTicket,
    // Consultor de Precios & Disponibilidad
    busquedaPrecios,
    setBusquedaPrecios,
    productoConsultado,
    setProductoConsultado,
    consultarProducto,
    productosConsultorFiltrados,
    // Catálogo General con Disponibilidad en Tiempo Real
    busquedaCatalogo,
    setBusquedaCatalogo,
    categoriaFiltroCatalogo,
    setCategoriaFiltroCatalogo,
    disponibilidadFiltroCatalogo,
    setDisponibilidadFiltroCatalogo,
    paginaCatalogo,
    setPaginaCatalogo,
    itemsPorPaginaCatalogo,
    totalPaginasCatalogo,
    inicioPaginacionCatalogo,
    productosCatalogoFiltrados,
    productosCatalogoPaginados,
    totalUnidadesEnStock,
    productosAgotadosCount,
    productosConStockCount,
    // Operativa de Sesión de Caja (Apertura, Arqueo y Cierre Mono-caja)
    cajaAbierta,
    setCajaAbierta,
    fechaApertura,
    cajeroApertura,
    observacionesApertura,
    isModalAperturaOpen,
    setIsModalAperturaOpen,
    abrirCaja,
    fondoInicial,
    setFondoInicial,
    isModalArqueoOpen,
    setIsModalArqueoOpen,
    isModalTicketCierreOpen,
    setIsModalTicketCierreOpen,
    ultimoCierre,
    setUltimoCierre,
    resumenMediosTurno,
    totalVentasEfectivo,
    totalDigitales,
    granTotalRecaudado,
    cantidadTicketsValidos,
    efectivoEsperado,
    confirmarCierreCaja,
  };
}
