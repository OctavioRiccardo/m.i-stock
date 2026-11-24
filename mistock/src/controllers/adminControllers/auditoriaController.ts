'use client';

/**
 * ====================================================================
 * CONTROLADOR DE AUDITORÍA CENTRALIZADA (Patrón MVC - Admin)
 * ====================================================================
 *
 * Propósito:
 * Consultar, filtrar y paginar la bitácora inmutable de eventos del sistema
 * (`public.auditoria_eventos`) y el historial de sesiones de caja (`public.sesiones_caja`):
 * - Movimientos de inventario (alta, modificación, baja, reactivación, ajustes de stock).
 * - Sesiones de acceso (login y logout de administradores y vendedores).
 * - Aperturas y cierres de caja por usuario.
 * - Ventas registradas y anulaciones por usuario.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AuditoriaEvento,
  ModuloAuditoria,
  FiltrosAuditoria,
  ResumenAuditoria,
  filtrarEventosAuditoria,
  calcularResumenAuditoria,
} from '@/models/modelos_dominio/auditoriaModel';
import { SesionCaja } from '@/models/modelos_dominio/sesionCajaModel';
import { Usuario } from '@/models/modelos_dominio/userModel';
import { supabaseService } from '@/services/supabaseService';
import { useConfiguracionData } from '@/services/configuracionService';

export type VistaAuditoriaTab = 'eventos' | 'sesiones_caja';

export function useAdminAuditoriaController() {
  const config = useConfiguracionData();
  const monedaSimbolo = config.negocio?.monedaSimbolo || '$';

  const [vistaActiva, setVistaActiva] = useState<VistaAuditoriaTab>('eventos');
  const [eventos, setEventos] = useState<AuditoriaEvento[]>([]);
  const [sesionesCaja, setSesionesCaja] = useState<SesionCaja[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  const [cargando, setCargando] = useState<boolean>(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [migracionPendiente, setMigracionPendiente] = useState<boolean>(false);

  // Filtros de eventos
  const [moduloFiltro, setModuloFiltro] = useState<ModuloAuditoria | 'todos'>('todos');
  const [usuarioFiltro, setUsuarioFiltro] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState<string>('');
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');

  // Paginación y modal de detalle
  const [pagina, setPagina] = useState<number>(1);
  const itemsPorPagina = 12;
  const [eventoSeleccionado, setEventoSeleccionado] = useState<AuditoriaEvento | null>(null);

  const recargarAuditoria = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);

    try {
      const [resEventos, resSesiones, resUsuarios] = await Promise.all([
        supabaseService.fetchAuditoriaEventos(300),
        supabaseService.fetchSesionesCaja(100),
        supabaseService.fetchUsuariosWithStatus(),
      ]);

      if (resEventos.migracionPendiente || resSesiones.migracionPendiente) {
        setMigracionPendiente(true);
        setEventos([]);
        setSesionesCaja([]);
      } else {
        setMigracionPendiente(false);
        if (resEventos.ok) {
          setEventos(resEventos.items);
        } else if (resEventos.error) {
          setErrorCarga(resEventos.error);
        }

        if (resSesiones.ok) {
          setSesionesCaja(resSesiones.items);
        } else if (resSesiones.error && !resEventos.error) {
          setErrorCarga(resSesiones.error);
        }
      }

      if (resUsuarios.ok) {
        setUsuarios(resUsuarios.items);
      }
    } catch (err) {
      setErrorCarga(err instanceof Error ? err.message : 'No se pudo consultar la auditoría.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void recargarAuditoria();
  }, [recargarAuditoria]);

  // Reiniciar paginación al cambiar cualquier filtro
  useEffect(() => {
    setPagina(1);
  }, [moduloFiltro, usuarioFiltro, busqueda, fechaDesde, fechaHasta, vistaActiva]);

  const filtros: FiltrosAuditoria = useMemo(
    () => ({
      modulo: moduloFiltro,
      usuarioId: usuarioFiltro,
      busqueda,
      fechaDesde,
      fechaHasta,
    }),
    [moduloFiltro, usuarioFiltro, busqueda, fechaDesde, fechaHasta]
  );

  const eventosFiltrados = useMemo(
    () => filtrarEventosAuditoria(eventos, filtros),
    [eventos, filtros]
  );

  const sesionesFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const desdeTs = fechaDesde ? new Date(`${fechaDesde}T00:00:00`).getTime() : null;
    const hastaTs = fechaHasta ? new Date(`${fechaHasta}T23:59:59.999`).getTime() : null;

    return sesionesCaja.filter((s) => {
      if (usuarioFiltro !== 'todos' && s.usuarioId !== usuarioFiltro && s.usuarioCierreId !== usuarioFiltro) {
        return false;
      }
      const ts = Date.parse(s.abiertaEl);
      if (desdeTs !== null && !Number.isNaN(ts) && ts < desdeTs) return false;
      if (hastaTs !== null && !Number.isNaN(ts) && ts > hastaTs) return false;
      if (q) {
        const texto = [
          s.codigoTurno,
          s.usuarioNombre,
          s.usuarioCierreNombre || '',
          s.observacionesApertura || '',
          s.observacionesCierre || '',
          `caja ${s.numeroCaja}`,
        ]
          .join(' ')
          .toLowerCase();
        if (!texto.includes(q)) return false;
      }
      return true;
    });
  }, [sesionesCaja, usuarioFiltro, busqueda, fechaDesde, fechaHasta]);

  const resumenGlobal: ResumenAuditoria = useMemo(
    () => calcularResumenAuditoria(eventos),
    [eventos]
  );

  const resumenFiltrado: ResumenAuditoria = useMemo(
    () => calcularResumenAuditoria(eventosFiltrados),
    [eventosFiltrados]
  );

  // Opciones de usuarios disponibles (combina nómina y actores presentes en los eventos)
  const opcionesUsuarios = useMemo(() => {
    const mapa = new Map<string, { id: string; nombre: string; rol?: string }>();
    for (const u of usuarios) {
      mapa.set(u.id, { id: u.id, nombre: u.nombre || u.email, rol: u.rol });
    }
    for (const ev of eventos) {
      if (ev.usuarioId && !mapa.has(ev.usuarioId)) {
        mapa.set(ev.usuarioId, {
          id: ev.usuarioId,
          nombre: ev.usuarioNombre,
          rol: ev.rolUsuario,
        });
      }
    }
    return Array.from(mapa.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [usuarios, eventos]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(
      (vistaActiva === 'eventos' ? eventosFiltrados.length : sesionesFiltradas.length) /
        itemsPorPagina
    )
  );

  const eventosPaginados = useMemo(() => {
    const inicio = (pagina - 1) * itemsPorPagina;
    return eventosFiltrados.slice(inicio, inicio + itemsPorPagina);
  }, [eventosFiltrados, pagina]);

  const sesionesPaginadas = useMemo(() => {
    const inicio = (pagina - 1) * itemsPorPagina;
    return sesionesFiltradas.slice(inicio, inicio + itemsPorPagina);
  }, [sesionesFiltradas, pagina]);

  const hayFiltrosActivos =
    moduloFiltro !== 'todos' ||
    usuarioFiltro !== 'todos' ||
    busqueda.trim() !== '' ||
    fechaDesde !== '' ||
    fechaHasta !== '';

  const limpiarFiltros = () => {
    setModuloFiltro('todos');
    setUsuarioFiltro('todos');
    setBusqueda('');
    setFechaDesde('');
    setFechaHasta('');
  };

  return {
    monedaSimbolo,
    vistaActiva,
    setVistaActiva,
    cargando,
    errorCarga,
    migracionPendiente,
    eventosFiltrados,
    eventosPaginados,
    sesionesFiltradas,
    sesionesPaginadas,
    resumenGlobal,
    resumenFiltrado,
    opcionesUsuarios,
    moduloFiltro,
    setModuloFiltro,
    usuarioFiltro,
    setUsuarioFiltro,
    busqueda,
    setBusqueda,
    fechaDesde,
    setFechaDesde,
    fechaHasta,
    setFechaHasta,
    hayFiltrosActivos,
    limpiarFiltros,
    pagina,
    setPagina,
    totalPaginas,
    itemsPorPagina,
    eventoSeleccionado,
    setEventoSeleccionado,
    recargarAuditoria,
  };
}
