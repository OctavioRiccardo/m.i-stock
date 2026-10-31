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
 * - Respeto a las directivas de configuración global (moneda, venta sin stock, sonido).
 * - Sincronización exacta con los triggers PostgreSQL de Supabase sin doble descuento.
 */

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  UserDashboardData,
  ProductoRapidoPOS,
  VentaRecientePOS,
  ItemCarritoPOS,
  PestanaOperativaPOS,
  calcularTotalesCarrito,
} from '@/models/modelos_vista/dashboardModel';
import { useInventarioData, inventarioService } from '@/services/inventarioService';
import { supabaseService } from '@/services/supabaseService';
import { MetodoPago, DetalleVenta } from '@/models/modelos_dominio/ventaModel';
import { useConfiguracionData } from '@/services/configuracionService';
import {
  ArqueoCajaDTO,
  ResumenMediosPagoCierre,
  EstadoBalanceCaja,
  calcularEfectivoEsperado,
  calcularDiferenciaCaja,
  determinarEstadoBalance,
} from '@/models/modelos_vista/cierreCajaModel';
import { LIMITES_TEXTO, MAX_PRECIO_DB } from '@/lib/validaciones';

export const VENTAS_STORAGE_KEY = 'mistock_ventas_historial_test_v1';

export interface VentasHistorialStore {
  ventasDelDia: number;
  recaudacionDelDia: number;
  ventasRecientes: VentaRecientePOS[];
}

export function recalcularVentasStore(ventas: VentaRecientePOS[]): VentasHistorialStore {
  const hoyStr = new Date().toLocaleDateString('es-AR');
  const hoyInicioTs = new Date().setHours(0, 0, 0, 0);

  const ventasDeHoy = ventas.filter((v: VentaRecientePOS) => {
    if (v.estado === 'cancelada') return false;
    if (v.fecha && v.fecha === hoyStr) return true;
    if (v.timestamp && v.timestamp >= hoyInicioTs) return true;
    return false;
  });

  return {
    ventasDelDia: ventasDeHoy.length,
    recaudacionDelDia: ventasDeHoy.reduce(
      (acc: number, v: VentaRecientePOS) => acc + (v.montoTotal || 0),
      0
    ),
    ventasRecientes: ventas,
  };
}

