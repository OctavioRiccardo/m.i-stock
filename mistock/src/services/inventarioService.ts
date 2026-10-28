'use client';

/**
 * ====================================================================
 * SERVICIO: GESTOR DE INVENTARIO CENTRALIZADO (Single Source of Truth)
 * ====================================================================
 * 
 * Propósito:
 * Proporcionar un almacén reactivo único para categorías y productos en memoria,
 * con persistencia opcional en localStorage del navegador y sincronización UUID
 * bidireccional con Supabase PostgreSQL.
 * 
 * Integración React 19:
 * Utiliza `useSyncExternalStore` para suscripciones reactivas libres de desincronización
 * y completamente compatibles con SSR en Next.js.
 */

import { useSyncExternalStore } from 'react';
import { Categoria, Producto } from '@/models/modelos_dominio/productoModel';
import { FormularioCargaProducto } from '@/models/modelos_vista/cargaProductoModel';
import { initialCategorias, initialProductos } from '@/models/mock_data/inventarioMock';
import { supabaseService } from './supabaseService';

const INVENTARIO_STORAGE_KEY = 'mistock_inventario_data_test_v1';

/**
 * Genera un identificador UUID v4 estándar compatible con PostgreSQL `uuid`.
 */
function generarUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface InventarioSnapshot {
  categorias: Categoria[];
  productos: Producto[];
}

/**
 * Snapshot inmutable para SSR (Server-Side Rendering) en Next.js.
 */
const SERVER_SNAPSHOT: InventarioSnapshot = Object.freeze({
  categorias: initialCategorias,
  productos: initialProductos,
});

/**
 * Inicialización segura del estado en el cliente (Browser).
 */
function inicializarEstadoCliente(): InventarioSnapshot {
  if (typeof window === 'undefined') {
    return SERVER_SNAPSHOT;
  }
  try {
    const raw = window.localStorage.getItem(INVENTARIO_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.categorias) && Array.isArray(parsed.productos)) {
        return {
          categorias: parsed.categorias,
          productos: parsed.productos,
        };
      }
    }
  } catch {
    // Si falla el parseo, se utiliza el catálogo inicial por defecto
  }
  return {
    categorias: initialCategorias,
    productos: initialProductos,
  };
}

let currentSnapshot: InventarioSnapshot = inicializarEstadoCliente();
const listeners = new Set<() => void>();

/**
 * Notifica a los suscriptores y sincroniza con localStorage.
 */
function notifySubscribers() {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(INVENTARIO_STORAGE_KEY, JSON.stringify(currentSnapshot));
    } catch {
      // Ignorar cuota excedida de localStorage en modo sandbox
    }
  }
  listeners.forEach((listener) => listener());
}

/**
 * Suscripción externa para useSyncExternalStore.
 */
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): InventarioSnapshot {
  return currentSnapshot;
}

function getServerSnapshot(): InventarioSnapshot {
  return SERVER_SNAPSHOT;
}

/**
 * Hook reactivo para consumir el inventario centralizado en cualquier componente o controlador.
 */
export function useInventarioData(): InventarioSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Métodos de mutación y operaciones empresariales del Inventario.
 */
