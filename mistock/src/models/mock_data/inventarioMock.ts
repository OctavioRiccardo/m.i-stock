/**
 * ====================================================================
 * INVENTARIO INICIAL (RAMA TEST - DATOS REALES EN BLANCO)
 * ====================================================================
 * 
 * Propósito:
 * Iniciar el catálogo de categorías y productos completamente vacío (0 datos simulados)
 * para realizar pruebas y carga de inventario con datos reales del comercio.
 */

import { Categoria, Producto } from '@/models/modelos_dominio/productoModel';

/**
 * Catálogo de categorías inicial (vacío para pruebas con datos reales).
 */
export const initialCategorias: Categoria[] = [];

/**
 * Catálogo maestro de productos inicial (vacío para pruebas con datos reales).
 */
export const initialProductos: Producto[] = [];
