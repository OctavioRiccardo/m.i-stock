/**
 * ====================================================================
 * RUTA: /adminstockcritico (Redirección Canónica a /admininventarioglobal)
 * ====================================================================
 * 
 * Rol en la Arquitectura:
 * Redirige hacia `/admininventarioglobal` donde se audita y gestiona el
 * inventario unificado por familias de categorías y las alertas de stock crítico.
 */

import { redirect } from 'next/navigation';

export default function AdminStockCriticoPage() {
  redirect('/admininventarioglobal');
}
