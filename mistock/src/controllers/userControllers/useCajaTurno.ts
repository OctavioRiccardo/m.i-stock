'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { VentaRecientePOS } from '@/models/modelos_vista/dashboardModel';
import {
  ArqueoCajaDTO,
  EstadoBalanceCaja,
  EstadoSesionCaja,
  ResumenMediosPagoCierre,
  calcularDiferenciaCaja,
  calcularEfectivoEsperado,
  determinarEstadoBalance,
} from '@/models/modelos_vista/cierreCajaModel';
import { LIMITES_TEXTO, MAX_PRECIO_DB } from '@/lib/validaciones';
import {
  obtenerNombreUsuarioActivoLocal,
  suscribirUsuarioActivo,
} from '@/lib/usuarioActivoStorage';
import { supabaseService } from '@/services/supabaseService';

const SESION_CAJA_STORAGE_KEY = 'mistock_sesion_caja_v1';

export function obtenerNombreUsuarioActivo(): string {
  return obtenerNombreUsuarioActivoLocal('Administrador');
}

function guardarSesionCajaLocal(payload: Partial<EstadoSesionCaja>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SESION_CAJA_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('[useCajaTurno] Error al guardar sesión de caja local:', err);
  }
}

function leerSesionCajaLocal(): Partial<EstadoSesionCaja> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESION_CAJA_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed as Partial<EstadoSesionCaja>;
    }
  } catch (err) {
    console.warn('[useCajaTurno] Error al leer sesión de caja local:', err);
  }
  return null;
}

/**
 * Agrupa los totales recaudados del turno activo por medio de pago.
 */
export function calcularResumenMediosTurno(
  ventasTurno: VentaRecientePOS[]
): ResumenMediosPagoCierre {
  const resumen: ResumenMediosPagoCierre = {
    efectivo: 0,
    mercadoPago: 0,
    tarjetaDebito: 0,
    tarjetaCredito: 0,
    transferencia: 0,
    otro: 0,
  };

  for (const v of ventasTurno) {
    const m = v.metodoPago;
    if (m === 'efectivo') resumen.efectivo += v.montoTotal;
    else if (m === 'mercado_pago') resumen.mercadoPago += v.montoTotal;
    else if (m === 'tarjeta_debito') resumen.tarjetaDebito += v.montoTotal;
    else if (m === 'tarjeta_credito') resumen.tarjetaCredito += v.montoTotal;
    else if (m === 'transferencia') resumen.transferencia += v.montoTotal;
    else resumen.otro += v.montoTotal;
  }

  return resumen;
}

export interface UseCajaTurnoParams {
  ventasRecientes: VentaRecientePOS[];
  numeroCaja: number;
  monedaSimbolo: string;
  onSuccess: (mensaje: string) => void;
}

