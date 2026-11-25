'use client';

/**
 * ====================================================================
 * SERVICIO: FACHADA DE PERSISTENCIA REMOTA SUPABASE POSTGRESQL
 * ====================================================================
 *
 * Propósito:
 * Exponer una interfaz unificada (`supabaseService`) compuesta por
 * repositorios cohesivos por dominio en `src/services/supabase/`:
 * - `inventarioRepo`: categorías y productos
 * - `ventasRepo`: historial, registro y anulación de ventas
 * - `usuariosRepo`: nómina de colaboradores y credenciales
 * - `configuracionRepo`: configuración del negocio, sesión de caja y respaldo CSV
 * - `auditoriaRepo`: eventos de autenticación, auditoría y turnos de caja
 */

import { inventarioRepo } from './supabase/inventarioRepo';
import { ventasRepo } from './supabase/ventasRepo';
import { usuariosRepo } from './supabase/usuariosRepo';
import { configuracionRepo } from './supabase/configuracionRepo';
import { auditoriaRepo } from './supabase/auditoriaRepo';

export type { FetchResult } from './supabase/shared';
export { inventarioRepo, ventasRepo, usuariosRepo, configuracionRepo, auditoriaRepo };

export const supabaseService = {
  ...inventarioRepo,
  ...ventasRepo,
  ...usuariosRepo,
  ...configuracionRepo,
  ...auditoriaRepo,
};
