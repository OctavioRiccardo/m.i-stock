'use client';

import { useMemo, useState } from 'react';
import {
  ItemCarritoPOS,
  ProductoRapidoPOS,
  calcularTotalesCarrito,
} from '@/models/modelos_vista/dashboardModel';

export interface UseCarritoPosParams {
  cajaAbierta: boolean;
  permitirVentaSinStock: boolean;
  productosPopulares: ProductoRapidoPOS[];
  onError: (mensaje: string) => void;
}

export function useCarritoPos({
  cajaAbierta,
  permitirVentaSinStock,
  productosPopulares,
  onError,
}: UseCarritoPosParams) {
  const [carrito, setCarrito] = useState<ItemCarritoPOS[]>([]);

  const totales = useMemo(() => calcularTotalesCarrito(carrito), [carrito]);
  const totalCarrito = totales.total;
  const cantidadArticulosCarrito = totales.cantidadArticulos;

  const agregarAlCarrito = (
    producto: ProductoRapidoPOS,
    cantidadAAgregar: number = 1
  ): boolean => {
    if (!cajaAbierta) {
      onError(
        'La caja está cerrada. Abra la caja desde el botón superior antes de armar el carrito.'
      );
      return false;
    }

    if (producto.stock <= 0 && !permitirVentaSinStock) {
      onError(`"${producto.nombre}" no tiene unidades disponibles en stock.`);
      return false;
    }

    setCarrito((prev) => {
      const index = prev.findIndex((item) => item.producto.id === producto.id);
      if (index >= 0) {
        const itemExistente = prev[index];
        const nuevaCantidad = itemExistente.cantidad + cantidadAAgregar;

        if (nuevaCantidad > producto.stock && !permitirVentaSinStock) {
          onError(
            `No se pueden agregar más unidades de "${producto.nombre}". Stock disponible: ${producto.stock} un.`
          );
          return prev;
        }

        const actualizado = [...prev];
        actualizado[index] = {
          ...itemExistente,
          cantidad: nuevaCantidad,
          subtotal: nuevaCantidad * producto.precio,
        };
        return actualizado;
      }

      if (cantidadAAgregar > producto.stock && !permitirVentaSinStock) {
        onError(
          `Stock insuficiente para "${producto.nombre}". Disponible: ${producto.stock} un.`
        );
        return prev;
      }

      return [
        ...prev,
        {
          producto,
          cantidad: cantidadAAgregar,
          subtotal: cantidadAAgregar * producto.precio,
        },
      ];
    });

    return true;
  };

  const removerItemCarrito = (productoId: string) => {
    if (!cajaAbierta) return;
    setCarrito((prev) => prev.filter((item) => item.producto.id !== productoId));
  };

  const actualizarCantidadItem = (productoId: string, nuevaCantidad: number) => {
    if (!cajaAbierta) return;

    if (nuevaCantidad <= 0) {
      removerItemCarrito(productoId);
      return;
    }

    setCarrito((prev) => {
      const index = prev.findIndex((item) => item.producto.id === productoId);
      if (index === -1) return prev;

      const item = prev[index];
      const prod = productosPopulares.find((p) => p.id === productoId) || item.producto;

      if (nuevaCantidad > prod.stock && !permitirVentaSinStock) {
        onError(
          `Stock máximo alcanzado para "${prod.nombre}". Disponible: ${prod.stock} un.`
        );
        return prev;
      }

      const actualizado = [...prev];
      actualizado[index] = {
        ...item,
        cantidad: nuevaCantidad,
        subtotal: nuevaCantidad * item.producto.precio,
      };
      return actualizado;
    });
  };

  const vaciarCarrito = () => {
    if (!cajaAbierta) return;
    setCarrito([]);
  };

  const limpiarCarritoPostVenta = () => {
    setCarrito([]);
  };

  return {
    carrito,
    totalCarrito,
    cantidadArticulosCarrito,
    agregarAlCarrito,
    actualizarCantidadItem,
    removerItemCarrito,
    vaciarCarrito,
    limpiarCarritoPostVenta,
  };
}
