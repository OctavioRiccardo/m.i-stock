'use client';

/**
 * ====================================================================
 * CONTROLADOR: INVENTARIO GLOBAL POR CATEGORÍAS (Patrón MVC - Controller)
 * ====================================================================
 * 
 * Propósito:
 * Gestionar la exploración, auditoría, filtrado, ordenamiento y valuación
 * del inventario consolidado de la empresa distribuido por familias de categorías.
 * 
 * Rol en la Arquitectura:
 * - Capa Controller ("C") consumida por `AdminInventarioGlobalView` (View).
 * - Desacoplado de la persistencia directa; orquesta las entidades de `Producto` y `Categoria`.
 */

import { useState, useMemo } from 'react';
import { useInventarioData } from '@/services/inventarioService';

export type FiltroEstadoStock = 'todos' | 'normal' | 'critico' | 'sin_stock';
export type CriterioOrdenInventario =
  | 'nombre_asc'
  | 'nombre_desc'
  | 'precio_asc'
  | 'precio_desc'
  | 'stock_asc'
  | 'stock_desc';

export function useAdminInventarioGlobalController() {
  const { categorias, productos } = useInventarioData();

  // Estados reactivos de filtrado y navegación
  const [categoriaSeleccionada, setCategoriaSeleccionadaState] = useState<string>('todas');
  const [busqueda, setBusquedaState] = useState<string>('');
  const [filtroStock, setFiltroStockState] = useState<FiltroEstadoStock>('todos');
  const [ordenarPor, setOrdenarPor] = useState<CriterioOrdenInventario>('nombre_asc');
  const [pagina, setPagina] = useState<number>(1);
  const itemsPorPagina = 8;

  // Setters con reinicio de página automático
  const setCategoriaSeleccionada = (catId: string) => {
    setCategoriaSeleccionadaState(catId);
    setPagina(1);
  };

  const setBusqueda = (termino: string) => {
    setBusquedaState(termino);
    setPagina(1);
  };

  const setFiltroStock = (filtro: FiltroEstadoStock) => {
    setFiltroStockState(filtro);
    setPagina(1);
  };

  const limpiarFiltros = () => {
    setCategoriaSeleccionadaState('todas');
    setBusquedaState('');
    setFiltroStockState('todos');
    setOrdenarPor('nombre_asc');
    setPagina(1);
  };

  // 1. Conteo de productos por categoría
  const conteosPorCategoria = useMemo(() => {
    return categorias.reduce<Record<string, number>>((acc, cat) => {
      acc[cat.id] = productos.filter((p) => p.categoriaId === cat.id && p.activo).length;
      return acc;
    }, {});
  }, [categorias, productos]);

  // 2. Métricas y KPIs globales del inventario
  const metricasGlobales = useMemo(() => {
    let unidadesTotales = 0;
    let valuacionCosto = 0;
    let valuacionVenta = 0;
    let articulosCriticos = 0;
    let articulosSinStock = 0;

    for (const p of productos) {
      if (!p.activo) continue;
      unidadesTotales += p.stockActual;
      valuacionCosto += p.precioCosto * p.stockActual;
      valuacionVenta += p.precioVenta * p.stockActual;

      if (p.stockActual === 0) {
        articulosSinStock++;
      } else if (p.stockActual <= p.stockMinimo) {
        articulosCriticos++;
      }
    }

    const margenEstimadoPorcentaje =
      valuacionCosto > 0 ? (((valuacionVenta - valuacionCosto) / valuacionCosto) * 100).toFixed(1) : '0';

    return {
      totalProductos: productos.filter((p) => p.activo).length,
      totalCategorias: categorias.filter((c) => c.activo).length,
      unidadesTotales,
      valuacionCosto,
      valuacionVenta,
      margenEstimadoPorcentaje,
      articulosCriticos,
      articulosSinStock,
    };
  }, [productos, categorias]);

  // 3. Objeto de categoría actualmente seleccionada (o null si es 'todas')
  const categoriaActualObj = useMemo(() => {
    if (categoriaSeleccionada === 'todas') return null;
    return categorias.find((c) => c.id === categoriaSeleccionada) || null;
  }, [categorias, categoriaSeleccionada]);

  // 4. Métricas específicas de la categoría seleccionada
  const metricasCategoriaActual = useMemo(() => {
    if (!categoriaActualObj) return null;
    const prodsCat = productos.filter((p) => p.categoriaId === categoriaActualObj.id && p.activo);
    const unidades = prodsCat.reduce((acc, p) => acc + p.stockActual, 0);
    const valorVenta = prodsCat.reduce((acc, p) => acc + p.precioVenta * p.stockActual, 0);
    const criticos = prodsCat.filter((p) => p.stockActual <= p.stockMinimo).length;

    return {
      totalArticulos: prodsCat.length,
      unidadesTotales: unidades,
      valorVentaTotal: valorVenta,
      articulosCriticos: criticos,
    };
  }, [categoriaActualObj, productos]);

  // 5. Filtrado y ordenamiento de productos
  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      // Filtro de categoría
      if (categoriaSeleccionada !== 'todas' && p.categoriaId !== categoriaSeleccionada) {
        return false;
      }

      // Filtro de búsqueda textual
      if (busqueda.trim()) {
        const query = busqueda.trim().toLowerCase();
        const coincideNombre = p.nombre.toLowerCase().includes(query);
        const coincideCodigo = p.codigo.toLowerCase().includes(query);
        const coincideSku = (p.sku || '').toLowerCase().includes(query);
        const coincideDesc = (p.descripcion || '').toLowerCase().includes(query);
        if (!coincideNombre && !coincideCodigo && !coincideSku && !coincideDesc) {
          return false;
        }
      }

      // Filtro de estado de stock
      if (filtroStock === 'critico') {
        return p.stockActual > 0 && p.stockActual <= p.stockMinimo;
      }
      if (filtroStock === 'sin_stock') {
        return p.stockActual === 0;
      }
      if (filtroStock === 'normal') {
        return p.stockActual > p.stockMinimo;
      }

      return true;
    }).sort((a, b) => {
      switch (ordenarPor) {
        case 'nombre_asc':
          return a.nombre.localeCompare(b.nombre);
        case 'nombre_desc':
          return b.nombre.localeCompare(a.nombre);
        case 'precio_asc':
          return a.precioVenta - b.precioVenta;
        case 'precio_desc':
          return b.precioVenta - a.precioVenta;
        case 'stock_asc':
          return a.stockActual - b.stockActual;
        case 'stock_desc':
          return b.stockActual - a.stockActual;
        default:
          return 0;
      }
    });
  }, [productos, categoriaSeleccionada, busqueda, filtroStock, ordenarPor]);

  // 6. Paginación reactiva
  const totalPaginas = Math.max(1, Math.ceil(productosFiltrados.length / itemsPorPagina));
  const inicioPaginacion = (pagina - 1) * itemsPorPagina;
  const productosPaginados = productosFiltrados.slice(
    inicioPaginacion,
    inicioPaginacion + itemsPorPagina
  );

  return {
    categorias,
    productos,
    categoriaSeleccionada,
    setCategoriaSeleccionada,
    categoriaActualObj,
    metricasCategoriaActual,
    busqueda,
    setBusqueda,
    filtroStock,
    setFiltroStock,
    ordenarPor,
    setOrdenarPor,
    pagina,
    setPagina,
    totalPaginas,
    inicioPaginacion,
    itemsPorPagina,
    conteosPorCategoria,
    metricasGlobales,
    productosFiltrados,
    productosPaginados,
    limpiarFiltros,
  };
}
