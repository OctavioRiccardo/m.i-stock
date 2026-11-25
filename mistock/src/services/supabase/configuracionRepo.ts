'use client';

import { createClient } from '@/lib/supabase/client';
import { EstadoSesionCaja } from '@/models/modelos_vista/cierreCajaModel';
import { ConfiguracionCompleta } from '@/models/modelos_vista/configuracionModel';
import { registrarErrorSupabase } from './shared';

async function leerDatosConfiguracionAutenticado(): Promise<Record<string, unknown> | null> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  const { data, error } = await supabase
    .from('configuracion_negocio')
    .select('datos')
    .eq('id', 1)
    .maybeSingle();

  if (error || !data || !data.datos || typeof data.datos !== 'object') {
    return null;
  }

  return data.datos as Record<string, unknown>;
}

async function fusionarDatosConfiguracion(patch: Record<string, unknown>): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return false;

  const { data: existingRow } = await supabase
    .from('configuracion_negocio')
    .select('datos')
    .eq('id', 1)
    .maybeSingle();

  const prevDatos =
    existingRow && existingRow.datos && typeof existingRow.datos === 'object'
      ? (existingRow.datos as Record<string, unknown>)
      : {};

  const { error } = await supabase.from('configuracion_negocio').upsert(
    {
      id: 1,
      datos: {
        ...prevDatos,
        ...patch,
      },
      actualizado_el: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (error) registrarErrorSupabase('fusionarDatosConfiguracion', error.message);
  return !error;
}

export const configuracionRepo = {
  async fetchRawDatosConfiguracion(): Promise<Record<string, unknown>> {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('configuracion_negocio')
        .select('datos')
        .eq('id', 1)
        .maybeSingle();
      if (data && data.datos && typeof data.datos === 'object') {
        return data.datos as Record<string, unknown>;
      }
      return {};
    } catch (err) {
      registrarErrorSupabase('fetchRawDatosConfiguracion', err);
      return {};
    }
  },

  async fetchConfiguracionNegocio(): Promise<Partial<ConfiguracionCompleta> | null> {
    try {
      const raw = await leerDatosConfiguracionAutenticado();
      return raw ? (raw as Partial<ConfiguracionCompleta>) : null;
    } catch (err) {
      registrarErrorSupabase('fetchConfiguracionNegocio', err);
      return null;
    }
  },

  async saveConfiguracionNegocio(config: ConfiguracionCompleta): Promise<boolean> {
    try {
      return await fusionarDatosConfiguracion({ ...config });
    } catch (err) {
      registrarErrorSupabase('saveConfiguracionNegocio', err);
      return false;
    }
  },

  async fetchSesionCaja(): Promise<Partial<EstadoSesionCaja> | null> {
    try {
      const raw = await leerDatosConfiguracionAutenticado();
      if (raw?.sesionCaja && typeof raw.sesionCaja === 'object') {
        return raw.sesionCaja as Partial<EstadoSesionCaja>;
      }
      return null;
    } catch (err) {
      registrarErrorSupabase('fetchSesionCaja', err);
      return null;
    }
  },

  async saveSesionCaja(sesionCaja: Partial<EstadoSesionCaja>): Promise<boolean> {
    try {
      return await fusionarDatosConfiguracion({ sesionCaja });
    } catch (err) {
      registrarErrorSupabase('saveSesionCaja', err);
      return false;
    }
  },

  async fetchUltimoRespaldoCSV(): Promise<string | null> {
    try {
      const raw = await leerDatosConfiguracionAutenticado();
      return typeof raw?.ultimoRespaldoCSV === 'string' ? raw.ultimoRespaldoCSV : null;
    } catch (err) {
      registrarErrorSupabase('fetchUltimoRespaldoCSV', err);
      return null;
    }
  },

  async saveUltimoRespaldoCSV(marca: string): Promise<boolean> {
    try {
      return await fusionarDatosConfiguracion({ ultimoRespaldoCSV: marca });
    } catch (err) {
      registrarErrorSupabase('saveUltimoRespaldoCSV', err);
      return false;
    }
  },
};
