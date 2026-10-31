/**
 * ====================================================================
 * MODELO DE DOMINIO: USUARIOS Y PERFILES DE ACCESO
 * ====================================================================
 * 
 * Propósito:
 * Modela los usuarios del sistema y sus roles de autorización en el negocio.
 * Sincronizado 1:1 con la tabla `public.usuario` y el enum `public.user_rol` en Supabase PostgreSQL.
 * 
 * Relación con Supabase:
 * - Tabla: `public.usuario`
 * - Clave Primaria: `id_usuario uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`
 * - Roles definidos en base de datos: 'admin', 'vendedor', 'no_rol'.
 */

/**
 * Roles de base de datos definidos en el enum `public.user_rol` de Supabase PostgreSQL.
 * - 'admin': Administrador con acceso total a finanzas, métricas, inventario y usuarios.
 * - 'vendedor': Operador del punto de venta (POS / caja) y consulta de catálogo.
 * - 'no_rol': Usuario autenticado recientemente pendiente de asignación de permisos.
 */
export type RolUsuarioDB = 'admin' | 'vendedor' | 'no_rol';

/**
 * Rol del usuario en el sistema. Coincide exactamente 1:1 con el enum de PostgreSQL.
 */
export type RolUsuario = RolUsuarioDB;

/**
 * Estados de la cuenta de usuario para control de acceso administrativo.
 */
export type EstadoUsuario = 'activo' | 'inactivo' | 'suspendido';

/**
 * Representación exacta de la fila de la tabla `public.usuario` en PostgreSQL / Supabase.
 */
export interface UsuarioRow {
  id_usuario: string; // uuid FK a auth.users(id)
  nombre: string | null;
  email: string;
  rol: RolUsuarioDB;
  telefono?: string | null;
  activo?: boolean | null;
  creado_el: string;
  actualizado_el: string;
}

/**
 * Entidad de Dominio: Perfil de Usuario en el Frontend.
 * Abstrae y extiende los datos del colaborador con convenciones de nomenclatura TypeScript.
 */
export interface Usuario {
  id: string;                     // UUID vinculado a auth.users y public.usuario
  email: string;                  // Correo electrónico del colaborador
  nombre: string;                 // Nombre visible del usuario
  nombreCompleto?: string;        // Alias de compatibilidad
  rol: RolUsuario;                // Nivel de privilegios (admin, vendedor/empleado, no_rol)
  telefono?: string;              // Teléfono de contacto
  avatarUrl?: string;             // Enlace opcional a avatar en Storage
  estado?: EstadoUsuario;         // Estado de la cuenta
  ultimoAcceso?: Date | string;   // Timestamp de última sesión
  fechaCreacion?: Date | string;  // Fecha de alta
  fechaActualizacion?: Date | string;
  password?: string;              // Contraseña transitoria al crear/editar (nunca se persiste en texto plano)
}

/**
 * Adaptador para transformar una fila cruda de `public.usuario` a la entidad de dominio `Usuario`.
 */
export function toUsuario(row: UsuarioRow): Usuario {
  return {
    id: row.id_usuario,
    email: row.email,
    nombre: row.nombre || '',
    nombreCompleto: row.nombre || '',
    rol: row.rol,
    telefono: row.telefono || undefined,
    estado: row.activo === false ? 'inactivo' : 'activo',
    fechaCreacion: row.creado_el,
    fechaActualizacion: row.actualizado_el,
  };
}

/**
 * DTO para la invitación o alta administrativa de un nuevo miembro del equipo.
 */
export interface CrearUsuarioDTO {
  email: string;
  nombre: string;
  nombreCompleto?: string;
  rol: RolUsuario;
  telefono?: string;
  password?: string;
}

/**
 * DTO para actualizar datos del perfil en Supabase.
 */
export type ActualizarUsuarioDTO = Partial<Omit<Usuario, 'id' | 'email' | 'fechaCreacion'>>;
