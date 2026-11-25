'use client';

/**
 * ====================================================================
 * CONTROLADOR DEL DASHBOARD DE ADMINISTRACIÓN (Patrón MVC)
 * ====================================================================
 * 
 * Propósito:
 * Gestionar los datos estratégicos del panel de control para el rol Administrador
 * bajo un único período global (`periodoMetricasActivo`):
 * métricas financieras reales comparadas contra el período anterior inmediato,
 * evolución temporal, participación de métodos de cobro, rotación de catálogo
 * con costos reales e historial filtrable de transacciones.
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
  VentaRecientePOS,
} from '@/models/modelos_vista/dashboardModel';
import { MetodoPago, EstadoVenta } from '@/models/modelos_dominio/ventaModel';
import { useConfiguracionData } from '@/services/configuracionService';
import { PeriodoMetricas } from '@/models/modelos_vista/configuracionModel';
import { useInventarioData, inventarioService } from '@/services/inventarioService';
import { supabaseService } from '@/services/supabaseService';
import {
  VENTAS_SERVER_SNAPSHOT,
  VentasHistorialStore,
  guardarVentasCliente,
  inicializarVentasCliente,
  recalcularVentasStore,
  suscribirVentasStorage,
} from '@/lib/ventasStorage';
import {
  MS_POR_DIA,
  calcularLimitesTiempo,
  calcularVariacionKPI,
  filtrarVentasPorVentana,
  obtenerEtiquetaPeriodo,
  obtenerTimestampVenta,
} from '@/lib/calculoMetricasAdmin';

export type RotacionTab = 'mas_vendidos' | 'menos_vendidos';

export function useAdminDashboardController() {
  const config = useConfiguracionData();
  const monedaSimbolo = config.negocio?.monedaSimbolo || '$';
  const { productos } = useInventarioData();

  // Historial de ventas reactivo sincronizado con Supabase PostgreSQL (estado inicial determinista para SSR)
  const [ventasState, setVentasState] = useState<VentasHistorialStore>(VENTAS_SERVER_SNAPSHOT);

  useEffect(() => {
    let mounted = true;
    void inventarioService.sincronizarConSupabase();

    const sincronizarVentas = () => {
      if (!mounted) return;
      setVentasState(inicializarVentasCliente());
    };

    queueMicrotask(sincronizarVentas);

    const desuscribirVentas = suscribirVentasStorage(sincronizarVentas);

    // Hidratar ventas autoritativas desde Supabase (reemplazando cualquier residuo local)
    supabaseService
      .fetchVentasWithStatus()
      .then((res) => {
        if (!mounted || !res.ok) return;
        setVentasState((prev) => {
          const prevById = new Map((prev.ventasRecientes || []).map((v) => [v.id, v]));
          const autoritativas = res.items
            .map((v) => ({
              ...v,
              idTurno: prevById.get(v.id)?.idTurno,
            }))
            .sort((a, b) => obtenerTimestampVenta(b) - obtenerTimestampVenta(a));

          const actualizado = recalcularVentasStore(autoritativas);
          guardarVentasCliente(actualizado, { notificar: false });
          return actualizado;
        });
      })
      .catch((err) => {
        console.warn('[dashboardController] Error al sincronizar ventas remotas:', err);
      });

    return () => {
      mounted = false;
      desuscribirVentas();
    };
  }, []);

  // Único selector global de período para todo el dashboard (derivado del valor por defecto salvo selección manual)
  const [periodoSeleccionadoManual, setPeriodoSeleccionadoManual] =
    useState<PeriodoMetricas | null>(null);
  const periodoMetricasActivo: PeriodoMetricas =
    periodoSeleccionadoManual ?? config.metricas?.periodoPorDefecto ?? 'mensual';
  const setPeriodoMetricasActivo = (nuevoPeriodo: PeriodoMetricas) => {
    setPeriodoSeleccionadoManual(nuevoPeriodo);
  };

  const etiquetaPeriodoActivo = useMemo(
    () => obtenerEtiquetaPeriodo(periodoMetricasActivo),
    [periodoMetricasActivo]
  );

  // Límites temporales actuales y del período inmediatamente anterior según configuración
  const limitesTiempo = useMemo(
    () =>
      calcularLimitesTiempo(new Date(), {
        inicioSemana: config.metricas?.inicioSemana,
        diaCorteMensual: config.metricas?.diaCorteMensual,
      }),
    [config.metricas?.inicioSemana, config.metricas?.diaCorteMensual]
  );

  // Subconjunto de ventas del período activo y de su ventana anterior comparable
  const { ventasVentanaActiva, ventasVentanaAnterior } = useMemo(
    () =>
      filtrarVentasPorVentana(
        ventasState.ventasRecientes || [],
        periodoMetricasActivo,
        limitesTiempo
      ),
    [ventasState.ventasRecientes, periodoMetricasActivo, limitesTiempo]
  );

  const mapearDetalleVentas = (lista: VentaRecientePOS[]): DetalleVentaItem[] =>
    lista.map((v) => ({
      id: v.id,
      codigoComprobante: v.id.length > 12 ? `VNT-${v.id.slice(-4).toUpperCase()}` : v.id,
      fechaHora: `${v.fecha || new Date().toLocaleDateString('es-AR')} ${v.hora}`,
      vendedor: v.vendedor || 'Administrador',
      metodoPago: (v.metodoPago as MetodoPago) || 'efectivo',
      cantidadItems: v.cantidadItems,
      total: v.montoTotal,
      estado: (v.estado as EstadoVenta) || 'completada',
    }));

  const calcularResumen = (lista: DetalleVentaItem[]): ResumenVentasPeriodo => {
    const activas = lista.filter((v) => v.estado !== 'cancelada');
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
  };

  const ventasPeriodoActivo = useMemo(
    () => mapearDetalleVentas(ventasVentanaActiva),
    [ventasVentanaActiva]
  );

  const resumenPeriodoActivo = useMemo(
    () => calcularResumen(ventasPeriodoActivo),
    [ventasPeriodoActivo]
  );

  const resumenPeriodoAnterior = useMemo(
    () => calcularResumen(mapearDetalleVentas(ventasVentanaAnterior)),
    [ventasVentanaAnterior]
  );

  // KPIs ejecutivos con comparativa porcentual real frente al período anterior
  const kpisActivos = useMemo<AdminMetricCard[]>(() => {
    const total = resumenPeriodoActivo.totalRecaudado;
    const ticket = resumenPeriodoActivo.ticketPromedio;
    const ops = resumenPeriodoActivo.cantidadVentas;
    const un = resumenPeriodoActivo.unidadesTotales;

    const valorRecaudacion = `${monedaSimbolo} ${total.toLocaleString('es-AR')}`;
    const valorTicket = `${monedaSimbolo} ${ticket.toLocaleString('es-AR')}`;
    const valorOps = `${ops} ${ops === 1 ? 'venta' : 'ventas'}`;
    const valorUnidades = `${un} un.`;

    const mostrarComparativa = config.metricas?.compararPeriodoAnterior !== false;
    const varRecaudacion = calcularVariacionKPI(total, resumenPeriodoAnterior.totalRecaudado, mostrarComparativa);
    const varTicket = calcularVariacionKPI(ticket, resumenPeriodoAnterior.ticketPromedio, mostrarComparativa);
    const varOps = calcularVariacionKPI(ops, resumenPeriodoAnterior.cantidadVentas, mostrarComparativa);
    const varUnidades = calcularVariacionKPI(un, resumenPeriodoAnterior.unidadesTotales, mostrarComparativa);

    switch (periodoMetricasActivo) {
      case 'diario':
        return [
          { title: 'Recaudación de Hoy (Caja)', value: valorRecaudacion, ...varRecaudacion },
          { title: 'Ticket Promedio Diario', value: valorTicket, ...varTicket },
          { title: 'Operaciones de Hoy', value: valorOps, ...varOps },
          { title: 'Unidades Despachadas Hoy', value: valorUnidades, ...varUnidades },
        ];
      case 'semanal':
        return [
          { title: 'Recaudación Semanal', value: valorRecaudacion, ...varRecaudacion },
          { title: 'Ticket Promedio Semanal', value: valorTicket, ...varTicket },
          { title: 'Operaciones de la Semana', value: valorOps, ...varOps },
          { title: 'Unidades Despachadas', value: valorUnidades, ...varUnidades },
        ];
      case 'ultimos_30_dias':
        return [
          { title: 'Recaudación (Últimos 30 Días)', value: valorRecaudacion, ...varRecaudacion },
          { title: 'Ticket Promedio (30 Días)', value: valorTicket, ...varTicket },
          { title: 'Operaciones (30 Días)', value: valorOps, ...varOps },
          { title: 'Unidades Despachadas (30 Días)', value: valorUnidades, ...varUnidades },
        ];
      case 'mensual':
      default:
        return [
          { title: 'Recaudación del Mes', value: valorRecaudacion, ...varRecaudacion },
          { title: 'Ticket Promedio Mensual', value: valorTicket, ...varTicket },
          { title: 'Operaciones Concretadas', value: valorOps, ...varOps },
          { title: 'Unidades Despachadas', value: valorUnidades, ...varUnidades },
        ];
    }
  }, [
    resumenPeriodoActivo,
    resumenPeriodoAnterior,
    monedaSimbolo,
    periodoMetricasActivo,
    config.metricas?.compararPeriodoAnterior,
  ]);

  // Rotación de productos del período activo con stockMinimo y precioCosto reales
  const { productosMasVendidos, productosMenosVendidos } = useMemo(() => {
    const mapaVentas = new Map<string, { unidades: number; monto: number }>();

    ventasVentanaActiva.forEach((v) => {
      if (v.estado === 'cancelada') return;
      (v.items || []).forEach((item) => {
        const actual = mapaVentas.get(item.productoId) || { unidades: 0, monto: 0 };
        const subtotalItem = item.subtotal ?? item.cantidad * (item.precioUnitario || 0);
        mapaVentas.set(item.productoId, {
          unidades: actual.unidades + item.cantidad,
          monto: actual.monto + subtotalItem,
        });
      });
    });

    const productosActivos = productos.filter((p) => p.activo);

    const rankingCompleto: ProductoRankingVentas[] = productosActivos.map((p) => {
      const info = mapaVentas.get(p.id) || { unidades: 0, monto: 0 };
      const nombreCategoria = p.categoria?.nombre || 'General';
      return {
        id: p.id,
        nombre: p.nombre,
        codigo: p.codigo,
        categoria: nombreCategoria,
        unidadesVendidas: info.unidades,
        stockActual: p.stockActual,
        stockMinimo: p.stockMinimo,
        precioCosto: p.precioCosto,
        montoTotal: info.monto,
        tendencia: info.unidades > 0 ? 'alza' : 'estancada',
      };
    });

    const masVendidos = rankingCompleto
      .filter((p) => p.unidadesVendidas > 0)
      .sort((a, b) => b.unidadesVendidas - a.unidadesVendidas || b.montoTotal - a.montoTotal);

    const menosVendidos = [...rankingCompleto].sort(
      (a, b) => a.unidadesVendidas - b.unidadesVendidas || b.stockActual - a.stockActual
    );

    return {
      productosMasVendidos: masVendidos,
      productosMenosVendidos: menosVendidos,
    };
  }, [ventasVentanaActiva, productos]);

  // Distribución real de métodos de pago en el período activo
  const distribucionPagosActiva = useMemo<PuntoDistribucionPago[]>(() => {
    const activas = ventasVentanaActiva.filter((v) => v.estado !== 'cancelada');
    const totalesPorMetodo: Record<string, number> = {
      'Mercado Pago (Point)': 0,
      Efectivo: 0,
      Transferencia: 0,
      'Tarjeta Débito/Crédito': 0,
    };
    let totalGlobal = 0;

    activas.forEach((v) => {
      let clave = 'Efectivo';
      if (v.metodoPago === 'mercado_pago') clave = 'Mercado Pago (Point)';
      else if (v.metodoPago === 'transferencia') clave = 'Transferencia';
      else if (v.metodoPago === 'tarjeta_debito' || v.metodoPago === 'tarjeta_credito') {
        clave = 'Tarjeta Débito/Crédito';
      } else if (v.metodoPago === 'efectivo') {
        clave = 'Efectivo';
      }

      totalesPorMetodo[clave] = (totalesPorMetodo[clave] || 0) + v.montoTotal;
      totalGlobal += v.montoTotal;
    });

    if (totalGlobal === 0) return [];

    return Object.entries(totalesPorMetodo)
      .filter(([, monto]) => monto > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([metodo, monto]) => ({
        metodo,
        monto,
        porcentaje: Math.round((monto / totalGlobal) * 100),
      }));
  }, [ventasVentanaActiva]);

  // Serie temporal comparativa (Recaudación Actual vs Período Anterior) para los 4 períodos
  const tendenciaActiva = useMemo<PuntoTendenciaVentas[]>(() => {
    const mostrarComparativa = config.metricas?.compararPeriodoAnterior !== false;
    let etiquetas: string[] = [];
    let obtenerIndiceActual: (ts: number) => number;
    let obtenerIndiceAnterior: (ts: number) => number;

    switch (periodoMetricasActivo) {
      case 'diario': {
        etiquetas = ['00-04h', '04-08h', '08-12h', '12-16h', '16-20h', '20-24h'];
        obtenerIndiceActual = (ts) => Math.min(5, Math.max(0, Math.floor(new Date(ts).getHours() / 4)));
        obtenerIndiceAnterior = obtenerIndiceActual;
        break;
      }
      case 'semanal': {
        etiquetas = limitesTiempo.iniciaDomingo
          ? ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
          : ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        obtenerIndiceActual = (ts) => {
          const dia = new Date(ts).getDay();
          return limitesTiempo.iniciaDomingo ? dia : (dia + 6) % 7;
        };
        obtenerIndiceAnterior = obtenerIndiceActual;
        break;
      }
      case 'ultimos_30_dias': {
        etiquetas = ['Días 1-5', 'Días 6-10', 'Días 11-15', 'Días 16-20', 'Días 21-25', 'Días 26-30'];
        obtenerIndiceActual = (ts) =>
          Math.min(5, Math.max(0, Math.floor((ts - limitesTiempo.inicio30DiasTs) / (5 * MS_POR_DIA))));
        obtenerIndiceAnterior = (ts) =>
          Math.min(5, Math.max(0, Math.floor((ts - limitesTiempo.inicio30DiasAnteriorTs) / (5 * MS_POR_DIA))));
        break;
      }
      case 'mensual':
      default: {
        etiquetas = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];
        obtenerIndiceActual = (ts) =>
          Math.min(3, Math.max(0, Math.floor((ts - limitesTiempo.inicioMesTs) / (7 * MS_POR_DIA))));
        obtenerIndiceAnterior = (ts) =>
          Math.min(3, Math.max(0, Math.floor((ts - limitesTiempo.inicioMesAnteriorTs) / (7 * MS_POR_DIA))));
        break;
      }
    }

    const puntos: PuntoTendenciaVentas[] = etiquetas.map((fecha) => ({
      fecha,
      'Recaudación Actual': 0,
      'Período Anterior': 0,
    }));

    ventasVentanaActiva.forEach((v) => {
      if (v.estado === 'cancelada') return;
      const idx = obtenerIndiceActual(obtenerTimestampVenta(v));
      if (puntos[idx]) {
        puntos[idx]['Recaudación Actual'] += v.montoTotal;
      }
    });

    if (mostrarComparativa) {
      ventasVentanaAnterior.forEach((v) => {
        if (v.estado === 'cancelada') return;
        const idx = obtenerIndiceAnterior(obtenerTimestampVenta(v));
        if (puntos[idx]) {
          puntos[idx]['Período Anterior'] += v.montoTotal;
        }
      });
    }

    const hayDatos = puntos.some(
      (p) => p['Recaudación Actual'] > 0 || p['Período Anterior'] > 0
    );

    return hayDatos ? puntos : [];
  }, [
    periodoMetricasActivo,
    ventasVentanaActiva,
    ventasVentanaAnterior,
    limitesTiempo,
    config.metricas?.compararPeriodoAnterior,
  ]);

  const data = useMemo<AdminDashboardData>(
    () => ({
      kpiMetrics: kpisActivos,
      productosMasVendidos,
      productosMenosVendidos,
      ventasDetalle: {
        resumenPeriodoActivo,
        ventasPeriodoActivo,
      },
      graficos: {
        tendenciaActiva,
        distribucionPagosActiva,
      },
    }),
    [
      kpisActivos,
      productosMasVendidos,
      productosMenosVendidos,
      resumenPeriodoActivo,
      ventasPeriodoActivo,
      tendenciaActiva,
      distribucionPagosActiva,
    ]
  );

  const [rotacionTab, setRotacionTab] = useState<RotacionTab>('mas_vendidos');
  const [categoriaRotacion, setCategoriaRotacion] = useState<string>('Todas');
  const [paginaRotacion, setPaginaRotacion] = useState<number>(1);
  const itemsPorPaginaRotacion = 5;
  const loading = false;

  const cambiarTabRotacion = (tab: RotacionTab) => {
    setRotacionTab(tab);
    setPaginaRotacion(1);
  };

  const cambiarCategoriaRotacion = (categoria: string) => {
    setCategoriaRotacion(categoria);
    setPaginaRotacion(1);
  };

  const [paginaVentas, setPaginaVentas] = useState<number>(1);
  const itemsPorPaginaVentas = 5;

  const [filtroVendedorVentas, setFiltroVendedorVentas] = useState<string>('Todos');
  const [filtroMetodoPagoVentas, setFiltroMetodoPagoVentas] = useState<string>('Todos');
  const [filtroEstadoVentas, setFiltroEstadoVentas] = useState<string>('Todos');
  const [busquedaVentas, setBusquedaVentas] = useState<string>('');

  const cambiarFiltroVendedorVentas = (vendedor: string) => {
    setFiltroVendedorVentas(vendedor);
    setPaginaVentas(1);
  };

  const cambiarFiltroMetodoPagoVentas = (metodo: string) => {
    setFiltroMetodoPagoVentas(metodo);
    setPaginaVentas(1);
  };

  const cambiarFiltroEstadoVentas = (estado: string) => {
    setFiltroEstadoVentas(estado);
    setPaginaVentas(1);
  };

  const cambiarBusquedaVentas = (busqueda: string) => {
    setBusquedaVentas(busqueda);
    setPaginaVentas(1);
  };

  const limpiarFiltrosVentas = () => {
    setFiltroVendedorVentas('Todos');
    setFiltroMetodoPagoVentas('Todos');
    setFiltroEstadoVentas('Todos');
    setBusquedaVentas('');
    setPaginaVentas(1);
  };

  const cambiarPeriodoMetricas = (periodo: PeriodoMetricas) => {
    setPeriodoMetricasActivo(periodo);
    setPaginaVentas(1);
    setPaginaRotacion(1);
  };

  return {
    data,
    loading,
    periodoMetricasActivo,
    etiquetaPeriodoActivo,
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
