/**
 * ====================================================================
 * MODELO DE DOMINIO: MOVIMIENTOS Y AUDITORÍA DE INVENTARIO
 * ====================================================================
 * 
 * Propósito:
 * Registrar cada cambio de stock como un libro diario contable inmutable (ledger).
 * Sincronizado 1:1 con la tabla `public.movimientos_stock` y el enum `public.tipo_movimiento`
 * en Supabase PostgreSQL (`schema.sql`).
 * 
 * Regla de Convención de Signos en Base de Datos:
 * - `cantidad > 0`: Ingreso de mercadería (compras, ajustes positivos, devoluciones de clientes).
 * - `cantidad < 0`: Salida de mercadería (ventas en caja, ajustes por faltante, mermas).
 * El trigger `tr_actualizar_stock` suma algebraicamente `NEW.cantidad` a `productos.stock_actual`.
 */

/**
 * Tipos de movimientos admitidos en el enum de base de datos `public.tipo_movimiento`.
 */
export type TipoMovimientoDB = 'compra' | 'venta' | 'ajuste' | 'devolucion';

/**
 * Tipología de eventos en el dominio frontend para granularidad de reportes y filtros.
 */
export type TipoMovimientoStock =
  | TipoMovimientoDB
  | 'entrada_compra'   // Ingreso de mercadería por recepción de proveedor
  | 'salida_venta'      // Descuento automático originado en el punto de venta
  | 'ajuste_positivo'  // Corrección al alza por recuento físico o sobrante
  | 'ajuste_negativo'  // Corrección a la baja por recuento físico o faltante
  | 'merma_danio';      // Pérdida por mercadería vencida, rota o deteriorada

/**
 * Fila cruda de la tabla `public.movimientos_stock` en PostgreSQL / Supabase.
 */
export interface MovimientoStockRow {
  id_movimiento: string;
  id_producto: string;
  id_usuario: string | null;
  cantidad: number; // Positivo (+) para ingresos, negativo (-) para salidas/ventas
  tipo: TipoMovimientoDB;
  motivo: string | null;
  creado_el: string;
}

/**
 * Entidad de Dominio: Movimiento Individual de Stock en la Aplicación.
 * Registro atómico de auditoría para trazabilidad de existencias.
 */
export interface MovimientoStock {
  id: string;
  productoId: string;
  nombreProducto?: string;
  tipo: TipoMovimientoStock;
  cantidad: number;       // Cantidad absoluta o con signo según contexto
  stockAnterior?: number;  // Saldo previo antes de aplicar la operación
  stockPosterior?: number; // Saldo resultante en el sistema
  motivo: string;         // Justificación administrativa o descripción
  usuarioId?: string;      // UUID del usuario o administrador responsable
  referenciaId?: string;  // Clave foránea opcional a la venta, compra o remito
  fecha: Date | string;
}

/**
 * Mapea una fila cruda de `public.movimientos_stock` a la entidad `MovimientoStock`.
 */
export function toMovimientoStock(row: MovimientoStockRow, nombreProducto?: string): MovimientoStock {
  return {
    id: row.id_movimiento,
    productoId: row.id_producto,
    nombreProducto,
    tipo: row.tipo,
    cantidad: row.cantidad,
    motivo: row.motivo || '',
    usuarioId: row.id_usuario || undefined,
    fecha: row.creado_el,
  };
}

/**
 * Renglón de comparación para auditorías físicas en góndola o depósito.
 */
export interface ItemAjusteInventario {
  productoId: string;
  nombreProducto: string;
  stockSistema: number; // Existencia teórica calculada por el software
  stockFisico: number;  // Conteo manual real verificado por el operario
  diferencia: number;   // Cálculo: stockFisico - stockSistema
}

/**
 * Entidad de Dominio: Acta de Ajuste Global de Inventario.
 * Documenta recuentos periódicos o inventarios de cierre de mes.
 */
export interface AjusteInventario {
  id: string;
  usuarioId: string;
  fecha: Date | string;
  motivo: string;
  items: ItemAjusteInventario[];
  observaciones?: string;
}

/**
 * DTO para la registración manual de ingresos extraordinarios, mermas o ajustes.
 */
export interface RegistrarMovimientoDTO {
  productoId: string;
  tipo: TipoMovimientoDB | TipoMovimientoStock;
  cantidad: number; // Signed or magnitude
  motivo: string;
  usuarioId?: string;
  referenciaId?: string;
}
