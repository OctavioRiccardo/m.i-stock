'use client';

import { useState, useEffect } from 'react';
import { UserDashboardData, QuickProduct } from '@/models/modelos_vista/dashboardModel';

// Mock data inicial didáctico (que luego se conectará a las tablas Supabase 'Producto' y 'Venta')
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

export function useUserDashboardController() {
  const [data, setData] = useState<UserDashboardData>(initialMockUserData);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [saleSuccessMessage, setSaleSuccessMessage] = useState<string | null>(null);

  // Filtrado reactivo de productos para búsqueda rápida en el punto de venta
  const filteredProducts = data.popularProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.code.includes(searchQuery)
  );

  /**
   * Registra una venta rápida de producto
   */
  const handleQuickSale = (productId: string) => {
    setLoading(true);
    const product = data.popularProducts.find((p) => p.id === productId);

    if (!product || product.stock <= 0) {
      setLoading(false);
      return;
    }

    // Descontar stock localmente (simulado)
    const updatedProducts = data.popularProducts.map((p) =>
      p.id === productId ? { ...p, stock: p.stock - 1 } : p
    );

    const newSale = {
      id: `VNT-${Date.now().toString().slice(-3)}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      totalAmount: product.price,
      itemCount: 1,
    };

    setData((prev) => ({
      ...prev,
      dailySalesCount: prev.dailySalesCount + 1,
      dailyRevenue: prev.dailyRevenue + product.price,
      popularProducts: updatedProducts,
      recentSales: [newSale, ...prev.recentSales],
    }));

    setSaleSuccessMessage(`Venta registrada: ${product.name} ($${product.price})`);
    setLoading(false);

    // Auto limpiar mensaje
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
