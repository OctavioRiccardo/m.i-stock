/**
 * ====================================================================
 * USUARIOS INICIALES (RAMA PRODUCCIÓN / TEST - DATOS REALES EN BLANCO)
 * ====================================================================
 * 
 * Propósito:
 * Iniciar la nómina de usuarios sin cuentas ficticias pre-cargadas,
 * hidratándose directamente desde `public.usuario` en Supabase PostgreSQL
 * y las altas realizadas desde Gestión de Usuarios (/adminusuarios).
 */

import { Usuario } from '@/models/modelos_dominio/userModel';

export const initialUsuarios: Usuario[] = [];
