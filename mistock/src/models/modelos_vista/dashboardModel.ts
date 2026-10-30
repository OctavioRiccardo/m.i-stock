/**
 * ====================================================================
 * MODELO DE VISTA: DASHBOARDS Y MÉTRICAS (ViewModels)
 * ====================================================================
 * 
 * Propósito:
 * Define las estructuras de datos agregadas consumidas por las vistas de panel:
 * - `AdminDashboardData`: Tarjetas KPI, gráficos comparativos, rotación de inventario y detalle de ventas.
 * - `UserDashboardData`: Terminal de venta POS, ventas del día, catálogo rápido de despacho.
 * 
 * Razón de Existencia en la Arquitectura:
 * Estos modelos no coinciden 1:1 con ninguna tabla de base de datos; son proyecciones
 * consolidadas (agregaciones SQL / cálculos) diseñadas específicamente para maximizar
 * la velocidad de renderizado de los componentes React.
 */

import { MetodoPago, EstadoVenta, DetalleVenta, Pago } from '@/models/modelos_dominio/ventaModel';

// ====================================================================
// 1. Modelos de Vista para la Terminal de Ventas (Punto de Venta / POS)
// ====================================================================

/**
 * Módulos / pestañas operativas disponibles en la terminal del vendedor/cajero (POS).
 */
export type PestanaOperativaPOS = 'caja' | 'catalogo' | 'precios' | 'historial';

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
  descripcion?: string;
  unidadMedida?: string;
  oferta?: boolean;
}
export type QuickProduct = ProductoRapidoPOS;

/**
 * Renglón de artículo añadido al ticket en curso de la caja (POS).
 */
export interface ItemCarritoPOS {
  producto: ProductoRapidoPOS;
  cantidad: number;
  subtotal: number;
}

/**
 * Registro de una venta concretada en caja con su desglose de renglones (DetalleVenta).
 */
export interface VentaRecientePOS {
  id: string;
  hora: string;
  fecha?: string;
  fechaISO?: string;
  timestamp?: number;
  idTurno?: string;
  montoTotal: number;
  cantidadItems: number;
  metodoPago?: MetodoPago | string;
  vendedor?: string;
  items: DetalleVenta[];
  pagos?: Pago[];
  estado?: EstadoVenta;
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
  stockMinimo: number;
  precioCosto: number;
  montoTotal: number;
  tendencia: 'alza' | 'baja' | 'estancada';
}

/**
 * Métricas consolidadas del período de facturación activo.
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
 * Bloque de datos para el registro transaccional sincronizado con el período activo.
 */
export interface VentasDetalleData {
  resumenPeriodoActivo: ResumenVentasPeriodo;
  ventasPeriodoActivo: DetalleVentaItem[];
}

export interface PuntoTendenciaVentas {
  fecha: string;
  'Recaudación Actual': number;
  'Período Anterior': number;
}

export interface PuntoDistribucionPago {
  metodo: string;
  monto: number;
  porcentaje: number;
}

export interface PuntoBarraVenta {
  periodo: string;
  'Monto Facturado': number;
  Operaciones: number;
}

export interface GraficosMetricasData {
  tendenciaActiva: PuntoTendenciaVentas[];
  distribucionPagosActiva: PuntoDistribucionPago[];
}

/**
 * Estado general consumido por el panel principal del Administrador.
 */
export interface AdminDashboardData {
  kpiMetrics: AdminMetricCard[];
  productosMasVendidos: ProductoRankingVentas[];
  productosMenosVendidos: ProductoRankingVentas[];
  ventasDetalle: VentasDetalleData;
  graficos: GraficosMetricasData;
}


// ====================================================================
// Funciones Puras de Dominio / Cálculo para el Carrito y Cobro POS
// ====================================================================

/**
 * Calcula el subtotal monetario de un renglón en el carrito de compras.
 */
export function calcularSubtotalRenglon(precio: number, cantidad: number): number {
  const p = Math.max(0, Number(precio) || 0);
  const c = Math.max(0, Number(cantidad) || 0);
  return Number((p * c).toFixed(2));
}

/**
 * Consolida la sumatoria de subtotales y unidades totales de un carrito.
 */
export function calcularTotalesCarrito(carrito: { cantidad: number; subtotal: number }[]): {
  total: number;
  cantidadArticulos: number;
} {
  const acumulado = carrito.reduce(
    (acc, item) => ({
      total: acc.total + (Number(item.subtotal) || 0),
      cantidadArticulos: acc.cantidadArticulos + (Number(item.cantidad) || 0),
    }),
    { total: 0, cantidadArticulos: 0 }
  );

  return {
    total: Number(acumulado.total.toFixed(2)),
    cantidadArticulos: acumulado.cantidadArticulos,
  };
}

/**
 * Calcula el vuelto a entregar o el faltante pendiente para pagos en efectivo.
 */
export function calcularVueltoPOS(
  total: number,
  montoRecibido: number
): {
  vuelto: number;
  faltante: number;
  esMontoSuficiente: boolean;
} {
  const tot = Math.max(0, Number(total) || 0);
  const recibido = Math.max(0, Number(montoRecibido) || 0);

  const vuelto = Number(Math.max(0, recibido - tot).toFixed(2));
  const faltante = Number(Math.max(0, tot - recibido).toFixed(2));
  const esMontoSuficiente = recibido >= tot;

  return { vuelto, faltante, esMontoSuficiente };
}

/**
 * Genera la lista de atajos rápidos de billetes comunes a partir del total a cobrar.
 */
export function generarSugerenciasBilletes(total: number): { label: string; valor: number }[] {
  const t = Math.max(0, Math.round(Number(total) || 0));
  return [
    { label: 'Exacto', valor: t },
    { label: '+ $1.000', valor: t + 1000 },
    { label: '+ $2.000', valor: t + 2000 },
    { label: '+ $5.000', valor: t + 5000 },
    { label: '+ $10.000', valor: t + 10000 },
    { label: '+ $20.000', valor: t + 20000 },
  ];
}
