/**
 * ====================================================================
 * MODELO DE DOMINIO: INVENTARIO Y MOVIMIENTOS DE STOCK
 * Representa el registro de auditoría, entradas, salidas y ajustes.
 * ====================================================================
 */

export type TipoMovimientoStock =
  | 'entrada_compra'   // Ingreso de mercadería por proveedor
  | 'salida_venta'      // Descuento automático por venta
  | 'ajuste_positivo'  // Corrección al alza por recuento físico
  | 'ajuste_negativo'  // Corrección a la baja por recuento físico
  | 'merma_danio'      // Producto vencido, dañado o roto
  | 'devolucion';       // Devolución de cliente

export interface MovimientoStock {
  id: string;
  productoId: string;
  nombreProducto?: string;
  tipo: TipoMovimientoStock;
  cantidad: number; // Cantidad afectada
  stockAnterior: number; // Stock previo al movimiento
  stockPosterior: number; // Stock resultante (stockAnterior +/- cantidad)
  motivo: string; // Justificación del movimiento
  usuarioId: string; // Responsable que efectuó la acción
  referenciaId?: string; // ID de venta, compra o remito relacionado
  fecha: Date | string;
}

export interface ItemAjusteInventario {
  productoId: string;
  nombreProducto: string;
  stockSistema: number;
  stockFisico: number;
  diferencia: number; // stockFisico - stockSistema
}

export interface AjusteInventario {
  id: string;
  usuarioId: string;
  fecha: Date | string;
  motivo: string;
  items: ItemAjusteInventario[];
  observaciones?: string;
}

// DTO para registrar un movimiento manual de stock
export interface RegistrarMovimientoDTO {
  productoId: string;
  tipo: TipoMovimientoStock;
  cantidad: number;
  motivo: string;
  usuarioId: string;
  referenciaId?: string;
}
