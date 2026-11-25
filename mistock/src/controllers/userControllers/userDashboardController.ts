'use client';

/**
 * ====================================================================
 * CONTROLADOR DEL PANEL DE CAJERO / TERMINAL DE VENTAS (POS) (Patrón MVC)
 * ====================================================================
 *
 * Propósito:
 * Orquestar la operativa diaria en el punto de venta (POS) componiendo:
 * - `useCajaTurno`: apertura, arqueo, cierre y sincronización de turnos de caja.
 * - `useCarritoPos`: armado, edición y validación de stock del ticket en curso.
 * - `ventasStorage`: caché local validada y sincronización con Supabase.
 */

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  UserDashboardData,
  ProductoRapidoPOS,
  VentaRecientePOS,
  PestanaOperativaPOS,
} from '@/models/modelos_vista/dashboardModel';
import { useInventarioData, inventarioService } from '@/services/inventarioService';
import { supabaseService } from '@/services/supabaseService';
import { MetodoPago, DetalleVenta } from '@/models/modelos_dominio/ventaModel';
import { useConfiguracionData } from '@/services/configuracionService';
import { LIMITES_TEXTO, MAX_PRECIO_DB, formatearCodigoComprobante } from '@/lib/validaciones';
import { obtenerEtiquetaMetodoPago } from '@/components/ui/badge-metodo-pago';
import {
  VENTAS_STORAGE_KEY,
  VENTAS_SERVER_SNAPSHOT,
  VentasHistorialStore,
  guardarVentasCliente,
  inicializarVentasCliente,
  recalcularVentasStore,
} from '@/lib/ventasStorage';
import { obtenerNombreUsuarioActivo, useCajaTurno } from './useCajaTurno';
import { useCarritoPos } from './useCarritoPos';

export {
  VENTAS_STORAGE_KEY,
  VENTAS_SERVER_SNAPSHOT,
  inicializarVentasCliente,
  recalcularVentasStore,
};
export type { VentasHistorialStore };

function reproducirSonidoConfirmacionVenta(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

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
  } catch (err) {
    console.warn('[POS] Audio de confirmación no disponible en el navegador:', err);
  }
}

