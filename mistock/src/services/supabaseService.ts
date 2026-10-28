'use client';

/**
 * ====================================================================
 * SERVICIO: CONECTOR DE PERSISTENCIA REMOTA SUPABASE POSTGRESQL
 * ====================================================================
 * 
 * Propósito:
 * Proporcionar métodos asíncronos tipados para interactuar con las tablas
 * de Supabase PostgreSQL (`categorias`, `productos`, `ventas`, `detalle_ventas`,
 * `pagos`, `usuario`) bajo una arquitectura híbrida y resiliente (Cloud-First
 * con fallback local).
 * 
 * Sincronización RLS y Transacciones:
 * - Mapea entidades de dominio TypeScript <-> Fila PostgreSQL (Snake_case).
 * - Diseñado para no bloquear la ejecución local si el entorno se encuentra
 *   offline o si las credenciales de prueba no poseen sesión remota.
 */

import { createClient } from '@/lib/supabase/client';
import {
  Categoria,
  CategoriaRow,
  Producto,
  ProductoRow,
  toCategoria,
  toProducto,
  UnidadMedida,
} from '@/models/modelos_dominio/productoModel';
import { VentaRecientePOS } from '@/models/modelos_vista/dashboardModel';
import {
  Usuario,
  UsuarioRow,
  toUsuario,
  RolUsuarioDB,
} from '@/models/modelos_dominio/userModel';
import { DetalleVenta, MetodoPago, EstadoVenta } from '@/models/modelos_dominio/ventaModel';

const isUUID = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

