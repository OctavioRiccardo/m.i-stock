/**
 * ====================================================================
 * MODELO DE DOMINIO: USUARIOS Y PERFILES
 * Representa los usuarios del sistema, sus roles de negocio y estado.
 * ====================================================================
 */

export type RolUsuario = 'admin' | 'empleado' | 'cajero';

export type EstadoUsuario = 'activo' | 'inactivo' | 'suspendido';

export interface Usuario {
  id: string; // UUID vinculado a auth.users de Supabase
  email: string;
  nombreCompleto: string;
  rol: RolUsuario;
  telefono?: string;
  avatarUrl?: string;
  estado: EstadoUsuario;
  ultimoAcceso?: Date | string;
  fechaCreacion: Date | string;
}

// DTO para crear o invitar a un nuevo colaborador
export interface CrearUsuarioDTO {
  email: string;
  nombreCompleto: string;
  rol: RolUsuario;
  telefono?: string;
}

// DTO para actualizar perfil
export type ActualizarUsuarioDTO = Partial<Omit<Usuario, 'id' | 'email' | 'fechaCreacion'>>;
