'use client';

import React from 'react';
import {
  Search,
  ShoppingCart,
  Package,
  Check,
  Clock,
  Plus,
  DollarSign,
} from 'lucide-react';
import { useUserDashboardController } from '@/controllers/userControllers/userDashboardController';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface UserDashboardViewProps {
  controller: ReturnType<typeof useUserDashboardController>;
}

export function UserDashboardView({ controller }: UserDashboardViewProps) {
  const {
    data,
    searchQuery,
    setSearchQuery,
    filteredProducts,
    saleSuccessMessage,
    handleQuickSale,
  } = controller;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1C2424] tracking-tight">
            Panel del Empleado
          </h1>
          <p className="text-sm text-[#657373]">
            Consulta de catálogo y registro rápido de ventas en caja.
          </p>
        </div>

        <Badge variant="default" className="text-xs py-1 px-3 self-start sm:self-auto">
          Operación Activa
        </Badge>
      </div>

      {/* Sale Success Notification */}
      {saleSuccessMessage && (
        <Alert variant="success">
          <Check className="h-4 w-4" />
          <AlertTitle>¡Venta Exitosa!</AlertTitle>
          <AlertDescription>{saleSuccessMessage}</AlertDescription>
        </Alert>
      )}

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#657373]">
              Ventas del Día
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E2F1F0] text-[#2A7A78]">
              <ShoppingCart className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#1C2424] tracking-tight mt-3">
            {data.dailySalesCount}
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#657373]">
              Recaudación Hoy
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E2F1F0] text-[#2A7A78]">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#1C2424] tracking-tight mt-3">
            ${data.dailyRevenue.toLocaleString('es-AR')}
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#657373]">
              Productos en Catálogo
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E2F1F0] text-[#2A7A78]">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#1C2424] tracking-tight mt-3">
            {data.totalProductsInStock} ítems
          </p>
        </Card>
      </div>

      {/* Main Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Catálogo y Registro Rápido */}
        <div className="lg:col-span-7">
          <Card>
            <CardHeader className="pb-3 border-b border-[#E8E6DF]">
              <CardTitle className="text-base font-bold text-[#1C2424]">
                Catálogo y Registro Rápido
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              <div className="relative">
                <Input
                  placeholder="Buscar por nombre o código de barra (ej. 779001)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#657373]" />
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((prod) => (
                    <TableRow key={prod.id}>
                      <TableCell>
                        <div className="font-semibold text-sm text-[#1C2424]">{prod.name}</div>
                        <div className="text-xs text-[#657373]">
                          {prod.category} • Cod: {prod.code}
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-[#1C2424]">
                        ${prod.price.toLocaleString('es-AR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={prod.stock > 10 ? 'default' : 'destructive'}>
                          {prod.stock} un.
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleQuickSale(prod.id)}
                          disabled={prod.stock <= 0}
                          className="gap-1"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Vender</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Ventas Recientes */}
        <div className="lg:col-span-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[#E8E6DF]">
              <CardTitle className="text-base font-bold text-[#1C2424]">
                Ventas Recientes
              </CardTitle>
              <Clock className="h-4 w-4 text-[#2A7A78]" />
            </CardHeader>

            <CardContent className="pt-4 space-y-3">
              {data.recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-[#E8E6DF] bg-white"
                >
                  <div>
                    <p className="text-xs font-bold text-[#1C2424]">{sale.id}</p>
                    <p className="text-xs text-[#657373]">
                      Hora: {sale.time} • {sale.itemCount} ítem(s)
                    </p>
                  </div>
                  <span className="text-sm font-extrabold text-[#2A7A78]">
                    ${sale.totalAmount.toLocaleString('es-AR')}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
