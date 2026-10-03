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
  kpiMetrics: [
    { title: 'Recaudación del Mes', value: '$1.450.000', changePercentage: '+12.5%', status: 'positive' },
    { title: 'Ticket Promedio Mensual', value: '$8.630', changePercentage: '+4.2%', status: 'positive' },
    { title: 'Operaciones Concretadas', value: '168 ventas', changePercentage: '+8.1%', status: 'positive' },
    { title: 'Unidades Despachadas', value: '640 un.', changePercentage: '+15.3%', status: 'positive' },
  ],
  productosMasVendidos: [
    {
      id: 'TOP-1',
      nombre: 'Yerba Mate Especial 1kg',
      codigo: 'ALM-YER-1001',
      categoria: 'Almacén',
      unidadesVendidas: 185,
      stockActual: 24,
      montoTotal: 425500,
      tendencia: 'alza',
    },
    {
      id: 'TOP-2',
      nombre: 'Leche Larga Vida Entera 1L',
      codigo: 'LAC-LEC-1002',
      categoria: 'Lácteos',
      unidadesVendidas: 142,
      stockActual: 8,
      montoTotal: 184600,
      tendencia: 'alza',
    },
    {
      id: 'TOP-3',
      nombre: 'Gaseosa Cola 1.5L',
      codigo: 'BEB-COL-1003',
      categoria: 'Bebidas',
      unidadesVendidas: 118,
      stockActual: 35,
      montoTotal: 295000,
      tendencia: 'alza',
    },
    {
      id: 'TOP-4',
      nombre: 'Pan Lactal Familiar 500g',
      codigo: 'PAN-LAC-1004',
      categoria: 'Panadería',
      unidadesVendidas: 96,
      stockActual: 12,
      montoTotal: 144000,
      tendencia: 'alza',
    },
    {
      id: 'TOP-5',
      nombre: 'Arroz Largo Fino 1kg',
      codigo: 'ALM-ARR-1005',
      categoria: 'Almacén',
      unidadesVendidas: 88,
      stockActual: 40,
      montoTotal: 132000,
      tendencia: 'alza',
    },
    {
      id: 'TOP-6',
      nombre: 'Fideos Guiseros 500g',
      codigo: 'ALM-FID-1006',
      categoria: 'Almacén',
      unidadesVendidas: 76,
      stockActual: 32,
      montoTotal: 98800,
      tendencia: 'alza',
    },
    {
      id: 'TOP-7',
      nombre: 'Galletitas Dulces Surtidas 400g',
      codigo: 'GAL-SUR-1007',
      categoria: 'Galletitas',
      unidadesVendidas: 65,
      stockActual: 18,
      montoTotal: 97500,
      tendencia: 'alza',
    },
    {
      id: 'TOP-8',
      nombre: 'Queso Cremoso 1kg',
      codigo: 'LAC-QUE-1008',
      categoria: 'Lácteos',
      unidadesVendidas: 54,
      stockActual: 14,
      montoTotal: 243000,
      tendencia: 'alza',
    },
    {
      id: 'TOP-9',
      nombre: 'Agua Mineral sin Gas 2L',
      codigo: 'BEB-AGU-1009',
      categoria: 'Bebidas',
      unidadesVendidas: 49,
      stockActual: 45,
      montoTotal: 58800,
      tendencia: 'alza',
    },
    {
      id: 'TOP-10',
      nombre: 'Manteca Calidad Extra 200g',
      codigo: 'LAC-MAN-1010',
      categoria: 'Lácteos',
      unidadesVendidas: 42,
      stockActual: 16,
      montoTotal: 92400,
      tendencia: 'alza',
    },
  ],
  productosMenosVendidos: [
    {
      id: 'LOW-1',
      nombre: 'Lavandina Concentrada 5L',
      codigo: 'LIM-LAV-2001',
      categoria: 'Limpieza',
      unidadesVendidas: 1,
      stockActual: 42,
      montoTotal: 4500,
      tendencia: 'estancada',
    },
    {
      id: 'LOW-2',
      nombre: 'Esponja Multiuso Pack x3',
      codigo: 'LIM-ESP-2002',
      categoria: 'Limpieza',
      unidadesVendidas: 2,
      stockActual: 60,
      montoTotal: 3200,
      tendencia: 'baja',
    },
    {
      id: 'LOW-3',
      nombre: 'Té Verde en Saquitos x20',
      codigo: 'INF-TEV-2003',
      categoria: 'Infusiones',
      unidadesVendidas: 3,
      stockActual: 30,
      montoTotal: 5400,
      tendencia: 'baja',
    },
    {
      id: 'LOW-4',
      nombre: 'Galletitas de Salvado 200g',
      codigo: 'GAL-SAL-2004',
      categoria: 'Galletitas',
      unidadesVendidas: 4,
      stockActual: 28,
      montoTotal: 7200,
      tendencia: 'estancada',
    },
    {
      id: 'LOW-5',
      nombre: 'Sal Fina Dosificador 500g',
      codigo: 'ALM-SAL-2005',
      categoria: 'Almacén',
      unidadesVendidas: 5,
      stockActual: 55,
      montoTotal: 6000,
      tendencia: 'baja',
    },
    {
      id: 'LOW-6',
      nombre: 'Vinagre de Manzana 500ml',
      codigo: 'ALM-VIN-2006',
      categoria: 'Almacén',
      unidadesVendidas: 5,
      stockActual: 34,
      montoTotal: 7500,
      tendencia: 'estancada',
    },
    {
      id: 'LOW-7',
      nombre: 'Limpiador de Pisos Lavanda 900ml',
      codigo: 'LIM-PIS-2007',
      categoria: 'Limpieza',
      unidadesVendidas: 6,
      stockActual: 48,
      montoTotal: 10800,
      tendencia: 'baja',
    },
    {
      id: 'LOW-8',
      nombre: 'Servilletas de Papel x80',
      codigo: 'PAP-SER-2008',
      categoria: 'Limpieza',
      unidadesVendidas: 7,
      stockActual: 50,
      montoTotal: 8400,
      tendencia: 'baja',
    },
    {
      id: 'LOW-9',
      nombre: 'Edulcorante Líquido 200ml',
      codigo: 'ALM-EDU-2009',
      categoria: 'Almacén',
      unidadesVendidas: 8,
      stockActual: 26,
      montoTotal: 12800,
      tendencia: 'baja',
    },
    {
      id: 'LOW-10',
      nombre: 'Lentejas Selección 400g',
      codigo: 'ALM-LEN-2010',
      categoria: 'Almacén',
      unidadesVendidas: 9,
      stockActual: 38,
      montoTotal: 14400,
      tendencia: 'estancada',
    },
  ],
  ventasDetalle: {
    resumenSemana: {
      totalRecaudado: 385400,
      cantidadVentas: 42,
      ticketPromedio: 9176,
      unidadesTotales: 156,
    },
    resumenMes: {
      totalRecaudado: 1450000,
      cantidadVentas: 168,
      ticketPromedio: 8630,
      unidadesTotales: 640,
    },
    ventasSemana: [
      {
        id: 'VNT-SEM-01',
        codigoComprobante: 'VNT-1048',
        fechaHora: 'Hoy, 18:30',
        vendedor: 'Octavio Riccardo',
        metodoPago: 'tarjeta_debito',
        cantidadItems: 4,
        total: 18500,
        estado: 'completada',
      },
      {
        id: 'VNT-SEM-02',
        codigoComprobante: 'VNT-1047',
        fechaHora: 'Hoy, 17:15',
        vendedor: 'Empleado Mañana',
        metodoPago: 'efectivo',
        cantidadItems: 2,
        total: 7200,
        estado: 'completada',
      },
      {
        id: 'VNT-SEM-03',
        codigoComprobante: 'VNT-1046',
        fechaHora: 'Hoy, 15:40',
        vendedor: 'Empleado Mañana',
        metodoPago: 'transferencia',
        cantidadItems: 6,
        total: 24600,
        estado: 'completada',
      },
      {
        id: 'VNT-SEM-04',
        codigoComprobante: 'VNT-1045',
        fechaHora: 'Ayer, 19:10',
        vendedor: 'Octavio Riccardo',
        metodoPago: 'tarjeta_credito',
        cantidadItems: 5,
        total: 31200,
        estado: 'completada',
      },
      {
        id: 'VNT-SEM-05',
        codigoComprobante: 'VNT-1044',
        fechaHora: 'Ayer, 16:50',
        vendedor: 'Empleado Mañana',
        metodoPago: 'efectivo',
        cantidadItems: 1,
        total: 4500,
        estado: 'completada',
      },
      {
        id: 'VNT-SEM-06',
        codigoComprobante: 'VNT-1043',
        fechaHora: 'Ayer, 12:20',
        vendedor: 'Empleado Mañana',
        metodoPago: 'tarjeta_debito',
        cantidadItems: 3,
        total: 13800,
        estado: 'completada',
      },
      {
        id: 'VNT-SEM-07',
        codigoComprobante: 'VNT-1042',
        fechaHora: 'Mar 23, 18:05',
        vendedor: 'Octavio Riccardo',
        metodoPago: 'efectivo',
        cantidadItems: 2,
        total: 8900,
        estado: 'completada',
      },
      {
        id: 'VNT-SEM-08',
        codigoComprobante: 'VNT-1041',
        fechaHora: 'Mar 23, 14:30',
        vendedor: 'Empleado Mañana',
        metodoPago: 'transferencia',
        cantidadItems: 7,
        total: 28400,
        estado: 'completada',
      },
      {
        id: 'VNT-SEM-09',
        codigoComprobante: 'VNT-1040',
        fechaHora: 'Lun 22, 17:45',
        vendedor: 'Octavio Riccardo',
        metodoPago: 'tarjeta_credito',
        cantidadItems: 4,
        total: 19500,
        estado: 'completada',
      },
      {
        id: 'VNT-SEM-10',
        codigoComprobante: 'VNT-1039',
        fechaHora: 'Lun 22, 11:15',
        vendedor: 'Empleado Mañana',
        metodoPago: 'efectivo',
        cantidadItems: 3,
        total: 11200,
        estado: 'completada',
      },
    ],
    ventasMes: [
      {
        id: 'VNT-MES-01',
        codigoComprobante: 'VNT-1048',
        fechaHora: '24 Sep, 18:30',
        vendedor: 'Octavio Riccardo',
        metodoPago: 'tarjeta_debito',
        cantidadItems: 4,
        total: 18500,
        estado: 'completada',
      },
      {
        id: 'VNT-MES-02',
        codigoComprobante: 'VNT-1045',
        fechaHora: '23 Sep, 19:10',
        vendedor: 'Octavio Riccardo',
        metodoPago: 'tarjeta_credito',
        cantidadItems: 5,
        total: 31200,
        estado: 'completada',
      },
      {
        id: 'VNT-MES-03',
        codigoComprobante: 'VNT-1038',
        fechaHora: '20 Sep, 16:00',
        vendedor: 'Empleado Mañana',
        metodoPago: 'transferencia',
        cantidadItems: 8,
        total: 42100,
        estado: 'completada',
      },
      {
        id: 'VNT-MES-04',
        codigoComprobante: 'VNT-1032',
        fechaHora: '18 Sep, 13:40',
        vendedor: 'Octavio Riccardo',
        metodoPago: 'efectivo',
        cantidadItems: 3,
        total: 9800,
        estado: 'completada',
      },
      {
        id: 'VNT-MES-05',
        codigoComprobante: 'VNT-1025',
        fechaHora: '15 Sep, 17:25',
        vendedor: 'Empleado Mañana',
        metodoPago: 'tarjeta_debito',
        cantidadItems: 6,
        total: 27500,
        estado: 'completada',
      },
      {
        id: 'VNT-MES-06',
        codigoComprobante: 'VNT-1019',
        fechaHora: '12 Sep, 19:00',
        vendedor: 'Octavio Riccardo',
        metodoPago: 'tarjeta_credito',
        cantidadItems: 4,
        total: 21400,
        estado: 'completada',
      },
      {
        id: 'VNT-MES-07',
        codigoComprobante: 'VNT-1014',
        fechaHora: '10 Sep, 11:30',
        vendedor: 'Empleado Mañana',
        metodoPago: 'efectivo',
        cantidadItems: 2,
        total: 6500,
        estado: 'completada',
      },
      {
        id: 'VNT-MES-08',
        codigoComprobante: 'VNT-1008',
        fechaHora: '07 Sep, 15:10',
        vendedor: 'Octavio Riccardo',
        metodoPago: 'transferencia',
        cantidadItems: 9,
        total: 51200,
        estado: 'completada',
      },
      {
        id: 'VNT-MES-09',
        codigoComprobante: 'VNT-1003',
        fechaHora: '04 Sep, 18:45',
        vendedor: 'Empleado Mañana',
        metodoPago: 'efectivo',
        cantidadItems: 3,
        total: 12400,
        estado: 'completada',
      },
      {
        id: 'VNT-MES-10',
        codigoComprobante: 'VNT-0998',
        fechaHora: '01 Sep, 10:20',
        vendedor: 'Octavio Riccardo',
        metodoPago: 'tarjeta_debito',
        cantidadItems: 5,
        total: 23800,
        estado: 'completada',
      },
      {
        id: 'VNT-MES-11',
        codigoComprobante: 'VNT-0992',
        fechaHora: '28 Ago, 18:00',
        vendedor: 'Empleado Mañana',
        metodoPago: 'efectivo',
        cantidadItems: 2,
        total: 8100,
        estado: 'completada',
      },
      {
        id: 'VNT-MES-12',
        codigoComprobante: 'VNT-0985',
        fechaHora: '26 Ago, 16:30',
        vendedor: 'Octavio Riccardo',
        metodoPago: 'tarjeta_credito',
        cantidadItems: 6,
        total: 33400,
        estado: 'completada',
      },
    ],
  },
  graficos: {
    tendenciaSemana: [
      { fecha: 'Lun', 'Recaudación Actual': 48000, 'Período Anterior': 42000 },
      { fecha: 'Mar', 'Recaudación Actual': 56500, 'Período Anterior': 49000 },
      { fecha: 'Mié', 'Recaudación Actual': 62000, 'Período Anterior': 54000 },
      { fecha: 'Jue', 'Recaudación Actual': 58400, 'Período Anterior': 51000 },
      { fecha: 'Vie', 'Recaudación Actual': 74000, 'Período Anterior': 68000 },
      { fecha: 'Sáb', 'Recaudación Actual': 86500, 'Período Anterior': 78000 },
    ],
    tendenciaMes: [
      { fecha: 'Semana 1', 'Recaudación Actual': 320000, 'Período Anterior': 290000 },
      { fecha: 'Semana 2', 'Recaudación Actual': 385400, 'Período Anterior': 340000 },
      { fecha: 'Semana 3', 'Recaudación Actual': 365000, 'Período Anterior': 350000 },
      { fecha: 'Semana 4', 'Recaudación Actual': 379600, 'Período Anterior': 360000 },
    ],
    distribucionPagosSemana: [
      { metodo: 'Mercado Pago (Point)', monto: 154200, porcentaje: 40 },
      { metodo: 'Efectivo', monto: 142600, porcentaje: 37 },
      { metodo: 'Transferencia', monto: 57800, porcentaje: 15 },
      { metodo: 'Tarjeta Débito/Crédito', monto: 30800, porcentaje: 8 },
    ],
    distribucionPagosMes: [
      { metodo: 'Mercado Pago (Point)', monto: 580000, porcentaje: 40 },
      { metodo: 'Efectivo', monto: 536500, porcentaje: 37 },
      { metodo: 'Transferencia', monto: 217500, porcentaje: 15 },
      { metodo: 'Tarjeta Débito/Crédito', monto: 116000, porcentaje: 8 },
    ],
    barrasVentasSemana: [
      { periodo: 'Lun', 'Monto Facturado': 48000, Operaciones: 8 },
      { periodo: 'Mar', 'Monto Facturado': 56500, Operaciones: 10 },
      { periodo: 'Mié', 'Monto Facturado': 62000, Operaciones: 12 },
      { periodo: 'Jue', 'Monto Facturado': 58400, Operaciones: 9 },
      { periodo: 'Vie', 'Monto Facturado': 74000, Operaciones: 14 },
      { periodo: 'Sáb', 'Monto Facturado': 86500, Operaciones: 18 },
    ],
    barrasVentasMes: [
      { periodo: 'Semana 1', 'Monto Facturado': 320000, Operaciones: 38 },
      { periodo: 'Semana 2', 'Monto Facturado': 385400, Operaciones: 42 },
      { periodo: 'Semana 3', 'Monto Facturado': 365000, Operaciones: 41 },
      { periodo: 'Semana 4', 'Monto Facturado': 379600, Operaciones: 47 },
    ],
  },
};

