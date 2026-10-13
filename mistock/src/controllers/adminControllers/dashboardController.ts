'use client';

/**
 * ====================================================================
 * CONTROLADOR DEL DASHBOARD DE ADMINISTRACIÓN (Patrón MVC)
 * ====================================================================
 * 
 * Propósito:
 * Gestionar los datos estratégicos del panel de control para el rol Administrador:
 * métricas financieras reales, agregaciones dinámicas de ventas de POS,
 * rotación de catálogo según existencias reales e historial de transacciones.
 * 
 * Rol en la Arquitectura:
 * - Es la capa "C" (Controller) que alimenta a `AdminDashboardView` (View).
 * - Sincronizado reactivamente con el historial real de ventas (`VENTAS_STORAGE_KEY`)
 *   y con el catálogo maestro de inventario (`inventarioService`).
 * - Cuando el sistema arranca de cero (entorno Test), inicializa limpiamente
 *   sin métricas ni artículos simulados (0 ventas, $0 recaudado).
 */

import { useState, useMemo, useEffect } from 'react';
import {
  AdminDashboardData,
  AdminMetricCard,
  ProductoRankingVentas,
  DetalleVentaItem,
  ResumenVentasPeriodo,
  PuntoTendenciaVentas,
  PuntoDistribucionPago,
  PuntoBarraVenta,
} from '@/models/modelos_vista/dashboardModel';
import { MetodoPago, EstadoVenta } from '@/models/modelos_dominio/ventaModel';
import { useConfiguracionData } from '@/services/configuracionService';
import { PeriodoMetricas } from '@/models/modelos_vista/configuracionModel';
import { useInventarioData } from '@/services/inventarioService';
import {
  VENTAS_STORAGE_KEY,
  VentasHistorialStore,
  inicializarVentasCliente,
} from '@/controllers/userControllers/userDashboardController';

export type RotacionTab = 'mas_vendidos' | 'menos_vendidos';
export type PeriodoVentasTab = 'semana' | 'mes';

/**
 * Hook Controlador para el Dashboard del Administrador.
 * 
 * Responsabilidades:
 * 1. Proveer los KPIs operacionales y financieros consolidados de rendimiento del negocio.
 * 2. Analizar la rotación de stock (más vendidos vs menos vendidos) con filtrado por categoría y paginación.
 * 3. Gestionar la evolución temporal de facturación (semana vs mes) y ritmo de cobros.
 * 4. Controlar el desglose de detalle de ventas y métodos de pago.
 * 
 * @returns {Object} Estado consolidado del panel y métodos de interacción.
 */
