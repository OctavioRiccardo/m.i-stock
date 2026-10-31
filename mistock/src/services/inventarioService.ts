'use client';

/**
 * ====================================================================
 * SERVICIO: GESTOR DE INVENTARIO CENTRALIZADO (Single Source of Truth)
 * ====================================================================
 * 
 * Propósito:
 * Proporcionar un almacén reactivo único para categorías y productos en memoria,
 * utilizando Supabase PostgreSQL como fuente de verdad autoritativa y `localStorage`
 * únicamente como caché rápida de sesión.
 * 
 * Integración React 19:
 * Utiliza `useSyncExternalStore` para suscripciones reactivas libres de desincronización
 * y completamente compatibles con SSR en Next.js.
 */

import { useSyncExternalStore } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Categoria, Producto } from '@/models/modelos_dominio/productoModel';
import { FormularioCargaProducto } from '@/models/modelos_vista/cargaProductoModel';
import { initialCategorias, initialProductos } from '@/models/mock_data/inventarioMock';
import {
  LIMITES_TEXTO,
  MAX_PRECIO_DB,
  MAX_STOCK_DB,
  esSkuValido,
  normalizarTexto,
} from '@/lib/validaciones';
import { supabaseService } from './supabaseService';

export const INVENTARIO_STORAGE_KEY = 'mistock_inventario_data_test_v1';

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
    // Si falla el parseo, se utiliza el catálogo vacío inicial
  }
  return {
    categorias: initialCategorias,
    productos: initialProductos,
  };
}

let currentSnapshot: InventarioSnapshot = inicializarEstadoCliente();
const listeners = new Set<() => void>();

