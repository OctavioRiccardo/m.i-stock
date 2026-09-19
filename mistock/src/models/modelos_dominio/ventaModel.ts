/**
 * ====================================================================
 * MODELO DE DOMINIO: VENTAS Y LÍNEAS DE DETALLE (Punto de Venta)
 * ====================================================================
 * 
 * Propósito:
 * Define las entidades que modelan las transacciones comerciales del negocio.
 * 
 * Principio de Inmutabilidad Contable:
 * `DetalleVenta` almacena los nombres y precios de los productos "congelados"
 * en el momento exacto de la operación. De esta manera, si un producto cambia de
 * precio o denominación en el futuro, las ventas históricas y reportes contables
 * permanecen 100% fidedignos e inalterados.
 */

/**
 * Métodos de cobro aceptados en la línea de cajas.
 */
export type MetodoPago =
  | 'efectivo'
  | 'tarjeta_debito'
  | 'tarjeta_credito'
  | 'transferencia'
  | 'otro';

/**
 * Estados del ciclo de vida de un comprobante de venta.
 */
export type EstadoVenta = 'completada' | 'cancelada' | 'pendiente';

/**
 * Entidad de Dominio: Renglón o Detalle de una Venta.
 * Representa cada artículo individual comercializado en el ticket.
 */
export interface DetalleVenta {
  id: string;
  ventaId: string;
  productoId: string;
  codigoProducto: string; // Histórico inmutable congelado al momento de vender
  nombreProducto: string; // Denominación histórica inmutable
  cantidad: number;       // Unidades comercializadas
  precioUnitario: number; // Precio histórico facturado al cliente
  subtotal: number;       // Cálculo: cantidad * precioUnitario
}

/**
 * Entidad de Dominio: Cabecera de Venta.
 * Agrupa los metadatos de la operación, forma de pago y relación con el cajero.
 */
export interface Venta {
  id: string;
  numeroComprobante?: string; // Identificador legible para el cliente (ej: 'VNT-101')
  fecha: Date | string;
  usuarioId: string;          // UUID del empleado o cajero que atendió la transacción
  nombreVendedor?: string;
  items: DetalleVenta[];      // Desglose de productos comprados
  total: number;              // Monto final neto tras aplicar descuentos
  metodoPago: MetodoPago;
  estado: EstadoVenta;
  descuento?: number;         // Bonificaciones aplicadas
  observaciones?: string;     // Notas internas o detalles de facturación
}

/**
 * Renglón individual para la carga de una nueva venta desde el POS.
 */
export interface ItemNuevaVenta {
  productoId: string;
  cantidad: number;
  precioUnitario: number;
}

/**
 * DTO para la confirmación y procesamiento de una venta en el servidor.
 */
export interface RegistrarVentaDTO {
  usuarioId: string;
  metodoPago: MetodoPago;
  items: ItemNuevaVenta[];
  descuento?: number;
  observaciones?: string;
}

