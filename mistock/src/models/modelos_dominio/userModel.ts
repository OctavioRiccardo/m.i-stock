/**
 * ====================================================================
 * MODELO DE DOMINIO: USUARIOS Y PERFILES DE ACCESO
 * ====================================================================
 * 
 * Propósito:
 * Modela los perfiles de usuario del sistema y sus roles de autorización.
 * En la arquitectura con Supabase, esta entidad reside en la tabla pública `profiles`,
 * vinculada mediante una relación 1:1 con la tabla interna de autenticación `auth.users`.
 */

/**
 * Roles de negocio para control de acceso basado en roles (RBAC).
 * - 'admin': Acceso total a finanzas, métricas, altas de catálogo y usuarios.
 * - 'empleado': Gestión operativa de ventas, consulta de catálogo y control de stock.
 * - 'cajero': Operaciones exclusivas de línea de cajas y emisión de tickets.
 */
export type RolUsuario = 'admin' | 'empleado' | 'cajero';

/**
 * Estados de la cuenta de usuario para control de acceso.
 */
export type EstadoUsuario = 'activo' | 'inactivo' | 'suspendido';

/**
 * Entidad de Dominio: Perfil de Usuario.
 * Datos de identidad y privilegios del colaborador en el sistema.
 */
export interface Usuario {
  id: string;             // UUID vinculado directamente al identificador de `auth.users` en Supabase
  email: string;          // Correo electrónico institucional o personal
  nombreCompleto: string; // Nombre y apellido del operador
  rol: RolUsuario;        // Nivel de privilegios y accesos en la plataforma
  telefono?: string;      // Teléfono o contacto directo
  avatarUrl?: string;     // Enlace a imagen de perfil en Supabase Storage
  estado: EstadoUsuario;  // Habilitación para iniciar sesión en la plataforma
  ultimoAcceso?: Date | string; // Marca temporal de la última sesión abierta
  fechaCreacion: Date | string; // Fecha de alta del colaborador
}

/**
 * DTO para la invitación o alta administrativa de un nuevo miembro del equipo.
 */
export interface CrearUsuarioDTO {
  email: string;
  nombreCompleto: string;
  rol: RolUsuario;
  telefono?: string;
}

/**
 * DTO para actualizar los datos personales o de contacto del usuario logueado.
 * Protege campos sensibles e inmutables (id, email, fechaCreacion).
 */
export type ActualizarUsuarioDTO = Partial<Omit<Usuario, 'id' | 'email' | 'fechaCreacion'>>;

