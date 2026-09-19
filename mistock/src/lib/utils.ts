/**
 * ====================================================================
 * UTILIDADES GENERALES (Tailwind CSS & Clases Condicionales)
 * ====================================================================
 * 
 * Propósito:
 * Funciones de ayuda transversal para la composición limpia y dinámica
 * de clases de Tailwind CSS en los componentes de interfaz (Dub.co / shadcn style).
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina condicionalmente múltiples clases CSS y resuelve conflictos de cascada en Tailwind.
 * 
 * ¿Por qué se utiliza clsx + twMerge?
 * - `clsx`: Permite evaluar expresiones condicionales (ej: `isActive && 'bg-blue-500'`).
 * - `twMerge`: Previene que clases contradictorias colisionen en el DOM (ej: si se envía
 *   `px-4` y una prop posterior envía `px-2`, `twMerge` conserva únicamente la última).
 * 
 * @param inputs Lista de nombres de clase, arrays u objetos booleanos.
 * @returns Cadena de texto resultante con las clases combinadas y sin colisiones.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

