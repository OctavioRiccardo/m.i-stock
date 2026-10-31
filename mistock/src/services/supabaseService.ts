'use client';

/**
 * ====================================================================
 * SERVICIO: CONECTOR DE PERSISTENCIA REMOTA SUPABASE POSTGRESQL
 * ====================================================================
 * 
 * Propósito:
 * Proporcionar métodos asíncronos tipados para interactuar con las tablas
 * de Supabase PostgreSQL (`categorias`, `productos`, `ventas`, `detalle_ventas`,
 * `pagos`, `usuario`, `configuracion_negocio`) con Supabase como fuente de verdad.
 * 
 * Sincronización RLS y Transacciones:
 * - Mapea entidades de dominio TypeScript <-> Fila PostgreSQL (Snake_case).
 * - Distingue entre respuestas vacías legítimas de la BD (`ok: true, items: []`)
 *   y fallos de red/sesión (`ok: false`) para evitar conservar datos fantasma.
 */

import { createClient as createSupabaseJsClient } from '@supabase/supabase-js';
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
import { ConfiguracionCompleta } from '@/models/modelos_vista/configuracionModel';

const isUUID = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

export interface FetchResult<T> {
  ok: boolean;
  items: T[];
  error?: string;
}

export const supabaseService = {
  /**
   * Obtiene categorías con bandera explícita de conexión exitosa y sesión autenticada.
   */
  async fetchCategoriasWithStatus(): Promise<FetchResult<Categoria>> {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { ok: false, items: [] };
      }

      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nombre', { ascending: true });

      if (error || !data) {
        return { ok: false, items: [], error: error?.message };
      }

      return {
        ok: true,
        items: data.map((row: CategoriaRow) => toCategoria(row)),
      };
    } catch (err) {
      return {
        ok: false,
        items: [],
        error: err instanceof Error ? err.message : 'Error de red',
      };
    }
  },

  /**
   * Obtiene la lista de categorías registradas en Supabase PostgreSQL.
   */
  async fetchCategorias(): Promise<Categoria[]> {
    const res = await this.fetchCategoriasWithStatus();
    return res.items;
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
   * Obtiene productos con bandera explícita de conexión exitosa y sesión autenticada.
   */
  async fetchProductosWithStatus(): Promise<FetchResult<Producto>> {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { ok: false, items: [] };
      }

      const { data, error } = await supabase
        .from('productos')
        .select('*, categorias (*)')
        .order('nombre', { ascending: true });

      if (error || !data) {
        return { ok: false, items: [], error: error?.message };
      }

      const items = data.map((row: Record<string, unknown>) => {
        const catRow = row.categorias as CategoriaRow | undefined;
        const cat = catRow ? toCategoria(catRow) : undefined;
        return toProducto(row as unknown as ProductoRow, cat);
      });

      return { ok: true, items };
    } catch (err) {
      return {
        ok: false,
        items: [],
        error: err instanceof Error ? err.message : 'Error de red',
      };
    }
  },

  /**
   * Obtiene el catálogo completo de productos con sus categorías asociadas (JOIN).
   */
  async fetchProductos(): Promise<Producto[]> {
    const res = await this.fetchProductosWithStatus();
    return res.items;
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

      const { data, error } = await supabase
        .from('productos')
        .update(payload)
        .eq('id_producto', productoId)
        .select('id_producto');

      return !error && Array.isArray(data) && data.length > 0;
    } catch {
      return false;
    }
  },

  /**
   * Obtiene el historial de ventas desde Supabase PostgreSQL con bandera de conexión.
   */
  async fetchVentasWithStatus(): Promise<FetchResult<VentaRecientePOS>> {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { ok: false, items: [] };
      }

      const { data, error } = await supabase
        .from('ventas')
        .select('*, detalle_ventas (*, productos (nombre, sku)), pagos (*), usuario (nombre)')
        .order('creado_el', { ascending: false })
        .limit(200);

      if (error || !data) {
        return { ok: false, items: [], error: error?.message };
      }

      const items = data.map((row: Record<string, unknown>) => {
        const idVenta = String(row.id_venta || '');
        const creadoEl = row.creado_el ? new Date(String(row.creado_el)) : new Date();
        const timestamp = creadoEl.getTime();
        const fecha = creadoEl.toLocaleDateString('es-AR');
        const hora = creadoEl.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

        const rawDetalles = Array.isArray(row.detalle_ventas) ? row.detalle_ventas : [];
        const itemsVenta: DetalleVenta[] = rawDetalles.map((det: Record<string, unknown>, idx: number) => {
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
        const cantidadItems = itemsVenta.reduce((acc, item) => acc + item.cantidad, 0) || 1;

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
          items: itemsVenta,
          pagos: rawPagos.map((p: Record<string, unknown>) => ({
            id: String(p.id_pago || ''),
            ventaId: idVenta,
            metodo: String(p.metodo || 'efectivo') as MetodoPago,
            total: Number(p.total) || 0,
          })),
          estado: (String(row.estado || 'completada') as EstadoVenta),
        };
      });

      return { ok: true, items };
    } catch (err) {
      return {
        ok: false,
        items: [],
        error: err instanceof Error ? err.message : 'Error de red',
      };
    }
  },

  /**
   * Obtiene el historial de ventas desde Supabase PostgreSQL con sus detalles y pagos.
   */
  async fetchVentas(): Promise<VentaRecientePOS[]> {
    const res = await this.fetchVentasWithStatus();
    return res.items;
  },

  /**
   * Registra una venta completa con sus renglones y pago en Supabase.
   * Dispara el trigger automático PostgreSQL `tr_venta_movimiento_stock`
   * para auditar el movimiento y descontar existencias una única vez.
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

      // 2. Renglones de detalle de venta (dispara tr_venta_movimiento_stock -> tr_actualizar_stock)
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
          const { error: detError } = await supabase.from('detalle_ventas').insert(renglonesPayload);
          if (detError) {
            return null;
          }
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
   * Marca una venta como cancelada en Supabase PostgreSQL verificando que la fila haya sido actualizada.
   */
  async cancelarVenta(idVenta: string): Promise<boolean> {
    try {
      if (!isUUID(idVenta)) return false;

      const supabase = createClient();
      const { data, error } = await supabase
        .from('ventas')
        .update({ estado: 'cancelada' })
        .eq('id_venta', idVenta)
        .select('id_venta');

      return !error && Array.isArray(data) && data.length > 0;
    } catch {
      return false;
    }
  },

  /**
   * Obtiene la nómina de colaboradores desde `public.usuario` con bandera de conexión.
   */
  async fetchUsuariosWithStatus(): Promise<FetchResult<Usuario>> {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { ok: false, items: [] };
      }

      const { data, error } = await supabase
        .from('usuario')
        .select('*')
        .order('creado_el', { ascending: false });

      if (error || !data) {
        return { ok: false, items: [], error: error?.message };
      }

      return {
        ok: true,
        items: data.map((row: UsuarioRow) => toUsuario(row)),
      };
    } catch (err) {
      return {
        ok: false,
        items: [],
        error: err instanceof Error ? err.message : 'Error de red',
      };
    }
  },

  /**
   * Obtiene la nómina de colaboradores desde `public.usuario`.
   */
  async fetchUsuarios(): Promise<Usuario[]> {
    const res = await this.fetchUsuariosWithStatus();
    return res.items;
  },

  /**
   * Crea un colaborador real en Supabase Auth + `public.usuario` sin cerrar la sesión del Admin.
   */
  async crearColaboradorRemoto(datos: {
    email: string;
    password: string;
    nombre: string;
    rol: RolUsuarioDB;
    telefono?: string;
  }): Promise<{ ok: boolean; id?: string; error?: string }> {
    try {
      const supabase = createClient();
      const emailLimpio = datos.email.trim().toLowerCase();
      const nombreLimpio = datos.nombre.trim();
      const telLimpio = datos.telefono?.trim() || null;

      // 1. Vía preferida: RPC transaccional `crear_colaborador_admin` (soporta TLDs personalizados y auto-confirma)
      const { data: rpcId, error: rpcError } = await supabase.rpc('crear_colaborador_admin', {
        p_email: emailLimpio,
        p_password: datos.password,
        p_nombre: nombreLimpio,
        p_rol: datos.rol,
        p_telefono: telLimpio,
      });

      if (!rpcError && rpcId) {
        return { ok: true, id: String(rpcId) };
      }

      // Si el RPC existe pero rechazó la operación (ej. email duplicado o permisos), devolver su mensaje
      const rpcMissing =
        rpcError &&
        (rpcError.code === 'PGRST202' ||
          rpcError.code === '42883' ||
          rpcError.message.toLowerCase().includes('could not find the function'));

      if (rpcError && !rpcMissing) {
        return { ok: false, error: rpcError.message };
      }

      // 2. Fallback si el parche SQL aún no fue ejecutado: cliente efímero sin persistir cookies
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

      if (!url || !key) {
        return { ok: false, error: 'Variables de conexión de Supabase no configuradas.' };
      }

      const ephemeralClient = createSupabaseJsClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });

      const { data: signUpData, error: signUpError } = await ephemeralClient.auth.signUp({
        email: emailLimpio,
        password: datos.password,
        options: {
          data: { full_name: nombreLimpio },
        },
      });

      if (signUpError || !signUpData.user) {
        return {
          ok: false,
          error:
            signUpError?.message ||
            'No se pudo registrar el colaborador en Supabase Auth (ejecuta patch_integridad_y_anulacion.sql para habilitar dominios personalizados).',
        };
      }

      const newUserId = signUpData.user.id;
      await this.updateUsuario(newUserId, {
        nombre: nombreLimpio,
        rol: datos.rol,
        telefono: telLimpio || undefined,
        activo: true,
      });

      return { ok: true, id: newUserId };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Error inesperado al registrar colaborador.',
      };
    }
  },

  /**
   * Actualiza datos, rol o estado activo de un usuario en `public.usuario`.
   * Incluye fallback resiliente si las columnas `telefono` o `activo` aún no existen en una BD previa.
   */
  async updateUsuario(
    idUsuario: string,
    datos: { nombre?: string; rol?: RolUsuarioDB; telefono?: string; activo?: boolean }
  ): Promise<boolean> {
    try {
      if (!isUUID(idUsuario)) return false;

      const supabase = createClient();
      const basePayload: Record<string, unknown> = {
        actualizado_el: new Date().toISOString(),
      };
      if (datos.nombre !== undefined) basePayload.nombre = datos.nombre.trim();
      if (datos.rol !== undefined) basePayload.rol = datos.rol;

      const extendedPayload: Record<string, unknown> = { ...basePayload };
      if (datos.telefono !== undefined) extendedPayload.telefono = datos.telefono.trim() || null;
      if (datos.activo !== undefined) extendedPayload.activo = datos.activo;

      const { data, error } = await supabase
        .from('usuario')
        .update(extendedPayload)
        .eq('id_usuario', idUsuario)
        .select('id_usuario');

      if (!error && Array.isArray(data) && data.length > 0) {
        return true;
      }

      // Fallback sin columnas extendidas si la base todavía tiene el esquema inicial sin el parche
      if (error && (datos.telefono !== undefined || datos.activo !== undefined)) {
        const { data: retryData, error: retryError } = await supabase
          .from('usuario')
          .update(basePayload)
          .eq('id_usuario', idUsuario)
          .select('id_usuario');

        return !retryError && Array.isArray(retryData) && retryData.length > 0;
      }

      return false;
    } catch {
      return false;
    }
  },

  /**
   * Actualiza la contraseña de un colaborador en Supabase Auth mediante RPC administrativo.
   */
  async actualizarPasswordColaborador(
    idUsuario: string,
    nuevaPassword: string
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      if (!isUUID(idUsuario)) {
        return { ok: false, error: 'Identificador de usuario no válido.' };
      }

      const supabase = createClient();
      const { data: rpcOk, error: rpcError } = await supabase.rpc(
        'actualizar_password_colaborador_admin',
        {
          p_id_usuario: idUsuario,
          p_nueva_password: nuevaPassword,
        }
      );

      if (!rpcError && rpcOk) {
        return { ok: true };
      }

      // Fallback si el usuario editado es el propio administrador autenticado y el RPC aún no fue aplicado
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.id === idUsuario) {
        const { error: selfErr } = await supabase.auth.updateUser({ password: nuevaPassword });
        if (!selfErr) {
          return { ok: true };
        }
      }

      return {
        ok: false,
        error:
          rpcError?.message ||
          'No se pudo actualizar la contraseña en Supabase Auth (ejecuta patch_integridad_y_anulacion.sql).',
      };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Error al actualizar la contraseña.',
      };
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

  /**
   * Obtiene la configuración remota del comercio desde `public.configuracion_negocio` (si existe).
   */
  async fetchConfiguracionNegocio(): Promise<Partial<ConfiguracionCompleta> | null> {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const { data, error } = await supabase
        .from('configuracion_negocio')
        .select('datos')
        .eq('id', 1)
        .maybeSingle();

      if (error || !data || !data.datos || typeof data.datos !== 'object') {
        return null;
      }

      return data.datos as Partial<ConfiguracionCompleta>;
    } catch {
      return null;
    }
  },

  /**
   * Persiste la configuración del comercio en `public.configuracion_negocio` (fila única `id = 1`).
   */
  async saveConfiguracionNegocio(config: ConfiguracionCompleta): Promise<boolean> {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      const { error } = await supabase
        .from('configuracion_negocio')
        .upsert(
          {
            id: 1,
            datos: config,
            actualizado_el: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

      return !error;
    } catch {
      return false;
    }
  },
};
