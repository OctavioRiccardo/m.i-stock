/**
 * ====================================================================
 * CONTROLADORES DE ADMINISTRACIÓN (Barrel Export)
 * ====================================================================
 * Punto de acceso centralizado para todos los controladores con permisos de Administrador:
 * - useAdminDashboardController: Métricas, KPIs y alertas de stock.
 * - useAdminInventarioController: Catálogo de productos y taxonomía de categorías.
 */

export * from './dashboardController';
export * from './inventarioController';
export * from './inventarioGlobalController';
export * from './usuariosController';

