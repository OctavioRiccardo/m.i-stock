import { UnidadMedida } from '@/models/modelos_dominio/productoModel';

/**
 * ====================================================================
 * MODELO DE VISTA: FORMULARIO DE CARGA DE PRODUCTO (ViewModel)
 * ====================================================================
 * 
 * Propósito:
 * Define las estructuras de datos exclusivas de la interfaz de usuario para el alta de productos:
 * - Estado de los campos de entrada del formulario interactivo.
 * - Valores iniciales por defecto para el reseteo del formulario.
 * - Estados de UI (indicadores de guardado, carga de selectores, modales).
 * - Métricas de rentabilidad calculadas en vivo al momento de la digitación de costos.
 */

/**
 * Representa los campos controlados del formulario de alta de producto.
 */
export interface FormularioCargaProducto {
  codigo: string;             // Código de barras (EAN/UPC) o SKU interno autogenerado
  nombre: string;             // Nombre comercial del producto
  descripcion: string;        // Descripción o especificaciones adicionales
  categoriaId: string;        // ID de la categoría seleccionada (campo obligatorio por regla de negocio)
  unidadMedida: UnidadMedida; // Unidad de medida ('unidad', 'kg', 'litro', etc.)
  precioCosto: number;        // Costo de compra o adquisición
  precioVenta: number;        // Precio final de venta al público
  stockInicial: number;       // Cantidad física inicial ingresada al inventario
  stockMinimo: number;        // Umbral de alerta para reposición de stock crítico
  ubicacion?: string;         // Referencia física en depósito (ej: "Estante 3 - Pasillo A")
  proveedor?: string;         // Nombre o razón social del distribuidor
  motivoIngreso?: string;     // Justificación del alta (ej: "Inventario inicial", "Compra mayorista")
}

/**
 * Valores por defecto para inicializar el formulario en la vista
 */
export const valoresInicialesCargaProducto: FormularioCargaProducto = {
  codigo: '',
  nombre: '',
  descripcion: '',
  categoriaId: '',
  unidadMedida: 'unidad',
  precioCosto: 0,
  precioVenta: 0,
  stockInicial: 1,
  stockMinimo: 5,
  ubicacion: '',
  proveedor: '',
  motivoIngreso: 'Alta inicial en inventario',
};

/**
 * Estado general de la pantalla de carga (UI State)
 */
export interface CargaProductoViewState {
  cargandoCategorias: boolean;
  guardando: boolean;
  error: string | null;
  mensajeExito: string | null;
  categoriasOpciones: { value: string; label: string }[];
  unidadesOpciones: { value: UnidadMedida; label: string }[];
}

/**
 * Métricas de rentabilidad calculadas en vivo en el formulario
 * Permite al usuario ver su margen de ganancia antes de guardar.
 */
export interface MetricasRentabilidad {
  gananciaNeta: number;     // precioVenta - precioCosto
  margenPorcentaje: number; // ((precioVenta - precioCosto) / precioCosto) * 100
  esRentable: boolean;      // true si precioVenta > precioCosto
}

/**
 * Resultado devuelto por el controlador tras intentar persistir en la BD
 */
export interface ResultadoCargaProducto {
  exito: boolean;
  mensaje: string;
  productoId?: string;
}
