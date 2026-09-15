// Modelos de vista para Dashboards (Admin y Usuario)

export interface QuickProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  code: string;
}

// Alias en español para compatibilidad
export type Productos = QuickProduct;

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

// Alias en español para compatibilidad
export type UsuarioDashboard = UserDashboardData;

export interface AdminMetricCard {
  title: string;
  value: string;
  changePercentage?: string;
  status: 'positive' | 'negative' | 'neutral';
}

// Alias en español para compatibilidad
export type AdminMetricas = AdminMetricCard;

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
