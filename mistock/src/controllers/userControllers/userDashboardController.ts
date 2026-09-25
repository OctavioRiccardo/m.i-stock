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
  ventasDelDia: 14,
  recaudacionDelDia: 48500,
  totalProductosEnStock: 320,
  ventasRecientes: [
    { id: 'VNT-101', hora: '10:45', montoTotal: 3500, cantidadItems: 2 },
    { id: 'VNT-102', hora: '11:15', montoTotal: 12000, cantidadItems: 5 },
    { id: 'VNT-103', hora: '12:00', montoTotal: 4800, cantidadItems: 1 },
  ],
  productosPopulares: [
    { id: 'P1', nombre: 'Aceite de Oliva 500ml', categoria: 'Almacén', precio: 4500, stock: 24, codigo: '779001' },
    { id: 'P2', nombre: 'Café Molido 250g', categoria: 'Bebidas', precio: 3200, stock: 15, codigo: '779002' },
    { id: 'P3', nombre: 'Detergente Concentrado 1L', categoria: 'Limpieza', precio: 2800, stock: 8, codigo: '779003' },
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
  const filteredProducts = data.productosPopulares.filter(
    (product) =>
      product.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.codigo.includes(searchQuery)
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
    const product = data.productosPopulares.find((p) => p.id === productId);

    // Validación de existencia y existencia de stock suficiente
    if (!product || product.stock <= 0) {
      setLoading(false);
      return;
    }

    // Decremento reactivo de stock en el catálogo local
    const updatedProducts = data.productosPopulares.map((p) =>
      p.id === productId ? { ...p, stock: p.stock - 1 } : p
    );

    // Creación del comprobante de venta reciente
    const newSale = {
      id: `VNT-${Date.now().toString().slice(-3)}`,
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      montoTotal: product.precio,
      cantidadItems: 1,
    };

    // Actualización atómica de los indicadores diarios del empleado
    setData((prev) => ({
      ...prev,
      ventasDelDia: prev.ventasDelDia + 1,
      recaudacionDelDia: prev.recaudacionDelDia + product.precio,
      productosPopulares: updatedProducts,
      ventasRecientes: [newSale, ...prev.ventasRecientes],
    }));

    setSaleSuccessMessage(`Venta registrada: ${product.nombre} ($${product.precio.toLocaleString('es-AR')})`);
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
