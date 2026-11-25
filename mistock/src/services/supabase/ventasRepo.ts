'use client';

import { createClient } from '@/lib/supabase/client';
import { VentaRecientePOS } from '@/models/modelos_vista/dashboardModel';
import { DetalleVenta, EstadoVenta, MetodoPago } from '@/models/modelos_dominio/ventaModel';
import { FetchResult, isUUID, registrarErrorSupabase } from './shared';

export function mapearFilaVentaAReciente(row: Record<string, unknown>): VentaRecientePOS {
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
    estado: String(row.estado || 'completada') as EstadoVenta,
  };
}

export const ventasRepo = {
  async fetchVentasWithStatus(): Promise<FetchResult<VentaRecientePOS>> {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
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

      return {
        ok: true,
        items: data.map((row: Record<string, unknown>) => mapearFilaVentaAReciente(row)),
      };
    } catch (err) {
      registrarErrorSupabase('fetchVentasWithStatus', err);
      return {
        ok: false,
        items: [],
        error: err instanceof Error ? err.message : 'Error de red',
      };
    }
  },

  async fetchVentas(): Promise<VentaRecientePOS[]> {
    const res = await ventasRepo.fetchVentasWithStatus();
    return res.items;
  },

  /**
   * Registra una venta completa con sus renglones y pago en Supabase.
   * Dispara el trigger automático PostgreSQL `tr_venta_movimiento_stock`.
   */
  async registrarVenta(venta: VentaRecientePOS): Promise<string | null> {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const ventaPayload: Record<string, unknown> = {
        total: venta.montoTotal,
        estado: venta.estado || 'completada',
      };
      if (user?.id && isUUID(user.id)) {
        ventaPayload.id_usuario = user.id;
      }

      const payloadConSesion: Record<string, unknown> =
        venta.sesionCajaId && isUUID(venta.sesionCajaId)
          ? { ...ventaPayload, id_sesion_caja: venta.sesionCajaId }
          : ventaPayload;

      let { data: ventaData, error: ventaError } = await supabase
        .from('ventas')
        .insert(payloadConSesion)
        .select()
        .single();

      // Fallback retrocompatible si la columna `id_sesion_caja` aún no fue aplicada en Supabase
      if (ventaError && 'id_sesion_caja' in payloadConSesion) {
        const retry = await supabase.from('ventas').insert(ventaPayload).select().single();
        ventaData = retry.data;
        ventaError = retry.error;
      }

      if (ventaError || !ventaData) {
        if (ventaError) registrarErrorSupabase('registrarVenta', ventaError.message);
        return null;
      }

      const idVentaGenerado = String(ventaData.id_venta);

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
          const { error: detError } = await supabase
            .from('detalle_ventas')
            .insert(renglonesPayload);
          if (detError) {
            registrarErrorSupabase('registrarVenta.detalle', detError.message);
            return null;
          }
        }
      }

      const { error: pagoError } = await supabase.from('pagos').insert({
        id_venta: idVentaGenerado,
        metodo: String(venta.metodoPago || 'efectivo'),
        total: venta.montoTotal,
      });
      if (pagoError) {
        registrarErrorSupabase('registrarVenta.pago', pagoError.message);
      }

      return idVentaGenerado;
    } catch (err) {
      registrarErrorSupabase('registrarVenta', err);
      return null;
    }
  },

  async cancelarVenta(idVenta: string): Promise<boolean> {
    try {
      if (!isUUID(idVenta)) return false;

      const supabase = createClient();
      const { data, error } = await supabase
        .from('ventas')
        .update({ estado: 'cancelada' })
        .eq('id_venta', idVenta)
        .select('id_venta');

      if (error) registrarErrorSupabase('cancelarVenta', error.message);
      return !error && Array.isArray(data) && data.length > 0;
    } catch (err) {
      registrarErrorSupabase('cancelarVenta', err);
      return false;
    }
  },
};
