/**
 * ====================================================================
 * MODELO DE DOMINIO: PRODUCTO Y CATEGORÍA
 * Representa las entidades de catálogo, precios y niveles de stock.
 * ====================================================================
 */

export type UnidadMedida = 'unidad' | 'kg' | 'gramo' | 'litro' | 'metro' | 'paquete';

export interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  fechaCreacion?: Date | string;
}

export interface Producto {
  id: string;
  codigo: string; // SKU o Código de barras (ej: '779001')
  nombre: string;
  descripcion?: string;
  precioVenta: number;
  precioCosto: number;
  stockActual: number;
  stockMinimo: number; // Umbral para alertas de stock crítico
  categoriaId: string;
  categoria?: Categoria; // Relación anidada resuelta
  unidadMedida: UnidadMedida;
  activo: boolean;
  imagenUrl?: string;
  fechaCreacion: Date | string;
  fechaActualizacion?: Date | string;
}

// Tipos auxiliares para creación y actualización (DTOs de dominio)
export type CrearProductoDTO = Omit<Producto, 'id' | 'categoria' | 'fechaCreacion' | 'fechaActualizacion'>;
export type ActualizarProductoDTO = Partial<CrearProductoDTO>;
