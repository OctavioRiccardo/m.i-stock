/**
 * ====================================================================
 * MODELO DE DOMINIO: MOVIMIENTOS Y AUDITORÍA DE INVENTARIO
 * ====================================================================
 * 
 * Propósito:
 * Registrar cada cambio de stock como un libro diario contable inmutable (ledger).
 * Cada alteración física de mercadería (compras, ventas, mermas, ajustes de inventario)
 * genera un movimiento auditable con usuario responsable, stock previo y posterior.
 */

/**
 * Tipología de eventos que afectan el saldo de stock en depósito.
 */
export type TipoMovimientoStock =
  | 'entrada_compra'   // Ingreso de mercadería por recepción de proveedor
  | 'salida_venta'      // Descuento automático originado en el punto de venta
  | 'ajuste_positivo'  // Corrección al alza por recuento físico o sobrante
  | 'ajuste_negativo'  // Corrección a la baja por recuento físico o faltante
  | 'merma_danio'      // Pérdida por mercadería vencida, rota o deteriorada
  | 'devolucion';       // Reingreso al stock por cancelación de compra de cliente

/**
 * Entidad de Dominio: Movimiento Individual de Stock.
 * Registro atómico de auditoría para trazabilidad de existencias.
 */
export interface MovimientoStock {
  id: string;
  productoId: string;
  nombreProducto?: string;
  tipo: TipoMovimientoStock;
  cantidad: number;       // Cantidad de unidades afectadas (siempre positiva)
  stockAnterior: number;  // Saldo previo antes de aplicar la operación
  stockPosterior: number; // Saldo resultante en el sistema (stockAnterior +/- cantidad)
  motivo: string;         // Justificación administrativa o descripción
  usuarioId: string;      // UUID del usuario o administrador responsable
  referenciaId?: string;  // Clave foránea opcional a la venta, compra o remito
  fecha: Date | string;
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
  tipo: TipoMovimientoStock;
  cantidad: number;
  motivo: string;
  usuarioId: string;
  referenciaId?: string;
}

