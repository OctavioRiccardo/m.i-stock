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
 * - Mantiene el estado reactivo del inventario, gestiona la validación de unicidad
 *   de código SKU/barra y comunica el resultado a la vista mediante estados de éxito/error.
 */

import { useState } from 'react';
import { Categoria, Producto } from '@/models/modelos_dominio/productoModel';
import { FormularioCargaProducto } from '@/models/modelos_vista/cargaProductoModel';

/**
 * Catálogo inicial simulado de Categorías de productos.
 * Representa las familias comerciales en las cuales se agruparán los artículos.
 */
const initialCategorias: Categoria[] = [
  { id: 'cat-1', nombre: 'Almacén', descripcion: 'Comestibles secos, aceites, harinas, condimentos', activo: true },
  { id: 'cat-2', nombre: 'Bebidas', descripcion: 'Aguas, gaseosas, jugos y aperitivos', activo: true },
  { id: 'cat-3', nombre: 'Limpieza', descripcion: 'Artículos de higiene, detergentes y lavandina', activo: true },
  { id: 'cat-4', nombre: 'Lácteos', descripcion: 'Leches, quesos, yogures y mantecas', activo: true },
  { id: 'cat-5', nombre: 'Golosinas', descripcion: 'Galletitas, chocolates, alfajores y caramelos', activo: true },
];

/**
 * Inventario inicial simulado de Productos.
 * Cada producto cuenta con asociación estricta a su `categoriaId`.
 */
const initialProductos: Producto[] = [
  {
    id: 'PROD-101',
    codigo: '779001',
    nombre: 'Aceite de Girasol 1.5L',
    descripcion: 'Aceite puro comestible primera prensada',
    precioCosto: 1800,
    precioVenta: 2600,
    stockActual: 35,
    stockMinimo: 10,
    categoriaId: 'cat-1',
    categoria: initialCategorias[0],
    unidadMedida: 'unidad',
    activo: true,
    fechaCreacion: new Date('2026-09-01'),
  },
  {
    id: 'PROD-102',
    codigo: '779002',
    nombre: 'Jabón Líquido Manos 500ml',
    descripcion: 'Antibacteriano con aloe vera',
    precioCosto: 950,
    precioVenta: 1600,
    stockActual: 3,
    stockMinimo: 10,
    categoriaId: 'cat-3',
    categoria: initialCategorias[2],
    unidadMedida: 'unidad',
    activo: true,
    fechaCreacion: new Date('2026-09-05'),
  },
  {
    id: 'PROD-103',
    codigo: '779003',
    nombre: 'Leche Entera Larga Vida 1L',
    descripcion: 'Ultra pasteurizada fortificada',
    precioCosto: 1100,
    precioVenta: 1750,
    stockActual: 2,
    stockMinimo: 20,
    categoriaId: 'cat-4',
    categoria: initialCategorias[3],
    unidadMedida: 'litro',
    activo: true,
    fechaCreacion: new Date('2026-09-10'),
  },
];

/**
 * Hook Controlador para la Gestión y Alta de Inventario.
 * 
 * Responsabilidades:
 * 1. Exponer la lista reactiva de categorías y productos.
 * 2. Permitir la creación de nuevas categorías "al vuelo" o previas al alta.
 * 3. Validar y procesar el guardado de nuevos productos respetando la regla
 *    de categoría obligatoria y código SKU único.
 * 4. Gestionar mensajes de retroalimentación temporal (éxito/error).
 * 
 * @returns {Object} Estado del inventario y métodos de mutación (agregarCategoria, guardarProducto).
 */
