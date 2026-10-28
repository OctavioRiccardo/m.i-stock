'use client';

/**
 * ====================================================================
 * CONTROLADOR DEL DASHBOARD DE ADMINISTRACIÓN (Patrón MVC)
 * ====================================================================
 * 
 * Propósito:
 * Gestionar los datos estratégicos del panel de control para el rol Administrador:
 * métricas financieras reales filtradas por período, agregaciones dinámicas de ventas
 * de POS sincronizadas con Supabase, rotación de catálogo e historial de transacciones.
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
  VentaRecientePOS,
} from '@/models/modelos_vista/dashboardModel';
import { MetodoPago, EstadoVenta } from '@/models/modelos_dominio/ventaModel';
import { useConfiguracionData } from '@/services/configuracionService';
import { PeriodoMetricas } from '@/models/modelos_vista/configuracionModel';
import { useInventarioData } from '@/services/inventarioService';
import { supabaseService } from '@/services/supabaseService';
import {
  VENTAS_STORAGE_KEY,
  VentasHistorialStore,
  inicializarVentasCliente,
} from '@/controllers/userControllers/userDashboardController';

export type RotacionTab = 'mas_vendidos' | 'menos_vendidos';
export type PeriodoVentasTab = 'semana' | 'mes';

/**
 * Obtiene el timestamp numérico de una venta reciente a partir de su campo timestamp, fechaISO o fecha.
 */
function obtenerTimestampVenta(v: VentaRecientePOS): number {
  if (typeof v.timestamp === 'number' && !Number.isNaN(v.timestamp)) {
    return v.timestamp;
  }
  if (v.fechaISO) {
    const parsed = Date.parse(v.fechaISO);
    if (!Number.isNaN(parsed)) return parsed;
  }
  if (v.fecha) {
    const partes = v.fecha.split('/');
    if (partes.length === 3) {
      const [dia, mes, anio] = partes.map(Number);
      const fechaObj = new Date(anio, mes - 1, dia);
      if (!Number.isNaN(fechaObj.getTime())) return fechaObj.getTime();
    }
  }
  return Date.now();
}

