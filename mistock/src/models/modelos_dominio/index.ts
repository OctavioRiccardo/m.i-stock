/**
 * ====================================================================
 * MODELOS DE DOMINIO (Barrel Export)
 * ====================================================================
 * 
 * Propósito:
 * Exportación centralizada de las entidades puras del negocio.
 * 
 * Separación Arquitectónica:
 * - Los Modelos de Dominio (`modelos_dominio`) representan la realidad del negocio
 *   y la estructura de las tablas en PostgreSQL / Supabase, sin depender de la UI.
 * - Los Modelos de Vista (`modelos_vista`) representan el estado efímero de las pantallas,
 *   formularios y KPIs agregados consumidos por los componentes de React.
 */

export * from './productoModel';
export * from './ventaModel';
export * from './inventarioModel';
export * from './userModel';

