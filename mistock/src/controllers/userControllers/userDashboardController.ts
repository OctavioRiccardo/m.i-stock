'use client';

/**
 * ====================================================================
 * CONTROLADOR DEL PANEL DE EMPLEADO / CAJERO (Patrón MVC)
 * ====================================================================
 * 
 * Propósito:
 * Gestionar la operativa diaria en el punto de venta (POS) para el rol de usuario/empleado:
 * búsqueda rápida en catálogo, registro ágil de ventas, descuento automático de stock
 * y seguimiento de métricas diarias (recaudación e historial inmediato).
 * 
 * Rol en la Arquitectura:
 * - Es la capa Controller ("C") consumida por `UserDashboardView` (View).
 * - Utiliza las estructuras de `UserDashboardData` (ViewModel) para aislar a la interfaz
 *   de las operaciones de cálculo de ventas y control de inventario en tiempo real.
 */

import { useState } from 'react';
import { UserDashboardData } from '@/models/modelos_vista/dashboardModel';

/**
 * Datos simulados iniciales para la operativa del empleado (Cajero/Ventas).
 * Permite simular transacciones comerciales y actualización de stock sin persistencia inmediata.
 */
const initialMockUserData: UserDashboardData = {
  dailySalesCount: 14,
  dailyRevenue: 48500,
  totalProductsInStock: 320,
  recentSales: [
    { id: 'VNT-101', time: '10:45 AM', totalAmount: 3500, itemCount: 2 },
    { id: 'VNT-102', time: '11:15 AM', totalAmount: 12000, itemCount: 5 },
    { id: 'VNT-103', time: '12:00 PM', totalAmount: 4800, itemCount: 1 },
  ],
  popularProducts: [
    { id: 'P1', name: 'Aceite de Oliva 500ml', category: 'Almacén', price: 4500, stock: 24, code: '779001' },
    { id: 'P2', name: 'Café Molido 250g', category: 'Bebidas', price: 3200, stock: 15, code: '779002' },
    { id: 'P3', name: 'Detergente Concentrado 1L', category: 'Limpieza', price: 2800, stock: 8, code: '779003' },
  ],
};

/**
 * Hook Controlador para el Panel del Operador / Empleado.
 * 
 * Responsabilidades:
 * 1. Exponer métricas de recaudación y ventas del día.
 * 2. Filtrar reactivamente el catálogo según término de búsqueda (nombre o código).
 * 3. Ejecutar ventas rápidas: descuenta stock disponible y actualiza totales diarios.
 * 4. Gestionar avisos temporales de confirmación de venta.
 * 
 * @returns {Object} Estado del POS, lista filtrada de productos y función handleQuickSale.
 */
export function useUserDashboardController() {
  const [data, setData] = useState<UserDashboardData>(initialMockUserData);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [saleSuccessMessage, setSaleSuccessMessage] = useState<string | null>(null);

  // Filtrado reactivo en tiempo real para búsqueda instantánea en el punto de venta
  const filteredProducts = data.popularProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.code.includes(searchQuery)
  );

  /**
   * Procesa una venta rápida de 1 unidad del producto seleccionado:
   * 1. Verifica disponibilidad de stock (> 0).
   * 2. Decrementa en 1 unidad el stock actual del producto.
   * 3. Incrementa el contador de ventas del día y el total monetario recaudado.
   * 4. Registra la transacción en la lista de ventas recientes con timestamp local.
   * 5. Emite notificación temporal para retroalimentación visual al cajero.
   * 
   * @param {string} productId - Identificador del producto a vender.
   */
  const handleQuickSale = (productId: string) => {
    setLoading(true);
    const product = data.popularProducts.find((p) => p.id === productId);

    // Validación de existencia y existencia de stock suficiente
    if (!product || product.stock <= 0) {
      setLoading(false);
      return;
    }

    // Decremento reactivo de stock en el catálogo local
    const updatedProducts = data.popularProducts.map((p) =>
      p.id === productId ? { ...p, stock: p.stock - 1 } : p
    );

    // Creación del comprobante de venta reciente
    const newSale = {
      id: `VNT-${Date.now().toString().slice(-3)}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      totalAmount: product.price,
      itemCount: 1,
    };

    // Actualización atómica de los indicadores diarios del empleado
    setData((prev) => ({
      ...prev,
      dailySalesCount: prev.dailySalesCount + 1,
      dailyRevenue: prev.dailyRevenue + product.price,
      popularProducts: updatedProducts,
      recentSales: [newSale, ...prev.recentSales],
    }));

    setSaleSuccessMessage(`Venta registrada: ${product.name} ($${product.price.toLocaleString('es-AR')})`);
    setLoading(false);

    // Limpieza automática del banner de confirmación a los 3 segundos
    setTimeout(() => setSaleSuccessMessage(null), 3000);
  };

  return {
    data,
    loading,
    searchQuery,
    setSearchQuery,
    filteredProducts,
    saleSuccessMessage,
    handleQuickSale,
  };
}