export function useAdminDashboardController() {
  const config = useConfiguracionData();
  const monedaSimbolo = config.negocio?.monedaSimbolo || '$';
  const { productos } = useInventarioData();

  // Historial de ventas reactivo persistido en el almacenamiento del sistema
  const [ventasState, setVentasState] = useState<VentasHistorialStore>(() => inicializarVentasCliente());

  // Sincronización con Supabase PostgreSQL y eventos de pestañas locales
  useEffect(() => {
    const sincronizarVentas = () => {
      setVentasState(inicializarVentasCliente());
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', sincronizarVentas);
      window.addEventListener('mistock_ventas_updated', sincronizarVentas);
    }

    // Hidratar ventas remotas desde Supabase
    supabaseService
      .fetchVentas()
      .then((ventasRemotas) => {
        if (ventasRemotas && ventasRemotas.length > 0) {
          setVentasState((prev) => {
            const idsLocales = new Set((prev.ventasRecientes || []).map((v) => v.id));
            const nuevas = ventasRemotas.filter((vr) => !idsLocales.has(vr.id));
            if (nuevas.length === 0) return prev;

            const combinadas = [...prev.ventasRecientes, ...nuevas].sort(
              (a, b) => obtenerTimestampVenta(b) - obtenerTimestampVenta(a)
            );
            const activas = combinadas.filter((v) => v.estado !== 'cancelada');
            const actualizado: VentasHistorialStore = {
              ventasDelDia: activas.length,
              recaudacionDelDia: activas.reduce((acc, v) => acc + v.montoTotal, 0),
              ventasRecientes: combinadas,
            };
            if (typeof window !== 'undefined') {
              try {
                window.localStorage.setItem(VENTAS_STORAGE_KEY, JSON.stringify(actualizado));
              } catch {}
            }
            return actualizado;
          });
        }
      })
      .catch(() => {});

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

  useEffect(() => {
    if (config.metricas?.periodoPorDefecto) {
      setPeriodoMetricasActivo(config.metricas.periodoPorDefecto);
    }
  }, [config.metricas?.periodoPorDefecto]);

  // Calcular límites de tiempo según la configuración de métricas
  const limitesTiempo = useMemo(() => {
    const ahora = new Date();
    const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).getTime();

    // Inicio de semana según preferencia ('lunes' vs 'domingo')
    const diaSemana = ahora.getDay(); // 0 = Dom, 1 = Lun
    const iniciaDomingo = config.metricas?.inicioSemana === 'domingo';
    const diasDesdeInicioSemana = iniciaDomingo ? diaSemana : (diaSemana + 6) % 7;
    const inicioSemanaTs = inicioHoy - diasDesdeInicioSemana * 86400000;

    // Inicio de mes contable según diaCorteMensual (1 a 28)
    const diaCorte = Math.max(1, Math.min(28, config.metricas?.diaCorteMensual || 1));
    let inicioMesDate = new Date(ahora.getFullYear(), ahora.getMonth(), diaCorte);
    if (ahora.getDate() < diaCorte) {
      inicioMesDate = new Date(ahora.getFullYear(), ahora.getMonth() - 1, diaCorte);
    }
    const inicioMesTs = inicioMesDate.getTime();

    // Últimos 30 días
    const inicio30DiasTs = inicioHoy - 29 * 86400000;

    return {
      inicioHoy,
      inicioSemanaTs,
      inicioMesTs,
      inicio30DiasTs,
      iniciaDomingo,
    };
  }, [config.metricas?.inicioSemana, config.metricas?.diaCorteMensual]);

  // Ventas filtradas por cada ventana temporal
  const ventasPorVentana = useMemo(() => {
    const todas = ventasState.ventasRecientes || [];
    const hoy = todas.filter((v) => obtenerTimestampVenta(v) >= limitesTiempo.inicioHoy);
    const semana = todas.filter((v) => obtenerTimestampVenta(v) >= limitesTiempo.inicioSemanaTs);
    const mes = todas.filter((v) => obtenerTimestampVenta(v) >= limitesTiempo.inicioMesTs);
    const ultimos30 = todas.filter((v) => obtenerTimestampVenta(v) >= limitesTiempo.inicio30DiasTs);

    return { todas, hoy, semana, mes, ultimos30 };
  }, [ventasState.ventasRecientes, limitesTiempo]);

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

  const detalleVentasSemana = useMemo(
    () => mapearDetalleVentas(ventasPorVentana.semana),
    [ventasPorVentana.semana]
  );
  const detalleVentasMes = useMemo(
    () => mapearDetalleVentas(ventasPorVentana.mes),
    [ventasPorVentana.mes]
  );

  const resumenSemana = useMemo(() => calcularResumen(detalleVentasSemana), [detalleVentasSemana]);
  const resumenMes = useMemo(() => calcularResumen(detalleVentasMes), [detalleVentasMes]);

  // Resumen correspondiente al período seleccionado en las tarjetas KPI superiores
  const resumenPeriodoActivo = useMemo<ResumenVentasPeriodo>(() => {
    switch (periodoMetricasActivo) {
      case 'diario':
        return calcularResumen(mapearDetalleVentas(ventasPorVentana.hoy));
      case 'semanal':
        return resumenSemana;
      case 'ultimos_30_dias':
        return calcularResumen(mapearDetalleVentas(ventasPorVentana.ultimos30));
      case 'mensual':
      default:
        return resumenMes;
    }
  }, [periodoMetricasActivo, ventasPorVentana, resumenSemana, resumenMes]);

  // KPIs dinámicos calculados según el período activo y los datos reales filtrados
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
    const comparativa = mostrarComparativa && ops > 0 ? '+100%' : undefined;
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
  }, [resumenPeriodoActivo, monedaSimbolo, periodoMetricasActivo, config.metricas?.compararPeriodoAnterior]);

  // Rotación de productos: Más Vendidos vs Menos Vendidos calculados del catálogo y ventas
  const { productosMasVendidos, productosMenosVendidos } = useMemo(() => {
    const mapaVentas = new Map<string, { unidades: number; monto: number }>();

    (ventasState.ventasRecientes || []).forEach((v) => {
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

  // Distribución real de métodos de pago para Semana y Mes
  const calcularDistribucionPagos = (lista: VentaRecientePOS[]): PuntoDistribucionPago[] => {
    const activas = lista.filter((v) => v.estado !== 'cancelada');
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
      else if (v.metodoPago === 'tarjeta_debito' || v.metodoPago === 'tarjeta_credito')
        clave = 'Tarjeta Débito/Crédito';
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
  };

  const distribucionPagosSemana = useMemo(
    () => calcularDistribucionPagos(ventasPorVentana.semana),
    [ventasPorVentana.semana]
  );
  const distribucionPagosMes = useMemo(
    () => calcularDistribucionPagos(ventasPorVentana.mes),
    [ventasPorVentana.mes]
  );

  // Barras y Tendencia de ventas agrupadas por día de la semana y semanas del mes
  const { barrasVentasSemana, barrasVentasMes, tendenciaSemana, tendenciaMes } = useMemo(() => {
    const diasLabels = limitesTiempo.iniciaDomingo
      ? ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
      : ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    const barrasSemana: PuntoBarraVenta[] = diasLabels.map((d) => ({
      periodo: d,
      'Monto Facturado': 0,
      Operaciones: 0,
    }));

    ventasPorVentana.semana.forEach((v) => {
      if (v.estado === 'cancelada') return;
      const fecha = new Date(obtenerTimestampVenta(v));
      const dia = fecha.getDay(); // 0=Dom..6=Sáb
      const idx = limitesTiempo.iniciaDomingo ? dia : (dia + 6) % 7;
      barrasSemana[idx]['Monto Facturado'] += v.montoTotal;
      barrasSemana[idx].Operaciones += 1;
    });

    const semanasMes = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];
    const barrasMes: PuntoBarraVenta[] = semanasMes.map((s) => ({
      periodo: s,
      'Monto Facturado': 0,
      Operaciones: 0,
    }));

    ventasPorVentana.mes.forEach((v) => {
      if (v.estado === 'cancelada') return;
      const fecha = new Date(obtenerTimestampVenta(v));
      const semanaIdx = Math.min(3, Math.floor((fecha.getDate() - 1) / 7));
      barrasMes[semanaIdx]['Monto Facturado'] += v.montoTotal;
      barrasMes[semanaIdx].Operaciones += 1;
    });

    const hayRecaudacionSemana = barrasSemana.some((b) => b['Monto Facturado'] > 0);
    const hayRecaudacionMes = barrasMes.some((b) => b['Monto Facturado'] > 0);

    const tendSemana: PuntoTendenciaVentas[] = hayRecaudacionSemana
      ? barrasSemana.map((b) => ({
          fecha: b.periodo,
          'Recaudación Actual': b['Monto Facturado'],
          'Período Anterior': 0,
        }))
      : [];

    const tendMes: PuntoTendenciaVentas[] = hayRecaudacionMes
      ? barrasMes.map((b) => ({
          fecha: b.periodo,
          'Recaudación Actual': b['Monto Facturado'],
          'Período Anterior': 0,
        }))
      : [];

    return {
      barrasVentasSemana: barrasSemana,
      barrasVentasMes: barrasMes,
      tendenciaSemana: tendSemana,
      tendenciaMes: tendMes,
    };
  }, [ventasPorVentana.semana, ventasPorVentana.mes, limitesTiempo.iniciaDomingo]);

  // Objeto general consolidado consumido por AdminDashboardView
  const data = useMemo<AdminDashboardData>(
    () => ({
      kpiMetrics: kpisActivos,
      productosMasVendidos,
      productosMenosVendidos,
      ventasDetalle: {
        resumenSemana,
        resumenMes,
        ventasSemana: detalleVentasSemana,
        ventasMes: detalleVentasMes,
      },
      graficos: {
        tendenciaSemana,
        tendenciaMes,
        distribucionPagosSemana,
        distribucionPagosMes,
        barrasVentasSemana,
        barrasVentasMes,
      },
    }),
    [
      kpisActivos,
      productosMasVendidos,
      productosMenosVendidos,
      resumenSemana,
      resumenMes,
      detalleVentasSemana,
      detalleVentasMes,
      tendenciaSemana,
      tendenciaMes,
      distribucionPagosSemana,
      distribucionPagosMes,
      barrasVentasSemana,
      barrasVentasMes,
    ]
  );

  // Pestaña activa para la tarjeta de rotación de productos ('mas_vendidos' | 'menos_vendidos')
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

  const [periodoVentasTab, setPeriodoVentasTab] = useState<PeriodoVentasTab>('semana');
  const [paginaVentas, setPaginaVentas] = useState<number>(1);
  const itemsPorPaginaVentas = 5;

  const [filtroVendedorVentas, setFiltroVendedorVentas] = useState<string>('Todos');
  const [filtroMetodoPagoVentas, setFiltroMetodoPagoVentas] = useState<string>('Todos');
  const [filtroEstadoVentas, setFiltroEstadoVentas] = useState<string>('Todos');
  const [busquedaVentas, setBusquedaVentas] = useState<string>('');

  const cambiarPeriodoVentas = (tab: PeriodoVentasTab) => {
    setPeriodoVentasTab(tab);
    setPaginaVentas(1);
  };

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
