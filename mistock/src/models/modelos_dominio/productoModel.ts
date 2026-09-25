/**
 * ====================================================================
 * MODELO DE DOMINIO: PRODUCTO Y CATEGORÍA
 * ====================================================================
 * 
 * Propósito:
 * Define las entidades fundamentales del catálogo de mercancías y su taxonomía.
 * Sincronizado 1:1 con las tablas `public.categorias` y `public.productos`
 * y el enum `public.unidad_medida` en Supabase PostgreSQL (`schema.sql`).
 * 
 * Regla de Integridad de Dominio:
 * Un `Producto` requiere estrictamente una `categoriaId` (`id_categoria`) válida.
 * No es posible instanciar ni persistir un producto huérfano en el sistema.
 */

/**
 * Unidades físicas de medida admitidas para el fraccionamiento o venta en el negocio.
 * Sincronizado con el enum `public.unidad_medida` en PostgreSQL.
 */
export type UnidadMedida = 'unidad' | 'kg' | 'gramo' | 'litro' | 'metro' | 'paquete';

/**
 * Fila cruda de la tabla `public.categorias` en PostgreSQL / Supabase.
 */
export interface CategoriaRow {
  id_categoria: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  creado_el: string;
  actualizado_el: string;
}

/**
 * Entidad de Dominio: Categoría de Productos en el Frontend.
 * Agrupa artículos según su naturaleza comercial (ej: 'Almacén', 'Limpieza', 'Bebidas').
 */
export interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  fechaCreacion?: Date | string;
  fechaActualizacion?: Date | string;
}

/**
 * Fila cruda de la tabla `public.productos` en PostgreSQL / Supabase.
 */
export interface ProductoRow {
  id_producto: string;
  id_categoria: string;
  nombre: string;
  descripcion: string | null;
  sku: string | null;
  precio_costo: number;
  precio_venta: number;
  stock_actual: number;
  stock_minimo: number;
  unidad_medida: UnidadMedida;
  imagen_url: string | null;
  oferta: boolean;
  activo: boolean;
  creado_el: string;
  actualizado_el: string;
}

/**
 * Entidad de Dominio: Producto.
 * Representa un artículo comercializable con precio, costos y existencia en depósito.
 */
export interface Producto {
  id: string;
  codigo: string;          // Código de barras (EAN/UPC) o SKU identificador único
  sku?: string;            // Nombre de columna nativa en Supabase (alias de codigo)
  nombre: string;          // Denominación comercial visible del artículo
  descripcion?: string;    // Información complementaria de presentación o marca
  precioVenta: number;     // Precio final unitario al consumidor (numeric(10,2))
  precioCosto: number;     // Costo de reposición o adquisición mayorista (numeric(10,2))
  stockActual: number;     // Cantidad disponible actualmente para la venta
  stockMinimo: number;     // Umbral de seguridad que dispara alertas de reposición
  categoriaId: string;     // Clave foránea obligatoria hacia la categoría contenedora (id_categoria)
  categoria?: Categoria;   // Objeto de categoría poblado (JOIN relacional)
  unidadMedida: UnidadMedida;
  oferta?: boolean;        // Indicador de producto promocional o con descuento
  activo: boolean;         // Control de disponibilidad operativa (baja lógica / soft-delete)
  imagenUrl?: string;      // URL de fotografía o recurso gráfico en Supabase Storage
  fechaCreacion: Date | string;
  fechaActualizacion?: Date | string;
}

/**
 * Transforma una fila cruda `ProductoRow` de Supabase a la entidad `Producto`.
 */
export function toProducto(row: ProductoRow, cat?: Categoria): Producto {
  return {
    id: row.id_producto,
    codigo: row.sku || '',
    sku: row.sku || '',
    nombre: row.nombre,
    descripcion: row.descripcion || '',
    precioVenta: Number(row.precio_venta),
    precioCosto: Number(row.precio_costo),
    stockActual: row.stock_actual,
    stockMinimo: row.stock_minimo,
    categoriaId: row.id_categoria,
    categoria: cat,
    unidadMedida: row.unidad_medida,
    oferta: row.oferta,
    activo: row.activo,
    imagenUrl: row.imagen_url || undefined,
    fechaCreacion: row.creado_el,
    fechaActualizacion: row.actualizado_el,
  };
}

/**
 * Transforma una fila cruda `CategoriaRow` de Supabase a la entidad `Categoria`.
 */
export function toCategoria(row: CategoriaRow): Categoria {
  return {
    id: row.id_categoria,
    nombre: row.nombre,
    descripcion: row.descripcion || '',
    activo: row.activo,
    fechaCreacion: row.creado_el,
    fechaActualizacion: row.actualizado_el,
  };
}

/**
 * Objeto de Transferencia de Datos (DTO) para dar de alta un producto.
 */
export type CrearProductoDTO = Omit<Producto, 'id' | 'categoria' | 'fechaCreacion' | 'fechaActualizacion'>;

/**
 * DTO para la edición parcial de los datos de un producto existente.
 */
export type ActualizarProductoDTO = Partial<CrearProductoDTO>;
