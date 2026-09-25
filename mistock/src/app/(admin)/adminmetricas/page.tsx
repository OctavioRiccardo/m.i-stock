/**
 * ====================================================================
 * RUTA: /adminmetricas (Redirección Canónica a /admin)
 * ====================================================================
 * 
 * Rol en la Arquitectura:
 * Redirige de forma permanente y canónica hacia `/admin`, evitando
 * la duplicación de rutas para el panel principal de métricas y dashboard.
 */

import { redirect } from 'next/navigation';

export default function AdminMetricasPage() {
  redirect('/admin');
}
