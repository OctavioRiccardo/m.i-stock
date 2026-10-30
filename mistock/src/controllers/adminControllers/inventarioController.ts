'use client';

/**
 * ====================================================================
 * CONTROLADOR DE GESTIÓN DE INVENTARIO (Patrón MVC)
 * ====================================================================
 * 
 * Propósito:
 * Administrar operativamente el catálogo de productos (ABMC) y la taxonomía
 * de categorías del negocio, garantizando la integridad referencial y las
 * reglas comerciales en el alta, edición, reposición y baja lógica de stock.
 * 
 * Regla de Negocio Fundamental:
 * "Un producto NO puede existir sin una categoría definida previamente.
 * Todo producto debe pertenecer estrictamente a una categoría válida."
 * 
 * Rol en la Arquitectura:
 * - Capa Controller ("C") consumida por `AdminGestionInventarioView` (View).
 * - Utiliza las entidades del Modelo de Dominio (`Producto`, `Categoria`) y
 *   los DTOs del Modelo de Vista (`FormularioCargaProducto`).
 * - Sincronizado reactivamente con el servicio central de inventario (`inventarioService`).
 */

import { useState, useEffect } from 'react';
import { Categoria, Producto } from '@/models/modelos_dominio/productoModel';
import { FormularioCargaProducto } from '@/models/modelos_vista/cargaProductoModel';
import { useInventarioData, inventarioService } from '@/services/inventarioService';
import { useConfiguracionData } from '@/services/configuracionService';

export type SeccionInventario = 'menu' | 'alta';
export type FiltroNivelStock = 'todos' | 'critico' | 'bajo' | 'agotado' | 'optimo';
export type FiltroEstadoComercial = 'activos' | 'inactivos' | 'todos';

/**
 * Hook Controlador para la Gestión Operativa de Inventario.
 */
