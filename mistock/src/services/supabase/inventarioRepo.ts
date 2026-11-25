'use client';

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
import { FetchResult, isUUID, registrarErrorSupabase } from './shared';

export const inventarioRepo = {
  /**
   * Obtiene categorías con bandera explícita de conexión exitosa y sesión autenticada.
   */
  async fetchCategoriasWithStatus(): Promise<FetchResult<Categoria>> {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
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
      registrarErrorSupabase('fetchCategoriasWithStatus', err);
      return {
        ok: false,
        items: [],
        error: err instanceof Error ? err.message : 'Error de red',
      };
    }
  },

  async fetchCategorias(): Promise<Categoria[]> {
    const res = await inventarioRepo.fetchCategoriasWithStatus();
    return res.items;
  },

  async insertCategoria(datos: {
    id?: string;
    nombre: string;
    descripcion?: string;
  }): Promise<Categoria | null> {
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
        if (error) registrarErrorSupabase('insertCategoria', error.message);
        return null;
      }

      return toCategoria(data as CategoriaRow);
    } catch (err) {
      registrarErrorSupabase('insertCategoria', err);
      return null;
    }
  },

  async fetchProductosWithStatus(): Promise<FetchResult<Producto>> {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
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
      registrarErrorSupabase('fetchProductosWithStatus', err);
      return {
        ok: false,
        items: [],
        error: err instanceof Error ? err.message : 'Error de red',
      };
    }
  },

  async fetchProductos(): Promise<Producto[]> {
    const res = await inventarioRepo.fetchProductosWithStatus();
    return res.items;
  },

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
        if (error) registrarErrorSupabase('insertProducto', error.message);
        return null;
      }

      const rowData = data as Record<string, unknown>;
      const cat = rowData.categorias ? toCategoria(rowData.categorias as CategoriaRow) : undefined;
      return toProducto(data as unknown as ProductoRow, cat);
    } catch (err) {
      registrarErrorSupabase('insertProducto', err);
      return null;
    }
  },

  async updateProducto(productoId: string, datos: Partial<Producto>): Promise<boolean> {
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
      if (datos.categoriaId !== undefined && isUUID(datos.categoriaId)) {
        payload.id_categoria = datos.categoriaId;
      }
      if (datos.unidadMedida !== undefined) payload.unidad_medida = datos.unidadMedida;
      if (datos.oferta !== undefined) payload.oferta = datos.oferta;
      if (datos.activo !== undefined) payload.activo = datos.activo;
      payload.actualizado_el = new Date().toISOString();

      const { data, error } = await supabase
        .from('productos')
        .update(payload)
        .eq('id_producto', productoId)
        .select('id_producto');

      if (error) registrarErrorSupabase('updateProducto', error.message);
      return !error && Array.isArray(data) && data.length > 0;
    } catch (err) {
      registrarErrorSupabase('updateProducto', err);
      return false;
    }
  },
};
