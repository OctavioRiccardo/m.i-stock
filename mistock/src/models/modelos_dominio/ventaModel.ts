/**
 * ====================================================================
 * MODELO DE DOMINIO: VENTAS Y DETALLE DE VENTA
 * Representa las transacciones comerciales en el punto de venta.
 * ====================================================================
 */

export type MetodoPago =
  | 'efectivo'
  | 'tarjeta_debito'
  | 'tarjeta_credito'
  | 'transferencia'
  | 'otro';

export type EstadoVenta = 'completada' | 'cancelada' | 'pendiente';

export interface DetalleVenta {
  id: string;
  ventaId: string;
  productoId: string;
  codigoProducto: string; // Histórico congelado al momento de vender
  nombreProducto: string; // Histórico congelado
  cantidad: number;
  precioUnitario: number; // Precio histórico de venta
  subtotal: number; // cantidad * precioUnitario
}

export interface Venta {
  id: string;
  numeroComprobante?: string; // Ej: 'VNT-101' o número de ticket
  fecha: Date | string;
  usuarioId: string; // ID del empleado/cajero que registró la venta
  nombreVendedor?: string;
  items: DetalleVenta[];
  total: number;
  metodoPago: MetodoPago;
  estado: EstadoVenta;
  descuento?: number;
  observaciones?: string;
}

// DTO para registrar una nueva venta desde el punto de venta
export interface ItemNuevaVenta {
  productoId: string;
  cantidad: number;
  precioUnitario: number;
}

export interface RegistrarVentaDTO {
  usuarioId: string;
  metodoPago: MetodoPago;
  items: ItemNuevaVenta[];
  descuento?: number;
  observaciones?: string;
}