export function useUserDashboardController() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Gestión reactiva de pestaña operativa derivada directamente de la URL (Consultor oculto temporalmente)
  const rawTabParam = searchParams?.get('tab') as PestanaOperativaPOS | null;
  const pestanaDesdeUrl: PestanaOperativaPOS =
    rawTabParam && ['caja', 'catalogo', 'historial'].includes(rawTabParam) ? rawTabParam : 'caja';
  const [pestanaLocal, setPestanaLocal] = useState<PestanaOperativaPOS | null>(null);
  const pestanaOperativa: PestanaOperativaPOS = rawTabParam ? pestanaDesdeUrl : (pestanaLocal ?? 'caja');

  const setPestanaOperativa = (nuevaPestana: PestanaOperativaPOS) => {
    setPestanaLocal(nuevaPestana);
    router.push(`/dashboard?tab=${nuevaPestana}`);
  };

  const { productos: storeProductos } = useInventarioData();

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

  // Estado inicial determinista idéntico en SSR e hidratación; la caché local y Supabase se cargan tras montar
  const [ventasState, setVentasState] = useState<VentasHistorialStore>(VENTAS_SERVER_SNAPSHOT);
  const pendingRegistrationsRef = useRef<Map<string, Promise<string | null>>>(new Map());
  const idRemotoPorTempRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    let mounted = true;
    queueMicrotask(() => {
      if (!mounted) return;
      const localSnapshot = inicializarVentasCliente();
      if (localSnapshot.ventasRecientes.length > 0) {
        setVentasState(localSnapshot);
      }
    });
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
          guardarVentasCliente(updated);
          return updated;
        });
      })
      .catch((err) => {
        console.warn('[POS] Error al sincronizar ventas remotas:', err);
      });

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
  const [searchQuery, setSearchQueryState] = useState<string>('');
  const [saleSuccessMessage, setSaleSuccessMessage] = useState<string | null>(null);
  const [saleErrorMessage, setSaleErrorMessage] = useState<string | null>(null);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<MetodoPago>('efectivo');

  const mostrarErrorTemporal = useCallback((mensaje: string, duracionMs: number = 3000) => {
    setSaleErrorMessage(mensaje);
    setTimeout(() => setSaleErrorMessage(null), duracionMs);
  }, []);

  const mostrarExitoTemporal = useCallback((mensaje: string, duracionMs: number = 4000) => {
    setSaleSuccessMessage(mensaje);
    setTimeout(() => setSaleSuccessMessage(null), duracionMs);
  }, []);

  const config = useConfiguracionData();
  const monedaSimbolo = config.negocio.monedaSimbolo || '$';
  const permitirVentaSinStock = config.pos.permitirVentaSinStock;

  // Sub-hook cohesivo de sesión y turno de caja
  const turno = useCajaTurno({
    ventasRecientes: data.ventasRecientes,
    numeroCaja: config.pos.numeroCaja || 1,
    monedaSimbolo,
    onSuccess: mostrarExitoTemporal,
  });

  // Sub-hook cohesivo de ticket / carrito activo
  const carritoPos = useCarritoPos({
    cajaAbierta: turno.cajaAbierta,
    permitirVentaSinStock,
    productosPopulares: data.productosPopulares,
    onError: mostrarErrorTemporal,
  });

  // ====================================================================
  // FILTRADO Y PAGINACIÓN DE CATÁLOGO RÁPIDO EN CAJA
  // ====================================================================
  const [categoriaFiltro, setCategoriaFiltroState] = useState<string>('todas');
  const [pagina, setPagina] = useState<number>(1);
  const itemsPorPagina = 6;

  const setSearchQuery = (q: string) => {
    setSearchQueryState(q);
    setPagina(1);
  };

  const setCategoriaFiltro = (cat: string) => {
    setCategoriaFiltroState(cat);
    setPagina(1);
  };

  const categorias = useMemo(() => {
    const cats = Array.from(new Set(data.productosPopulares.map((p) => p.categoria))).filter(
      Boolean
    );
    return cats.sort();
  }, [data.productosPopulares]);

  const conteosPorCategoria = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of data.productosPopulares) {
      counts[p.categoria] = (counts[p.categoria] || 0) + 1;
    }
    return counts;
  }, [data.productosPopulares]);

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

  const totalPaginas = Math.max(1, Math.ceil(filteredProducts.length / itemsPorPagina));
  const inicioPaginacion = (pagina - 1) * itemsPorPagina;
  const productosPaginados = filteredProducts.slice(
    inicioPaginacion,
    inicioPaginacion + itemsPorPagina
  );

  // ====================================================================
  // FILTRADO Y PAGINACIÓN DE VENTAS RECIENTES EN CAJA
  // ====================================================================
  const [metodoPagoFiltroVentas, setMetodoPagoFiltroVentasState] = useState<string>('todos');
  const [busquedaHistorial, setBusquedaHistorialState] = useState<string>('');
  const [paginaVentas, setPaginaVentas] = useState<number>(1);

  const setMetodoPagoFiltroVentas = (metodo: string) => {
    setMetodoPagoFiltroVentasState(metodo);
    setPaginaVentas(1);
  };

  const setBusquedaHistorial = (q: string) => {
    setBusquedaHistorialState(q);
    setPaginaVentas(1);
  };

  const conteosPorMetodoPago = useMemo(() => {
    const counts: Record<string, number> = { todos: data.ventasRecientes.length };
    for (const v of data.ventasRecientes) {
      const m = v.metodoPago || 'efectivo';
      counts[m] = (counts[m] || 0) + 1;
    }
    return counts;
  }, [data.ventasRecientes]);

  const ventasFiltradas = useMemo(() => {
    const query = busquedaHistorial.trim().toLowerCase();

    return data.ventasRecientes.filter((v) => {
      const coincideMetodo =
        metodoPagoFiltroVentas === 'todos' ||
        (v.metodoPago || 'efectivo') === metodoPagoFiltroVentas;

      const coincideBusqueda =
        !query ||
        v.id.toLowerCase().includes(query) ||
        formatearCodigoComprobante(v.id).toLowerCase().includes(query) ||
        (v.vendedor && v.vendedor.toLowerCase().includes(query)) ||
        (v.items && v.items.some((it) => it.nombreProducto?.toLowerCase().includes(query)));

      return coincideMetodo && coincideBusqueda;
    });
  }, [data.ventasRecientes, metodoPagoFiltroVentas, busquedaHistorial]);

  const itemsPorPaginaVentas = 6;
  const totalPaginasVentas = Math.max(1, Math.ceil(ventasFiltradas.length / itemsPorPaginaVentas));
  const inicioPaginacionVentas = (paginaVentas - 1) * itemsPorPaginaVentas;
  const ventasRecientesPaginadas = ventasFiltradas.slice(
    inicioPaginacionVentas,
    inicioPaginacionVentas + itemsPorPaginaVentas
  );

  // ====================================================================
  // CONSULTOR DE PRECIOS & CATÁLOGO GENERAL
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

  const [busquedaCatalogo, setBusquedaCatalogoState] = useState<string>('');
  const [categoriaFiltroCatalogo, setCategoriaFiltroCatalogoState] = useState<string>('todas');
  const [disponibilidadFiltroCatalogo, setDisponibilidadFiltroCatalogoState] = useState<
    'todos' | 'con_stock' | 'agotados'
  >('todos');
  const [paginaCatalogo, setPaginaCatalogo] = useState<number>(1);
  const itemsPorPaginaCatalogo = 8;

  const setBusquedaCatalogo = (q: string) => {
    setBusquedaCatalogoState(q);
    setPaginaCatalogo(1);
  };
  const setCategoriaFiltroCatalogo = (cat: string) => {
    setCategoriaFiltroCatalogoState(cat);
    setPaginaCatalogo(1);
  };
  const setDisponibilidadFiltroCatalogo = (disp: 'todos' | 'con_stock' | 'agotados') => {
    setDisponibilidadFiltroCatalogoState(disp);
    setPaginaCatalogo(1);
  };

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
  }, [
    data.productosPopulares,
    busquedaCatalogo,
    categoriaFiltroCatalogo,
    disponibilidadFiltroCatalogo,
  ]);

  const totalPaginasCatalogo = Math.max(
    1,
    Math.ceil(productosCatalogoFiltrados.length / itemsPorPaginaCatalogo)
  );
  const inicioPaginacionCatalogo = (paginaCatalogo - 1) * itemsPorPaginaCatalogo;
  const productosCatalogoPaginados = productosCatalogoFiltrados.slice(
    inicioPaginacionCatalogo,
    inicioPaginacionCatalogo + itemsPorPaginaCatalogo
  );

  const totalUnidadesEnStock = useMemo(
    () => data.productosPopulares.reduce((acc, p) => acc + p.stock, 0),
    [data.productosPopulares]
  );

  const productosAgotadosCount = useMemo(
    () => data.productosPopulares.filter((p) => p.stock === 0).length,
    [data.productosPopulares]
  );

  const productosConStockCount = useMemo(
    () => data.productosPopulares.filter((p) => p.stock > 0).length,
    [data.productosPopulares]
  );

  // ====================================================================
  // PROCESAMIENTO DE COBRO Y ANULACIÓN DE COMPROBANTES
  // ====================================================================
  const procesarVentaTicket = (
    metodoPago: MetodoPago = 'efectivo',
    montoRecibido?: number
  ): VentaRecientePOS | null => {
    if (!turno.cajaAbierta) {
      mostrarErrorTemporal(
        'La caja está cerrada. Abra la caja desde el botón superior de apertura.'
      );
      return null;
    }

    if (carritoPos.carrito.length === 0) {
      mostrarErrorTemporal('El ticket está vacío. Agregue productos antes de cobrar.');
      return null;
    }

    if (carritoPos.totalCarrito > MAX_PRECIO_DB) {
      mostrarErrorTemporal(
        `El total del ticket supera el límite operativo de ${monedaSimbolo} ${MAX_PRECIO_DB.toLocaleString('es-AR')}.`,
        4000
      );
      return null;
    }

    if (!permitirVentaSinStock) {
      for (const item of carritoPos.carrito) {
        const prod = data.productosPopulares.find((p) => p.id === item.producto.id);
        if (!prod || prod.stock < item.cantidad) {
          mostrarErrorTemporal(
            `Stock insuficiente para "${item.producto.nombre}". Stock: ${prod?.stock ?? 0}, Requerido: ${item.cantidad}.`,
            4000
          );
          return null;
        }
      }
    }

    setLoading(true);
    setSaleErrorMessage(null);
    setSaleSuccessMessage(null);

    const totalVenta = carritoPos.totalCarrito;
    const vuelto =
      metodoPago === 'efectivo' && montoRecibido !== undefined && montoRecibido >= totalVenta
        ? montoRecibido - totalVenta
        : 0;

    const ventaId = `VNT-${Date.now().toString().slice(-4)}`;

    const itemsVenta: DetalleVenta[] = carritoPos.carrito.map((item, idx) => ({
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
      idTurno: turno.idTurnoActivo || undefined,
      sesionCajaId: turno.obtenerSesionRemotaActiva(),
      montoTotal: totalVenta,
      cantidadItems: carritoPos.cantidadArticulosCarrito,
      metodoPago,
      vendedor:
        turno.cajeroApertura && turno.cajeroApertura !== 'Administrador'
          ? turno.cajeroApertura
          : obtenerNombreUsuarioActivo(),
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
    for (const item of carritoPos.carrito) {
      inventarioService.descontarStock(
        item.producto.id,
        item.cantidad,
        permitirVentaSinStock,
        false
      );
    }

    if (config.pos.sonidoConfirmacionVenta) {
      reproducirSonidoConfirmacionVenta();
    }

    const registroPromise = supabaseService.registrarVenta(newSale);
    pendingRegistrationsRef.current.set(ventaId, registroPromise);

    registroPromise
      .then((remoteId) => {
        pendingRegistrationsRef.current.delete(ventaId);
        if (!remoteId) {
          setVentasState((prev) => {
            const filtradas = prev.ventasRecientes.filter((v) => v.id !== ventaId);
            const updated = recalcularVentasStore(filtradas);
            guardarVentasCliente(updated);
            return updated;
          });
          void inventarioService.sincronizarConSupabase();
          setSaleErrorMessage(
            'No se pudo registrar la venta en Supabase. Se revirtió la operación.'
          );
          return;
        }

        idRemotoPorTempRef.current.set(ventaId, remoteId);

        setVentasState((prev) => {
          const allSales = prev.ventasRecientes.map((v) =>
            v.id === ventaId ? { ...v, id: remoteId, idTemporal: ventaId } : v
          );
          const updated = recalcularVentasStore(allSales);
          guardarVentasCliente(updated);
          return updated;
        });

        turno.registrarVentaEnTurno(remoteId);
        void inventarioService.sincronizarConSupabase();
      })
      .catch((err) => {
        console.warn('[POS] Error al persistir venta en Supabase:', err);
        pendingRegistrationsRef.current.delete(ventaId);
        void inventarioService.sincronizarConSupabase();
      });

    setVentasState((prev) => {
      const updated = recalcularVentasStore([newSale, ...prev.ventasRecientes]);
      guardarVentasCliente(updated);
      return updated;
    });

    setPaginaVentas(1);
    carritoPos.limpiarCarritoPostVenta();

    const textoMetodo = obtenerEtiquetaMetodoPago(metodoPago, { larga: true });
    const textoVuelto =
      metodoPago === 'efectivo' && vuelto > 0
        ? ` • Vuelto: ${monedaSimbolo} ${vuelto.toLocaleString('es-AR')}`
        : '';

    mostrarExitoTemporal(
      `Cobro registrado con éxito (${ventaId}): ${itemsVenta.length} ítems • Total: ${monedaSimbolo} ${totalVenta.toLocaleString('es-AR')} (${textoMetodo})${textoVuelto}`,
      4500
    );
    setLoading(false);

    return newSale;
  };

  const cancelarVenta = (ventaId: string, motivo?: string): boolean => {
    const idMapeado = idRemotoPorTempRef.current.get(ventaId) || ventaId;
    const venta = data.ventasRecientes.find(
      (v) => v.id === idMapeado || v.id === ventaId || v.idTemporal === ventaId
    );
    if (!venta) {
      mostrarErrorTemporal(
        `No se encontró el comprobante ${formatearCodigoComprobante(ventaId)}.`,
        3500
      );
      return false;
    }

    if (venta.estado === 'cancelada') {
      mostrarErrorTemporal(
        `El comprobante ${formatearCodigoComprobante(venta.id)} ya fue cancelado previamente.`,
        3500
      );
      return false;
    }

    const idInicial = venta.id;
    const tempAlias = venta.idTemporal || (ventaId.startsWith('VNT-') ? ventaId : undefined);
    const coincideVenta = (v: VentaRecientePOS, extraId?: string) =>
      v.id === idInicial ||
      v.id === ventaId ||
      (extraId ? v.id === extraId : false) ||
      (tempAlias ? v.id === tempAlias || v.idTemporal === tempAlias : false);

    // 1. Reintegro optimista en UI (`sincronizarRemoto = false`):
    // PostgreSQL reintegra el stock mediante `tr_cancelar_venta_reintegrar_stock`.
    for (const item of venta.items || []) {
      inventarioService.reintegrarStock(item.productoId, item.cantidad, false);
    }

    // 2. Actualizar estado local y confirmar en Supabase
    setVentasState((prev) => {
      const allSales = prev.ventasRecientes.map((v) =>
        coincideVenta(v) ? { ...v, estado: 'cancelada' as const } : v
      );
      const updated = recalcularVentasStore(allSales);
      guardarVentasCliente(updated);
      return updated;
    });

    const motivoLimpio = (motivo || '').trim().slice(0, LIMITES_TEXTO.OBSERVACIONES_MAX);
    const motivoTexto = motivoLimpio ? ` (Motivo: ${motivoLimpio})` : '';

    const revertirAnulacionLocal = (extraId?: string) => {
      setVentasState((prev) => {
        const revertidas = prev.ventasRecientes.map((v) =>
          coincideVenta(v, extraId) ? { ...v, estado: 'completada' as const } : v
        );
        const updated = recalcularVentasStore(revertidas);
        guardarVentasCliente(updated);
        return updated;
      });
      void inventarioService.sincronizarConSupabase();
      setSaleSuccessMessage(null);
      setSaleErrorMessage(
        'No se pudo anular el ticket en Supabase. Aplique mistock/supabase/migrations/schema.sql en el SQL Editor.'
      );
    };

    const ejecutarCancelacionRemota = async () => {
      let idParaCancelar = idRemotoPorTempRef.current.get(idInicial) || idInicial;

      if (idParaCancelar.startsWith('VNT-')) {
        const pendiente =
          pendingRegistrationsRef.current.get(idParaCancelar) ||
          (tempAlias ? pendingRegistrationsRef.current.get(tempAlias) : undefined);
        if (pendiente) {
          const resolvedId = await pendiente;
          if (resolvedId) {
            idRemotoPorTempRef.current.set(idParaCancelar, resolvedId);
            idParaCancelar = resolvedId;
          }
        }
      }

      if (!idParaCancelar || idParaCancelar.startsWith('VNT-')) {
        revertirAnulacionLocal();
        return;
      }

      const ok = await supabaseService.cancelarVenta(idParaCancelar);
      if (!ok) {
        revertirAnulacionLocal(idParaCancelar);
        return;
      }

      void inventarioService.sincronizarConSupabase();
      setSaleErrorMessage(null);
      mostrarExitoTemporal(
        `Venta ${formatearCodigoComprobante(idParaCancelar)} anulada con éxito y mercadería reingresada al stock.${motivoTexto}`,
        4000
      );
    };

    void ejecutarCancelacionRemota().catch((err) => {
      console.warn('[POS] Error al anular comprobante en Supabase:', err);
      revertirAnulacionLocal();
    });

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
    carrito: carritoPos.carrito,
    totalCarrito: carritoPos.totalCarrito,
    cantidadArticulosCarrito: carritoPos.cantidadArticulosCarrito,
    agregarAlCarrito: carritoPos.agregarAlCarrito,
    actualizarCantidadItem: carritoPos.actualizarCantidadItem,
    removerItemCarrito: carritoPos.removerItemCarrito,
    vaciarCarrito: carritoPos.vaciarCarrito,
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
    cajaAbierta: turno.cajaAbierta,
    setCajaAbierta: turno.setCajaAbierta,
    fechaApertura: turno.fechaApertura,
    cajeroApertura: turno.cajeroApertura,
    observacionesApertura: turno.observacionesApertura,
    isModalAperturaOpen: turno.isModalAperturaOpen,
    setIsModalAperturaOpen: turno.setIsModalAperturaOpen,
    abrirCaja: turno.abrirCaja,
    fondoInicial: turno.fondoInicial,
    setFondoInicial: turno.setFondoInicial,
    isModalArqueoOpen: turno.isModalArqueoOpen,
    setIsModalArqueoOpen: turno.setIsModalArqueoOpen,
    isModalTicketCierreOpen: turno.isModalTicketCierreOpen,
    setIsModalTicketCierreOpen: turno.setIsModalTicketCierreOpen,
    ultimoCierre: turno.ultimoCierre,
    setUltimoCierre: turno.setUltimoCierre,
    resumenMediosTurno: turno.resumenMediosTurno,
    totalVentasEfectivo: turno.totalVentasEfectivo,
    totalDigitales: turno.totalDigitales,
    granTotalRecaudado: turno.granTotalRecaudado,
    cantidadTicketsValidos: turno.cantidadTicketsValidos,
    idTurnoActivo: turno.idTurnoActivo,
    efectivoEsperado: turno.efectivoEsperado,
    cancelarVenta,
    confirmarCierreCaja: turno.confirmarCierreCaja,
  };
}
