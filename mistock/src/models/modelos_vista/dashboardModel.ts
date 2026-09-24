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

export interface QuickProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  code: string;
}

export interface UserDashboardData {
  dailySalesCount: number;
  dailyRevenue: number;
  totalProductsInStock: number;
  recentSales: {
    id: string;
    time: string;
    totalAmount: number;
    itemCount: number;
  }[];
  popularProducts: QuickProduct[];
}

export interface AdminMetricCard {
  title: string;
  value: string;
  changePercentage?: string;
  status: 'positive' | 'negative' | 'neutral';
}

export interface LowStockAlert {
  id: string;
  productName: string;
  currentStock: number;
  minThreshold: number;
  category: string;
}

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
export type ProductSalesRanking = ProductoRankingVentas;

export interface AdminDashboardData {
  monthlyRevenue: number;
  totalProducts: number;
  activeUsersCount: number;
  lowStockCount: number;
  kpiMetrics: AdminMetricCard[];
  stockAlerts: LowStockAlert[];
  productosMasVendidos: ProductoRankingVentas[];
  productosMenosVendidos: ProductoRankingVentas[];
}


