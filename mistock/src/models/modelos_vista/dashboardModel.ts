// Modelos de vista para Dashboards (Admin y Usuario)

// ==========================================
// 1. Interfaces en Español (Versión Actual)
// ==========================================

export interface Productos {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
  codigo: string;
}

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

export interface AdminMetricas {
  titulo: string;
  valor: string;
  cambioPorcentaje?: string;
  estado: 'positive' | 'negative' | 'neutral';
}

export interface AlertaStockBajo {
  id: string;
  productoNombre: string;
  stockActual: number;
  UmbralMinimo: number;
  categoria: string;
}

export interface AdminDashboard {
  GananciasMensuales: number;
  TotalProductos: number;
  UsuariosActivos: number;
  AlertasStockBajo: number;
  metricas: AdminMetricas[];
  alertasStockBajo: AlertaStockBajo[];
}

// ==========================================
// 2. Interfaces y Alias de compatibilidad con controladores
// ==========================================

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

export interface AdminDashboardData {
  monthlyRevenue: number;
  totalProducts: number;
  activeUsersCount: number;
  lowStockCount: number;
  kpiMetrics: AdminMetricCard[];
  stockAlerts: LowStockAlert[];
}
