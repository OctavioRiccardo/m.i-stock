'use client';

/**
 * ====================================================================
 * SERVICIO: GESTOR DE CONFIGURACIÓN CENTRALIZADA (Single Source of Truth)
 * ====================================================================
 * 
 * Propósito:
 * Proporcionar un almacén reactivo único para los parámetros de negocio,
 * políticas de caja (POS), métodos de pago habilitados y reglas de inventario,
 * sincronizado con Supabase PostgreSQL (`public.configuracion_negocio`) y
 * cacheado localmente para disponibilidad inmediata en mostrador.
 * 
 * Integración React 19:
 * Utiliza `useSyncExternalStore` para suscripciones reactivas sin tearing
 * y con total compatibilidad SSR en Next.js.
 */

import { useSyncExternalStore } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  ConfiguracionCompleta,
  ConfiguracionNegocio,
  ConfiguracionPOS,
  ConfiguracionInventario,
  ConfiguracionMetricas,
  MetodosPagoConfig,
  valoresPorDefectoConfiguracion,
} from '@/models/modelos_vista/configuracionModel';
import {
  LIMITES_TEXTO,
  acotarEntero,
  formatearCuitInput,
  sanitizarCodigoIsoInput,
  sanitizarTelefonoInput,
} from '@/lib/validaciones';
import { supabaseService } from './supabaseService';

export const CONFIGURACION_STORAGE_KEY = 'mistock_configuracion_v1';

/** Valores heredados ficticios que se limpian automáticamente si quedaron en un navegador antiguo. */
const LEGACY_MOCK_CUITS = new Set(['30-71829340-9']);
const LEGACY_MOCK_ADDRESSES = new Set(['Av. Corrientes 3450, CABA']);
const LEGACY_MOCK_PHONES = new Set(['+54 9 11 4521-8890']);
const LEGACY_MOCK_EMAILS = new Set(['contacto@mistock.com']);
const LEGACY_MOCK_RAZON = new Set(['M.I Stock Almacén Comercial']);

/**
 * Snapshot inmutable para SSR (Server-Side Rendering) en Next.js.
 */
const SERVER_SNAPSHOT: ConfiguracionCompleta = Object.freeze(valoresPorDefectoConfiguracion);

function fusionarConfiguracion(parsed: Partial<ConfiguracionCompleta>): ConfiguracionCompleta {
  const negocioRaw: Partial<ConfiguracionNegocio> = parsed.negocio || {};

  const cuitLimpio =
    negocioRaw.cuit && LEGACY_MOCK_CUITS.has(negocioRaw.cuit) ? '' : (negocioRaw.cuit ?? '');
  const direccionLimpia =
    negocioRaw.direccion && LEGACY_MOCK_ADDRESSES.has(negocioRaw.direccion)
      ? ''
      : (negocioRaw.direccion ?? '');
  const telefonoLimpio =
    negocioRaw.telefono && LEGACY_MOCK_PHONES.has(negocioRaw.telefono)
      ? ''
      : (negocioRaw.telefono ?? '');
  const emailLimpio =
    negocioRaw.emailContacto && LEGACY_MOCK_EMAILS.has(negocioRaw.emailContacto)
      ? ''
      : (negocioRaw.emailContacto ?? '');
  const razonLimpia =
    negocioRaw.razonSocial && LEGACY_MOCK_RAZON.has(negocioRaw.razonSocial)
      ? ''
      : (negocioRaw.razonSocial ?? '');

  return {
    ...valoresPorDefectoConfiguracion,
    ...parsed,
    negocio: {
      ...valoresPorDefectoConfiguracion.negocio,
      ...negocioRaw,
      razonSocial: razonLimpia,
      cuit: cuitLimpio,
      direccion: direccionLimpia,
      telefono: telefonoLimpio,
      emailContacto: emailLimpio,
    },
    pos: {
      ...valoresPorDefectoConfiguracion.pos,
      ...(parsed.pos || {}),
      metodosPagoHabilitados: {
        ...valoresPorDefectoConfiguracion.pos.metodosPagoHabilitados,
        ...(parsed.pos?.metodosPagoHabilitados || {}),
      },
    },
    inventario: {
      ...valoresPorDefectoConfiguracion.inventario,
      ...(parsed.inventario || {}),
    },
    metricas: {
      ...valoresPorDefectoConfiguracion.metricas,
      ...(parsed.metricas || {}),
    },
    sistema: {
      ...valoresPorDefectoConfiguracion.sistema,
      ...(parsed.sistema || {}),
    },
  };
}

/**
 * Inicialización segura del estado en el cliente (Browser).
 */