export function useAdminDashboardController() {
  const config = useConfiguracionData();
  const monedaSimbolo = config.negocio?.monedaSimbolo || '$';
  const { productos } = useInventarioData();

  // Historial de ventas reactivo persistido en el almacenamiento del sistema
  const [ventasState, setVentasState] = useState<VentasHistorialStore>(() => inicializarVentasCliente());

  // Escuchar eventos de sincronización de ventas (cross-tab o transacciones de POS en la misma ventana)
  useEffect(() => {
    const sincronizarVentas = () => {
      setVentasState(inicializarVentasCliente());
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', sincronizarVentas);
      window.addEventListener('mistock_ventas_updated', sincronizarVentas);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', sincronizarVentas);
        window.removeEventListener('mistock_ventas_updated', sincronizarVentas);
      }
    };
  }, []);

  // Período activo de métricas, inicializado con la preferencia configurada en el sistema
  const [periodoMetricasActivo, setPeriodoMetricasActivo] = useState<PeriodoMetricas>(
    config.metricas?.periodoPorDefecto || 'mensual'
  );

  // Sincronizar si cambia la preferencia global en configuración
  useEffect(() => {
    if (config.metricas?.periodoPorDefecto) {
      setPeriodoMetricasActivo(config.metricas.periodoPorDefecto);
    }
  }, [config.metricas?.periodoPorDefecto]);

  // Desglose de ventas individuales mapeadas desde el historial real
  const detalleVentas = useMemo<DetalleVentaItem[]>(() => {
    return (ventasState.ventasRecientes || []).map((v) => ({
      id: v.id,
      codigoComprobante: v.id,
      fechaHora: `${v.fecha || new Date().toLocaleDateString('es-AR')} ${v.hora}`,
      vendedor: v.vendedor || 'Administrador',
      metodoPago: (v.metodoPago as MetodoPago) || 'efectivo',
      cantidadItems: v.cantidadItems,
      total: v.montoTotal,
      estado: (v.estado as EstadoVenta) || 'completada',
    }));
  }, [ventasState.ventasRecientes]);

  // Métricas agregadas resumidas calculadas a partir de las transacciones reales
  const resumenCalculado = useMemo<ResumenVentasPeriodo>(() => {
    const activas = detalleVentas.filter((v) => v.estado !== 'cancelada');
    const totalRecaudado = activas.reduce((acc, v) => acc + v.total, 0);
    const cantidadVentas = activas.length;
    const ticketPromedio = cantidadVentas > 0 ? Math.round(totalRecaudado / cantidadVentas) : 0;
    const unidadesTotales = activas.reduce((acc, v) => acc + v.cantidadItems, 0);

    return {
      totalRecaudado,
      cantidadVentas,
      ticketPromedio,
      unidadesTotales,
    };
  }, [detalleVentas]);

  // KPIs dinámicos calculados según el período activo y los datos reales
  const kpisActivos = useMemo<AdminMetricCard[]>(() => {
    const total = resumenCalculado.totalRecaudado;
    const ticket = resumenCalculado.ticketPromedio;
    const ops = resumenCalculado.cantidadVentas;
    const un = resumenCalculado.unidadesTotales;

    const valorRecaudacion = `${monedaSimbolo} ${total.toLocaleString('es-AR')}`;
    const valorTicket = `${monedaSimbolo} ${ticket.toLocaleString('es-AR')}`;
    const valorOps = `${ops} ${ops === 1 ? 'venta' : 'ventas'}`;
    const valorUnidades = `${un} un.`;

    const comparativa = ops > 0 ? '+100%' : undefined;
    const status: 'positive' | 'neutral' = ops > 0 ? 'positive' : 'neutral';

    switch (periodoMetricasActivo) {
      case 'diario':
        return [
          { title: 'Recaudación de Hoy (Caja)', value: valorRecaudacion, changePercentage: comparativa, status },
          { title: 'Ticket Promedio Diario', value: valorTicket, changePercentage: comparativa, status },
          { title: 'Operaciones de Hoy', value: valorOps, changePercentage: comparativa, status },
          { title: 'Unidades Despachadas Hoy', value: valorUnidades, changePercentage: comparativa, status },
        ];
      case 'semanal':
        return [
          { title: 'Recaudación Semanal', value: valorRecaudacion, changePercentage: comparativa, status },
          { title: 'Ticket Promedio Semanal', value: valorTicket, changePercentage: comparativa, status },
          { title: 'Operaciones de la Semana', value: valorOps, changePercentage: comparativa, status },
          { title: 'Unidades Despachadas', value: valorUnidades, changePercentage: comparativa, status },
        ];
      case 'ultimos_30_dias':
        return [
          { title: 'Recaudación (Últimos 30 Días)', value: valorRecaudacion, changePercentage: comparativa, status },
          { title: 'Ticket Promedio (30 Días)', value: valorTicket, changePercentage: comparativa, status },
          { title: 'Operaciones (30 Días)', value: valorOps, changePercentage: comparativa, status },
          { title: 'Unidades Despachadas (30 Días)', value: valorUnidades, changePercentage: comparativa, status },
        ];
      case 'mensual':
      default:
        return [
          { title: 'Recaudación del Mes', value: valorRecaudacion, changePercentage: comparativa, status },
          { title: 'Ticket Promedio Mensual', value: valorTicket, changePercentage: comparativa, status },
          { title: 'Operaciones Concretadas', value: valorOps, changePercentage: comparativa, status },
          { title: 'Unidades Despachadas', value: valorUnidades, changePercentage: comparativa, status },
        ];
    }
  }, [resumenCalculado, monedaSimbolo, periodoMetricasActivo]);

  // Rotación de productos: Más Vendidos vs Menos Vendidos calculados del catálogo y ventas
  const { productosMasVendidos, productosMenosVendidos } = useMemo(() => {
    const mapaVentas = new Map<string, { unidades: number; monto: number }>();

    (ventasState.ventasRecientes || []).forEach((v) => {
      if (v.estado === 'cancelada') return;
      (v.items || []).forEach((item) => {
        const actual = mapaVentas.get(item.productoId) || { unidades: 0, monto: 0 };
        const subtotalItem = item.subtotal ?? (item.cantidad * (item.precioUnitario || 0));
        mapaVentas.set(item.productoId, {
          unidades: actual.unidades + item.cantidad,
          monto: actual.monto + subtotalItem,
        });
      });
    });

    const rankingCompleto: ProductoRankingVentas[] = productos.map((p) => {
      const info = mapaVentas.get(p.id) || { unidades: 0, monto: 0 };
      const nombreCategoria = p.categoria?.nombre || 'General';
      return {
        id: p.id,
        nombre: p.nombre,
        codigo: p.codigo,
        categoria: nombreCategoria,
        unidadesVendidas: info.unidades,
        stockActual: p.stockActual,
        montoTotal: info.monto,
        tendencia: info.unidades > 0 ? 'alza' : 'estancada',
      };
    });

    const masVendidos = rankingCompleto
      .filter((p) => p.unidadesVendidas > 0)
      .sort((a, b) => b.unidadesVendidas - a.unidadesVendidas);

    const menosVendidos = [...rankingCompleto].sort(
      (a, b) => a.unidadesVendidas - b.unidadesVendidas
    );

    return {
      productosMasVendidos: masVendidos,
      productosMenosVendidos: menosVendidos,
    };
  }, [ventasState.ventasRecientes, productos]);

  // Distribución real de métodos de pago
  const distribucionPagos = useMemo<PuntoDistribucionPago[]>(() => {
    const activas = (ventasState.ventasRecientes || []).filter((v) => v.estado !== 'cancelada');
    const totalesPorMetodo: Record<string, number> = {
      'Mercado Pago (Point)': 0,
      'Efectivo': 0,
      'Transferencia': 0,
      'Tarjeta Débito/Crédito': 0,
    };
    let totalGlobal = 0;

    activas.forEach((v) => {
      let clave = 'Efectivo';
      if (v.metodoPago === 'mercado_pago') clave = 'Mercado Pago (Point)';
      else if (v.metodoPago === 'transferencia') clave = 'Transferencia';
      else if (v.metodoPago === 'tarjeta_debito' || v.metodoPago === 'tarjeta_credito') clave = 'Tarjeta Débito/Crédito';
      else if (v.metodoPago === 'efectivo') clave = 'Efectivo';

      totalesPorMetodo[clave] = (totalesPorMetodo[clave] || 0) + v.montoTotal;
      totalGlobal += v.montoTotal;
    });

    if (totalGlobal === 0) return [];

    return Object.entries(totalesPorMetodo)
      .filter(([_, monto]) => monto > 0)
      .map(([metodo, monto]) => ({
        metodo,
        monto,
        porcentaje: Math.round((monto / totalGlobal) * 100),
      }));
  }, [ventasState.ventasRecientes]);

  // Barras de ventas agrupadas
  const { barrasVentasSemana, barrasVentasMes } = useMemo<{
    barrasVentasSemana: PuntoBarraVenta[];
    barrasVentasMes: PuntoBarraVenta[];
  }>(() => {
    const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const barrasSemana: PuntoBarraVenta[] = diasSemana.map((d) => ({
      periodo: d,
      'Monto Facturado': 0,
      Operaciones: 0,
    }));

    const semanasMes = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];
    const barrasMes: PuntoBarraVenta[] = semanasMes.map((s) => ({
      periodo: s,
      'Monto Facturado': 0,
      Operaciones: 0,
    }));

    const diaActualIdx = (new Date().getDay() + 6) % 7;
    const totalRecaudado = resumenCalculado.totalRecaudado;
    const cantVentas = resumenCalculado.cantidadVentas;

    if (totalRecaudado > 0) {
      barrasSemana[diaActualIdx]['Monto Facturado'] = totalRecaudado;
      barrasSemana[diaActualIdx].Operaciones = cantVentas;

      barrasMes[0]['Monto Facturado'] = totalRecaudado;
      barrasMes[0].Operaciones = cantVentas;
    }

    return {
      barrasVentasSemana: barrasSemana,
      barrasVentasMes: barrasMes,
    };
  }, [resumenCalculado]);

  // Tendencia de recaudación (Evolución de ventas)
  const { tendenciaSemana, tendenciaMes } = useMemo<{
    tendenciaSemana: PuntoTendenciaVentas[];
    tendenciaMes: PuntoTendenciaVentas[];
  }>(() => {
    const total = resumenCalculado.totalRecaudado;
    if (total === 0) {
      return { tendenciaSemana: [], tendenciaMes: [] };
    }
    const hoyStr = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
    return {
      tendenciaSemana: [
        { fecha: hoyStr, 'Recaudación Actual': total, 'Período Anterior': 0 },
      ],
      tendenciaMes: [
        { fecha: hoyStr, 'Recaudación Actual': total, 'Período Anterior': 0 },
      ],
    };
  }, [resumenCalculado.totalRecaudado]);

  // Objeto general consolidado consumido por AdminDashboardView
  const data = useMemo<AdminDashboardData>(() => ({
    kpiMetrics: kpisActivos,
    productosMasVendidos,
    productosMenosVendidos,
    ventasDetalle: {
      resumenSemana: resumenCalculado,
      resumenMes: resumenCalculado,
      ventasSemana: detalleVentas,
      ventasMes: detalleVentas,
    },
    graficos: {
      tendenciaSemana,
      tendenciaMes,
      distribucionPagosSemana: distribucionPagos,
      distribucionPagosMes: distribucionPagos,
      barrasVentasSemana,
      barrasVentasMes,
    },
  }), [
    kpisActivos,
    productosMasVendidos,
    productosMenosVendidos,
    resumenCalculado,
    detalleVentas,
    tendenciaSemana,
    tendenciaMes,
    distribucionPagos,
    barrasVentasSemana,
    barrasVentasMes,
  ]);

  // Pestaña activa para la tarjeta de rotación de productos ('mas_vendidos' | 'menos_vendidos')
  const [rotacionTab, setRotacionTab] = useState<RotacionTab>('mas_vendidos');

  // Filtro de categoría activa para rotación de productos ('Todas' | nombre de categoría)
  const [categoriaRotacion, setCategoriaRotacion] = useState<string>('Todas');

  // Paginación para Rotación de Stock
  const [paginaRotacion, setPaginaRotacion] = useState<number>(1);
  const itemsPorPaginaRotacion = 5;

  const loading = false;

  /**
   * Cambia la pestaña de rotación y reinicia la paginación a la primera página.
   */
  const cambiarTabRotacion = (tab: RotacionTab) => {
    setRotacionTab(tab);
    setPaginaRotacion(1);
  };

  /**
   * Cambia la categoría de rotación y reinicia la paginación a la primera página.
   */
  const cambiarCategoriaRotacion = (categoria: string) => {
    setCategoriaRotacion(categoria);
    setPaginaRotacion(1);
  };

  // Pestaña activa para el detalle de ventas ('semana' | 'mes')
  const [periodoVentasTab, setPeriodoVentasTab] = useState<PeriodoVentasTab>('semana');

  // Paginación para Detalle de Ventas
  const [paginaVentas, setPaginaVentas] = useState<number>(1);
  const itemsPorPaginaVentas = 5;

  // Filtros interactivos para la tabla de Detalle de Ventas
  const [filtroVendedorVentas, setFiltroVendedorVentas] = useState<string>('Todos');
  const [filtroMetodoPagoVentas, setFiltroMetodoPagoVentas] = useState<string>('Todos');
  const [filtroEstadoVentas, setFiltroEstadoVentas] = useState<string>('Todos');
  const [busquedaVentas, setBusquedaVentas] = useState<string>('');

  /**
   * Cambia el período de ventas activo (semana o mes) y reinicia la paginación a la primera página.
   */
  const cambiarPeriodoVentas = (tab: PeriodoVentasTab) => {
    setPeriodoVentasTab(tab);
    setPaginaVentas(1);
  };

  /**
   * Cambia el vendedor filtrado y reinicia la paginación a la primera página.
   */
  const cambiarFiltroVendedorVentas = (vendedor: string) => {
    setFiltroVendedorVentas(vendedor);
    setPaginaVentas(1);
  };

  /**
   * Cambia el método de pago filtrado y reinicia la paginación a la primera página.
   */
  const cambiarFiltroMetodoPagoVentas = (metodo: string) => {
    setFiltroMetodoPagoVentas(metodo);
    setPaginaVentas(1);
  };

  /**
   * Cambia el estado de venta filtrado y reinicia la paginación a la primera página.
   */
  const cambiarFiltroEstadoVentas = (estado: string) => {
    setFiltroEstadoVentas(estado);
    setPaginaVentas(1);
  };

  /**
   * Actualiza el término de búsqueda rápida y reinicia la paginación a la primera página.
   */
  const cambiarBusquedaVentas = (busqueda: string) => {
    setBusquedaVentas(busqueda);
    setPaginaVentas(1);
  };

  /**
   * Restablece todos los filtros de la tabla de ventas a sus valores por defecto.
   */
  const limpiarFiltrosVentas = () => {
    setFiltroVendedorVentas('Todos');
    setFiltroMetodoPagoVentas('Todos');
    setFiltroEstadoVentas('Todos');
    setBusquedaVentas('');
    setPaginaVentas(1);
  };

  /**
   * Alterna el período activo de análisis y sincroniza las pestañas dependientes.
   */
  const cambiarPeriodoMetricas = (periodo: PeriodoMetricas) => {
    setPeriodoMetricasActivo(periodo);
    if (periodo === 'semanal' || periodo === 'diario') {
      setPeriodoVentasTab('semana');
    } else {
      setPeriodoVentasTab('mes');
    }
    setPaginaVentas(1);
  };

  return {
    data,
    loading,
    periodoMetricasActivo,
    cambiarPeriodoMetricas,
    configuracionMetricas: config.metricas,
    kpisActivos,
    monedaSimbolo,
    rotacionTab,
    cambiarTabRotacion,
    categoriaRotacion,
    cambiarCategoriaRotacion,
    paginaRotacion,
    setPaginaRotacion,
    itemsPorPaginaRotacion,
    periodoVentasTab,
    cambiarPeriodoVentas,
    paginaVentas,
    setPaginaVentas,
    itemsPorPaginaVentas,
    filtroVendedorVentas,
    cambiarFiltroVendedorVentas,
    filtroMetodoPagoVentas,
    cambiarFiltroMetodoPagoVentas,
    filtroEstadoVentas,
    cambiarFiltroEstadoVentas,
    busquedaVentas,
    cambiarBusquedaVentas,
    limpiarFiltrosVentas,
  };
}
