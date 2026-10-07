'use client';

/**
 * ====================================================================
 * SERVICIO: GESTOR DE CONFIGURACIÓN CENTRALIZADA (Single Source of Truth)
 * ====================================================================
 * 
 * Propósito:
 * Proporcionar un almacén reactivo único para los parámetros de negocio,
 * políticas de caja (POS), métodos de pago habilitados y reglas de inventario.
 * 
 * Resuelve la desincronización entre:
 * - `configuracionController` (Edición y persistencia por el Administrador)
 * - `userDashboardController` (Terminal de venta POS y validaciones de caja)
 * - `ModalDetalleVenta` (Impresión y formato de tickets térmicos)
 * - Pestañas múltiples del navegador mediante sincronización StorageEvent.
 * 
 * Integración React 19:
 * Utiliza `useSyncExternalStore` para suscripciones reactivas sin tearing
 * y con total compatibilidad SSR en Next.js.
 */

import { useSyncExternalStore } from 'react';
import {
  ConfiguracionCompleta,
  ConfiguracionNegocio,
  ConfiguracionPOS,
  ConfiguracionInventario,
  ConfiguracionMetricas,
  MetodosPagoConfig,
  valoresPorDefectoConfiguracion,
} from '@/models/modelos_vista/configuracionModel';

const CONFIGURACION_STORAGE_KEY = 'mistock_configuracion_v1';

/**
 * Snapshot inmutable para SSR (Server-Side Rendering) en Next.js.
 */
const SERVER_SNAPSHOT: ConfiguracionCompleta = Object.freeze(valoresPorDefectoConfiguracion);

/**
 * Inicialización segura del estado en el cliente (Browser).
 * Aplica fusión profunda (deep-merge) para garantizar que propiedades nuevas
 * como 'mercado_pago' o 'metricas' existan aun si el localStorage
 * contenía una versión anterior de la configuración.
 */
function inicializarEstadoCliente(): ConfiguracionCompleta {
  if (typeof window === 'undefined') {
    return SERVER_SNAPSHOT;
  }
  try {
    const raw = window.localStorage.getItem(CONFIGURACION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...valoresPorDefectoConfiguracion,
        ...parsed,
        negocio: {
          ...valoresPorDefectoConfiguracion.negocio,
          ...(parsed.negocio || {}),
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
  } catch {
    // Si falla el parseo, se utiliza el default
  }
  return valoresPorDefectoConfiguracion;
}

let currentSnapshot: ConfiguracionCompleta = SERVER_SNAPSHOT;
let hasHydrated = false;
const listeners = new Set<() => void>();

/**
 * Notifica a los componentes suscritos y sincroniza con localStorage.
 */
function notifySubscribers() {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(CONFIGURACION_STORAGE_KEY, JSON.stringify(currentSnapshot));
    } catch {
      // Ignorar cuota excedida en sandbox
    }
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

  // Hidratación segura en cliente: tras la reconciliación inicial de SSR,
  // se carga el estado persistido en localStorage sin generar mismatch de hidratación.
  if (!hasHydrated && typeof window !== 'undefined') {
    hasHydrated = true;
    currentSnapshot = inicializarEstadoCliente();
    listener();
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
 * 
 * @example
 * const config = useConfiguracionData();
 * console.log(config.pos.metodosPagoHabilitados);
 */
export function useConfiguracionData(): ConfiguracionCompleta {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Servicio Singleton para mutaciones de configuración global.
 */
export const configuracionService = {
  /**
   * Obtiene una referencia directa al snapshot actual.
   */
  getConfiguracion(): ConfiguracionCompleta {
    return currentSnapshot;
  },

  /**
   * Actualiza parámetros del negocio, identidad fiscal o tickets.
   */
  actualizarNegocio(datos: Partial<ConfiguracionNegocio>): void {
    currentSnapshot = {
      ...currentSnapshot,
      negocio: {
        ...currentSnapshot.negocio,
        ...datos,
      },
    };
    notifySubscribers();
  },

  /**
   * Actualiza políticas de caja, hardware o límites del POS.
   */
  actualizarPOS(datos: Partial<ConfiguracionPOS>): void {
    currentSnapshot = {
      ...currentSnapshot,
      pos: {
        ...currentSnapshot.pos,
        ...datos,
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
   * Actualiza directivas de inventario.
   */
  actualizarInventario(datos: Partial<ConfiguracionInventario>): void {
    currentSnapshot = {
      ...currentSnapshot,
      inventario: {
        ...currentSnapshot.inventario,
        ...datos,
      },
    };
    notifySubscribers();
  },

  /**
   * Actualiza las preferencias de cálculo y períodos de métricas/KPIs.
   */
  actualizarMetricas(datos: Partial<ConfiguracionMetricas>): void {
    currentSnapshot = {
      ...currentSnapshot,
      metricas: {
        ...currentSnapshot.metricas,
        ...datos,
      },
    };
    notifySubscribers();
  },

  /**
   * Reemplaza la configuración completa y persiste en localStorage.
   */
  guardarConfiguracion(nuevaConfig: ConfiguracionCompleta): void {
    currentSnapshot = { ...nuevaConfig };
    notifySubscribers();
  },

  /**
   * Restablece los valores a los estándares de fábrica.
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

  /**
   * Permite suscripciones imperativas fuera de React.
   */
  subscribe,
};
