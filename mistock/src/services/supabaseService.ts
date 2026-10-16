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
import { Categoria, CategoriaRow, Producto, ProductoRow, toCategoria, toProducto, UnidadMedida } from '@/models/modelos_dominio/productoModel';
import { VentaRecientePOS } from '@/models/modelos_vista/dashboardModel';
import { Usuario, UsuarioRow, toUsuario } from '@/models/modelos_dominio/userModel';

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
  async insertCategoria(datos: { nombre: string; descripcion?: string }): Promise<Categoria | null> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('categorias')
        .insert({
          nombre: datos.nombre.trim(),
          descripcion: datos.descripcion?.trim() || null,
          activo: true,
        })
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

      return data.map((row: any) => {
        const cat = row.categorias ? toCategoria(row.categorias) : undefined;
        return toProducto(row as ProductoRow, cat);
      });
    } catch {
      return [];
    }
  },

  /**
   * Registra un nuevo producto en Supabase PostgreSQL.
   */
  async insertProducto(prod: {
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
      const isUUID = (str: string) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
      if (!isUUID(prod.categoriaId)) {
        return null;
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from('productos')
        .insert({
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
        })
        .select('*, categorias (*)')
        .single();

      if (error || !data) {
        return null;
      }

      const cat = (data as any).categorias ? toCategoria((data as any).categorias) : undefined;
      return toProducto(data as ProductoRow, cat);
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
      const isUUID = (str: string) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
      if (!isUUID(productoId)) {
        return false;
      }

      const supabase = createClient();
      const payload: Record<string, any> = {};

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
   * Registra una venta completa con sus renglones y pago en Supabase.
   * Dispara el trigger automático PostgreSQL `tr_venta_movimiento_stock`
   * para auditar el movimiento y descontar existencias.
   */
  async registrarVenta(venta: VentaRecientePOS): Promise<boolean> {
    try {
      const supabase = createClient();

      // 1. Cabecera de la venta
      const { data: ventaData, error: ventaError } = await supabase
        .from('ventas')
        .insert({
          total: venta.montoTotal,
          estado: venta.estado || 'completada',
        })
        .select()
        .single();

      if (ventaError || !ventaData) {
        return false;
      }

      const idVentaGenerado = ventaData.id_venta;

      // 2. Renglones de detalle de venta
      if (venta.items && venta.items.length > 0) {
        const isUUID = (str: string) =>
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

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

      return true;
    } catch {
      return false;
    }
  },

  /**
   * Marca una venta como cancelada en Supabase PostgreSQL.
   */
  async cancelarVenta(idVenta: string): Promise<boolean> {
    try {
      const isUUID = (str: string) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
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
};