export const inventarioService = {
  /**
   * Obtiene la instantánea actual de categorías.
   */
  getCategorias(): Categoria[] {
    return currentSnapshot.categorias;
  },

  /**
   * Obtiene la instantánea actual de productos.
   */
  getProductos(): Producto[] {
    return currentSnapshot.productos;
  },

  /**
   * Sincroniza el inventario con Supabase PostgreSQL (Cloud-first bidireccional).
   * Incorpora categorías y productos remotos al catálogo reactivo local.
   */
  async sincronizarConSupabase(): Promise<boolean> {
    try {
      const [catsRemotas, prodsRemotos] = await Promise.all([
        supabaseService.fetchCategorias(),
        supabaseService.fetchProductos(),
      ]);

      let huboCambios = false;
      const nuevasCategorias = [...currentSnapshot.categorias];
      const nuevosProductos = [...currentSnapshot.productos];

      if (catsRemotas && catsRemotas.length > 0) {
        for (const catRemota of catsRemotas) {
          const indexExistente = nuevasCategorias.findIndex(
            (c) => c.id === catRemota.id || c.nombre.trim().toLowerCase() === catRemota.nombre.trim().toLowerCase()
          );
          if (indexExistente >= 0) {
            const idAnterior = nuevasCategorias[indexExistente].id;
            nuevasCategorias[indexExistente] = {
              ...nuevasCategorias[indexExistente],
              ...catRemota,
            };
            // Si la categoría local tenía otro ID, actualizar productos que apunten a ella
            if (idAnterior !== catRemota.id) {
              for (let i = 0; i < nuevosProductos.length; i++) {
                if (nuevosProductos[i].categoriaId === idAnterior) {
                  nuevosProductos[i] = {
                    ...nuevosProductos[i],
                    categoriaId: catRemota.id,
                    categoria: catRemota,
                  };
                }
              }
            }
            huboCambios = true;
          } else {
            nuevasCategorias.push(catRemota);
            huboCambios = true;
          }
        }
      }

      if (prodsRemotos && prodsRemotos.length > 0) {
        for (const prodRemoto of prodsRemotos) {
          const indexExistente = nuevosProductos.findIndex(
            (p) =>
              p.id === prodRemoto.id ||
              (p.codigo && prodRemoto.codigo && p.codigo.trim().toLowerCase() === prodRemoto.codigo.trim().toLowerCase())
          );
          if (indexExistente >= 0) {
            nuevosProductos[indexExistente] = {
              ...nuevosProductos[indexExistente],
              ...prodRemoto,
              categoria: prodRemoto.categoria || nuevasCategorias.find((c) => c.id === prodRemoto.categoriaId),
            };
            huboCambios = true;
          } else {
            nuevosProductos.push({
              ...prodRemoto,
              categoria: prodRemoto.categoria || nuevasCategorias.find((c) => c.id === prodRemoto.categoriaId),
            });
            huboCambios = true;
          }
        }
      }

      if (huboCambios) {
        currentSnapshot = {
          categorias: nuevasCategorias,
          productos: nuevosProductos,
        };
        notifySubscribers();
      }
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Registra una nueva categoría en el catálogo global con UUID compatible con PostgreSQL.
   */
  agregarCategoria(nombre: string, descripcion?: string): Categoria {
    const idGenerado = generarUUID();
    const nuevaCat: Categoria = {
      id: idGenerado,
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || '',
      activo: true,
      fechaCreacion: new Date(),
    };

    currentSnapshot = {
      ...currentSnapshot,
      categorias: [...currentSnapshot.categorias, nuevaCat],
    };
    notifySubscribers();

    // Persistencia asíncrona en Supabase preservando el UUID
    supabaseService
      .insertCategoria({ id: idGenerado, nombre, descripcion })
      .then((catRemota) => {
        if (catRemota && catRemota.id !== idGenerado) {
          currentSnapshot = {
            categorias: currentSnapshot.categorias.map((c) => (c.id === idGenerado ? catRemota : c)),
            productos: currentSnapshot.productos.map((p) =>
              p.categoriaId === idGenerado ? { ...p, categoriaId: catRemota.id, categoria: catRemota } : p
            ),
          };
          notifySubscribers();
        }
      })
      .catch(() => {});

    return nuevaCat;
  },

  /**
   * Guarda un nuevo producto validando unicidad de código y categoría obligatoria.
   */
  guardarProducto(
    datos: FormularioCargaProducto
  ): { exito: boolean; mensaje: string; producto?: Producto } {
    if (!datos.categoriaId || datos.categoriaId.trim() === '') {
      return {
        exito: false,
        mensaje: 'El producto no puede existir sin una categoría definida.',
      };
    }

    const categoriaSeleccionada = currentSnapshot.categorias.find((c) => c.id === datos.categoriaId);
    if (!categoriaSeleccionada) {
      return {
        exito: false,
        mensaje: 'La categoría seleccionada no es válida o no existe.',
      };
    }

    if (!datos.nombre.trim()) {
      return { exito: false, mensaje: 'El nombre del producto es obligatorio.' };
    }

    if (!datos.codigo.trim()) {
      return { exito: false, mensaje: 'El código de barras o SKU es obligatorio.' };
    }

    const codigoExiste = currentSnapshot.productos.some(
      (p) => p.codigo.toLowerCase() === datos.codigo.trim().toLowerCase()
    );
    if (codigoExiste) {
      return {
        exito: false,
        mensaje: `Ya existe un producto con el código "${datos.codigo}". Ingrese un código único.`,
      };
    }

    if (datos.precioVenta <= 0) {
      return { exito: false, mensaje: 'El precio de venta debe ser mayor a 0.' };
    }

    const idProductoGenerado = generarUUID();
    const nuevoProducto: Producto = {
      id: idProductoGenerado,
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

    currentSnapshot = {
      ...currentSnapshot,
      productos: [nuevoProducto, ...currentSnapshot.productos],
    };
    notifySubscribers();

    // Persistencia asíncrona en Supabase preservando el UUID
    supabaseService
      .insertProducto({
        id: idProductoGenerado,
        nombre: nuevoProducto.nombre,
        descripcion: nuevoProducto.descripcion,
        sku: nuevoProducto.codigo,
        precioCosto: nuevoProducto.precioCosto,
        precioVenta: nuevoProducto.precioVenta,
        stockActual: nuevoProducto.stockActual,
        stockMinimo: nuevoProducto.stockMinimo,
        categoriaId: nuevoProducto.categoriaId,
        unidadMedida: nuevoProducto.unidadMedida,
        oferta: nuevoProducto.oferta,
      })
      .then((prodRemoto) => {
        if (prodRemoto && prodRemoto.id !== idProductoGenerado) {
          currentSnapshot = {
            ...currentSnapshot,
            productos: currentSnapshot.productos.map((p) =>
              p.id === idProductoGenerado ? { ...p, id: prodRemoto.id } : p
            ),
          };
          notifySubscribers();
        }
      })
      .catch(() => {});

    return {
      exito: true,
      mensaje: `Producto "${nuevoProducto.nombre}" cargado con éxito en la categoría "${categoriaSeleccionada.nombre}".`,
      producto: nuevoProducto,
    };
  },

  /**
   * Da de baja lógica un producto del catálogo activo.
   */
  darDeBajaProducto(productoId: string, motivo?: string): { exito: boolean; mensaje: string } {
    const producto = currentSnapshot.productos.find((p) => p.id === productoId);
    if (!producto) {
      return { exito: false, mensaje: 'El producto especificado no existe en el catálogo.' };
    }

    currentSnapshot = {
      ...currentSnapshot,
      productos: currentSnapshot.productos.map((p) =>
        p.id === productoId ? { ...p, activo: false, fechaActualizacion: new Date() } : p
      ),
    };
    notifySubscribers();

    // Persistencia asíncrona no bloqueante en Supabase
    supabaseService.updateProducto(productoId, { activo: false }).catch(() => {});

    const detalleMotivo = motivo ? ` (Motivo: ${motivo.trim()})` : '';
    return {
      exito: true,
      mensaje: `El producto "${producto.nombre}" (${producto.codigo}) fue dado de baja correctamente.${detalleMotivo}`,
    };
  },

  /**
   * Reactiva un producto previamente dado de baja en el catálogo.
   */
  reactivarProducto(productoId: string): { exito: boolean; mensaje: string } {
    const producto = currentSnapshot.productos.find((p) => p.id === productoId);
    if (!producto) {
      return { exito: false, mensaje: 'El producto especificado no existe.' };
    }

    currentSnapshot = {
      ...currentSnapshot,
      productos: currentSnapshot.productos.map((p) =>
        p.id === productoId ? { ...p, activo: true, fechaActualizacion: new Date() } : p
      ),
    };
    notifySubscribers();

    // Persistencia asíncrona no bloqueante en Supabase
    supabaseService.updateProducto(productoId, { activo: true }).catch(() => {});

    return {
      exito: true,
      mensaje: `El producto "${producto.nombre}" fue reactivado en el catálogo comercial.`,
    };
  },

  /**
   * Actualiza los datos de un producto asegurando integridad de claves y valores numéricos.
   */
  modificarProducto(
    productoId: string,
    datosActualizados: Partial<Producto>
  ): { exito: boolean; mensaje: string } {
    const producto = currentSnapshot.productos.find((p) => p.id === productoId);
    if (!producto) {
      return { exito: false, mensaje: 'El producto que intenta modificar no existe.' };
    }

    if (datosActualizados.precioVenta !== undefined && Number(datosActualizados.precioVenta) <= 0) {
      return { exito: false, mensaje: 'El precio de venta debe ser superior a 0.' };
    }

    let nuevaCategoria = producto.categoria;
    if (datosActualizados.categoriaId && datosActualizados.categoriaId !== producto.categoriaId) {
      const cat = currentSnapshot.categorias.find((c) => c.id === datosActualizados.categoriaId);
      if (!cat) {
        return { exito: false, mensaje: 'La categoría seleccionada no es válida.' };
      }
      nuevaCategoria = cat;
    }

    if (datosActualizados.codigo && datosActualizados.codigo.trim() !== producto.codigo) {
      const repetido = currentSnapshot.productos.some(
        (p) => p.id !== productoId && p.codigo.toLowerCase() === datosActualizados.codigo?.trim().toLowerCase()
      );
      if (repetido) {
        return {
          exito: false,
          mensaje: `El código "${datosActualizados.codigo}" ya pertenece a otro producto.`,
        };
      }
    }

    currentSnapshot = {
      ...currentSnapshot,
      productos: currentSnapshot.productos.map((p) => {
        if (p.id !== productoId) return p;
        return {
          ...p,
          ...datosActualizados,
          codigo: datosActualizados.codigo ? datosActualizados.codigo.trim() : p.codigo,
          nombre: datosActualizados.nombre ? datosActualizados.nombre.trim() : p.nombre,
          precioCosto: datosActualizados.precioCosto !== undefined ? Number(datosActualizados.precioCosto) : p.precioCosto,
          precioVenta: datosActualizados.precioVenta !== undefined ? Number(datosActualizados.precioVenta) : p.precioVenta,
          stockMinimo: datosActualizados.stockMinimo !== undefined ? Number(datosActualizados.stockMinimo) : p.stockMinimo,
          categoriaId: datosActualizados.categoriaId || p.categoriaId,
          categoria: nuevaCategoria,
          fechaActualizacion: new Date(),
        };
      }),
    };
    notifySubscribers();

    // Persistencia asíncrona no bloqueante en Supabase
    supabaseService.updateProducto(productoId, datosActualizados).catch(() => {});

    return {
      exito: true,
      mensaje: `Producto "${datosActualizados.nombre || producto.nombre}" actualizado con éxito.`,
    };
  },

  /**
   * Descuenta stock tras una venta concretada en el punto de venta (POS).
   * Si permitirNegativo es true, no trunca en 0 para mantener la trazabilidad de backorders.
   */
  descontarStock(productoId: string, cantidad: number, permitirNegativo: boolean = false): boolean {
    const producto = currentSnapshot.productos.find((p) => p.id === productoId);
    if (!producto) return false;

    const nuevoStock = permitirNegativo
      ? producto.stockActual - cantidad
      : Math.max(0, producto.stockActual - cantidad);

    currentSnapshot = {
      ...currentSnapshot,
      productos: currentSnapshot.productos.map((p) =>
        p.id === productoId
          ? {
              ...p,
              stockActual: nuevoStock,
              fechaActualizacion: new Date(),
            }
          : p
      ),
    };
    notifySubscribers();

    // Sincronizar stock actualizado con Supabase
    supabaseService.updateProducto(productoId, { stockActual: nuevoStock }).catch(() => {});
    return true;
  },

  /**
   * Reintegra existencias al inventario tras la anulación o cancelación de una venta.
   */
  reintegrarStock(productoId: string, cantidad: number): boolean {
    const producto = currentSnapshot.productos.find((p) => p.id === productoId);
    if (!producto) return false;

    const nuevoStock = producto.stockActual + cantidad;

    currentSnapshot = {
      ...currentSnapshot,
      productos: currentSnapshot.productos.map((p) =>
        p.id === productoId
          ? {
              ...p,
              stockActual: nuevoStock,
              fechaActualizacion: new Date(),
            }
          : p
      ),
    };
    notifySubscribers();

    // Sincronizar stock reintegrado con Supabase
    supabaseService.updateProducto(productoId, { stockActual: nuevoStock }).catch(() => {});
    return true;
  },

  /**
   * Restablece el inventario a los datos semilla iniciales de inventarioMock.
   */
  reiniciarCatalogo(): void {
    currentSnapshot = {
      categorias: initialCategorias,
      productos: initialProductos,
    };
    notifySubscribers();
  },
};

// Sincronización automática no bloqueante en el cliente al iniciar la aplicación
if (typeof window !== 'undefined') {
  setTimeout(() => {
    inventarioService.sincronizarConSupabase();
  }, 200);
}
