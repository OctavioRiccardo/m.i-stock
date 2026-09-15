// Modelos de vista para Dashboards (Admin y Usuario)

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

export interface AdminDashboard {
  GananciasMensuales: number;
  TotalProductos: number;
  UsuariosActivos: number;
  AlertasStockBajo: number;
  metricas: AdminMetricas[];
  alertasStockBajo: AlertaStockBajo[];
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

