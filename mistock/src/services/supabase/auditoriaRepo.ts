'use client';

import { createClient } from '@/lib/supabase/client';
import { RolUsuarioDB } from '@/models/modelos_dominio/userModel';
import {
  AuditoriaEvento,
  AuditoriaEventoRow,
  toAuditoriaEvento,
} from '@/models/modelos_dominio/auditoriaModel';
import {
  SesionCaja,
  SesionCajaRow,
  toSesionCaja,
} from '@/models/modelos_dominio/sesionCajaModel';
import {
  esErrorTablaFaltante,
  FetchResult,
  isUUID,
  registrarErrorSupabase,
} from './shared';

export const auditoriaRepo = {
  /**
   * Registra un evento de autenticación (`login` o `logout`) en `public.auditoria_eventos`.
   */
  async registrarEventoAuth(
    accion: 'login' | 'logout',
    detalle?: { rol?: RolUsuarioDB; nombre?: string; email?: string }
  ): Promise<boolean> {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id || !isUUID(user.id)) return false;

      const etiquetaAccion = accion === 'login' ? 'Inicio de sesión' : 'Cierre de sesión';
      const identificador = detalle?.nombre || detalle?.email || user.email || 'Usuario';
      const rol = detalle?.rol;

      const { error } = await supabase.from('auditoria_eventos').insert({
        id_usuario: user.id,
        rol_usuario: rol || null,
        modulo: 'auth',
        accion,
        entidad: 'auth',
        entidad_id: user.id,
        resumen: `${etiquetaAccion} de ${identificador}${rol ? ` (${rol})` : ''}`,
        datos_nuevos: {
          email: detalle?.email || user.email || null,
          rol: rol || null,
        },
      });

      if (error) registrarErrorSupabase('registrarEventoAuth', error.message);
      return !error;
    } catch (err) {
      registrarErrorSupabase('registrarEventoAuth', err);
      return false;
    }
  },

  /**
   * Registra una nueva sesión de caja abierta en `public.sesiones_caja` (dispara `tr_auditar_sesiones_caja`).
   */
  async abrirSesionCajaRemota(params: {
    codigoTurno: string;
    numeroCaja: number;
    fondoInicial: number;
    observaciones?: string;
  }): Promise<string | null> {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id || !isUUID(user.id)) return null;

      const { data, error } = await supabase
        .from('sesiones_caja')
        .insert({
          codigo_turno: params.codigoTurno,
          id_usuario: user.id,
          numero_caja: params.numeroCaja || 1,
          fondo_inicial: params.fondoInicial,
          observaciones_apertura: params.observaciones || null,
          estado: 'abierta',
        })
        .select('id_sesion')
        .single();

      if (error || !data?.id_sesion) {
        if (error) registrarErrorSupabase('abrirSesionCajaRemota', error.message);
        return null;
      }
      return String(data.id_sesion);
    } catch (err) {
      registrarErrorSupabase('abrirSesionCajaRemota', err);
      return null;
    }
  },

  /**
   * Cierra una sesión de caja abierta en `public.sesiones_caja` (dispara `tr_auditar_sesiones_caja`).
   */
  async cerrarSesionCajaRemota(
    idSesion: string,
    params: {
      efectivoEsperado: number;
      efectivoReal: number;
      diferencia: number;
      totalRecaudado: number;
      cantidadTickets: number;
      observaciones?: string;
    }
  ): Promise<boolean> {
    try {
      if (!isUUID(idSesion)) return false;

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id || !isUUID(user.id)) return false;

      const { error } = await supabase
        .from('sesiones_caja')
        .update({
          id_usuario_cierre: user.id,
          efectivo_esperado: params.efectivoEsperado,
          efectivo_real: params.efectivoReal,
          diferencia: params.diferencia,
          total_recaudado: params.totalRecaudado,
          cantidad_tickets: params.cantidadTickets,
          observaciones_cierre: params.observaciones || null,
          estado: 'cerrada',
          cerrada_el: new Date().toISOString(),
        })
        .eq('id_sesion', idSesion);

      if (error) registrarErrorSupabase('cerrarSesionCajaRemota', error.message);
      return !error;
    } catch (err) {
      registrarErrorSupabase('cerrarSesionCajaRemota', err);
      return false;
    }
  },

  /**
   * Obtiene los eventos de auditoría centralizada desde `public.auditoria_eventos` (solo admins).
   */
  async fetchAuditoriaEventos(limite: number = 300): Promise<FetchResult<AuditoriaEvento>> {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        return { ok: false, items: [] };
      }

      const { data, error } = await supabase
        .from('auditoria_eventos')
        .select(
          'id_evento, id_usuario, rol_usuario, modulo, accion, entidad, entidad_id, resumen, datos_anteriores, datos_nuevos, creado_el, usuario(nombre, email, rol)'
        )
        .order('creado_el', { ascending: false })
        .limit(limite);

      if (error) {
        return {
          ok: false,
          items: [],
          migracionPendiente: esErrorTablaFaltante(error),
          error: error.message,
        };
      }

      const rows = (data || []) as unknown as AuditoriaEventoRow[];
      return {
        ok: true,
        items: rows.map((row) => toAuditoriaEvento(row)),
      };
    } catch (err) {
      registrarErrorSupabase('fetchAuditoriaEventos', err);
      return {
        ok: false,
        items: [],
        error: err instanceof Error ? err.message : 'Error de red',
      };
    }
  },

  /**
   * Obtiene el historial de sesiones de caja (aperturas y cierres) desde `public.sesiones_caja`.
   * Preserva los nombres explícitos de FK (`sesiones_caja_id_usuario_fkey` y `sesiones_caja_id_usuario_cierre_fkey`)
   * requeridos por PostgREST para desambiguar la doble relación con `public.usuario`.
   */
  async fetchSesionesCaja(limite: number = 100): Promise<FetchResult<SesionCaja>> {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        return { ok: false, items: [] };
      }

      const { data, error } = await supabase
        .from('sesiones_caja')
        .select(
          'id_sesion, codigo_turno, id_usuario, id_usuario_cierre, numero_caja, fondo_inicial, efectivo_esperado, efectivo_real, diferencia, total_recaudado, cantidad_tickets, estado, observaciones_apertura, observaciones_cierre, abierta_el, cerrada_el, usuario_apertura:usuario!sesiones_caja_id_usuario_fkey(nombre, email), usuario_cierre:usuario!sesiones_caja_id_usuario_cierre_fkey(nombre, email)'
        )
        .order('abierta_el', { ascending: false })
        .limit(limite);

      if (error) {
        if (esErrorTablaFaltante(error)) {
          return {
            ok: false,
            items: [],
            migracionPendiente: true,
            error: error.message,
          };
        }

        // Fallback sin embed si el nombre de la FK difiere en un entorno personalizado
        const { data: rawData, error: rawError } = await supabase
          .from('sesiones_caja')
          .select('*')
          .order('abierta_el', { ascending: false })
          .limit(limite);

        if (rawError) {
          return {
            ok: false,
            items: [],
            error: rawError.message,
          };
        }

        const rawRows = (rawData || []) as unknown as SesionCajaRow[];
        return {
          ok: true,
          items: rawRows.map((row) => toSesionCaja(row)),
        };
      }

      const rows = (data || []) as unknown as SesionCajaRow[];
      return {
        ok: true,
        items: rows.map((row) => toSesionCaja(row)),
      };
    } catch (err) {
      registrarErrorSupabase('fetchSesionesCaja', err);
      return {
        ok: false,
        items: [],
        error: err instanceof Error ? err.message : 'Error de red',
      };
    }
  },
};