function inicializarEstadoCliente(): ConfiguracionCompleta {
  if (typeof window === 'undefined') {
    return SERVER_SNAPSHOT;
  }
  try {
    const raw = window.localStorage.getItem(CONFIGURACION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return fusionarConfiguracion(parsed);
      }
    }
  } catch {
    // Si falla el parseo, se utiliza el default limpio
  }
  return valoresPorDefectoConfiguracion;
}

let currentSnapshot: ConfiguracionCompleta = SERVER_SNAPSHOT;
let hasHydrated = false;
let remoteSaveTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

/**
 * Persiste con debounce en Supabase `public.configuracion_negocio` para no saturar en cada tecla.
 */
function agendarGuardadoRemoto() {
  if (typeof window === 'undefined') return;
  if (remoteSaveTimer) {
    clearTimeout(remoteSaveTimer);
  }
  remoteSaveTimer = setTimeout(() => {
    void supabaseService.saveConfiguracionNegocio(currentSnapshot);
  }, 450);
}

/**
 * Notifica a los componentes suscritos, actualiza caché local y agenda sincronización remota.
 */
function notifySubscribers(sincronizarRemoto: boolean = true) {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(CONFIGURACION_STORAGE_KEY, JSON.stringify(currentSnapshot));
    } catch {
      // Ignorar cuota excedida en sandbox
    }
  }
  if (sincronizarRemoto) {
    agendarGuardadoRemoto();
  }
  listeners.forEach((listener) => listener());
}

/**
 * Escucha cambios de configuración originados en otras pestañas o ventanas del navegador.
 */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === CONFIGURACION_STORAGE_KEY) {
      currentSnapshot = inicializarEstadoCliente();
      listeners.forEach((listener) => listener());
    }
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  if (!hasHydrated && typeof window !== 'undefined') {
    hasHydrated = true;
    currentSnapshot = inicializarEstadoCliente();
    listener();
    void configuracionService.sincronizarConSupabase();
  }

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): ConfiguracionCompleta {
  return currentSnapshot;
}

function getServerSnapshot(): ConfiguracionCompleta {
  return SERVER_SNAPSHOT;
}

/**
 * Hook para suscribirse reactivamente al almacén de configuración.
 */
