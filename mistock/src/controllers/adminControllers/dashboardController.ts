'use client';

/**
 * ====================================================================
 * CONTROLADOR DEL DASHBOARD DE ADMINISTRACIÓN (Patrón MVC)
 * ====================================================================
 * 
 * Propósito:
 * Gestionar los datos estratégicos del panel de control para el rol Administrador:
 * métricas financieras de facturación mensual, conteo de stock activo,
 * usuarios del sistema y atención prioritaria a alertas de stock crítico.
 * 
 * Rol en la Arquitectura:
 * - Es la capa "C" (Controller) que alimenta a `AdminDashboardView` (View).
 * - Consume las definiciones tipadas de `AdminDashboardData` (ViewModel).
 * - Desacopla la lógica de resolución de alertas y recálculo de indicadores
 *   de los componentes visuales de la interfaz de usuario.
 */

import { useState } from 'react';
import { AdminDashboardData } from '@/models/modelos_vista/dashboardModel';

/**
 * Datos iniciales simulados (Mock) para métricas y alertas del Administrador.
 * Permiten el desarrollo y pruebas de interfaz de usuario desacopladas de la BD.
 */
const initialMockAdminData: AdminDashboardData = {
  monthlyRevenue: 1450000,
  totalProducts: 480,
  activeUsersCount: 8,
  lowStockCount: 4,
  kpiMetrics: [
    { title: 'Ventas del Mes', value: '$1.450.000', changePercentage: '+12.5%', status: 'positive' },
    { title: 'Productos Activos', value: '480', changePercentage: '+4 nuevos', status: 'positive' },
    { title: 'Stock Crítico', value: '4 ítems', changePercentage: '-2 atendidos', status: 'negative' },
    { title: 'Usuarios del Sistema', value: '8 activos', status: 'neutral' },
  ],
  stockAlerts: [
    { id: 'ALT-1', productName: 'Jabón Líquido Manos 500ml', currentStock: 3, minThreshold: 10, category: 'Limpieza' },
    { id: 'ALT-2', productName: 'Papel Higiénico Pack x4', currentStock: 5, minThreshold: 15, category: 'Limpieza' },
    { id: 'ALT-3', productName: 'Leche Larga Vida 1L', currentStock: 2, minThreshold: 20, category: 'Lácteos' },
    { id: 'ALT-4', productName: 'Harina 0000 1kg', currentStock: 4, minThreshold: 12, category: 'Almacén' },
  ],
};

/**
 * Hook Controlador para el Dashboard del Administrador.
 * 
 * Responsabilidades:
 * 1. Proveer los KPIs operacionales y financieros consolidados.
 * 2. Gestionar la lista de alertas de stock por debajo del umbral mínimo.
 * 3. Procesar las solicitudes de reposición / resolución de alertas críticas.
 * 4. Gestionar estados temporales de notificación visual tras acciones del usuario.
 * 
 * @returns {Object} Estado consolidado del panel y método disparador de reposición.
 */
export function useAdminDashboardController() {
  // Estado principal que contiene métricas agregadas y alertas activas
  const [data, setData] = useState<AdminDashboardData>(initialMockAdminData);

  // Indicador de carga para operaciones asíncronas del dashboard
  const [loading, setLoading] = useState<boolean>(false);

  // Mensaje temporal de éxito tras resolver una alerta de stock
  const [alertResolvedMsg, setAlertResolvedMsg] = useState<string | null>(null);

  /**
   * Resuelve o gestiona una orden de reposición para un ítem en alerta crítica.
   * Disminuye el contador de stock crítico y remueve el ítem de la lista visible.
   * 
   * @param {string} alertId - Identificador único de la alerta de stock.
   */
  const handleRestockAlert = (alertId: string) => {
    setLoading(true);
    const alert = data.stockAlerts.find((a) => a.id === alertId);

    if (!alert) {
      setLoading(false);
      return;
    }

    // Filtra la alerta resuelta
    const updatedAlerts = data.stockAlerts.filter((a) => a.id !== alertId);

    // Actualiza métricas y alertas atómicamente
    setData((prev) => ({
      ...prev,
      lowStockCount: prev.lowStockCount - 1,
      stockAlerts: updatedAlerts,
    }));

    setAlertResolvedMsg(`Reposición solicitada para: ${alert.productName}`);
    setLoading(false);

    // Limpia la notificación tras 3 segundos
    setTimeout(() => setAlertResolvedMsg(null), 3000);
  };

  return {
    data,
    loading,
    alertResolvedMsg,
    handleRestockAlert,
  };
}