/**
 * Notifica a los suscriptores y actualiza la caché local.
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
   * Sincroniza el inventario tomando a Supabase PostgreSQL como única fuente de verdad.
   * Reemplaza cualquier caché previa en `localStorage` (incluso si la BD está vacía `[]`).
   */
  async sincronizarConSupabase(): Promise<boolean> {
    try {
      const [resCats, resProds] = await Promise.all([
        supabaseService.fetchCategoriasWithStatus(),
        supabaseService.fetchProductosWithStatus(),
      ]);

      if (!resCats.ok || !resProds.ok) {
        return false;
      }

      const mapaCategorias = new Map<string, Categoria>(
        resCats.items.map((c) => [c.id, c])
      );

      const productosNormalizados: Producto[] = resProds.items.map((prod) => ({
        ...prod,
        categoria: prod.categoria || mapaCategorias.get(prod.categoriaId),
      }));

      currentSnapshot = {
        categorias: resCats.items,
        productos: productosNormalizados,
      };
      notifySubscribers();
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Registra una nueva categoría validando formato, longitud y unicidad de nombre.
   */
  agregarCategoria(
    nombre: string,
    descripcion?: string
  ): { exito: boolean; mensaje: string; categoria?: Categoria } {
    const nombreLimpio = normalizarTexto(nombre || '');
    const descLimpia = (descripcion || '').trim().slice(0, LIMITES_TEXTO.DESCRIPCION_MAX);

    if (nombreLimpio.length < LIMITES_TEXTO.NOMBRE_CATEGORIA_MIN) {
      return {
        exito: false,
        mensaje: `El nombre de la categoría debe tener al menos ${LIMITES_TEXTO.NOMBRE_CATEGORIA_MIN} caracteres.`,
      };
    }

    if (nombreLimpio.length > LIMITES_TEXTO.NOMBRE_CATEGORIA_MAX) {
      return {
        exito: false,
        mensaje: `El nombre de la categoría no puede superar los ${LIMITES_TEXTO.NOMBRE_CATEGORIA_MAX} caracteres.`,
      };
    }

    const existe = currentSnapshot.categorias.some(
      (c) => c.nombre.trim().toLowerCase() === nombreLimpio.toLowerCase()
    );
    if (existe) {
      return {
        exito: false,
        mensaje: `Ya existe una categoría llamada "${nombreLimpio}".`,
      };
    }

    const snapshotPrevio = currentSnapshot;
    const idGenerado = generarUUID();
    const nuevaCat: Categoria = {
      id: idGenerado,
      nombre: nombreLimpio,
      descripcion: descLimpia,
      activo: true,
      fechaCreacion: new Date(),
    };

    currentSnapshot = {
      ...currentSnapshot,
      categorias: [...currentSnapshot.categorias, nuevaCat],
    };
    notifySubscribers();

    // Persistencia remota verificada en Supabase
    supabaseService
      .insertCategoria({ id: idGenerado, nombre: nombreLimpio, descripcion: descLimpia })
      .then((catRemota) => {
        if (!catRemota) {
          // Revertir si PostgreSQL rechazó la inserción
          currentSnapshot = snapshotPrevio;
          notifySubscribers();
          return;
        }
        if (catRemota.id !== idGenerado) {
          currentSnapshot = {
            categorias: currentSnapshot.categorias.map((c) => (c.id === idGenerado ? catRemota : c)),
            productos: currentSnapshot.productos.map((p) =>
              p.categoriaId === idGenerado ? { ...p, categoriaId: catRemota.id, categoria: catRemota } : p
            ),
          };
          notifySubscribers();
        }
      })
      .catch(() => {
        currentSnapshot = snapshotPrevio;
        notifySubscribers();
      });

    return {
      exito: true,
      mensaje: `Categoría "${nuevaCat.nombre}" creada con éxito.`,
      categoria: nuevaCat,
    };
  },

  /**
   * Guarda un nuevo producto validando unicidad de código, rangos numéricos y categoría obligatoria.
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

    const nombreLimpio = normalizarTexto(datos.nombre || '');
    if (
      nombreLimpio.length < LIMITES_TEXTO.NOMBRE_PRODUCTO_MIN ||
      nombreLimpio.length > LIMITES_TEXTO.NOMBRE_PRODUCTO_MAX
    ) {
      return {
        exito: false,
        mensaje: `El nombre del producto debe tener entre ${LIMITES_TEXTO.NOMBRE_PRODUCTO_MIN} y ${LIMITES_TEXTO.NOMBRE_PRODUCTO_MAX} caracteres.`,
      };
    }

    const codigoLimpio = (datos.codigo || '').trim();
    if (!esSkuValido(codigoLimpio)) {
      return {
        exito: false,
        mensaje: `El SKU / código debe tener entre ${LIMITES_TEXTO.SKU_MIN} y ${LIMITES_TEXTO.SKU_MAX} caracteres (letras, números, guiones, puntos o barras, sin espacios).`,
      };
    }

    const codigoExiste = currentSnapshot.productos.some(
      (p) => p.codigo.toLowerCase() === codigoLimpio.toLowerCase()
    );
    if (codigoExiste) {
      return {
        exito: false,
        mensaje: `Ya existe un producto con el código "${codigoLimpio}". Ingrese un código único.`,
      };
    }

    const precioCosto = Number(datos.precioCosto) || 0;
    const precioVenta = Number(datos.precioVenta);
    const stockInicial = Number(datos.stockInicial) || 0;
    const stockMinimo = Number(datos.stockMinimo) || 0;

    if (!Number.isFinite(precioCosto) || precioCosto < 0 || precioCosto > MAX_PRECIO_DB) {
      return {
        exito: false,
        mensaje: `El precio de costo debe estar entre $0 y $${MAX_PRECIO_DB.toLocaleString('es-AR')}.`,
      };
    }

    if (!Number.isFinite(precioVenta) || precioVenta <= 0 || precioVenta > MAX_PRECIO_DB) {
      return {
        exito: false,
        mensaje: `El precio de venta debe ser mayor a $0 y no superar $${MAX_PRECIO_DB.toLocaleString('es-AR')}.`,
      };
    }

    if (!Number.isInteger(stockInicial) || stockInicial < 0 || stockInicial > MAX_STOCK_DB) {
      return {
        exito: false,
        mensaje: `El stock inicial debe ser un número entero entre 0 y ${MAX_STOCK_DB.toLocaleString('es-AR')}.`,
      };
    }

    if (!Number.isInteger(stockMinimo) || stockMinimo < 0 || stockMinimo > MAX_STOCK_DB) {
      return {
        exito: false,
        mensaje: `El stock mínimo debe ser un número entero entre 0 y ${MAX_STOCK_DB.toLocaleString('es-AR')}.`,
      };
    }

    const descLimpia = (datos.descripcion || '').trim().slice(0, LIMITES_TEXTO.DESCRIPCION_MAX);
    const snapshotPrevio = currentSnapshot;
    const idProductoGenerado = generarUUID();
    const nuevoProducto: Producto = {
      id: idProductoGenerado,
      codigo: codigoLimpio,
      nombre: nombreLimpio,
      descripcion: descLimpia,
      precioCosto: Number(precioCosto.toFixed(2)),
      precioVenta: Number(precioVenta.toFixed(2)),
      stockActual: stockInicial,
      stockMinimo,
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

    // Persistencia verificada en Supabase preservando el UUID
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
        if (!prodRemoto) {
          currentSnapshot = snapshotPrevio;
          notifySubscribers();
          return;
        }
        if (prodRemoto.id !== idProductoGenerado) {
          currentSnapshot = {
            ...currentSnapshot,
            productos: currentSnapshot.productos.map((p) =>
              p.id === idProductoGenerado ? { ...p, id: prodRemoto.id } : p
            ),
          };
          notifySubscribers();
        }
      })
      .catch(() => {
        currentSnapshot = snapshotPrevio;
        notifySubscribers();
      });

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

    const snapshotPrevio = currentSnapshot;
    currentSnapshot = {
      ...currentSnapshot,
      productos: currentSnapshot.productos.map((p) =>
        p.id === productoId ? { ...p, activo: false, fechaActualizacion: new Date() } : p
      ),
    };
    notifySubscribers();

    supabaseService
      .updateProducto(productoId, { activo: false })
      .then((ok) => {
        if (!ok) {
          currentSnapshot = snapshotPrevio;
          notifySubscribers();
        }
      })
      .catch(() => {
        currentSnapshot = snapshotPrevio;
        notifySubscribers();
      });

    const motivoLimpio = (motivo || '').trim().slice(0, LIMITES_TEXTO.OBSERVACIONES_MAX);
    const detalleMotivo = motivoLimpio ? ` (Motivo: ${motivoLimpio})` : '';
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

    const snapshotPrevio = currentSnapshot;
    currentSnapshot = {
      ...currentSnapshot,
      productos: currentSnapshot.productos.map((p) =>
        p.id === productoId ? { ...p, activo: true, fechaActualizacion: new Date() } : p
      ),
    };
    notifySubscribers();

    supabaseService
      .updateProducto(productoId, { activo: true })
      .then((ok) => {
        if (!ok) {
          currentSnapshot = snapshotPrevio;
          notifySubscribers();
        }
      })
      .catch(() => {
        currentSnapshot = snapshotPrevio;
        notifySubscribers();
      });

    return {
      exito: true,
      mensaje: `El producto "${producto.nombre}" fue reactivado en el catálogo comercial.`,
    };
  },

  /**
   * Actualiza los datos de un producto asegurando integridad de claves, textos y valores numéricos.
   */
  modificarProducto(
    productoId: string,
    datosActualizados: Partial<Producto>
  ): { exito: boolean; mensaje: string } {
    const producto = currentSnapshot.productos.find((p) => p.id === productoId);
    if (!producto) {
      return { exito: false, mensaje: 'El producto que intenta modificar no existe.' };
    }

    const nombreFinal =
      datosActualizados.nombre !== undefined
        ? normalizarTexto(datosActualizados.nombre)
        : producto.nombre;

    if (
      nombreFinal.length < LIMITES_TEXTO.NOMBRE_PRODUCTO_MIN ||
      nombreFinal.length > LIMITES_TEXTO.NOMBRE_PRODUCTO_MAX
    ) {
      return {
        exito: false,
        mensaje: `El nombre del producto debe tener entre ${LIMITES_TEXTO.NOMBRE_PRODUCTO_MIN} y ${LIMITES_TEXTO.NOMBRE_PRODUCTO_MAX} caracteres.`,
      };
    }

    const codigoFinal =
      datosActualizados.codigo !== undefined
        ? datosActualizados.codigo.trim()
        : producto.codigo;

    if (!esSkuValido(codigoFinal)) {
      return {
        exito: false,
        mensaje: `El SKU / código debe tener entre ${LIMITES_TEXTO.SKU_MIN} y ${LIMITES_TEXTO.SKU_MAX} caracteres válidos sin espacios.`,
      };
    }

    if (codigoFinal.toLowerCase() !== producto.codigo.toLowerCase()) {
      const repetido = currentSnapshot.productos.some(
        (p) => p.id !== productoId && p.codigo.toLowerCase() === codigoFinal.toLowerCase()
      );
      if (repetido) {
        return {
          exito: false,
          mensaje: `El código "${codigoFinal}" ya pertenece a otro producto.`,
        };
      }
    }

    const precioCostoFinal =
      datosActualizados.precioCosto !== undefined
        ? Number(datosActualizados.precioCosto)
        : producto.precioCosto;
    const precioVentaFinal =
      datosActualizados.precioVenta !== undefined
        ? Number(datosActualizados.precioVenta)
        : producto.precioVenta;
    const stockActualFinal =
      datosActualizados.stockActual !== undefined
        ? Number(datosActualizados.stockActual)
        : producto.stockActual;
    const stockMinimoFinal =
      datosActualizados.stockMinimo !== undefined
        ? Number(datosActualizados.stockMinimo)
        : producto.stockMinimo;

    if (!Number.isFinite(precioCostoFinal) || precioCostoFinal < 0 || precioCostoFinal > MAX_PRECIO_DB) {
      return {
        exito: false,
        mensaje: `El precio de costo debe estar entre $0 y $${MAX_PRECIO_DB.toLocaleString('es-AR')}.`,
      };
    }

    if (!Number.isFinite(precioVentaFinal) || precioVentaFinal <= 0 || precioVentaFinal > MAX_PRECIO_DB) {
      return {
        exito: false,
        mensaje: `El precio de venta debe ser mayor a $0 y no superar $${MAX_PRECIO_DB.toLocaleString('es-AR')}.`,
      };
    }

    if (!Number.isInteger(stockActualFinal) || stockActualFinal < 0 || stockActualFinal > MAX_STOCK_DB) {
      return {
        exito: false,
        mensaje: `El stock físico debe ser un número entero entre 0 y ${MAX_STOCK_DB.toLocaleString('es-AR')}.`,
      };
    }

    if (!Number.isInteger(stockMinimoFinal) || stockMinimoFinal < 0 || stockMinimoFinal > MAX_STOCK_DB) {
      return {
        exito: false,
        mensaje: `El stock mínimo debe ser un número entero entre 0 y ${MAX_STOCK_DB.toLocaleString('es-AR')}.`,
      };
    }

    let nuevaCategoria = producto.categoria;
    if (datosActualizados.categoriaId && datosActualizados.categoriaId !== producto.categoriaId) {
      const cat = currentSnapshot.categorias.find((c) => c.id === datosActualizados.categoriaId);
      if (!cat) {
        return { exito: false, mensaje: 'La categoría seleccionada no es válida.' };
      }
      nuevaCategoria = cat;
    }

    const descripcionFinal =
      datosActualizados.descripcion !== undefined
        ? datosActualizados.descripcion.trim().slice(0, LIMITES_TEXTO.DESCRIPCION_MAX)
        : producto.descripcion;

    const payloadSanitizado: Partial<Producto> = {
      ...datosActualizados,
      nombre: nombreFinal,
      codigo: codigoFinal,
      descripcion: descripcionFinal,
      precioCosto: Number(precioCostoFinal.toFixed(2)),
      precioVenta: Number(precioVentaFinal.toFixed(2)),
      stockActual: stockActualFinal,
      stockMinimo: stockMinimoFinal,
      categoriaId: datosActualizados.categoriaId || producto.categoriaId,
    };

    const snapshotPrevio = currentSnapshot;
    currentSnapshot = {
      ...currentSnapshot,
      productos: currentSnapshot.productos.map((p) => {
        if (p.id !== productoId) return p;
        return {
          ...p,
          ...payloadSanitizado,
          categoria: nuevaCategoria,
          fechaActualizacion: new Date(),
        };
      }),
    };
    notifySubscribers();

    supabaseService
      .updateProducto(productoId, payloadSanitizado)
      .then((ok) => {
        if (!ok) {
          currentSnapshot = snapshotPrevio;
          notifySubscribers();
        }
      })
      .catch(() => {
        currentSnapshot = snapshotPrevio;
        notifySubscribers();
      });

    return {
      exito: true,
      mensaje: `Producto "${nombreFinal}" actualizado con éxito.`,
    };
  },

  /**
   * Descuenta stock de forma optimista en la UI tras una venta concretada en el POS.
   * Por defecto `sincronizarRemoto = false` porque el trigger PostgreSQL `tr_venta_movimiento_stock`
   * descuenta las existencias atómicamente al insertar en `detalle_ventas` (evitando doble descuento).
   */
  descontarStock(
    productoId: string,
    cantidad: number,
    permitirNegativo: boolean = false,
    sincronizarRemoto: boolean = false
  ): boolean {
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

    if (sincronizarRemoto) {
      supabaseService.updateProducto(productoId, { stockActual: Math.max(0, nuevoStock) }).catch(() => {});
    }
    return true;
  },

  /**
   * Reintegra existencias en la UI tras la anulación de una venta.
   * Por defecto `sincronizarRemoto = false` porque el trigger PostgreSQL `tr_cancelar_venta_reintegrar_stock`
   * registra la devolución y suma el stock al cambiar `ventas.estado` a `'cancelada'`.
   */
  reintegrarStock(
    productoId: string,
    cantidad: number,
    sincronizarRemoto: boolean = false
  ): boolean {
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

    if (sincronizarRemoto) {
      supabaseService.updateProducto(productoId, { stockActual: nuevoStock }).catch(() => {});
    }
    return true;
  },

  /**
   * Limpia la caché en memoria y en `localStorage` al cerrar sesión para evitar residuos entre cuentas.
   */
  limpiarCacheLocal(): void {
    currentSnapshot = {
      categorias: [],
      productos: [],
    };
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(INVENTARIO_STORAGE_KEY);
      } catch {}
    }
    listeners.forEach((listener) => listener());
  },

  /**
   * Restablece el inventario a los datos semilla iniciales (vacíos).
   */
  reiniciarCatalogo(): void {
    currentSnapshot = {
      categorias: initialCategorias,
      productos: initialProductos,
    };
    notifySubscribers();
  },
};

// Sincronización automática con Supabase al iniciar y ante cambios de sesión Auth
if (typeof window !== 'undefined') {
  setTimeout(() => {
    void inventarioService.sincronizarConSupabase();
  }, 150);

  try {
    const supabase = createClient();
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        void inventarioService.sincronizarConSupabase();
      } else if (event === 'SIGNED_OUT') {
        inventarioService.limpiarCacheLocal();
      }
    });
  } catch {
    // Entorno sin variables configuradas
  }
}
