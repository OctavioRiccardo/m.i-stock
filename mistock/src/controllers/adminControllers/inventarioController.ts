'use client';

/**
 * ====================================================================
 * CONTROLADOR DE GESTIÓN DE INVENTARIO (Patrón MVC)
 * ====================================================================
 * 
 * Propósito:
 * Administrar el catálogo de productos y la taxonomía de categorías del negocio.
 * Garantiza la integridad referencial y las reglas de negocio en la carga de stock.
 * 
 * Regla de Negocio Fundamental:
 * "Un producto NO puede existir sin una categoría definida previamente.
 * Todo producto debe pertenecer estrictamente a una categoría válida."
 * 
 * Rol en la Arquitectura:
 * - Capa Controller ("C") consumida por `AdminGestionInventario` (View).
 * - Utiliza las entidades del Modelo de Dominio (`Producto`, `Categoria`) y
 *   los DTOs del Modelo de Vista (`FormularioCargaProducto`).
 * - Sincronizado reactivamente con el servicio central de inventario (`inventarioService`).
 */

import { useState } from 'react';
import { Categoria, Producto } from '@/models/modelos_dominio/productoModel';
import { FormularioCargaProducto } from '@/models/modelos_vista/cargaProductoModel';
import { useInventarioData, inventarioService } from '@/services/inventarioService';

export type SeccionInventario = 'menu' | 'alta' | 'baja' | 'modificar';
export type FiltroNivelStock = 'todos' | 'critico' | 'bajo' | 'agotado' | 'optimo';

/**
 * Hook Controlador para la Gestión y Alta de Inventario.
 * 
 * Responsabilidades:
 * 1. Exponer la lista reactiva de categorías y productos sincronizados.
 * 2. Gestionar la subsección activa ('menu' | 'alta' | 'baja' | 'modificar').
 * 3. Permitir la creación de nuevas categorías "al vuelo" o previas al alta.
 * 4. Validar y procesar el guardado de nuevos productos respetando la regla
 *    de categoría obligatoria y código SKU único.
 * 5. Dar de baja lógica o reactivar productos existentes.
 * 6. Modificar datos de productos existentes (precios, existencias, descripción, categoría).
 * 7. Gestionar mensajes de retroalimentación temporal (éxito/error).
 * 8. Proveer diagnósticos de stock crítico/bajo y filtros de existencias para compras y reposición.
 * 
 * @returns {Object} Estado del inventario, navegación y métodos de mutación.
 */
export function useAdminInventarioController() {
  const [seccionActiva, setSeccionActiva] = useState<SeccionInventario>('menu');
  const { categorias, productos } = useInventarioData();
  const [loading, setLoading] = useState<boolean>(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  // Filtros reactivos para el catálogo por categoría y nivel de stock en el Hub de gestión
  const [categoriaFiltroHub, setCategoriaFiltroHub] = useState<string>('todas');
  const [filtroStockHub, setFiltroStockHub] = useState<FiltroNivelStock>('todos');
  const [busquedaHub, setBusquedaHub] = useState<string>('');

  // Paginación reactiva para el catálogo de inventario (8 ítems por página)
  const [paginaInventario, setPaginaInventario] = useState<number>(1);
  const itemsPorPaginaInventario = 8;

  const handleSetCategoriaFiltroHub = (catId: string) => {
    setCategoriaFiltroHub(catId);
    setPaginaInventario(1);
  };

  const handleSetFiltroStockHub = (nivel: FiltroNivelStock) => {
    setFiltroStockHub(nivel);
    setPaginaInventario(1);
  };

  const handleSetBusquedaHub = (term: string) => {
    setBusquedaHub(term);
    setPaginaInventario(1);
  };

  const limpiarFiltrosHub = () => {
    setCategoriaFiltroHub('todas');
    setFiltroStockHub('todos');
    setBusquedaHub('');
    setPaginaInventario(1);
  };

  // Métricas diagnósticas de existencias y salud del stock
  const metricasStockHub = {
    total: productos.length,
    activos: productos.filter((p) => p.activo).length,
    criticos: productos.filter((p) => p.activo && p.stockActual <= p.stockMinimo).length,
    bajasUnidades: productos.filter(
      (p) => p.activo && p.stockActual > 0 && p.stockActual <= p.stockMinimo * 1.5
    ).length,
    agotados: productos.filter((p) => p.activo && p.stockActual === 0).length,
    optimos: productos.filter((p) => p.activo && p.stockActual > p.stockMinimo).length,
  };

  // Conteo de artículos por cada categoría
  const conteosPorCategoria = categorias.reduce<Record<string, number>>((acc, cat) => {
    acc[cat.id] = productos.filter((p) => p.categoriaId === cat.id).length;
    return acc;
  }, {});

  // Artículos filtrados según categoría activa, nivel de existencias y búsqueda textual
  const productosFiltradosHub = productos.filter((p) => {
    // 1. Filtro por categoría
    const coincideCategoria =
      categoriaFiltroHub === 'todas' || p.categoriaId === categoriaFiltroHub;

    // 2. Filtro por nivel de stock
    let coincideStock = true;
    if (filtroStockHub === 'critico') {
      coincideStock = p.stockActual <= p.stockMinimo;
    } else if (filtroStockHub === 'bajo') {
      coincideStock = p.stockActual > 0 && p.stockActual <= p.stockMinimo * 1.5;
    } else if (filtroStockHub === 'agotado') {
      coincideStock = p.stockActual === 0;
    } else if (filtroStockHub === 'optimo') {
      coincideStock = p.stockActual > p.stockMinimo;
    }

    // 3. Búsqueda textual por código, nombre o descripción
    const busq = busquedaHub.trim().toLowerCase();
    const coincideTexto =
      !busq ||
      p.nombre.toLowerCase().includes(busq) ||
      p.codigo.toLowerCase().includes(busq) ||
      (p.descripcion && p.descripcion.toLowerCase().includes(busq));

    return coincideCategoria && coincideStock && coincideTexto;
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
  };
}
