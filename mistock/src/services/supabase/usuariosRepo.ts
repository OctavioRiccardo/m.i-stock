'use client';

import { createClient as createSupabaseJsClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { obtenerCredencialesSupabasePublicas } from '@/lib/supabase/url';
import { RolUsuarioDB, toUsuario, Usuario, UsuarioRow } from '@/models/modelos_dominio/userModel';
import { FetchResult, isUUID, registrarErrorSupabase } from './shared';

export const usuariosRepo = {
  async fetchUsuariosWithStatus(): Promise<FetchResult<Usuario>> {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
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
      registrarErrorSupabase('fetchUsuariosWithStatus', err);
      return {
        ok: false,
        items: [],
        error: err instanceof Error ? err.message : 'Error de red',
      };
    }
  },

  async fetchUsuarios(): Promise<Usuario[]> {
    const res = await usuariosRepo.fetchUsuariosWithStatus();
    return res.items;
  },

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

      const rpcMissing =
        rpcError &&
        (rpcError.code === 'PGRST202' ||
          rpcError.code === '42883' ||
          rpcError.message.toLowerCase().includes('could not find the function'));

      if (rpcError && !rpcMissing) {
        return { ok: false, error: rpcError.message };
      }

      const { url, key } = obtenerCredencialesSupabasePublicas();
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
            'No se pudo registrar el colaborador en Supabase Auth (ejecuta mistock/supabase/migrations/schema.sql para habilitar dominios personalizados).',
        };
      }

      const newUserId = signUpData.user.id;
      await usuariosRepo.updateUsuario(newUserId, {
        nombre: nombreLimpio,
        rol: datos.rol,
        telefono: telLimpio || undefined,
        activo: true,
      });

      return { ok: true, id: newUserId };
    } catch (err) {
      registrarErrorSupabase('crearColaboradorRemoto', err);
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Error inesperado al registrar colaborador.',
      };
    }
  },

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

      if (error && (datos.telefono !== undefined || datos.activo !== undefined)) {
        const { data: retryData, error: retryError } = await supabase
          .from('usuario')
          .update(basePayload)
          .eq('id_usuario', idUsuario)
          .select('id_usuario');

        return !retryError && Array.isArray(retryData) && retryData.length > 0;
      }

      return false;
    } catch (err) {
      registrarErrorSupabase('updateUsuario', err);
      return false;
    }
  },

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

      const {
        data: { user },
      } = await supabase.auth.getUser();
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
          'No se pudo actualizar la contraseña en Supabase Auth (ejecuta mistock/supabase/migrations/schema.sql).',
      };
    } catch (err) {
      registrarErrorSupabase('actualizarPasswordColaborador', err);
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Error al actualizar la contraseña.',
      };
    }
  },

  async deleteUsuario(idUsuario: string): Promise<boolean> {
    try {
      if (!isUUID(idUsuario)) return false;

      const supabase = createClient();
      const { error } = await supabase.from('usuario').delete().eq('id_usuario', idUsuario);
      if (error) registrarErrorSupabase('deleteUsuario', error.message);
      return !error;
    } catch (err) {
      registrarErrorSupabase('deleteUsuario', err);
      return false;
    }
  },
};