export function useAdminInventarioController() {
  const [seccionActiva, setSeccionActiva] = useState<SeccionInventario>('menu');
  const { categorias, productos } = useInventarioData();
  const config = useConfiguracionData();
  const [loading, setLoading] = useState<boolean>(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  // Filtros reactivos unificados para el catálogo operativo
  const [categoriaFiltroHub, setCategoriaFiltroHub] = useState<string>('todas');
  const [filtroStockHub, setFiltroStockHub] = useState<FiltroNivelStock>('todos');
  const [filtroEstadoHub, setFiltroEstadoHub] = useState<FiltroEstadoComercial>('activos');
  const [busquedaHub, setBusquedaHub] = useState<string>('');

  // Paginación reactiva para el catálogo de inventario (8 ítems por página)
  const [paginaInventario, setPaginaInventario] = useState<number>(1);
  const itemsPorPaginaInventario = 8;

  // Soporte de navegación directa desde Inventario Global (/admingestioninven?q=SKU)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q');
    if (query && query.trim()) {
      setBusquedaHub(query.trim());
      setFiltroEstadoHub('todos');
      setPaginaInventario(1);
    }
  }, []);

  const handleSetCategoriaFiltroHub = (catId: string) => {
    setCategoriaFiltroHub(catId);
    setPaginaInventario(1);
  };

  const handleSetFiltroStockHub = (nivel: FiltroNivelStock) => {
    setFiltroStockHub(nivel);
    setPaginaInventario(1);
  };

  const handleSetFiltroEstadoHub = (estado: FiltroEstadoComercial) => {
    setFiltroEstadoHub(estado);
    setPaginaInventario(1);
  };

  const handleSetBusquedaHub = (term: string) => {
    setBusquedaHub(term);
    setPaginaInventario(1);
  };

  const limpiarFiltrosHub = () => {
    setCategoriaFiltroHub('todas');
    setFiltroStockHub('todos');
    setFiltroEstadoHub('activos');
    setBusquedaHub('');
    setPaginaInventario(1);
  };

  // Métricas diagnósticas de existencias con 4 niveles mutuamente excluyentes
  // (agotados + criticos + bajasUnidades + optimos === activos)
  const metricasStockHub = {
    total: productos.length,
    activos: productos.filter((p) => p.activo).length,
    inactivos: productos.filter((p) => !p.activo).length,
    criticos: productos.filter((p) => p.activo && p.stockActual > 0 && p.stockActual <= p.stockMinimo).length,
    bajasUnidades: productos.filter(
      (p) => p.activo && p.stockActual > p.stockMinimo && p.stockActual <= p.stockMinimo * 1.5
    ).length,
    agotados: productos.filter((p) => p.activo && p.stockActual === 0).length,
    optimos: productos.filter((p) => p.activo && p.stockActual > p.stockMinimo * 1.5).length,
  };

  // Conteo de artículos por categoría respetando el estado comercial seleccionado
  const conteosPorCategoria = categorias.reduce<Record<string, number>>((acc, cat) => {
    acc[cat.id] = productos.filter((p) => {
      if (p.categoriaId !== cat.id) return false;
      if (filtroEstadoHub === 'activos') return p.activo;
      if (filtroEstadoHub === 'inactivos') return !p.activo;
      return true;
    }).length;
    return acc;
  }, {});

  // Artículos filtrados según estado comercial, categoría, nivel de stock y búsqueda textual
  const productosFiltradosHub = productos.filter((p) => {
    // 1. Filtro por estado comercial
    if (filtroEstadoHub === 'activos' && !p.activo) return false;
    if (filtroEstadoHub === 'inactivos' && p.activo) return false;

    // 2. Filtro por categoría
    const coincideCategoria =
      categoriaFiltroHub === 'todas' || p.categoriaId === categoriaFiltroHub;
    if (!coincideCategoria) return false;

    // 3. Filtro por nivel de stock (4 estados mutuamente excluyentes)
    let coincideStock = true;
    if (filtroStockHub === 'critico') {
      coincideStock = p.stockActual > 0 && p.stockActual <= p.stockMinimo;
    } else if (filtroStockHub === 'bajo') {
      coincideStock = p.stockActual > p.stockMinimo && p.stockActual <= p.stockMinimo * 1.5;
    } else if (filtroStockHub === 'agotado') {
      coincideStock = p.stockActual === 0;
    } else if (filtroStockHub === 'optimo') {
      coincideStock = p.stockActual > p.stockMinimo * 1.5;
    }
    if (!coincideStock) return false;

    // 4. Búsqueda textual por código, nombre, descripción o nombre de categoría
    const busq = busquedaHub.trim().toLowerCase();
    const coincideTexto =
      !busq ||
      p.nombre.toLowerCase().includes(busq) ||
      p.codigo.toLowerCase().includes(busq) ||
      Boolean(p.descripcion && p.descripcion.toLowerCase().includes(busq)) ||
      Boolean(p.categoria?.nombre && p.categoria.nombre.toLowerCase().includes(busq));

    return coincideTexto;
  });

  /**
   * Registra una nueva categoría en el sistema a través del servicio central.
   */
  const agregarCategoria = (nombre: string, descripcion?: string): Categoria => {
    const nuevaCat = inventarioService.agregarCategoria(nombre, descripcion);
    setMensajeExito(`Categoría "${nuevaCat.nombre}" creada con éxito.`);
    setTimeout(() => setMensajeExito(null), 3500);
    return nuevaCat;
  };

  /**
   * Guarda un nuevo producto en el catálogo verificando todas las reglas de negocio.
   */
  const guardarProducto = (
    datos: FormularioCargaProducto
  ): { exito: boolean; mensaje: string; producto?: Producto } => {
    setMensajeError(null);
    setLoading(true);

    const resultado = inventarioService.guardarProducto(datos);
    setLoading(false);

    if (!resultado.exito) {
      setMensajeError(resultado.mensaje);
      return resultado;
    }

    setMensajeExito(resultado.mensaje);
    setTimeout(() => setMensajeExito(null), 4000);
    return resultado;
  };

  /**
   * Da de baja lógica un producto del catálogo comercial activo.
   */
  const darDeBajaProducto = (productoId: string, motivo?: string) => {
    setMensajeError(null);
    const resultado = inventarioService.darDeBajaProducto(productoId, motivo);

    if (!resultado.exito) {
      setMensajeError(resultado.mensaje);
      return;
    }

    setMensajeExito(resultado.mensaje);
    setTimeout(() => setMensajeExito(null), 4000);
  };

  /**
   * Reactiva un producto previamente dado de baja en el catálogo.
   */
  const reactivarProducto = (productoId: string) => {
    setMensajeError(null);
    const resultado = inventarioService.reactivarProducto(productoId);

    if (!resultado.exito) {
      setMensajeError(resultado.mensaje);
      return;
    }

    setMensajeExito(resultado.mensaje);
    setTimeout(() => setMensajeExito(null), 4000);
  };

  /**
   * Actualiza los datos de un producto existente asegurando coherencia en precios y categoría.
   */
  const modificarProducto = (productoId: string, datosActualizados: Partial<Producto>): boolean => {
    setMensajeError(null);
    const resultado = inventarioService.modificarProducto(productoId, datosActualizados);

    if (!resultado.exito) {
      setMensajeError(resultado.mensaje);
      return false;
    }

    setMensajeExito(resultado.mensaje);
    setTimeout(() => setMensajeExito(null), 4000);
    return true;
  };

  const limpiarMensajes = () => {
    setMensajeExito(null);
    setMensajeError(null);
  };

  return {
    seccionActiva,
    setSeccionActiva,
    categorias,
    productos,
    categoriaFiltroHub,
    setCategoriaFiltroHub: handleSetCategoriaFiltroHub,
    filtroEstadoHub,
    setFiltroEstadoHub: handleSetFiltroEstadoHub,
    busquedaHub,
    setBusquedaHub: handleSetBusquedaHub,
    conteosPorCategoria,
    productosFiltradosHub,
    paginaInventario,
    setPaginaInventario,
    itemsPorPaginaInventario,
    filtroStockHub,
    setFiltroStockHub: handleSetFiltroStockHub,
    metricasStockHub,
    limpiarFiltrosHub,
    loading,
    mensajeExito,
    mensajeError,
    agregarCategoria,
    guardarProducto,
    darDeBajaProducto,
    reactivarProducto,
    modificarProducto,
    limpiarMensajes,
    config,
  };
}