export function useConfiguracionData(): ConfiguracionCompleta {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Servicio Singleton para mutaciones de configuración global con sanitización de entradas.
 */
export const configuracionService = {
  getConfiguracion(): ConfiguracionCompleta {
    return currentSnapshot;
  },

  /**
   * Hidrata la configuración desde Supabase `public.configuracion_negocio` si está disponible.
   */
  async sincronizarConSupabase(): Promise<boolean> {
    try {
      const remota = await supabaseService.fetchConfiguracionNegocio();
      if (!remota) return false;
      currentSnapshot = fusionarConfiguracion(remota);
      notifySubscribers(false);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Actualiza parámetros del negocio sanitizando longitudes, CUIT, teléfono, código ISO y punto de venta.
   */
  actualizarNegocio(datos: Partial<ConfiguracionNegocio>): void {
    const sanitizado: Partial<ConfiguracionNegocio> = { ...datos };

    if (sanitizado.nombreComercial !== undefined) {
      sanitizado.nombreComercial = sanitizado.nombreComercial.slice(
        0,
        LIMITES_TEXTO.NOMBRE_COMERCIAL_MAX
      );
    }
    if (sanitizado.razonSocial !== undefined) {
      sanitizado.razonSocial = sanitizado.razonSocial.slice(0, LIMITES_TEXTO.RAZON_SOCIAL_MAX);
    }
    if (sanitizado.cuit !== undefined) {
      sanitizado.cuit = formatearCuitInput(sanitizado.cuit);
    }
    if (sanitizado.direccion !== undefined) {
      sanitizado.direccion = sanitizado.direccion.slice(0, LIMITES_TEXTO.DIRECCION_MAX);
    }
    if (sanitizado.telefono !== undefined) {
      sanitizado.telefono = sanitizarTelefonoInput(sanitizado.telefono);
    }
    if (sanitizado.emailContacto !== undefined) {
      sanitizado.emailContacto = sanitizado.emailContacto.trim().slice(0, LIMITES_TEXTO.EMAIL_MAX);
    }
    if (sanitizado.monedaSimbolo !== undefined) {
      sanitizado.monedaSimbolo = sanitizado.monedaSimbolo.trim().slice(0, 4);
    }
    if (sanitizado.monedaCodigo !== undefined) {
      sanitizado.monedaCodigo = sanitizarCodigoIsoInput(sanitizado.monedaCodigo);
    }
    if (sanitizado.mensajeEncabezadoTicket !== undefined) {
      sanitizado.mensajeEncabezadoTicket = sanitizado.mensajeEncabezadoTicket.slice(
        0,
        LIMITES_TEXTO.MENSAJE_TICKET_MAX
      );
    }
    if (sanitizado.mensajePieTicket !== undefined) {
      sanitizado.mensajePieTicket = sanitizado.mensajePieTicket.slice(
        0,
        LIMITES_TEXTO.MENSAJE_TICKET_MAX
      );
    }
    if (sanitizado.textoAclaracionLegal !== undefined) {
      sanitizado.textoAclaracionLegal = sanitizado.textoAclaracionLegal.slice(
        0,
        LIMITES_TEXTO.MENSAJE_TICKET_MAX
      );
    }
    if (sanitizado.puntoVenta !== undefined) {
      sanitizado.puntoVenta = acotarEntero(sanitizado.puntoVenta, 1, 99999, 1);
    }

    currentSnapshot = {
      ...currentSnapshot,
      negocio: {
        ...currentSnapshot.negocio,
        ...sanitizado,
      },
    };
    notifySubscribers();
  },

  /**
   * Actualiza políticas de caja, hardware o límites del POS acotando valores numéricos.
   */
  actualizarPOS(datos: Partial<ConfiguracionPOS>): void {
    const sanitizado: Partial<ConfiguracionPOS> = { ...datos };

    if (sanitizado.numeroCaja !== undefined) {
      sanitizado.numeroCaja = acotarEntero(sanitizado.numeroCaja, 1, 99, 1);
    }
    if (sanitizado.limiteDescuentoVendedor !== undefined) {
      sanitizado.limiteDescuentoVendedor = acotarEntero(
        sanitizado.limiteDescuentoVendedor,
        0,
        100,
        10
      );
    }

    currentSnapshot = {
      ...currentSnapshot,
      pos: {
        ...currentSnapshot.pos,
        ...sanitizado,
      },
    };
    notifySubscribers();
  },

  /**
   * Habilita o deshabilita un método de cobro asegurando que quede al menos uno activo.
   */
  toggleMetodoPago(metodo: keyof MetodosPagoConfig): { exito: boolean; mensaje?: string } {
    const actual = currentSnapshot.pos.metodosPagoHabilitados[metodo];
    const nuevosMetodos = {
      ...currentSnapshot.pos.metodosPagoHabilitados,
      [metodo]: !actual,
    };

    const activos = Object.values(nuevosMetodos).filter(Boolean).length;
    if (activos === 0) {
      return {
        exito: false,
        mensaje: 'Debe quedar al menos un método de cobro habilitado para la caja.',
      };
    }

    currentSnapshot = {
      ...currentSnapshot,
      pos: {
        ...currentSnapshot.pos,
        metodosPagoHabilitados: nuevosMetodos,
      },
    };
    notifySubscribers();
    return { exito: true };
  },

  /**
   * Actualiza directivas de inventario acotando el umbral mínimo a enteros válidos.
   */
  actualizarInventario(datos: Partial<ConfiguracionInventario>): void {
    const sanitizado: Partial<ConfiguracionInventario> = { ...datos };
    if (sanitizado.umbralMinimoPorDefecto !== undefined) {
      sanitizado.umbralMinimoPorDefecto = acotarEntero(
        sanitizado.umbralMinimoPorDefecto,
        1,
        10000,
        5
      );
    }

    currentSnapshot = {
      ...currentSnapshot,
      inventario: {
        ...currentSnapshot.inventario,
        ...sanitizado,
      },
    };
    notifySubscribers();
  },

  /**
   * Actualiza las preferencias de cálculo y períodos de métricas.
   */
  actualizarMetricas(datos: Partial<ConfiguracionMetricas>): void {
    const sanitizado: Partial<ConfiguracionMetricas> = { ...datos };
    if (sanitizado.diaCorteMensual !== undefined) {
      sanitizado.diaCorteMensual = acotarEntero(sanitizado.diaCorteMensual, 1, 28, 1);
    }

    currentSnapshot = {
      ...currentSnapshot,
      metricas: {
        ...currentSnapshot.metricas,
        ...sanitizado,
      },
    };
    notifySubscribers();
  },

  /**
   * Reemplaza la configuración completa y sincroniza con Supabase.
   */
  guardarConfiguracion(nuevaConfig: ConfiguracionCompleta): void {
    currentSnapshot = fusionarConfiguracion(nuevaConfig);
    notifySubscribers(false);
    void supabaseService.saveConfiguracionNegocio(currentSnapshot);
  },

  /**
   * Restablece los valores a los estándares limpios de fábrica.
   */
  restablecerPorDefecto(): void {
    currentSnapshot = { ...valoresPorDefectoConfiguracion };
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(CONFIGURACION_STORAGE_KEY);
      } catch {
        // Ignore
      }
    }
    notifySubscribers();
  },

  subscribe,
};

if (typeof window !== 'undefined') {
  try {
    const supabase = createClient();
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        void configuracionService.sincronizarConSupabase();
      }
    });
  } catch {
    // Entorno sin variables configuradas
  }
}
