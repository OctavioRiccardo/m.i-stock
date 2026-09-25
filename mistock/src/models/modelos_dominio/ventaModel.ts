/**
 * ====================================================================
 * MODELO DE DOMINIO: VENTAS, DETALLES Y PAGOS (Punto de Venta)
 * ====================================================================
 * 
 * Propósito:
 * Define las entidades que modelan las transacciones comerciales del negocio.
 * Sincronizado 1:1 con las tablas `public.ventas`, `public.detalle_ventas`
 * y `public.pagos` en Supabase PostgreSQL (`schema.sql`).
 * 
 * Principio de Inmutabilidad Contable (Snapshot):
 * Cada `detalle_ventas` congela el `precio_unitario` y la cantidad exacta al momento
 * de la transacción. El trigger `tr_venta_movimiento_stock` genera automáticamente
 * el movimiento de egreso en `public.movimientos_stock` con valor negativo.
 * 
 * Soporte de Pagos Divididos (Split Payment):
 * La tabla `public.pagos` desacopla el método de cobro de la cabecera `ventas`,
 * permitiendo abonar una compra con múltiples medios de pago (ej: mitad efectivo, mitad transferencia).
 */

/**
 * Métodos de cobro aceptados en la línea de cajas.
 * Coincide con los valores permitidos en `public.pagos.metodo`.
 */
export type MetodoPago =
  | 'efectivo'
  | 'tarjeta_debito'
  | 'tarjeta_credito'
  | 'transferencia'
  | 'otro';

/**
 * Estados del ciclo de vida de un comprobante de venta (`public.ventas.estado`).
 */
export type EstadoVenta = 'completada' | 'cancelada' | 'pendiente';

/**
 * Fila cruda de la tabla `public.pagos` en PostgreSQL / Supabase.
 */
export interface PagoRow {
  id_pago: string;
  id_venta: string;
  metodo: string;
  total: number;
  creado_el: string;
}

/**
 * Entidad de Dominio: Pago de Venta.
 */
export interface Pago {
  id: string;
  ventaId: string;
  metodo: MetodoPago | string;
  total: number;
  fechaCreacion?: Date | string;
}

/**
 * Fila cruda de la tabla `public.detalle_ventas` en PostgreSQL / Supabase.
 */
export interface DetalleVentaRow {
  id_detalle: string;
  id_venta: string;
  id_producto: string;
  cantidad: number;
  precio_unitario: number;
}

/**
 * Entidad de Dominio: Renglón o Detalle de una Venta.
 * Representa cada artículo individual comercializado en el ticket.
 */
export interface DetalleVenta {
  id: string;
  ventaId: string;
  productoId: string;
  codigoProducto?: string; // Histórico congelado al momento de vender
  nombreProducto?: string; // Denominación histórica
  cantidad: number;        // Unidades comercializadas
  precioUnitario: number;  // Precio histórico facturado al cliente
  subtotal?: number;       // Cálculo derivado: cantidad * precioUnitario
}

/**
 * Fila cruda de la tabla `public.ventas` en PostgreSQL / Supabase.
 */
export interface VentaRow {
  id_venta: string;
  id_usuario: string | null;
  total: number;
  estado: EstadoVenta | string;
  creado_el: string;
}

/**
 * Entidad de Dominio: Cabecera de Venta.
 * Agrupa los metadatos de la operación, formas de pago y relación con el cajero.
 */
export interface Venta {
  id: string;
  numeroComprobante?: string; // Identificador visual legible para el cliente (ej: 'VNT-101')
  fecha: Date | string;
  usuarioId: string;          // UUID del empleado o cajero que atendió la transacción (id_usuario)
  nombreVendedor?: string;
  items: DetalleVenta[];      // Desglose de productos vendidos
  total: number;              // Monto total facturado
  metodoPago: MetodoPago;     // Método de pago principal o predominante
  pagos?: Pago[];             // Registro detallado de cobros (soporte de split payment)
  estado: EstadoVenta;
  descuento?: number;         // Bonificaciones aplicadas
  observaciones?: string;     // Notas internas de auditoría
}

/**
 * Transforma una fila `VentaRow` junto a sus detalles y pagos a la entidad `Venta`.
 */
export function toVenta(
  row: VentaRow,
  items: DetalleVenta[] = [],
  pagos: Pago[] = [],
  nombreVendedor?: string
): Venta {
  const metodoPrincipal: MetodoPago = pagos.length > 0 && pagos[0].metodo in ['efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia']
    ? (pagos[0].metodo as MetodoPago)
    : 'efectivo';

  return {
    id: row.id_venta,
    numeroComprobante: `VNT-${row.id_venta.slice(-4).toUpperCase()}`,
    fecha: row.creado_el,
    usuarioId: row.id_usuario || '',
    nombreVendedor,
    items,
    pagos,
    total: Number(row.total),
    metodoPago: metodoPrincipal,
    estado: (row.estado as EstadoVenta) || 'completada',
  };
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
