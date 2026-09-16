import { UnidadMedida } from '@/models/modelos_dominio/productoModel';

/**
 * ====================================================================
 * MODELO DE VISTA: CARGA / ALTA DE PRODUCTO EN INVENTARIO
 * Define los tipos para el formulario, estado de UI y métricas
 * calculadas en tiempo real para la pantalla de ingreso de productos.
 * ====================================================================
 */

/**
 * Valores del formulario de carga de producto (ideal para useForm de Mantine)
 */
export interface FormularioCargaProducto {
  codigo: string;             // Código de barras (EAN/UPC) o SKU interno
  nombre: string;             // Nombre comercial del producto
  descripcion: string;        // Descripción o detalles adicionales
  categoriaId: string;        // ID de la categoría seleccionada
  unidadMedida: UnidadMedida; // Unidad de medida ('unidad', 'kg', 'litro', etc.)
  precioCosto: number;        // Costo de compra o fabricación
  precioVenta: number;        // Precio final de venta al público
  stockInicial: number;       // Cantidad física con la que ingresa al inventario
  stockMinimo: number;        // Umbral de alerta para reposición de stock
  ubicacion?: string;         // Ubicación física (ej: "Estante 3 - Pasillo A")
  proveedor?: string;         // Nombre o contacto del proveedor (opcional)
  motivoIngreso?: string;     // Justificación del ingreso (ej: "Compra inicial", "Nuevo ingreso")
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
