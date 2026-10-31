/**
 * ====================================================================
 * MODELO DE VISTA: CONFIGURACIÓN GENERAL DEL SISTEMA (ViewModels)
 * ====================================================================
 * 
 * Propósito:
 * Define las estructuras de datos para la parametrización del negocio,
 * reglas operativas de venta en caja (POS), alertas de inventario y respaldos.
 */

export type ModoComprobante = 'no_fiscal' | 'factura_afip';
export type CondicionIva = 'monotributo' | 'responsable_inscripto' | 'consumidor_final';
export type AnchoPapelTicket = '80mm' | '58mm';

export interface ConfiguracionNegocio {
  nombreComercial: string;
  razonSocial: string;
  cuit: string;
  direccion: string;
  telefono: string;
  emailContacto: string;
  monedaSimbolo: string;
  monedaCodigo: string;
  condicionIva: CondicionIva;
  mensajeEncabezadoTicket: string;
  mensajePieTicket: string;
  // Parámetros de Validez Legal y Fiscal
  modoComprobante: ModoComprobante;
  mostrarAclaracionLegal: boolean; // Si es true, imprime "DOCUMENTO NO VÁLIDO COMO FACTURA"
  textoAclaracionLegal: string;
  puntoVenta: number;
}

export interface MetodosPagoConfig {
  efectivo: boolean;
  tarjeta_debito: boolean;
  tarjeta_credito: boolean;
  transferencia: boolean;
  mercado_pago: boolean;
}

export interface ConfiguracionPOS {
  numeroCaja: number;
  metodosPagoHabilitados: MetodosPagoConfig;
  permitirVentaSinStock: boolean;
  limiteDescuentoVendedor: number; // Porcentaje máximo (ej: 10)
  sonidoConfirmacionVenta: boolean;
  modoEscanerRapido: boolean;
  autoImprimirTicket: boolean;
  anchoPapelTicket: AnchoPapelTicket;
}

export interface ConfiguracionInventario {
  umbralMinimoPorDefecto: number;
  alertarMargenNegativo: boolean;
  requerirCategoriaEstricta?: boolean;
  controlarVencimientos: boolean;
}

export type PeriodoMetricas = 'diario' | 'semanal' | 'mensual' | 'ultimos_30_dias';
export type InicioSemana = 'lunes' | 'domingo';

export interface ConfiguracionMetricas {
  periodoPorDefecto: PeriodoMetricas;
  inicioSemana: InicioSemana;
  diaCorteMensual: number; // 1 a 28 (por defecto 1, inicio de mes)
  compararPeriodoAnterior: boolean;
}

export interface ConfiguracionSistema {
  estadoConexionDB: 'conectado' | 'desconectado' | 'latencia_alta';
  versionEsquema: string;
  ultimoRespaldo: string;
  filasTotalesDB: number;
}

export interface ConfiguracionCompleta {
  negocio: ConfiguracionNegocio;
  pos: ConfiguracionPOS;
  inventario: ConfiguracionInventario;
  metricas: ConfiguracionMetricas;
  sistema: ConfiguracionSistema;
}

export const valoresPorDefectoConfiguracion: ConfiguracionCompleta = {
  negocio: {
    nombreComercial: 'M.I Stock',
    razonSocial: '',
    cuit: '',
    direccion: '',
    telefono: '',
    emailContacto: '',
    monedaSimbolo: '$',
    monedaCodigo: 'ARS',
    condicionIva: 'monotributo',
    mensajeEncabezadoTicket: 'Comprobante de Venta - Línea de Cajas',
    mensajePieTicket: '¡Muchas gracias por su compra! Conserve su ticket para cambios.',
    modoComprobante: 'no_fiscal',
    mostrarAclaracionLegal: true,
    textoAclaracionLegal: 'DOCUMENTO NO VÁLIDO COMO FACTURA',
    puntoVenta: 1,
  },
  pos: {
    numeroCaja: 1,
    metodosPagoHabilitados: {
      efectivo: true,
      tarjeta_debito: true,
      tarjeta_credito: true,
      transferencia: true,
      mercado_pago: true,
    },
    permitirVentaSinStock: false,
    limiteDescuentoVendedor: 10,
    sonidoConfirmacionVenta: true,
    modoEscanerRapido: true,
    autoImprimirTicket: false,
    anchoPapelTicket: '80mm',
  },
  inventario: {
    umbralMinimoPorDefecto: 5,
    alertarMargenNegativo: true,
    requerirCategoriaEstricta: true,
    controlarVencimientos: false,
  },
  metricas: {
    periodoPorDefecto: 'mensual',
    inicioSemana: 'lunes',
    diaCorteMensual: 1,
    compararPeriodoAnterior: true,
  },
  sistema: {
    estadoConexionDB: 'conectado',
    versionEsquema: 'PostgreSQL 15 (Supabase)',
    ultimoRespaldo: 'Sin respaldos exportados',
    filasTotalesDB: 0,
  },
};
