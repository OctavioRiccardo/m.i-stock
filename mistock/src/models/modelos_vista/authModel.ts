import { RolUsuario } from '@/models/modelos_dominio/userModel';

/**
 * ====================================================================
 * MODELO DE VISTA: AUTENTICACIÓN Y SESIÓN (ViewModels)
 * ====================================================================
 * 
 * Propósito:
 * Estructuras de datos dedicadas a la interacción de login y sesión en el frontend:
 * - Campos del formulario de inicio de sesión (`LoginFormValues`).
 * - Perfil de usuario simplificado para barras de navegación y avatars (`UserProfile`).
 * - Distinción de rol a nivel de presentación sincronizado con PostgreSQL (`UserRole`).
 */

/**
 * Datos controlados en el formulario de inicio de sesión (LoginFormView).
 */
export interface LoginFormValues {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Roles del usuario para la interfaz, sincronizado 1:1 con `public.user_rol` de PostgreSQL.
 * 'admin': Administrador general.
 * 'vendedor': Operador de caja / terminal de ventas (POS).
 * 'no_rol': Usuario registrado sin rol asignado.
 */
export type UserRole = RolUsuario;

/**
 * Representación del usuario autenticado en la barra superior o cabecera.
 */
export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  role: UserRole;
  avatarUrl?: string;
}
