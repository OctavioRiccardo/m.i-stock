'use client';

import { useState } from 'react';
import { Categoria, Producto } from '@/models/modelos_dominio/productoModel';
import { FormularioCargaProducto } from '@/models/modelos_vista/cargaProductoModel';

// Mock inicial de Categorías
const initialCategorias: Categoria[] = [
  { id: 'cat-1', nombre: 'Almacén', descripcion: 'Comestibles secos, aceites, harinas, condimentos', activo: true },
  { id: 'cat-2', nombre: 'Bebidas', descripcion: 'Aguas, gaseosas, jugos y aperitivos', activo: true },
  { id: 'cat-3', nombre: 'Limpieza', descripcion: 'Artículos de higiene, detergentes y lavandina', activo: true },
  { id: 'cat-4', nombre: 'Lácteos', descripcion: 'Leches, quesos, yogures y mantecas', activo: true },
  { id: 'cat-5', nombre: 'Golosinas', descripcion: 'Galletitas, chocolates, alfajores y caramelos', activo: true },
];

// Mock inicial de Productos en Inventario
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
 * Controlador exclusivo para la Gestión de Inventario y Catálogo.
 * Administra el alta de productos, definición de categorías y control de stock.
 */
export function useAdminInventarioController() {
  const [categorias, setCategorias] = useState<Categoria[]>(initialCategorias);
  const [productos, setProductos] = useState<Producto[]>(initialProductos);
  const [loading, setLoading] = useState<boolean>(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  /**
   * Crea y registra una nueva categoría obligatoria para alojar productos
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
   * Guarda un nuevo producto asociado estrictamente a una categoría
   */
  const guardarProducto = (
    datos: FormularioCargaProducto
  ): { exito: boolean; mensaje: string; producto?: Producto } => {
    setMensajeError(null);

    // REGLA DE NEGOCIO: El producto no puede existir sin una categoría definida
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