export type RotacionTab = 'mas_vendidos' | 'menos_vendidos';
export type PeriodoVentasTab = 'semana' | 'mes';

/**
 * Hook Controlador para el Dashboard del Administrador.
 * 
 * Responsabilidades:
 * 1. Proveer los KPIs operacionales y financieros consolidados de rendimiento del negocio.
 * 2. Analizar la rotación de stock (más vendidos vs menos vendidos) con filtrado por categoría y paginación.
 * 3. Gestionar la evolución temporal de facturación (semana vs mes) y ritmo de cobros.
 * 4. Controlar el desglose de detalle de ventas y métodos de pago.
 * 
 * @returns {Object} Estado consolidado del panel y métodos de interacción.
 */
export function useAdminDashboardController() {
  // Estado principal que contiene métricas agregadas y datos analíticos
  const [data] = useState<AdminDashboardData>(initialMockAdminData);

  // Pestaña activa para la tarjeta de rotación de productos ('mas_vendidos' | 'menos_vendidos')
  const [rotacionTab, setRotacionTab] = useState<RotacionTab>('mas_vendidos');

  // Filtro de categoría activa para rotación de productos ('Todas' | nombre de categoría)
  const [categoriaRotacion, setCategoriaRotacion] = useState<string>('Todas');

  // Paginación para Rotación de Stock
  const [paginaRotacion, setPaginaRotacion] = useState<number>(1);
  const itemsPorPaginaRotacion = 5;

  // Indicador de carga para operaciones asíncronas del dashboard
  const [loading] = useState<boolean>(false);

  /**
   * Cambia la pestaña de rotación y reinicia la paginación a la primera página.
   */
  const cambiarTabRotacion = (tab: RotacionTab) => {
    setRotacionTab(tab);
    setPaginaRotacion(1);
  };

  /**
   * Cambia la categoría de rotación y reinicia la paginación a la primera página.
   */
  const cambiarCategoriaRotacion = (categoria: string) => {
    setCategoriaRotacion(categoria);
    setPaginaRotacion(1);
  };

  // Pestaña activa para el detalle de ventas ('semana' | 'mes')
  const [periodoVentasTab, setPeriodoVentasTab] = useState<PeriodoVentasTab>('semana');

  // Paginación para Detalle de Ventas
  const [paginaVentas, setPaginaVentas] = useState<number>(1);
  const itemsPorPaginaVentas = 5;

  /**
   * Cambia el período de ventas activo (semana o mes) y reinicia la paginación a la primera página.
   */
  const cambiarPeriodoVentas = (tab: PeriodoVentasTab) => {
    setPeriodoVentasTab(tab);
    setPaginaVentas(1);
  };

  return {
    data,
    loading,
    rotacionTab,
    cambiarTabRotacion,
    categoriaRotacion,
    cambiarCategoriaRotacion,
    paginaRotacion,
    setPaginaRotacion,
    itemsPorPaginaRotacion,
    periodoVentasTab,
    cambiarPeriodoVentas,
    paginaVentas,
    setPaginaVentas,
    itemsPorPaginaVentas,
  };
}
