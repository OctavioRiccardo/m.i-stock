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
import { useInventarioData } from '@/services/inventarioService';
import { supabaseService } from '@/services/supabaseService';
import {
  VENTAS_STORAGE_KEY,
  VentasHistorialStore,
  inicializarVentasCliente,
} from '@/controllers/userControllers/userDashboardController';

export type RotacionTab = 'mas_vendidos' | 'menos_vendidos';

const MS_POR_DIA = 86400000;

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

/**
 * Devuelve la etiqueta legible para el período analítico activo.
 */
function obtenerEtiquetaPeriodo(periodo: PeriodoMetricas): string {
  switch (periodo) {
    case 'diario':
      return 'Hoy';
    case 'semanal':
      return 'Esta Semana';
    case 'ultimos_30_dias':
      return 'Últimos 30 Días';
    case 'mensual':
    default:
      return 'Este Mes';
  }
}

/**
 * Calcula la variación porcentual real frente al período anterior inmediato.
 */
function calcularVariacionKPI(
  actual: number,
  anterior: number,
  mostrarComparativa: boolean
): { changePercentage?: string; status: 'positive' | 'negative' | 'neutral' } {
  if (!mostrarComparativa) {
    return {
      changePercentage: undefined,
      status: actual > 0 ? 'positive' : 'neutral',
    };
  }
  if (anterior === 0 && actual === 0) {
    return { changePercentage: undefined, status: 'neutral' };
  }
  if (anterior === 0 && actual > 0) {
    return { changePercentage: '+100%', status: 'positive' };
  }
  const variacion = Math.round(((actual - anterior) / anterior) * 100);
  const signo = variacion > 0 ? '+' : '';
  const status: 'positive' | 'negative' | 'neutral' =
    variacion > 0 ? 'positive' : variacion < 0 ? 'negative' : 'neutral';

  return {
    changePercentage: `${signo}${variacion}%`,
    status,
  };
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

  // Único selector global de período para todo el dashboard
  const [periodoMetricasActivo, setPeriodoMetricasActivo] = useState<PeriodoMetricas>(
    config.metricas?.periodoPorDefecto || 'mensual'
  );

  useEffect(() => {
    if (config.metricas?.periodoPorDefecto) {
      setPeriodoMetricasActivo(config.metricas.periodoPorDefecto);
    }
  }, [config.metricas?.periodoPorDefecto]);

  const etiquetaPeriodoActivo = useMemo(
    () => obtenerEtiquetaPeriodo(periodoMetricasActivo),
    [periodoMetricasActivo]
  );

  // Límites temporales actuales y del período inmediatamente anterior según configuración
  const limitesTiempo = useMemo(() => {
    const ahora = new Date();
    const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).getTime();
    const inicioAyer = inicioHoy - MS_POR_DIA;

    // Inicio de semana según preferencia ('lunes' vs 'domingo')
    const diaSemana = ahora.getDay(); // 0 = Dom, 1 = Lun
    const iniciaDomingo = config.metricas?.inicioSemana === 'domingo';
    const diasDesdeInicioSemana = iniciaDomingo ? diaSemana : (diaSemana + 6) % 7;
    const inicioSemanaTs = inicioHoy - diasDesdeInicioSemana * MS_POR_DIA;
    const inicioSemanaAnteriorTs = inicioSemanaTs - 7 * MS_POR_DIA;

    // Inicio de mes contable según diaCorteMensual (1 a 28)
    const diaCorte = Math.max(1, Math.min(28, config.metricas?.diaCorteMensual || 1));
    let inicioMesDate = new Date(ahora.getFullYear(), ahora.getMonth(), diaCorte);
    if (ahora.getDate() < diaCorte) {
      inicioMesDate = new Date(ahora.getFullYear(), ahora.getMonth() - 1, diaCorte);
    }
    const inicioMesTs = inicioMesDate.getTime();
    const inicioMesAnteriorDate = new Date(
      inicioMesDate.getFullYear(),
      inicioMesDate.getMonth() - 1,
      diaCorte
    );
    const inicioMesAnteriorTs = inicioMesAnteriorDate.getTime();

    // Últimos 30 días y ventana previa de 30 días
    const inicio30DiasTs = inicioHoy - 29 * MS_POR_DIA;
    const inicio30DiasAnteriorTs = inicio30DiasTs - 30 * MS_POR_DIA;

    return {
      inicioHoy,
      inicioAyer,
      inicioSemanaTs,
      inicioSemanaAnteriorTs,
      inicioMesTs,
      inicioMesAnteriorTs,
      inicio30DiasTs,
      inicio30DiasAnteriorTs,
      iniciaDomingo,
    };
  }, [config.metricas?.inicioSemana, config.metricas?.diaCorteMensual]);

  // Subconjunto de ventas del período activo y de su ventana anterior comparable
  const { ventasVentanaActiva, ventasVentanaAnterior } = useMemo(() => {
    const todas = ventasState.ventasRecientes || [];

    switch (periodoMetricasActivo) {
      case 'diario':
        return {
          ventasVentanaActiva: todas.filter((v) => obtenerTimestampVenta(v) >= limitesTiempo.inicioHoy),
          ventasVentanaAnterior: todas.filter((v) => {
            const ts = obtenerTimestampVenta(v);
            return ts >= limitesTiempo.inicioAyer && ts < limitesTiempo.inicioHoy;
          }),
        };
      case 'semanal':
        return {
          ventasVentanaActiva: todas.filter((v) => obtenerTimestampVenta(v) >= limitesTiempo.inicioSemanaTs),
          ventasVentanaAnterior: todas.filter((v) => {
            const ts = obtenerTimestampVenta(v);
            return ts >= limitesTiempo.inicioSemanaAnteriorTs && ts < limitesTiempo.inicioSemanaTs;
          }),
        };
      case 'ultimos_30_dias':
        return {
          ventasVentanaActiva: todas.filter((v) => obtenerTimestampVenta(v) >= limitesTiempo.inicio30DiasTs),
          ventasVentanaAnterior: todas.filter((v) => {
            const ts = obtenerTimestampVenta(v);
            return ts >= limitesTiempo.inicio30DiasAnteriorTs && ts < limitesTiempo.inicio30DiasTs;
          }),
        };
      case 'mensual':
      default:
        return {
          ventasVentanaActiva: todas.filter((v) => obtenerTimestampVenta(v) >= limitesTiempo.inicioMesTs),
          ventasVentanaAnterior: todas.filter((v) => {
            const ts = obtenerTimestampVenta(v);
            return ts >= limitesTiempo.inicioMesAnteriorTs && ts < limitesTiempo.inicioMesTs;
          }),
        };
    }
  }, [ventasState.ventasRecientes, periodoMetricasActivo, limitesTiempo]);

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

  // Objeto general consolidado consumido por AdminDashboardView
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
