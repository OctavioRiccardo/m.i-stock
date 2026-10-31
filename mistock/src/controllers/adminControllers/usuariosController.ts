'use client';

/**
 * ====================================================================
 * CONTROLADOR: GESTIÓN DE USUARIOS Y ROLES (Patrón MVC - Controller)
 * ====================================================================
 * 
 * Propósito:
 * Administrar las cuentas reales de colaboradores en Supabase Auth + `public.usuario`,
 * asignación de roles de acceso y habilitación operativa (`activo` / `inactivo`),
 * sin almacenar usuarios ficticios ni contraseñas en texto plano en `localStorage`.
 * 
 * Sincronizado con Supabase:
 * - Tabla: `public.usuario`
 * - Roles: `admin`, `vendedor`, `no_rol` (enum `public.user_rol`)
 * - Políticas RLS & RPCs: Solo `admin` activo puede crear, modificar o eliminar usuarios.
 */

import { useState, useMemo, useEffect } from 'react';
import {
  Usuario,
  RolUsuarioDB,
  EstadoUsuario,
  CrearUsuarioDTO,
} from '@/models/modelos_dominio/userModel';
import { initialUsuarios } from '@/models/mock_data/usuariosMock';
import {
  LIMITES_TEXTO,
  esEmailValido,
  esTelefonoValido,
  normalizarTexto,
  sanitizarTelefonoInput,
} from '@/lib/validaciones';
import { supabaseService } from '@/services/supabaseService';

export type FiltroRol = 'todos' | RolUsuarioDB;
export type FiltroEstado = 'todos' | 'activo' | 'inactivo';

const USUARIOS_STORAGE_KEY = 'mistock_usuarios_data_test_v1';
const LEGACY_MOCK_EMAILS = new Set(['admin@mistock.com', 'admin@test.com']);

function normalizarEstadoUsuario(estado?: EstadoUsuario): 'activo' | 'inactivo' {
  return estado === 'inactivo' || estado === 'suspendido' ? 'inactivo' : 'activo';
}

function sanitizarParaCache(lista: Usuario[]): Usuario[] {
  return lista.map((u) => {
    const copia: Usuario = {
      ...u,
      estado: normalizarEstadoUsuario(u.estado),
    };
    delete copia.password;
    return copia;
  });
}

