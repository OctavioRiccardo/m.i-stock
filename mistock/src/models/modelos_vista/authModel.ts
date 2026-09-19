/**
 * ====================================================================
 * MODELO DE VISTA: AUTENTICACIÓN Y SESIÓN (ViewModels)
 * ====================================================================
 * 
 * Propósito:
 * Estructuras de datos dedicadas a la interacción de login y sesión en el frontend:
 * - Campos del formulario de inicio de sesión (`LoginFormValues`).
 * - Perfil de usuario simplificado para barras de navegación y avatars (`UserProfile`).
 * - Distinción de rol a nivel de presentación (`UserRole`).
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
 * Roles simplificados para condicionamiento visual y enrutamiento en la UI.
 */
export type UserRole = 'admin' | 'user';

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

