/**
 * ====================================================================
 * MODELO DE DOMINIO: PRODUCTO Y CATEGORÍA
 * ====================================================================
 * 
 * Propósito:
 * Define las entidades fundamentales del catálogo de mercancías y su taxonomía.
 * Representa fielmente las tablas de la base de datos relacional (PostgreSQL / Supabase)
 * de forma independiente de cualquier framework o vista de usuario.
 * 
 * Regla de Integridad de Dominio:
 * Un `Producto` requiere estrictamente una `categoriaId` válida.
 * No es posible instanciar ni persistir un producto "huérfano" en el sistema.
 */

/**
 * Unidades físicas de medida admitidas para el fraccionamiento o venta.
 */
export type UnidadMedida = 'unidad' | 'kg' | 'gramo' | 'litro' | 'metro' | 'paquete';

/**
 * Entidad de Dominio: Categoría de Productos.
 * Agrupa artículos según su naturaleza comercial (ej: 'Almacén', 'Limpieza', 'Bebidas').
 */
export interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  fechaCreacion?: Date | string;
}

/**
 * Entidad de Dominio: Producto.
 * Representa un artículo comercializable con precio, costos y existencia en depósito.
 */
export interface Producto {
  id: string;
  codigo: string;          // Código de barras (EAN/UPC) o SKU identificador único
  nombre: string;          // Denominación comercial visible del artículo
  descripcion?: string;   // Información complementaria de presentación o marca
  precioVenta: number;     // Precio final unitario al consumidor
  precioCosto: number;     // Costo de reposición o adquisición mayorista
  stockActual: number;     // Cantidad disponible actualmente para la venta
  stockMinimo: number;     // Umbral de seguridad que dispara alertas de reposición
  categoriaId: string;     // Clave foránea obligatoria hacia la categoría contenedora
  categoria?: Categoria;   // Objeto de categoría poblado (JOIN relacional)
  unidadMedida: UnidadMedida;
  activo: boolean;         // Control de disponibilidad operativa (baja lógica)
  imagenUrl?: string;      // URL de fotografía o recurso gráfico en Supabase Storage
  fechaCreacion: Date | string;
  fechaActualizacion?: Date | string;
}

/**
 * Objeto de Transferencia de Datos (DTO) para dar de alta un producto.
 * Omite campos autogenerados por la base de datos (id, fechas, entidad anidada).
 */
export type CrearProductoDTO = Omit<Producto, 'id' | 'categoria' | 'fechaCreacion' | 'fechaActualizacion'>;

/**
 * DTO para la edición parcial de los datos de un producto existente.
 */
export type ActualizarProductoDTO = Partial<CrearProductoDTO>;