export const supabaseService = {
  /**
   * Obtiene la lista de categorías registradas en Supabase PostgreSQL.
   */
  async fetchCategorias(): Promise<Categoria[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nombre', { ascending: true });

      if (error || !data) {
        return [];
      }

      return data.map((row: CategoriaRow) => toCategoria(row));
    } catch {
      return [];
    }
  },

  /**
   * Registra una nueva categoría en Supabase.
   */
  async insertCategoria(datos: { id?: string; nombre: string; descripcion?: string }): Promise<Categoria | null> {
    try {
      const supabase = createClient();
      const payload: Record<string, unknown> = {
        nombre: datos.nombre.trim(),
        descripcion: datos.descripcion?.trim() || null,
        activo: true,
      };
      if (datos.id && isUUID(datos.id)) {
        payload.id_categoria = datos.id;
      }

      const { data, error } = await supabase
        .from('categorias')
        .insert(payload)
        .select()
        .single();

      if (error || !data) {
        return null;
      }

      return toCategoria(data as CategoriaRow);
    } catch {
      return null;
    }
  },

  /**
   * Obtiene el catálogo completo de productos con sus categorías asociadas (JOIN).
   */
  async fetchProductos(): Promise<Producto[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('productos')
        .select('*, categorias (*)')
        .order('nombre', { ascending: true });

      if (error || !data) {
        return [];
      }

      return data.map((row: Record<string, unknown>) => {
        const catRow = row.categorias as CategoriaRow | undefined;
        const cat = catRow ? toCategoria(catRow) : undefined;
        return toProducto(row as unknown as ProductoRow, cat);
      });
    } catch {
      return [];
    }
  },

  /**
   * Registra un nuevo producto en Supabase PostgreSQL.
   */
  async insertProducto(prod: {
    id?: string;
    nombre: string;
    descripcion?: string;
    sku: string;
    precioCosto: number;
    precioVenta: number;
    stockActual: number;
    stockMinimo: number;
    categoriaId: string;
    unidadMedida: UnidadMedida;
    oferta?: boolean;
  }): Promise<Producto | null> {
    try {
      if (!isUUID(prod.categoriaId)) {
        return null;
      }

      const supabase = createClient();
      const payload: Record<string, unknown> = {
        id_categoria: prod.categoriaId,
        nombre: prod.nombre.trim(),
        descripcion: prod.descripcion?.trim() || null,
        sku: prod.sku.trim(),
        precio_costo: prod.precioCosto,
        precio_venta: prod.precioVenta,
        stock_actual: prod.stockActual,
        stock_minimo: prod.stockMinimo,
        unidad_medida: prod.unidadMedida,
        oferta: Boolean(prod.oferta),
        activo: true,
      };

      if (prod.id && isUUID(prod.id)) {
        payload.id_producto = prod.id;
      }

      const { data, error } = await supabase
        .from('productos')
        .insert(payload)
        .select('*, categorias (*)')
        .single();

      if (error || !data) {
        return null;
      }

      const rowData = data as Record<string, unknown>;
      const cat = rowData.categorias ? toCategoria(rowData.categorias as CategoriaRow) : undefined;
      return toProducto(data as unknown as ProductoRow, cat);
    } catch {
      return null;
    }
  },

  /**
   * Actualiza los datos de un producto existente en Supabase.
   */
  async updateProducto(
    productoId: string,
    datos: Partial<Producto>
  ): Promise<boolean> {
    try {
      if (!isUUID(productoId)) {
        return false;
      }

      const supabase = createClient();
      const payload: Record<string, unknown> = {};

      if (datos.nombre !== undefined) payload.nombre = datos.nombre.trim();
      if (datos.descripcion !== undefined) payload.descripcion = datos.descripcion.trim();
      if (datos.codigo !== undefined) payload.sku = datos.codigo.trim();
      if (datos.precioCosto !== undefined) payload.precio_costo = Number(datos.precioCosto);
      if (datos.precioVenta !== undefined) payload.precio_venta = Number(datos.precioVenta);
      if (datos.stockActual !== undefined) payload.stock_actual = Number(datos.stockActual);
      if (datos.stockMinimo !== undefined) payload.stock_minimo = Number(datos.stockMinimo);
      if (datos.categoriaId !== undefined && isUUID(datos.categoriaId)) payload.id_categoria = datos.categoriaId;
      if (datos.unidadMedida !== undefined) payload.unidad_medida = datos.unidadMedida;
      if (datos.oferta !== undefined) payload.oferta = datos.oferta;
      if (datos.activo !== undefined) payload.activo = datos.activo;
      payload.actualizado_el = new Date().toISOString();

      const { error } = await supabase
        .from('productos')
        .update(payload)
        .eq('id_producto', productoId);

      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Obtiene el historial de ventas desde Supabase PostgreSQL con sus detalles y pagos.
   */
  async fetchVentas(): Promise<VentaRecientePOS[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('ventas')
        .select('*, detalle_ventas (*, productos (nombre, sku)), pagos (*), usuario (nombre)')
        .order('creado_el', { ascending: false })
        .limit(200);

      if (error || !data) {
        return [];
      }

      return data.map((row: Record<string, unknown>) => {
        const idVenta = String(row.id_venta || '');
        const creadoEl = row.creado_el ? new Date(String(row.creado_el)) : new Date();
        const timestamp = creadoEl.getTime();
        const fecha = creadoEl.toLocaleDateString('es-AR');
        const hora = creadoEl.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

        const rawDetalles = Array.isArray(row.detalle_ventas) ? row.detalle_ventas : [];
        const items: DetalleVenta[] = rawDetalles.map((det: Record<string, unknown>, idx: number) => {
          const prodRel = det.productos as { nombre?: string; sku?: string } | null;
          const cant = Number(det.cantidad) || 1;
          const precio = Number(det.precio_unitario) || 0;
          return {
            id: String(det.id_detalle || `DET-${idx + 1}`),
            ventaId: idVenta,
            productoId: String(det.id_producto || ''),
            nombreProducto: prodRel?.nombre || 'Artículo',
            codigoProducto: prodRel?.sku || '',
            cantidad: cant,
            precioUnitario: precio,
            subtotal: Number((cant * precio).toFixed(2)),
          };
        });

        const rawPagos = Array.isArray(row.pagos) ? row.pagos : [];
        const metodoPrincipal =
          rawPagos.length > 0 && rawPagos[0]?.metodo
            ? (String(rawPagos[0].metodo) as MetodoPago)
            : 'efectivo';

        const usuarioRel = row.usuario as { nombre?: string } | null;
        const cantidadItems = items.reduce((acc, item) => acc + item.cantidad, 0) || 1;

        return {
          id: idVenta,
          hora,
          fecha,
          fechaISO: creadoEl.toISOString(),
          timestamp,
          montoTotal: Number(row.total) || 0,
          cantidadItems,
          metodoPago: metodoPrincipal,
          vendedor: usuarioRel?.nombre || 'Cajero',
          items,
          pagos: rawPagos.map((p: Record<string, unknown>) => ({
            id: String(p.id_pago || ''),
            ventaId: idVenta,
            metodo: String(p.metodo || 'efectivo') as MetodoPago,
            total: Number(p.total) || 0,
          })),
          estado: (String(row.estado || 'completada') as EstadoVenta),
        };
      });
    } catch {
      return [];
    }
  },

  /**
   * Registra una venta completa con sus renglones y pago en Supabase.
   * Dispara el trigger automático PostgreSQL `tr_venta_movimiento_stock`
   * para auditar el movimiento y descontar existencias.
   */
  async registrarVenta(venta: VentaRecientePOS): Promise<string | null> {
    try {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();

      // 1. Cabecera de la venta
      const ventaPayload: Record<string, unknown> = {
        total: venta.montoTotal,
        estado: venta.estado || 'completada',
      };
      if (user?.id && isUUID(user.id)) {
        ventaPayload.id_usuario = user.id;
      }

      const { data: ventaData, error: ventaError } = await supabase
        .from('ventas')
        .insert(ventaPayload)
        .select()
        .single();

      if (ventaError || !ventaData) {
        return null;
      }

      const idVentaGenerado = String(ventaData.id_venta);

      // 2. Renglones de detalle de venta
      if (venta.items && venta.items.length > 0) {
        const renglonesPayload = venta.items
          .filter((item) => isUUID(item.productoId))
          .map((item) => ({
            id_venta: idVentaGenerado,
            id_producto: item.productoId,
            cantidad: item.cantidad,
            precio_unitario: item.precioUnitario,
          }));

        if (renglonesPayload.length > 0) {
          await supabase.from('detalle_ventas').insert(renglonesPayload);
        }
      }

      // 3. Registro de pago
      await supabase.from('pagos').insert({
        id_venta: idVentaGenerado,
        metodo: String(venta.metodoPago || 'efectivo'),
        total: venta.montoTotal,
      });

      return idVentaGenerado;
    } catch {
      return null;
    }
  },

  /**
   * Marca una venta como cancelada en Supabase PostgreSQL.
   */
  async cancelarVenta(idVenta: string): Promise<boolean> {
    try {
      if (!isUUID(idVenta)) return false;

      const supabase = createClient();
      const { error } = await supabase
        .from('ventas')
        .update({ estado: 'cancelada' })
        .eq('id_venta', idVenta);

      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Obtiene la nómina de colaboradores desde `public.usuario`.
   */
  async fetchUsuarios(): Promise<Usuario[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('usuario')
        .select('*')
        .order('creado_el', { ascending: false });

      if (error || !data) {
        return [];
      }

      return data.map((row: UsuarioRow) => toUsuario(row));
    } catch {
      return [];
    }
  },

  /**
   * Actualiza datos o rol de un usuario en `public.usuario`.
   */
  async updateUsuario(
    idUsuario: string,
    datos: { nombre?: string; rol?: RolUsuarioDB; telefono?: string }
  ): Promise<boolean> {
    try {
      if (!isUUID(idUsuario)) return false;

      const supabase = createClient();
      const payload: Record<string, unknown> = {
        actualizado_el: new Date().toISOString(),
      };
      if (datos.nombre !== undefined) payload.nombre = datos.nombre.trim();
      if (datos.rol !== undefined) payload.rol = datos.rol;
      if (datos.telefono !== undefined) payload.telefono = datos.telefono.trim() || null;

      const { error } = await supabase
        .from('usuario')
        .update(payload)
        .eq('id_usuario', idUsuario);

      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Elimina un usuario de `public.usuario`.
   */
  async deleteUsuario(idUsuario: string): Promise<boolean> {
    try {
      if (!isUUID(idUsuario)) return false;

      const supabase = createClient();
      const { error } = await supabase
        .from('usuario')
        .delete()
        .eq('id_usuario', idUsuario);

      return !error;
    } catch {
      return false;
    }
  },
};