export function useCajaTurno({
  ventasRecientes,
  numeroCaja,
  monedaSimbolo,
  onSuccess,
}: UseCajaTurnoParams) {
  const [cajaAbierta, setCajaAbierta] = useState<boolean>(false);
  const [fondoInicial, setFondoInicial] = useState<number>(10000);
  const [fechaApertura, setFechaApertura] = useState<string | null>(null);
  const [cajeroApertura, setCajeroApertura] = useState<string>('Administrador');
  const [observacionesApertura, setObservacionesApertura] = useState<string>('');
  const [idTurnoActivo, setIdTurnoActivo] = useState<string | null>(null);
  const [idSesionRemota, setIdSesionRemota] = useState<string | null>(null);
  const idSesionRemotaRef = useRef<string | null>(null);
  const [ventasIdsTurno, setVentasIdsTurno] = useState<string[]>([]);
  const [timestampApertura, setTimestampApertura] = useState<number | null>(null);
  const [isModalAperturaOpen, setIsModalAperturaOpen] = useState<boolean>(false);
  const [isModalArqueoOpen, setIsModalArqueoOpen] = useState<boolean>(false);
  const [isModalTicketCierreOpen, setIsModalTicketCierreOpen] = useState<boolean>(false);
  const [ultimoCierre, setUltimoCierre] = useState<ArqueoCajaDTO | null>(null);

  const handleSetIsModalAperturaOpen = (abrir: boolean) => {
    if (abrir) {
      setCajeroApertura(obtenerNombreUsuarioActivo());
    }
    setIsModalAperturaOpen(abrir);
  };

  // Sincronizar sesión de caja y perfil de cajero desde Supabase PostgreSQL
  useEffect(() => {
    let mounted = true;
    const syncPerfil = () => {
      const actual = obtenerNombreUsuarioActivo();
      setCajeroApertura((prev) =>
        prev === 'Administrador' && actual !== 'Administrador' ? actual : prev
      );
    };
    const desuscribirUsuario = suscribirUsuarioActivo(syncPerfil);

    queueMicrotask(() => {
      if (!mounted) return;
      const sesion = leerSesionCajaLocal();
      if (sesion && typeof sesion.cajaAbierta === 'boolean') {
        setCajaAbierta(sesion.cajaAbierta);
        if (sesion.cajaAbierta) {
          if (sesion.idTurno) setIdTurnoActivo(sesion.idTurno);
          if (sesion.idSesionRemota) {
            setIdSesionRemota(sesion.idSesionRemota);
            idSesionRemotaRef.current = sesion.idSesionRemota;
          }
          if (sesion.timestampApertura) setTimestampApertura(sesion.timestampApertura);
          if (sesion.fondoInicial !== undefined) setFondoInicial(sesion.fondoInicial);
          if (sesion.fechaApertura) setFechaApertura(sesion.fechaApertura);
          if (sesion.cajeroApertura) setCajeroApertura(sesion.cajeroApertura);
          if (sesion.observacionesApertura) setObservacionesApertura(sesion.observacionesApertura);
          if (Array.isArray(sesion.ventasIdsTurno)) setVentasIdsTurno(sesion.ventasIdsTurno);
        } else {
          setCajeroApertura(obtenerNombreUsuarioActivo());
        }
        if (sesion.ultimoCierre) setUltimoCierre(sesion.ultimoCierre);
      } else {
        setCajaAbierta(false);
        setCajeroApertura(obtenerNombreUsuarioActivo());
      }
    });

    void supabaseService.fetchSesionCaja().then((remota) => {
      if (!mounted || !remota) return;
      const abiertaRemota =
        typeof remota.cajaAbierta === 'boolean'
          ? remota.cajaAbierta
          : typeof remota.estaAbierta === 'boolean'
            ? remota.estaAbierta
            : undefined;
      if (typeof abiertaRemota !== 'boolean') return;

      setCajaAbierta(abiertaRemota);
      if (abiertaRemota) {
        if (remota.idTurno) setIdTurnoActivo(remota.idTurno);
        if (remota.idSesionRemota) {
          setIdSesionRemota(remota.idSesionRemota);
          idSesionRemotaRef.current = remota.idSesionRemota;
        }
        if (remota.timestampApertura) setTimestampApertura(remota.timestampApertura);
        if (remota.fondoInicial !== undefined) setFondoInicial(remota.fondoInicial);
        if (remota.fechaApertura) setFechaApertura(remota.fechaApertura);
        if (remota.cajeroApertura) setCajeroApertura(remota.cajeroApertura);
        if (remota.observacionesApertura !== undefined) {
          setObservacionesApertura(remota.observacionesApertura);
        }
        if (Array.isArray(remota.ventasIdsTurno)) setVentasIdsTurno(remota.ventasIdsTurno);
      } else {
        setIdTurnoActivo(null);
        setIdSesionRemota(null);
        idSesionRemotaRef.current = null;
        setTimestampApertura(null);
        setVentasIdsTurno([]);
        setCajeroApertura(obtenerNombreUsuarioActivo());
      }
      if (remota.ultimoCierre !== undefined) {
        setUltimoCierre(remota.ultimoCierre || null);
      }
      guardarSesionCajaLocal(remota);
    });

    return () => {
      mounted = false;
      desuscribirUsuario();
    };
  }, []);

  const abrirCaja = (montoInicial: number, observaciones?: string) => {
    const montoSeguro =
      Number.isFinite(montoInicial) && montoInicial >= 0
        ? Math.min(MAX_PRECIO_DB, Number(montoInicial.toFixed(2)))
        : 0;
    const obsSegura = (observaciones || '').trim().slice(0, LIMITES_TEXTO.OBSERVACIONES_MAX);

    const ahora = new Date();
    const fechaFormateada = ahora.toLocaleDateString('es-AR');
    const horaFormateada = ahora.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const strFechaApertura = `${fechaFormateada} ${horaFormateada}`;
    const cajeroActual = obtenerNombreUsuarioActivo();
    const nuevoIdTurno = `TRN-${Date.now().toString().slice(-6)}`;
    const nuevoTimestamp = ahora.getTime();

    setIdTurnoActivo(nuevoIdTurno);
    setIdSesionRemota(null);
    idSesionRemotaRef.current = null;
    setTimestampApertura(nuevoTimestamp);
    setCajaAbierta(true);
    setFondoInicial(montoSeguro);
    setFechaApertura(strFechaApertura);
    setCajeroApertura(cajeroActual);
    setObservacionesApertura(obsSegura);
    setIsModalAperturaOpen(false);
    setVentasIdsTurno([]);

    const estadoBaseApertura: Partial<EstadoSesionCaja> = {
      cajaAbierta: true,
      estaAbierta: true,
      idTurno: nuevoIdTurno,
      idSesionRemota: null,
      timestampApertura: nuevoTimestamp,
      fondoInicial: montoSeguro,
      fechaApertura: strFechaApertura,
      cajeroApertura: cajeroActual,
      observacionesApertura: obsSegura,
      ultimoCierre,
      ventasIdsTurno: [],
    };

    void supabaseService.saveSesionCaja(estadoBaseApertura);
    guardarSesionCajaLocal(estadoBaseApertura);

    void supabaseService
      .abrirSesionCajaRemota({
        codigoTurno: nuevoIdTurno,
        numeroCaja: numeroCaja || 1,
        fondoInicial: montoSeguro,
        observaciones: obsSegura || undefined,
      })
      .then((remoteSessionId) => {
        if (!remoteSessionId) return;
        setIdSesionRemota(remoteSessionId);
        idSesionRemotaRef.current = remoteSessionId;
        const actualizado: Partial<EstadoSesionCaja> = {
          ...estadoBaseApertura,
          idSesionRemota: remoteSessionId,
        };
        void supabaseService.saveSesionCaja(actualizado);
        guardarSesionCajaLocal(actualizado);
      });

    onSuccess(
      `Caja abierta con éxito (Turno ${nuevoIdTurno}). Fondo inicial: ${monedaSimbolo} ${montoSeguro.toLocaleString('es-AR')}`
    );
  };

  const registrarVentaEnTurno = (remoteId: string) => {
    setVentasIdsTurno((prevIds) => {
      const nextIds = prevIds.includes(remoteId) ? prevIds : [remoteId, ...prevIds];
      if (cajaAbierta) {
        const sesionActualizada: Partial<EstadoSesionCaja> = {
          cajaAbierta: true,
          estaAbierta: true,
          idTurno: idTurnoActivo || undefined,
          idSesionRemota: idSesionRemotaRef.current || idSesionRemota || null,
          timestampApertura: timestampApertura || undefined,
          fondoInicial,
          fechaApertura,
          cajeroApertura:
            cajeroApertura && cajeroApertura !== 'Administrador'
              ? cajeroApertura
              : obtenerNombreUsuarioActivo(),
          observacionesApertura,
          ultimoCierre,
          ventasIdsTurno: nextIds,
        };
        guardarSesionCajaLocal(sesionActualizada);
        void supabaseService.saveSesionCaja(sesionActualizada);
      }
      return nextIds;
    });
  };

  const ventasTurnoActual = useMemo(() => {
    if (!cajaAbierta && !timestampApertura && !idTurnoActivo) return [];
    return ventasRecientes.filter((v) => {
      if (v.estado === 'cancelada') return false;
      if (idTurnoActivo && v.idTurno) {
        return v.idTurno === idTurnoActivo;
      }
      if (ventasIdsTurno.length > 0 && ventasIdsTurno.includes(v.id)) {
        return true;
      }
      if (timestampApertura && v.timestamp) {
        return v.timestamp >= timestampApertura - 60000;
      }
      return false;
    });
  }, [ventasRecientes, cajaAbierta, idTurnoActivo, timestampApertura, ventasIdsTurno]);

  const resumenMediosTurno = useMemo(
    () => calcularResumenMediosTurno(ventasTurnoActual),
    [ventasTurnoActual]
  );

  const totalVentasEfectivo = resumenMediosTurno.efectivo;
  const totalDigitales =
    resumenMediosTurno.mercadoPago +
    resumenMediosTurno.tarjetaDebito +
    resumenMediosTurno.tarjetaCredito +
    resumenMediosTurno.transferencia +
    resumenMediosTurno.otro;
  const granTotalRecaudado = totalVentasEfectivo + totalDigitales;
  const cantidadTicketsValidos = useMemo(() => ventasTurnoActual.length, [ventasTurnoActual]);
  const efectivoEsperado = calcularEfectivoEsperado(fondoInicial, totalVentasEfectivo);

  const confirmarCierreCaja = (efectivoReal: number, observaciones?: string): ArqueoCajaDTO => {
    const efectivoSeguro =
      Number.isFinite(efectivoReal) && efectivoReal >= 0
        ? Math.min(MAX_PRECIO_DB, Number(efectivoReal.toFixed(2)))
        : 0;
    const obsSegura = (observaciones || '').trim().slice(0, LIMITES_TEXTO.OBSERVACIONES_MAX);

    const diferencia = calcularDiferenciaCaja(efectivoSeguro, efectivoEsperado);
    const estadoBalance: EstadoBalanceCaja = determinarEstadoBalance(diferencia);

    const fechaHoy = new Date();
    const horaFormateada = fechaHoy.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const fechaFormateada = fechaHoy.toLocaleDateString('es-AR');

    const nuevoCierre: ArqueoCajaDTO = {
      idCierre: `CR-${Date.now().toString().slice(-6)}`,
      idTurno: idTurnoActivo || undefined,
      fechaApertura: fechaApertura || `${fechaFormateada} 08:30`,
      fechaCierre: `${fechaFormateada} ${horaFormateada}`,
      cajero: cajeroApertura || 'Administrador',
      numeroCaja: numeroCaja || 1,
      fondoInicial,
      totalVentasEfectivo,
      totalDigitales,
      granTotalRecaudado,
      cantidadTickets: cantidadTicketsValidos,
      efectivoEsperado,
      efectivoReal: efectivoSeguro,
      diferencia,
      estadoBalance,
      desgloseMedios: resumenMediosTurno,
      observaciones: obsSegura || undefined,
    };

    const sesionRemotaACerrar = idSesionRemotaRef.current || idSesionRemota;

    setCajaAbierta(false);
    setIdTurnoActivo(null);
    setIdSesionRemota(null);
    idSesionRemotaRef.current = null;
    setTimestampApertura(null);
    setUltimoCierre(nuevoCierre);
    setIsModalArqueoOpen(false);
    setIsModalTicketCierreOpen(true);
    setVentasIdsTurno([]);

    if (sesionRemotaACerrar) {
      void supabaseService.cerrarSesionCajaRemota(sesionRemotaACerrar, {
        efectivoEsperado,
        efectivoReal: efectivoSeguro,
        diferencia,
        totalRecaudado: granTotalRecaudado,
        cantidadTickets: cantidadTicketsValidos,
        observaciones: obsSegura || undefined,
      });
    }

    const sesionCerrada: Partial<EstadoSesionCaja> = {
      cajaAbierta: false,
      estaAbierta: false,
      idTurno: undefined,
      idSesionRemota: null,
      timestampApertura: undefined,
      fondoInicial,
      fechaApertura: null,
      cajeroApertura: undefined,
      observacionesApertura: '',
      ultimoCierre: nuevoCierre,
      ventasIdsTurno: [],
    };

    void supabaseService.saveSesionCaja(sesionCerrada);
    guardarSesionCajaLocal(sesionCerrada);

    onSuccess(
      `Cierre de Caja ${nuevoCierre.idCierre} emitido. Diferencia: ${monedaSimbolo} ${diferencia.toLocaleString('es-AR')}`
    );

    return nuevoCierre;
  };

  const obtenerSesionRemotaActiva = (): string | undefined =>
    idSesionRemotaRef.current || idSesionRemota || undefined;

  return {
    cajaAbierta,
    setCajaAbierta,
    fechaApertura,
    cajeroApertura,
    observacionesApertura,
    isModalAperturaOpen,
    setIsModalAperturaOpen: handleSetIsModalAperturaOpen,
    abrirCaja,
    fondoInicial,
    setFondoInicial,
    isModalArqueoOpen,
    setIsModalArqueoOpen,
    isModalTicketCierreOpen,
    setIsModalTicketCierreOpen,
    ultimoCierre,
    setUltimoCierre,
    resumenMediosTurno,
    totalVentasEfectivo,
    totalDigitales,
    granTotalRecaudado,
    cantidadTicketsValidos,
    idTurnoActivo,
    efectivoEsperado,
    confirmarCierreCaja,
    registrarVentaEnTurno,
    obtenerSesionRemotaActiva,
  };
}