export function useAdminInventarioController() {
  const [categorias, setCategorias] = useState<Categoria[]>(initialCategorias);
  const [productos, setProductos] = useState<Producto[]>(initialProductos);
  const [loading, setLoading] = useState<boolean>(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  /**
   * Registra una nueva categoría en el sistema.
   * Permite al administrador crear categorías antes o durante la carga de productos.
   * 
   * @param {string} nombre - Nombre comercial o descriptivo de la categoría (obligatorio).
   * @param {string} [descripcion] - Detalle opcional sobre los artículos que engloba.
   * @returns {Categoria} La entidad de categoría recién creada con su identificador generado.
   */
  const agregarCategoria = (nombre: string, descripcion?: string): Categoria => {
    const nuevaCat: Categoria = {
      id: `cat-${Date.now().toString().slice(-4)}`,
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || '',
      activo: true,
      fechaCreacion: new Date(),
    };

    setCategorias((prev) => [...prev, nuevaCat]);
    setMensajeExito(`Categoría "${nuevaCat.nombre}" creada con éxito.`);
    setTimeout(() => setMensajeExito(null), 3500);

    return nuevaCat;
  };

  /**
   * Guarda un nuevo producto en el catálogo verificando todas las reglas de negocio.
   * 
   * Reglas validadas:
   * 1. Presencia y existencia de una categoría válida (`categoriaId`).
   * 2. Campos obligatorios completos (`nombre`, `codigo`).
   * 3. Unicidad estricta del código de barras / SKU en el catálogo.
   * 4. Precios coherentes (`precioVenta > 0`).
   * 
   * @param {FormularioCargaProducto} datos - Objeto de transferencia (DTO) proveniente de la vista.
   * @returns {Object} Resultado con indicador de éxito, mensaje explicativo y producto creado.
   */
  const guardarProducto = (
    datos: FormularioCargaProducto
  ): { exito: boolean; mensaje: string; producto?: Producto } => {
    setMensajeError(null);

    // REGLA DE NEGOCIO: Un producto no puede existir sin una categoría definida
    if (!datos.categoriaId || datos.categoriaId.trim() === '') {
      const errorMsg = 'El producto no puede existir sin una categoría definida. Debe seleccionar o crear una categoría primero.';
      setMensajeError(errorMsg);
      return { exito: false, mensaje: errorMsg };
    }

    const categoriaSeleccionada = categorias.find((c) => c.id === datos.categoriaId);
    if (!categoriaSeleccionada) {
      const errorMsg = 'La categoría seleccionada no es válida o no existe.';
      setMensajeError(errorMsg);
      return { exito: false, mensaje: errorMsg };
    }

    if (!datos.nombre.trim()) {
      const errorMsg = 'El nombre del producto es obligatorio.';
      setMensajeError(errorMsg);
      return { exito: false, mensaje: errorMsg };
    }

    if (!datos.codigo.trim()) {
      const errorMsg = 'El código de barras o SKU es obligatorio.';
      setMensajeError(errorMsg);
      return { exito: false, mensaje: errorMsg };
    }

    // Comprobar código repetido
    const codigoExiste = productos.some((p) => p.codigo.toLowerCase() === datos.codigo.trim().toLowerCase());
    if (codigoExiste) {
      const errorMsg = `Ya existe un producto con el código "${datos.codigo}". Ingrese un código único.`;
      setMensajeError(errorMsg);
      return { exito: false, mensaje: errorMsg };
    }

    if (datos.precioVenta <= 0) {
      const errorMsg = 'El precio de venta debe ser mayor a 0.';
      setMensajeError(errorMsg);
      return { exito: false, mensaje: errorMsg };
    }

    setLoading(true);

    const nuevoProducto: Producto = {
      id: `PROD-${Date.now().toString().slice(-4)}`,
      codigo: datos.codigo.trim(),
      nombre: datos.nombre.trim(),
      descripcion: datos.descripcion?.trim() || '',
      precioCosto: Number(datos.precioCosto) || 0,
      precioVenta: Number(datos.precioVenta),
      stockActual: Number(datos.stockInicial) || 0,
      stockMinimo: Number(datos.stockMinimo) || 0,
      categoriaId: datos.categoriaId,
      categoria: categoriaSeleccionada,
      unidadMedida: datos.unidadMedida || 'unidad',
      activo: true,
      fechaCreacion: new Date(),
    };

    // Actualizar estado de inventario
    setProductos((prev) => [nuevoProducto, ...prev]);

    setLoading(false);
    const exitoMsg = `Producto "${nuevoProducto.nombre}" cargado con éxito en la categoría "${categoriaSeleccionada.nombre}".`;
    setMensajeExito(exitoMsg);
    setTimeout(() => setMensajeExito(null), 4000);

    return { exito: true, mensaje: exitoMsg, producto: nuevoProducto };
  };

  const limpiarMensajes = () => {
    setMensajeExito(null);
    setMensajeError(null);
  };

  return {
    categorias,
    productos,
    loading,
    mensajeExito,
    mensajeError,
    agregarCategoria,
    guardarProducto,
    limpiarMensajes,
  };
}
