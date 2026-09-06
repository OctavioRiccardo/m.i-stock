'use client';

import { useState } from 'react';
import { AdminDashboardData } from '@/models/dashboardModel';

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

export function useAdminDashboardController() {
  const [data, setData] = useState<AdminDashboardData>(initialMockAdminData);
  const [loading, setLoading] = useState<boolean>(false);
  const [alertResolvedMsg, setAlertResolvedMsg] = useState<string | null>(null);

  /**
   * Resuelve o repone stock de una alerta crítica
   */
  const handleRestockAlert = (alertId: string) => {
    setLoading(true);
    const alert = data.stockAlerts.find((a) => a.id === alertId);

    if (!alert) {
      setLoading(false);
      return;
    }

    const updatedAlerts = data.stockAlerts.filter((a) => a.id !== alertId);

    setData((prev) => ({
      ...prev,
      lowStockCount: prev.lowStockCount - 1,
      stockAlerts: updatedAlerts,
    }));

    setAlertResolvedMsg(`Reposición solicitada para: ${alert.productName}`);
    setLoading(false);

    setTimeout(() => setAlertResolvedMsg(null), 3000);
  };

  return {
    data,
    loading,
    alertResolvedMsg,
    handleRestockAlert,
  };
}