export function inicializarVentasCliente(): VentasHistorialStore {
  if (typeof window === 'undefined') {
    return { ventasDelDia: 0, recaudacionDelDia: 0, ventasRecientes: [] };
  }
  try {
    const raw = window.localStorage.getItem(VENTAS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.ventasRecientes)) {
        return recalcularVentasStore(parsed.ventasRecientes);
      }
    }
  } catch {}
  return { ventasDelDia: 0, recaudacionDelDia: 0, ventasRecientes: [] };
}

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

  const [ventasState, setVentasState] = useState<VentasHistorialStore>(inicializarVentasCliente);

  // Hidratar ventas autoritativas desde Supabase al montar (reemplazando cualquier residuo local)
  useEffect(() => {
    let mounted = true;
    void inventarioService.sincronizarConSupabase();

    supabaseService
      .fetchVentasWithStatus()
      .then((res) => {
        if (!mounted || !res.ok) return;
        setVentasState((prev) => {
          const prevById = new Map(prev.ventasRecientes.map((v) => [v.id, v]));
          const autoritativas = res.items
            .map((v) => ({
              ...v,
              idTurno: prevById.get(v.id)?.idTurno,
            }))
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

          const updated = recalcularVentasStore(autoritativas);
          if (typeof window !== 'undefined') {
            try {
              window.localStorage.setItem(VENTAS_STORAGE_KEY, JSON.stringify(updated));
              window.dispatchEvent(new Event('mistock_ventas_updated'));
            } catch {}
          }
          return updated;
        });
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const data: UserDashboardData = useMemo(
    () => ({
      ventasDelDia: ventasState.ventasDelDia,
      recaudacionDelDia: ventasState.recaudacionDelDia,
      totalProductosEnStock: productosPopulares.reduce((acc, p) => acc + p.stock, 0),
      ventasRecientes: ventasState.ventasRecientes,
      productosPopulares,
    }),
    [ventasState, productosPopulares]
  );

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
        filtroCat === 'todas' || product.categoria.toLowerCase() === filtroCat;

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

  // Paginación para Ventas Recientes en Caja
  const [paginaVentas, setPaginaVentas] = useState<number>(1);
  const itemsPorPaginaVentas = 6;
  const totalPaginasVentas = Math.max(1, Math.ceil(ventasFiltradas.length / itemsPorPaginaVentas));
  const inicioPaginacionVentas = (paginaVentas - 1) * itemsPorPaginaVentas;
  const ventasRecientesPaginadas = ventasFiltradas.slice(
    inicioPaginacionVentas,
    inicioPaginacionVentas + itemsPorPaginaVentas
  );

  // Reset de página al cambiar filtros en historial
  useEffect(() => {
    setPaginaVentas(1);
  }, [metodoPagoFiltroVentas, busquedaHistorial]);

  // ====================================================================
  // OPERATIVA DE SESIÓN DE CAJA: APERTURA Y CIERRE (MONO-CAJA)
  // ====================================================================
  const [cajaAbierta, setCajaAbierta] = useState<boolean>(false);
  const [fondoInicial, setFondoInicial] = useState<number>(10000);
  const [fechaApertura, setFechaApertura] = useState<string | null>(null);

  const getNombreUsuarioActivo = (): string => {
    if (typeof window !== 'undefined') {
      try {
        const u = window.localStorage.getItem('mistock_usuario_activo');
        if (u) {
          const parsed = JSON.parse(u);
          if (parsed.nombre) return parsed.nombre;
        }
      } catch {}
    }
    return 'Administrador';
  };

  const [cajeroApertura, setCajeroApertura] = useState<string>(() => getNombreUsuarioActivo());
  const [observacionesApertura, setObservacionesApertura] = useState<string>('');
  const [idTurnoActivo, setIdTurnoActivo] = useState<string | null>(null);
  const [timestampApertura, setTimestampApertura] = useState<number | null>(null);
  const [isModalAperturaOpen, setIsModalAperturaOpen] = useState<boolean>(false);

  const handleSetIsModalAperturaOpen = (abrir: boolean) => {
    if (abrir) {
      setCajeroApertura(getNombreUsuarioActivo());
    }
    setIsModalAperturaOpen(abrir);
  };
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
          if (sesion.cajaAbierta) {
            if (sesion.idTurno) setIdTurnoActivo(sesion.idTurno);
            if (sesion.timestampApertura) setTimestampApertura(sesion.timestampApertura);
            if (sesion.fondoInicial !== undefined) setFondoInicial(sesion.fondoInicial);
            if (sesion.fechaApertura) setFechaApertura(sesion.fechaApertura);
            if (sesion.cajeroApertura) setCajeroApertura(sesion.cajeroApertura);
            if (sesion.observacionesApertura) setObservacionesApertura(sesion.observacionesApertura);
          } else {
            setCajeroApertura(getNombreUsuarioActivo());
          }
          if (sesion.ultimoCierre) setUltimoCierre(sesion.ultimoCierre);
          return;
        }
      }
      setCajaAbierta(false);
      setCajeroApertura(getNombreUsuarioActivo());
    } catch {
      setCajaAbierta(false);
      setCajeroApertura(getNombreUsuarioActivo());
    }
  }, []);

  /**
   * Ejecuta la Apertura de Caja validando rangos numéricos y longitud de observaciones.
   */
  const abrirCaja = (montoInicial: number, observaciones?: string) => {
    const montoSeguro =
      Number.isFinite(montoInicial) && montoInicial >= 0
        ? Math.min(MAX_PRECIO_DB, Number(montoInicial.toFixed(2)))
        : 0;
    const obsSegura = (observaciones || '').trim().slice(0, LIMITES_TEXTO.OBSERVACIONES_MAX);

    const ahora = new Date();
    const fechaFormateada = ahora.toLocaleDateString('es-AR');
    const horaFormateada = ahora.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const strFechaApertura = `${fechaFormateada} ${horaFormateada}`;
    const cajeroActual = getNombreUsuarioActivo();
    const nuevoIdTurno = `TRN-${Date.now().toString().slice(-6)}`;
    const nuevoTimestamp = ahora.getTime();

    setIdTurnoActivo(nuevoIdTurno);
    setTimestampApertura(nuevoTimestamp);
    setCajaAbierta(true);
    setFondoInicial(montoSeguro);
    setFechaApertura(strFechaApertura);
    setCajeroApertura(cajeroActual);
    setObservacionesApertura(obsSegura);
    setIsModalAperturaOpen(false);

    try {
      localStorage.setItem(
        'mistock_sesion_caja_v1',
        JSON.stringify({
          cajaAbierta: true,
          idTurno: nuevoIdTurno,
          timestampApertura: nuevoTimestamp,
          fondoInicial: montoSeguro,
          fechaApertura: strFechaApertura,
          cajeroApertura: cajeroActual,
          observacionesApertura: obsSegura,
          ultimoCierre,
        })
      );
    } catch {}

    setSaleSuccessMessage(
      `Caja abierta con éxito (Turno ${nuevoIdTurno}). Fondo inicial: ${monedaSimbolo} ${montoSeguro.toLocaleString('es-AR')}`
    );
    setTimeout(() => setSaleSuccessMessage(null), 4000);
  };

  // Ventas correspondientes exclusivamente a la sesión del turno activo
  const ventasTurnoActual = useMemo(() => {
    if (!cajaAbierta && !timestampApertura && !idTurnoActivo) return [];
    return data.ventasRecientes.filter((v) => {
      if (v.estado === 'cancelada') return false;
      if (idTurnoActivo && v.idTurno) {
        return v.idTurno === idTurnoActivo;
      }
      if (timestampApertura && v.timestamp) {
        return v.timestamp >= timestampApertura;
      }
      return false;
    });
  }, [data.ventasRecientes, cajaAbierta, idTurnoActivo, timestampApertura]);

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

    for (const v of ventasTurnoActual) {
      const m = v.metodoPago;
      if (m === 'efectivo') resumen.efectivo += v.montoTotal;
      else if (m === 'mercado_pago') resumen.mercadoPago += v.montoTotal;
      else if (m === 'tarjeta_debito') resumen.tarjetaDebito += v.montoTotal;
      else if (m === 'tarjeta_credito') resumen.tarjetaCredito += v.montoTotal;
      else if (m === 'transferencia') resumen.transferencia += v.montoTotal;
      else resumen.otro += v.montoTotal;
    }

    return resumen;
  }, [ventasTurnoActual]);

  const totalVentasEfectivo = resumenMediosTurno.efectivo;
  const totalDigitales =
    resumenMediosTurno.mercadoPago +
    resumenMediosTurno.tarjetaDebito +
    resumenMediosTurno.tarjetaCredito +
    resumenMediosTurno.transferencia +
    resumenMediosTurno.otro;
  const granTotalRecaudado = totalVentasEfectivo + totalDigitales;
  const cantidadTicketsValidos = useMemo(() => ventasTurnoActual.length, [ventasTurnoActual]);
  const efectivoEsperado = calcularEfectivoEsperado(fondoInicial, totalVentasEfectivo);

  /**
   * Ejecuta la confirmación del Arqueo y emite el comprobante de Cierre de Caja (Z).
   */
  const confirmarCierreCaja = (efectivoReal: number, observaciones?: string): ArqueoCajaDTO => {
    const efectivoSeguro =
      Number.isFinite(efectivoReal) && efectivoReal >= 0
        ? Math.min(MAX_PRECIO_DB, Number(efectivoReal.toFixed(2)))
        : 0;
    const obsSegura = (observaciones || '').trim().slice(0, LIMITES_TEXTO.OBSERVACIONES_MAX);

    const diferencia = calcularDiferenciaCaja(efectivoSeguro, efectivoEsperado);
    const estadoBalance: EstadoBalanceCaja = determinarEstadoBalance(diferencia);

    const fechaHoy = new Date();
    const horaFormateada = fechaHoy.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const fechaFormateada = fechaHoy.toLocaleDateString('es-AR');

    const nuevoCierre: ArqueoCajaDTO = {
      idCierre: `CR-${Date.now().toString().slice(-6)}`,
      idTurno: idTurnoActivo || undefined,
      fechaApertura: fechaApertura || `${fechaFormateada} 08:30`,
      fechaCierre: `${fechaFormateada} ${horaFormateada}`,
      cajero: cajeroApertura || 'Administrador',
      numeroCaja: config.pos.numeroCaja || 1,
      fondoInicial,
      totalVentasEfectivo,
      totalDigitales,
      granTotalRecaudado,
      cantidadTickets: cantidadTicketsValidos,
      efectivoEsperado,
      efectivoReal: efectivoSeguro,
      diferencia,
      estadoBalance,
      desgloseMedios: resumenMediosTurno,
      observaciones: obsSegura || undefined,
    };

    setCajaAbierta(false);
    setIdTurnoActivo(null);
    setTimestampApertura(null);
    setUltimoCierre(nuevoCierre);
    setIsModalArqueoOpen(false);
    setIsModalTicketCierreOpen(true);

    try {
      localStorage.setItem(
        'mistock_sesion_caja_v1',
        JSON.stringify({
          cajaAbierta: false,
          idTurno: null,
          timestampApertura: null,
          fondoInicial,
          fechaApertura: null,
          cajeroApertura: null,
          observacionesApertura: '',
          ultimoCierre: nuevoCierre,
        })
      );
    } catch {}

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

  const consultarProducto = (termino: string) => {
    const q = termino.trim().toLowerCase();
    if (!q) {
      setProductoConsultado(null);
      return;
    }

    const exacto = data.productosPopulares.find((p) => p.codigo.toLowerCase() === q);
    if (exacto) {
      setProductoConsultado(exacto);
      return;
    }

    const match = data.productosPopulares.find(
      (p) => p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q)
    );
    setProductoConsultado(match || null);
  };

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
  const [disponibilidadFiltroCatalogo, setDisponibilidadFiltroCatalogo] = useState<
    'todos' | 'con_stock' | 'agotados'
  >('todos');
  const [paginaCatalogo, setPaginaCatalogo] = useState<number>(1);
  const itemsPorPaginaCatalogo = 8;

  useEffect(() => {
    setPaginaCatalogo(1);
  }, [busquedaCatalogo, categoriaFiltroCatalogo, disponibilidadFiltroCatalogo]);

  const productosCatalogoFiltrados = useMemo(() => {
    const query = busquedaCatalogo.trim().toLowerCase();
    const catFiltro = categoriaFiltroCatalogo.toLowerCase();

    return data.productosPopulares.filter((p) => {
      const coincideBusqueda =
        !query ||
        p.nombre.toLowerCase().includes(query) ||
        p.codigo.toLowerCase().includes(query) ||
        p.categoria.toLowerCase().includes(query);

      const coincideCategoria = catFiltro === 'todas' || p.categoria.toLowerCase() === catFiltro;

      const coincideDisponibilidad =
        disponibilidadFiltroCatalogo === 'todos' ||
        (disponibilidadFiltroCatalogo === 'con_stock' && p.stock > 0) ||
        (disponibilidadFiltroCatalogo === 'agotados' && p.stock === 0);

      return coincideBusqueda && coincideCategoria && coincideDisponibilidad;
    });
  }, [data.productosPopulares, busquedaCatalogo, categoriaFiltroCatalogo, disponibilidadFiltroCatalogo]);

  const totalPaginasCatalogo = Math.max(
    1,
    Math.ceil(productosCatalogoFiltrados.length / itemsPorPaginaCatalogo)
  );
  const inicioPaginacionCatalogo = (paginaCatalogo - 1) * itemsPorPaginaCatalogo;
  const productosCatalogoPaginados = productosCatalogoFiltrados.slice(
    inicioPaginacionCatalogo,
    inicioPaginacionCatalogo + itemsPorPaginaCatalogo
  );

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

  const totalCarrito = useMemo(() => {
    return calcularTotalesCarrito(carrito).total;
  }, [carrito]);

  const cantidadArticulosCarrito = useMemo(() => {
    return calcularTotalesCarrito(carrito).cantidadArticulos;
  }, [carrito]);

  const agregarAlCarrito = (producto: ProductoRapidoPOS, cantidadAAgregar: number = 1): boolean => {
    if (!cajaAbierta) {
      setSaleErrorMessage(
        'La caja está cerrada. Abra la caja desde el botón superior antes de armar el carrito.'
      );
      setTimeout(() => setSaleErrorMessage(null), 3000);
      return false;
    }

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

  const actualizarCantidadItem = (productoId: string, nuevaCantidad: number) => {
    if (!cajaAbierta) return;

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

  const removerItemCarrito = (productoId: string) => {
    if (!cajaAbierta) return;
    setCarrito((prev) => prev.filter((item) => item.producto.id !== productoId));
  };

  const vaciarCarrito = () => {
    if (!cajaAbierta) return;
    setCarrito([]);
  };

  /**
   * Procesa y cobra el ticket completo con todos los productos del carrito.
   * Evita el doble descuento dejando la mutación remota exclusivamente al trigger PostgreSQL.
   */
  const procesarVentaTicket = (
    metodoPago: MetodoPago = 'efectivo',
    montoRecibido?: number
  ): VentaRecientePOS | null => {
    if (!cajaAbierta) {
      setSaleErrorMessage('La caja está cerrada. Abra la caja desde el botón superior de apertura.');
      setTimeout(() => setSaleErrorMessage(null), 3000);
      return null;
    }

    if (carrito.length === 0) {
      setSaleErrorMessage('El ticket está vacío. Agregue productos antes de cobrar.');
      setTimeout(() => setSaleErrorMessage(null), 3000);
      return null;
    }

    if (totalCarrito > MAX_PRECIO_DB) {
      setSaleErrorMessage(
        `El total del ticket supera el límite operativo de ${monedaSimbolo} ${MAX_PRECIO_DB.toLocaleString('es-AR')}.`
      );
      setTimeout(() => setSaleErrorMessage(null), 4000);
      return null;
    }

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

    const ahora = new Date();
    const newSale: VentaRecientePOS = {
      id: ventaId,
      hora: ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fecha: ahora.toLocaleDateString('es-AR'),
      fechaISO: ahora.toISOString(),
      timestamp: ahora.getTime(),
      idTurno: idTurnoActivo || undefined,
      montoTotal: totalVenta,
      cantidadItems: cantidadArticulosCarrito,
      metodoPago,
      vendedor: cajeroApertura || 'Administrador',
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

    // Descuento optimista únicamente en memoria/UI (`sincronizarRemoto = false`):
    // PostgreSQL descuenta el stock una sola vez mediante `tr_venta_movimiento_stock`.
    for (const item of carrito) {
      inventarioService.descontarStock(item.producto.id, item.cantidad, permitirVentaSinStock, false);
    }

    if (config.pos.sonidoConfirmacionVenta && typeof window !== 'undefined') {
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.08);
          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.22);
        }
      } catch {}
    }

    // Persistencia remota verificada en Supabase
    supabaseService
      .registrarVenta(newSale)
      .then((remoteId) => {
        if (!remoteId) {
          // Revertir venta local y re-sincronizar stock real desde Supabase
          setVentasState((prev) => {
            const filtradas = prev.ventasRecientes.filter((v) => v.id !== ventaId);
            const updated = recalcularVentasStore(filtradas);
            if (typeof window !== 'undefined') {
              try {
                window.localStorage.setItem(VENTAS_STORAGE_KEY, JSON.stringify(updated));
                window.dispatchEvent(new Event('mistock_ventas_updated'));
              } catch {}
            }
            return updated;
          });
          void inventarioService.sincronizarConSupabase();
          setSaleErrorMessage('No se pudo registrar la venta en Supabase. Se revirtió la operación.');
          return;
        }

        setVentasState((prev) => {
          const allSales = prev.ventasRecientes.map((v) =>
            v.id === ventaId ? { ...v, id: remoteId } : v
          );
          const updated = recalcularVentasStore(allSales);
          if (typeof window !== 'undefined') {
            try {
              window.localStorage.setItem(VENTAS_STORAGE_KEY, JSON.stringify(updated));
              window.dispatchEvent(new Event('mistock_ventas_updated'));
            } catch {}
          }
          return updated;
        });

        // Sincronizar existencias con el valor exacto calculado por el trigger PostgreSQL
        void inventarioService.sincronizarConSupabase();
      })
      .catch(() => {
        void inventarioService.sincronizarConSupabase();
      });

    setVentasState((prev) => {
      const updated = recalcularVentasStore([newSale, ...prev.ventasRecientes]);
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(VENTAS_STORAGE_KEY, JSON.stringify(updated));
          window.dispatchEvent(new Event('mistock_ventas_updated'));
        } catch {}
      }
      return updated;
    });

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
   * Cancela una venta registrada en Supabase, reintegra su stock mediante trigger PostgreSQL
   * y descuenta su monto de las métricas del turno y del día.
   */
  const cancelarVenta = (ventaId: string, motivo?: string): boolean => {
    const venta = data.ventasRecientes.find((v) => v.id === ventaId);
    if (!venta) {
      setSaleErrorMessage(`No se encontró el comprobante ${ventaId}.`);
      setTimeout(() => setSaleErrorMessage(null), 3500);
      return false;
    }

    if (venta.estado === 'cancelada') {
      setSaleErrorMessage(`El comprobante ${ventaId} ya fue cancelado previamente.`);
      setTimeout(() => setSaleErrorMessage(null), 3500);
      return false;
    }

    if (ventaId.startsWith('VNT-')) {
      setSaleErrorMessage(
        'Aguarde un segundo a que el ticket termine de sincronizarse con la base de datos e intente nuevamente.'
      );
      setTimeout(() => setSaleErrorMessage(null), 3500);
      return false;
    }

    // 1. Reintegro optimista en UI (`sincronizarRemoto = false`):
    // PostgreSQL reintegra el stock mediante `tr_cancelar_venta_reintegrar_stock`.
    for (const item of venta.items || []) {
      inventarioService.reintegrarStock(item.productoId, item.cantidad, false);
    }

    // 2. Actualizar estado local y verificar confirmación en Supabase
    setVentasState((prev) => {
      const allSales = prev.ventasRecientes.map((v) =>
        v.id === ventaId ? { ...v, estado: 'cancelada' as const } : v
      );
      const updated = recalcularVentasStore(allSales);
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(VENTAS_STORAGE_KEY, JSON.stringify(updated));
          window.dispatchEvent(new Event('mistock_ventas_updated'));
        } catch {}
      }
      return updated;
    });

    supabaseService
      .cancelarVenta(ventaId)
      .then((ok) => {
        if (!ok) {
          // Revertir si la base de datos rechazó la anulación (ej. falta aplicar patch_integridad_y_anulacion.sql)
          setVentasState((prev) => {
            const revertidas = prev.ventasRecientes.map((v) =>
              v.id === ventaId ? { ...v, estado: 'completada' as const } : v
            );
            const updated = recalcularVentasStore(revertidas);
            if (typeof window !== 'undefined') {
              try {
                window.localStorage.setItem(VENTAS_STORAGE_KEY, JSON.stringify(updated));
                window.dispatchEvent(new Event('mistock_ventas_updated'));
              } catch {}
            }
            return updated;
          });
          void inventarioService.sincronizarConSupabase();
          setSaleErrorMessage(
            'No se pudo anular el ticket en Supabase. Aplique patch_integridad_y_anulacion.sql en el SQL Editor.'
          );
          return;
        }
        void inventarioService.sincronizarConSupabase();
      })
      .catch(() => {
        void inventarioService.sincronizarConSupabase();
      });

    const motivoLimpio = (motivo || '').trim().slice(0, LIMITES_TEXTO.OBSERVACIONES_MAX);
    const motivoTexto = motivoLimpio ? ` (Motivo: ${motivoLimpio})` : '';
    setSaleSuccessMessage(
      `Venta ${ventaId} anulada con éxito y mercadería reingresada al stock.${motivoTexto}`
    );
    setTimeout(() => setSaleSuccessMessage(null), 4000);
    return true;
  };

  return {
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
    monedaSimbolo,
    metodoSeleccionado,
    setMetodoSeleccionado,
    permitirVentaSinStock,
    config,
    carrito,
    totalCarrito,
    cantidadArticulosCarrito,
    agregarAlCarrito,
    actualizarCantidadItem,
    removerItemCarrito,
    vaciarCarrito,
    procesarVentaTicket,
    busquedaPrecios,
    setBusquedaPrecios,
    productoConsultado,
    setProductoConsultado,
    consultarProducto,
    productosConsultorFiltrados,
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
    cajaAbierta,
    setCajaAbierta,
    fechaApertura,
    cajeroApertura,
    observacionesApertura,
    isModalAperturaOpen,
    setIsModalAperturaOpen: handleSetIsModalAperturaOpen,
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
    idTurnoActivo,
    efectivoEsperado,
    cancelarVenta,
    confirmarCierreCaja,
  };
}
