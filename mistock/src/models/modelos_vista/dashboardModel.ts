/**
 * ====================================================================
 * MODELO DE VISTA: DASHBOARDS Y MÉTRICAS (ViewModels)
 * ====================================================================
 * 
 * Propósito:
 * Define las estructuras de datos agregadas consumidas por las vistas de panel:
 * - `AdminDashboardData`: Tarjetas KPI, resumen financiero, alertas de reposición.
 * - `UserDashboardData`: Punto de venta, ventas del día, catálogo rápido de despacho.
 * 
 * Razón de Existencia en la Arquitectura:
 * Estos modelos no coinciden 1:1 con ninguna tabla de base de datos; son proyecciones
 * consolidadas (agregaciones SQL / cálculos) diseñadas específicamente para maximizar
 * la velocidad de renderizado de los componentes React.
 */


/**
 * Representación simplificada de un producto para listas rápidas en el POS.
 */
export interface Productos {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
  codigo: string;
}

/**
 * Resumen consolidado para la pantalla operativa del empleado.
 */
export interface UsuarioDashboard {
  VentasDiarias: number;
  GananciasDiarias: number;
  TotalProductosEnStock: number;
  VentasRecientes: {
    id: string;
    hora: string;
    totalGanado: number;
    cantidad: number;
  }[];
  ProductosMasVendidos: Productos[];
}

/**
 * Tarjeta de indicador clave de rendimiento (KPI) para el administrador.
 */
export interface AdminMetricas {
  titulo: string;
  valor: string;
  cambioPorcentaje?: string;
  estado: 'positive' | 'negative' | 'neutral';
}

/**
 * Alerta prioritaria generada cuando un producto alcanza o cae por debajo de su umbral mínimo.
 */
export interface AlertaStockBajo {
  id: string;
  productoNombre: string;
  stockActual: number;
  UmbralMinimo: number;
  categoria: string;
}

/**
 * Estado general consumido por el panel del Administrador.
 */
export interface AdminDashboard {
  GananciasMensuales: number;
  TotalProductos: number;
  UsuariosActivos: number;
  AlertasStockBajo: number;
  metricas: AdminMetricas[];
  alertasStockBajo: AlertaStockBajo[];
  productosMasVendidos: ProductoRankingVentas[];
  productosMenosVendidos: ProductoRankingVentas[];
}

// ====================================================================
// 2. Interfaces y Tipos de Compatibilidad para los Controladores
// ====================================================================

export interface ProductoRapidoPOS {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
  codigo: string;
}
export type QuickProduct = ProductoRapidoPOS;

export interface VentaRecientePOS {
  id: string;
  hora: string;
  montoTotal: number;
  cantidadItems: number;
}

export interface UserDashboardData {
  ventasDelDia: number;
  recaudacionDelDia: number;
  totalProductosEnStock: number;
  ventasRecientes: VentaRecientePOS[];
  productosPopulares: ProductoRapidoPOS[];
}

export interface AdminMetricCard {
  title: string;
  value: string;
  changePercentage?: string;
  status: 'positive' | 'negative' | 'neutral';
}

export interface AlertaStockCritico {
  id: string;
  nombreProducto: string;
  stockActual: number;
  umbralMinimo: number;
  categoria: string;
}
export type LowStockAlert = AlertaStockCritico;

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

// Alias de compatibilidad
import { MetodoPago, EstadoVenta } from '@/models/modelos_dominio/ventaModel';

export interface ResumenVentasPeriodo {
  totalRecaudado: number;
  cantidadVentas: number;
  ticketPromedio: number;
  unidadesTotales: number;
}

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

export interface VentasDetalleData {
  resumenSemana: ResumenVentasPeriodo;
  resumenMes: ResumenVentasPeriodo;
  ventasSemana: DetalleVentaItem[];
  ventasMes: DetalleVentaItem[];
}

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


