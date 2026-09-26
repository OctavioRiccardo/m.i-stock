/**
 * ====================================================================
 * MODELO DE VISTA: DASHBOARDS Y MÉTRICAS (ViewModels)
 * ====================================================================
 * 
 * Propósito:
 * Define las estructuras de datos agregadas consumidas por las vistas de panel:
 * - `AdminDashboardData`: Tarjetas KPI, resumen financiero, alertas de reposición y detalle de ventas.
 * - `UserDashboardData`: Terminal de venta POS, ventas del día, catálogo rápido de despacho.
 * 
 * Razón de Existencia en la Arquitectura:
 * Estos modelos no coinciden 1:1 con ninguna tabla de base de datos; son proyecciones
 * consolidadas (agregaciones SQL / cálculos) diseñadas específicamente para maximizar
 * la velocidad de renderizado de los componentes React.
 */

import { MetodoPago, EstadoVenta } from '@/models/modelos_dominio/ventaModel';

// ====================================================================
// 1. Modelos de Vista para la Terminal de Ventas (Punto de Venta / POS)
// ====================================================================

/**
 * Representación optimizada de un producto para listas rápidas en el POS.
 */
export interface ProductoRapidoPOS {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
  stockMinimo?: number;
  codigo: string;
}
export type QuickProduct = ProductoRapidoPOS;

/**
 * Registro simplificado de una venta concretada en caja para historial inmediato.
 */
export interface VentaRecientePOS {
  id: string;
  hora: string;
  montoTotal: number;
  cantidadItems: number;
  metodoPago?: MetodoPago | string;
}

/**
 * Estado general consumido por la terminal de ventas del cajero/vendedor.
 */
export interface UserDashboardData {
  ventasDelDia: number;
  recaudacionDelDia: number;
  totalProductosEnStock: number;
  ventasRecientes: VentaRecientePOS[];
  productosPopulares: ProductoRapidoPOS[];
}

// ====================================================================
// 2. Modelos de Vista para el Panel de Administración (KPIs & Alertas)
// ====================================================================

/**
 * Tarjeta de indicador clave de rendimiento (KPI) para el administrador.
 */
export interface AdminMetricCard {
  title: string;
  value: string;
  changePercentage?: string;
  status: 'positive' | 'negative' | 'neutral';
}

/**
 * Alerta generada cuando las existencias de un producto caen por debajo de su umbral mínimo.
 */
export interface AlertaStockCritico {
  id: string;
  nombreProducto: string;
  stockActual: number;
  umbralMinimo: number;
  categoria: string;
}
export type LowStockAlert = AlertaStockCritico;

/**
 * Renglón de ranking para el informe de rotación de inventario (más y menos vendidos).
 */
export interface ProductoRankingVentas {
  id: string;
  nombre: string;
  codigo: string;
  categoria: string;
  unidadesVendidas: number;
  stockActual: number;
  montoTotal: number;
  tendencia: 'alza' | 'baja' | 'estancada';
}

/**
 * Métricas consolidadas de un período de facturación (semana / mes).
 */
export interface ResumenVentasPeriodo {
  totalRecaudado: number;
  cantidadVentas: number;
  ticketPromedio: number;
  unidadesTotales: number;
}

/**
 * Detalle individual de un comprobante de venta emitido.
 */
export interface DetalleVentaItem {
  id: string;
  codigoComprobante: string;
  fechaHora: string;
  vendedor: string;
  metodoPago: MetodoPago;
  cantidadItems: number;
  total: number;
  estado: EstadoVenta;
}

/**
 * Bloque de datos para el panel de análisis temporal de ventas.
 */
export interface VentasDetalleData {
  resumenSemana: ResumenVentasPeriodo;
  resumenMes: ResumenVentasPeriodo;
  ventasSemana: DetalleVentaItem[];
  ventasMes: DetalleVentaItem[];
}

/**
 * Estado general consumido por el panel principal del Administrador.
 */
export interface AdminDashboardData {
  monthlyRevenue: number;
  totalProducts: number;
  activeUsersCount: number;
  lowStockCount: number;
  kpiMetrics: AdminMetricCard[];
  stockAlerts: LowStockAlert[];
  productosMasVendidos: ProductoRankingVentas[];
  productosMenosVendidos: ProductoRankingVentas[];
  ventasDetalle: VentasDetalleData;
}
