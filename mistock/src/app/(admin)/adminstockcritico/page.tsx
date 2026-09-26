/**
 * ====================================================================
 * RUTA: /adminstockcritico (Redirección Canónica a /admin)
 * ====================================================================
 * 
 * Rol en la Arquitectura:
 * Redirige hacia `/admin` donde se gestionan las alertas de stock crítico
 * y la reposición de mercadería integrada en el dashboard.
 */

import { redirect } from 'next/navigation';

export default function AdminStockCriticoPage() {
  redirect('/admin');
}
