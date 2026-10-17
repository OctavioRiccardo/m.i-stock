'use client';

/**
 * ====================================================================
 * CONTROLADOR: GESTIÓN DE USUARIOS Y ROLES (Patrón MVC - Controller)
 * ====================================================================
 * 
 * Propósito:
 * Administrar las cuentas de colaboradores, asignación de roles RBAC
 * y habilitación de estados en el sistema.
 * 
 * Sincronizado con Supabase:
 * - Tabla: `public.usuario`
 * - Roles: `admin`, `vendedor`, `no_rol` (enum `public.user_rol`)
 * - Políticas RLS: Solo `admin` puede insertar, modificar o eliminar usuarios.
 */

import { useState, useMemo, useEffect } from 'react';
import {
  Usuario,
  RolUsuarioDB,
  EstadoUsuario,
  CrearUsuarioDTO,
} from '@/models/modelos_dominio/userModel';
import { initialUsuarios } from '@/models/mock_data/usuariosMock';
import { supabaseService } from '@/services/supabaseService';

export type FiltroRol = 'todos' | RolUsuarioDB;
export type FiltroEstado = 'todos' | EstadoUsuario;

const USUARIOS_STORAGE_KEY = 'mistock_usuarios_data_test_v1';

export function useAdminUsuariosController() {
  const [usuarios, setUsuarios] = useState<Usuario[]>(() => {
    if (typeof window === 'undefined') return initialUsuarios;
    try {
      const stored = window.localStorage.getItem(USUARIOS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const emails = new Set(parsed.map((u: Usuario) => u.email.toLowerCase()));
          const faltantes = initialUsuarios.filter((u) => !emails.has(u.email.toLowerCase()));
          return faltantes.length > 0 ? [...faltantes, ...parsed] : parsed;
        }
      }
    } catch {}
    return initialUsuarios;
  });

  const guardarUsuarios = (updater: (prev: Usuario[]) => Usuario[]) => {
    setUsuarios((prev) => {
      const actualizados = updater(prev);
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(USUARIOS_STORAGE_KEY, JSON.stringify(actualizados));
        } catch {}
      }
      return actualizados;
    });
  };

  // Sincronizar colaboradores remotos desde Supabase public.usuario
  useEffect(() => {
    supabaseService
      .fetchUsuarios()
      .then((usuariosRemotos) => {
        if (usuariosRemotos && usuariosRemotos.length > 0) {
          guardarUsuarios((prev) => {
            const idsExistentes = new Set(prev.map((u) => u.id));
            const emailsExistentes = new Set(prev.map((u) => u.email.toLowerCase()));
            const actualizados = [...prev];
            let cambio = false;

            for (const u of usuariosRemotos) {
              if (!idsExistentes.has(u.id) && !emailsExistentes.has(u.email.toLowerCase())) {
                actualizados.push(u);
                cambio = true;
              }
            }
            return cambio ? actualizados : prev;
          });
        }
      })
      .catch(() => {});
  }, []);

  const [busqueda, setBusquedaState] = useState<string>('');
  const [filtroRol, setFiltroRolState] = useState<FiltroRol>('todos');
  const [filtroEstado, setFiltroEstadoState] = useState<FiltroEstado>('todos');
  const [pagina, setPagina] = useState<number>(1);
  const itemsPorPagina = 6;

  // Estados de modales y diálogos
  const [modalCrearAbierto, setModalCrearAbierto] = useState<boolean>(false);
  const [modalEditarAbierto, setModalEditarAbierto] = useState<boolean>(false);
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState<boolean>(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);

  // Mensajes de retroalimentación
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const setBusqueda = (term: string) => {
    setBusquedaState(term);
    setPagina(1);
  };

  const setFiltroRol = (rol: FiltroRol) => {
    setFiltroRolState(rol);
    setPagina(1);
  };

  const setFiltroEstado = (estado: FiltroEstado) => {
    setFiltroEstadoState(estado);
    setPagina(1);
  };

  const limpiarFiltros = () => {
    setBusquedaState('');
    setFiltroRolState('todos');
    setFiltroEstadoState('todos');
    setPagina(1);
  };

  const limpiarMensajes = () => {
    setMensajeExito(null);
    setMensajeError(null);
  };

  // Métricas consolidadas del panel de usuarios
  const metricasUsuarios = useMemo(() => {
    const total = usuarios.length;
    const admins = usuarios.filter((u) => u.rol === 'admin').length;
    const vendedores = usuarios.filter((u) => u.rol === 'vendedor').length;
    const noRol = usuarios.filter((u) => u.rol === 'no_rol').length;
    const activos = usuarios.filter((u) => u.estado === 'activo').length;

    return {
      total,
      admins,
      vendedores,
      noRol,
      activos,
    };
  }, [usuarios]);

  // Lista filtrada reactivamente
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      // Filtro de rol
      if (filtroRol !== 'todos' && u.rol !== filtroRol) {
        return false;
      }

      // Filtro de estado
      if (filtroEstado !== 'todos' && u.estado !== filtroEstado) {
        return false;
      }

      // Búsqueda por texto (nombre o email)
      if (busqueda.trim()) {
        const query = busqueda.trim().toLowerCase();
        const coincideNombre = u.nombre.toLowerCase().includes(query);
        const coincideEmail = u.email.toLowerCase().includes(query);
        const coincideTel = (u.telefono || '').toLowerCase().includes(query);
        if (!coincideNombre && !coincideEmail && !coincideTel) {
          return false;
        }
      }

      return true;
    });
  }, [usuarios, filtroRol, filtroEstado, busqueda]);

  // Paginación
  const totalPaginas = Math.max(1, Math.ceil(usuariosFiltrados.length / itemsPorPagina));
  const inicioPaginacion = (pagina - 1) * itemsPorPagina;
  const usuariosPaginados = usuariosFiltrados.slice(
    inicioPaginacion,
    inicioPaginacion + itemsPorPagina
  );

  /**
   * Crea un nuevo usuario o registra una invitación en el sistema.
   */
  const crearUsuario = (dto: CrearUsuarioDTO): boolean => {
    setMensajeError(null);

    if (!dto.nombre.trim()) {
      setMensajeError('El nombre del colaborador es obligatorio.');
      return false;
    }

    if (!dto.email.trim() || !dto.email.includes('@')) {
      setMensajeError('Debes ingresar un correo electrónico válido.');
      return false;
    }

    const emailExiste = usuarios.some(
      (u) => u.email.toLowerCase() === dto.email.trim().toLowerCase()
    );
    if (emailExiste) {
      setMensajeError(`Ya existe un usuario registrado con el correo "${dto.email}".`);
      return false;
    }

    const nuevoUsuario: Usuario = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      email: dto.email.trim().toLowerCase(),
      nombre: dto.nombre.trim(),
      nombreCompleto: dto.nombre.trim(),
      rol: dto.rol,
      telefono: dto.telefono?.trim() || undefined,
      password: dto.password?.trim() || undefined,
      estado: 'activo',
      fechaCreacion: new Date(),
      ultimoAcceso: new Date(),
    };

    guardarUsuarios((prev) => [nuevoUsuario, ...prev]);
    setModalCrearAbierto(false);
    setMensajeExito(`Usuario "${nuevoUsuario.nombre}" incorporado exitosamente.`);
    setTimeout(() => setMensajeExito(null), 4000);
    return true;
  };

  /**
   * Modifica los datos o rol de un usuario existente.
   */
  const actualizarUsuario = (id: string, datos: Partial<Usuario>): boolean => {
    setMensajeError(null);

    const usuario = usuarios.find((u) => u.id === id);
    if (!usuario) {
      setMensajeError('El usuario a modificar no existe.');
      return false;
    }

    // Regla de seguridad: no dejar el sistema sin administradores
    if (usuario.rol === 'admin' && datos.rol && datos.rol !== 'admin') {
      const cantidadAdmins = usuarios.filter((u) => u.rol === 'admin').length;
      if (cantidadAdmins <= 1) {
        setMensajeError('No es posible revocar el rol al único administrador del sistema.');
        return false;
      }
    }

    guardarUsuarios((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        return {
          ...u,
          ...datos,
          nombre: datos.nombre ? datos.nombre.trim() : u.nombre,
          nombreCompleto: datos.nombre ? datos.nombre.trim() : u.nombreCompleto,
          password: datos.password !== undefined ? (datos.password.trim() || undefined) : u.password,
          fechaActualizacion: new Date(),
        };
      })
    );

    setModalEditarAbierto(false);
    setUsuarioSeleccionado(null);
    setMensajeExito('Datos del usuario actualizados correctamente.');
    setTimeout(() => setMensajeExito(null), 4000);
    return true;
  };

  /**
   * Modifica directamente el rol de un colaborador (asignación rápida).
   */
  const cambiarRolRapido = (id: string, nuevoRol: RolUsuarioDB) => {
    actualizarUsuario(id, { rol: nuevoRol });
  };

  /**
   * Cambia el estado operativo (activo / suspendido / inactivo).
   */
  const toggleEstadoUsuario = (id: string) => {
    const usuario = usuarios.find((u) => u.id === id);
    if (!usuario) return;

    const proximoEstado: EstadoUsuario =
      usuario.estado === 'activo' ? 'suspendido' : 'activo';

    actualizarUsuario(id, { estado: proximoEstado });
  };

  /**
   * Elimina un usuario del sistema (desvinculación).
   */
  const eliminarUsuario = (id: string): boolean => {
    setMensajeError(null);
    const usuario = usuarios.find((u) => u.id === id);

    if (!usuario) {
      setMensajeError('El usuario que intentas eliminar no fue encontrado.');
      return false;
    }

    if (usuario.rol === 'admin') {
      const cantidadAdmins = usuarios.filter((u) => u.rol === 'admin').length;
      if (cantidadAdmins <= 1) {
        setMensajeError('Operación bloqueada: No puedes eliminar al único administrador.');
        return false;
      }
    }

    guardarUsuarios((prev) => prev.filter((u) => u.id !== id));
    setModalEliminarAbierto(false);
    setUsuarioSeleccionado(null);
    setMensajeExito(`El usuario "${usuario.nombre}" fue desvinculado del sistema.`);
    setTimeout(() => setMensajeExito(null), 4000);
    return true;
  };

  const abrirModalEditar = (usuario: Usuario) => {
    setUsuarioSeleccionado(usuario);
    setModalEditarAbierto(true);
  };

  const abrirModalEliminar = (usuario: Usuario) => {
    setUsuarioSeleccionado(usuario);
    setModalEliminarAbierto(true);
  };

  return {
    usuarios,
    busqueda,
    setBusqueda,
    filtroRol,
    setFiltroRol,
    filtroEstado,
    setFiltroEstado,
    pagina,
    setPagina,
    totalPaginas,
    inicioPaginacion,
    itemsPorPagina,
    metricasUsuarios,
    usuariosFiltrados,
    usuariosPaginados,
    modalCrearAbierto,
    setModalCrearAbierto,
    modalEditarAbierto,
    setModalEditarAbierto,
    modalEliminarAbierto,
    setModalEliminarAbierto,
    usuarioSeleccionado,
    mensajeExito,
    mensajeError,
    crearUsuario,
    actualizarUsuario,
    cambiarRolRapido,
    toggleEstadoUsuario,
    eliminarUsuario,
    abrirModalEditar,
    abrirModalEliminar,
    limpiarFiltros,
    limpiarMensajes,
  };
}
