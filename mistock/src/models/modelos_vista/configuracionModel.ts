/**
 * ====================================================================
 * MODELO DE VISTA: CONFIGURACIÓN GENERAL DEL SISTEMA (ViewModels)
 * ====================================================================
 * 
 * Propósito:
 * Define las estructuras de datos para la parametrización del negocio,
 * reglas de venta en caja (POS), alertas de inventario y respaldos.
 */

export type ModoComprobante = 'no_fiscal' | 'factura_afip';

export interface ConfiguracionNegocio {
  nombreComercial: string;
  razonSocial: string;
  cuit: string;
  direccion: string;
  telefono: string;
  emailContacto: string;
  monedaSimbolo: string;
  monedaCodigo: string;
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
}

export interface ConfiguracionPOS {
  metodosPagoHabilitados: MetodosPagoConfig;
  permitirVentaSinStock: boolean;
  limiteDescuentoVendedor: number; // Porcentaje máximo (ej: 10)
  sonidoConfirmacionVenta: boolean;
  modoEscanerRapido: boolean;
}

export interface ConfiguracionInventario {
  umbralMinimoPorDefecto: number;
  alertarMargenNegativo: boolean;
  requerirCategoriaEstricta: boolean;
  controlarVencimientos: boolean;
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
  sistema: ConfiguracionSistema;
}

export const valoresPorDefectoConfiguracion: ConfiguracionCompleta = {
  negocio: {
    nombreComercial: 'M.I Stock',
    razonSocial: 'M.I Stock Almacén Comercial',
    cuit: '30-71829340-9',
    direccion: 'Av. Corrientes 3450, CABA',
    telefono: '+54 9 11 4521-8890',
    emailContacto: 'contacto@mistock.com',
    monedaSimbolo: '$',
    monedaCodigo: 'ARS',
    mensajeEncabezadoTicket: 'Comprobante de Venta - Línea de Cajas',
    mensajePieTicket: '¡Muchas gracias por su compra! Conserve su ticket para cambios.',
    modoComprobante: 'no_fiscal',
    mostrarAclaracionLegal: true,
    textoAclaracionLegal: 'DOCUMENTO NO VÁLIDO COMO FACTURA',
    puntoVenta: 1,
  },
  pos: {
    metodosPagoHabilitados: {
      efectivo: true,
      tarjeta_debito: true,
      tarjeta_credito: true,
      transferencia: true,
    },
    permitirVentaSinStock: false,
    limiteDescuentoVendedor: 10,
    sonidoConfirmacionVenta: true,
    modoEscanerRapido: true,
  },
  inventario: {
    umbralMinimoPorDefecto: 5,
    alertarMargenNegativo: true,
    requerirCategoriaEstricta: true,
    controlarVencimientos: false,
  },
  sistema: {
    estadoConexionDB: 'conectado',
    versionEsquema: 'PostgreSQL 15 (Supabase)',
    ultimoRespaldo: '2026-09-25 18:30',
    filasTotalesDB: 340,
  },
};
