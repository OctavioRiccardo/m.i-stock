/**
 * ====================================================================
 * RUTA RAÍZ: / (Página de Inicio)
 * ====================================================================
 * 
 * Redirección canónica inicial hacia la pantalla de acceso (/login).
 */

import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/login');
}