export function useAdminUsuariosController() {
  const [usuarios, setUsuarios] = useState<Usuario[]>(() => {
    if (typeof window === 'undefined') {
      return sanitizarParaCache(initialUsuarios);
    }
    try {
      const stored = window.localStorage.getItem(USUARIOS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return sanitizarParaCache(
            parsed.filter((u: Usuario) => !LEGACY_MOCK_EMAILS.has((u.email || '').toLowerCase()))
          );
        }
      }
    } catch {}
    return sanitizarParaCache(initialUsuarios);
  });

  const [guardandoUsuario, setGuardandoUsuario] = useState<boolean>(false);

  const guardarUsuarios = (updater: (prev: Usuario[]) => Usuario[]) => {
    setUsuarios((prev) => {
      const actualizados = sanitizarParaCache(updater(prev));
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(USUARIOS_STORAGE_KEY, JSON.stringify(actualizados));
        } catch {}
      }
      return actualizados;
    });
  };

  // Sincronizar nómina autoritativa desde Supabase public.usuario (reemplazando residuos locales)
  useEffect(() => {
    let mounted = true;
    supabaseService
      .fetchUsuariosWithStatus()
      .then((res) => {
        if (!mounted || !res.ok) return;
        guardarUsuarios(() => res.items);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
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
      if (filtroRol !== 'todos' && u.rol !== filtroRol) {
        return false;
      }

      const esActivo = u.estado === 'activo';
      if (filtroEstado === 'activo' && !esActivo) {
        return false;
      }
      if (filtroEstado === 'inactivo' && esActivo) {
        return false;
      }

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
   * Crea un colaborador real en Supabase Auth + `public.usuario`.
   */
  const crearUsuario = async (dto: CrearUsuarioDTO): Promise<boolean> => {
    setMensajeError(null);

    const nombreLimpio = normalizarTexto(dto.nombre || '');
    if (
      nombreLimpio.length < LIMITES_TEXTO.NOMBRE_USUARIO_MIN ||
      nombreLimpio.length > LIMITES_TEXTO.NOMBRE_USUARIO_MAX
    ) {
      setMensajeError(
        `El nombre del colaborador debe tener entre ${LIMITES_TEXTO.NOMBRE_USUARIO_MIN} y ${LIMITES_TEXTO.NOMBRE_USUARIO_MAX} caracteres.`
      );
      return false;
    }

    const emailLimpio = (dto.email || '').trim().toLowerCase();
    if (!esEmailValido(emailLimpio)) {
      setMensajeError('Debes ingresar un correo electrónico con formato válido (ej. usuario@dominio.com).');
      return false;
    }

    if (!esTelefonoValido(dto.telefono)) {
      setMensajeError('El teléfono ingresado no es válido (debe contener entre 6 y 15 dígitos numéricos).');
      return false;
    }

    const passwordRaw = dto.password || '';
    if (
      passwordRaw.length < LIMITES_TEXTO.PASSWORD_MIN ||
      passwordRaw.length > LIMITES_TEXTO.PASSWORD_MAX
    ) {
      setMensajeError(
        `Debes asignar una contraseña de entre ${LIMITES_TEXTO.PASSWORD_MIN} y ${LIMITES_TEXTO.PASSWORD_MAX} caracteres.`
      );
      return false;
    }

    const emailExiste = usuarios.some((u) => u.email.toLowerCase() === emailLimpio);
    if (emailExiste) {
      setMensajeError(`Ya existe un usuario registrado con el correo "${emailLimpio}".`);
      return false;
    }

    const telefonoLimpio = dto.telefono ? sanitizarTelefonoInput(dto.telefono).trim() : undefined;

    setGuardandoUsuario(true);
    try {
      const res = await supabaseService.crearColaboradorRemoto({
        email: emailLimpio,
        password: passwordRaw,
        nombre: nombreLimpio,
        rol: dto.rol,
        telefono: telefonoLimpio || undefined,
      });

      if (!res.ok) {
        setMensajeError(res.error || 'No se pudo registrar el colaborador en la base de datos.');
        return false;
      }

      // Refrescar lista autoritativa desde Supabase
      const refresh = await supabaseService.fetchUsuariosWithStatus();
      if (refresh.ok) {
        guardarUsuarios(() => refresh.items);
      } else if (res.id) {
        const nuevoUsuario: Usuario = {
          id: res.id,
          email: emailLimpio,
          nombre: nombreLimpio,
          nombreCompleto: nombreLimpio,
          rol: dto.rol,
          telefono: telefonoLimpio || undefined,
          estado: 'activo',
          fechaCreacion: new Date(),
        };
        guardarUsuarios((prev) => [nuevoUsuario, ...prev]);
      }

      setModalCrearAbierto(false);
      setMensajeExito(`Colaborador "${nombreLimpio}" registrado en la base de datos exitosamente.`);
      setTimeout(() => setMensajeExito(null), 4000);
      return true;
    } finally {
      setGuardandoUsuario(false);
    }
  };

  /**
   * Modifica los datos, rol, estado o contraseña de un usuario existente y sincroniza con Supabase.
   */
  const actualizarUsuario = (id: string, datos: Partial<Usuario>): boolean => {
    setMensajeError(null);

    const usuario = usuarios.find((u) => u.id === id);
    if (!usuario) {
      setMensajeError('El usuario a modificar no existe.');
      return false;
    }

    const nombreFinal =
      datos.nombre !== undefined ? normalizarTexto(datos.nombre) : usuario.nombre;

    if (
      nombreFinal.length < LIMITES_TEXTO.NOMBRE_USUARIO_MIN ||
      nombreFinal.length > LIMITES_TEXTO.NOMBRE_USUARIO_MAX
    ) {
      setMensajeError(
        `El nombre del colaborador debe tener entre ${LIMITES_TEXTO.NOMBRE_USUARIO_MIN} y ${LIMITES_TEXTO.NOMBRE_USUARIO_MAX} caracteres.`
      );
      return false;
    }

    if (datos.telefono !== undefined && !esTelefonoValido(datos.telefono)) {
      setMensajeError('El teléfono ingresado no es válido (debe contener entre 6 y 15 dígitos numéricos).');
      return false;
    }

    const nuevaPassword = datos.password?.trim() || '';
    if (
      nuevaPassword !== '' &&
      (nuevaPassword.length < LIMITES_TEXTO.PASSWORD_MIN ||
        nuevaPassword.length > LIMITES_TEXTO.PASSWORD_MAX)
    ) {
      setMensajeError(
        `La nueva contraseña debe tener entre ${LIMITES_TEXTO.PASSWORD_MIN} y ${LIMITES_TEXTO.PASSWORD_MAX} caracteres.`
      );
      return false;
    }

    const rolFinal = datos.rol ?? usuario.rol;
    const estadoFinal =
      datos.estado !== undefined
        ? normalizarEstadoUsuario(datos.estado)
        : normalizarEstadoUsuario(usuario.estado);

    // Regla de seguridad: no dejar el sistema sin al menos un administrador activo
    if (usuario.rol === 'admin' && (rolFinal !== 'admin' || estadoFinal !== 'activo')) {
      const otrosAdminsActivos = usuarios.filter(
        (u) => u.id !== id && u.rol === 'admin' && u.estado === 'activo'
      ).length;
      if (otrosAdminsActivos === 0) {
        setMensajeError('No es posible revocar ni desactivar al único administrador activo del sistema.');
        return false;
      }
    }

    const telefonoFinal =
      datos.telefono !== undefined
        ? sanitizarTelefonoInput(datos.telefono).trim()
        : usuario.telefono || '';

    const snapshotPrevio = usuarios;

    guardarUsuarios((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        return {
          ...u,
          nombre: nombreFinal,
          nombreCompleto: nombreFinal,
          rol: rolFinal,
          estado: estadoFinal,
          telefono: telefonoFinal || undefined,
          fechaActualizacion: new Date(),
        };
      })
    );

    // Sincronizar con Supabase public.usuario
    supabaseService
      .updateUsuario(id, {
        nombre: nombreFinal,
        rol: rolFinal,
        telefono: telefonoFinal,
        activo: estadoFinal === 'activo',
      })
      .then((ok) => {
        if (!ok) {
          guardarUsuarios(() => snapshotPrevio);
          setMensajeError('No se pudieron guardar los cambios en Supabase. Verifique sus permisos.');
        }
      })
      .catch(() => {
        guardarUsuarios(() => snapshotPrevio);
      });

    // Si se solicitó cambio de contraseña, impactar en auth.users
    if (nuevaPassword !== '') {
      supabaseService
        .actualizarPasswordColaborador(id, nuevaPassword)
        .then((res) => {
          if (!res.ok) {
            setMensajeError(
              res.error || 'Los datos se actualizaron, pero no se pudo cambiar la contraseña en Auth.'
            );
          }
        })
        .catch(() => {});
    }

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
   * Alterna el estado operativo de la cuenta entre `activo` e `inactivo`.
   */
  const toggleEstadoUsuario = (id: string) => {
    const usuario = usuarios.find((u) => u.id === id);
    if (!usuario) return;

    const proximoEstado: EstadoUsuario =
      usuario.estado === 'activo' ? 'inactivo' : 'activo';

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
      const otrosAdminsActivos = usuarios.filter(
        (u) => u.id !== id && u.rol === 'admin' && u.estado === 'activo'
      ).length;
      if (otrosAdminsActivos === 0) {
        setMensajeError('Operación bloqueada: No puedes eliminar al único administrador activo.');
        return false;
      }
    }

    const snapshotPrevio = usuarios;
    guardarUsuarios((prev) => prev.filter((u) => u.id !== id));

    supabaseService
      .deleteUsuario(id)
      .then((ok) => {
        if (!ok) {
          guardarUsuarios(() => snapshotPrevio);
          setMensajeError('No se pudo eliminar el usuario en la base de datos.');
        }
      })
      .catch(() => {
        guardarUsuarios(() => snapshotPrevio);
      });

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
    guardandoUsuario,
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
