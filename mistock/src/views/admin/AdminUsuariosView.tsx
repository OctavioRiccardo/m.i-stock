'use client';

/**
 * ====================================================================
 * VISTA: GESTIÓN DE USUARIOS Y ROLES (Patrón MVC - View)
 * ====================================================================
 * 
 * Propósito:
 * Proporcionar una interfaz limpia, segura y profesional para administrar
 * las cuentas de empleados, asignación de roles y estados operativos (`activo` / `inactivo`).
 * 
 * Sincronizado con Supabase:
 * - Tabla: `public.usuario`
 * - Roles nativos: `admin`, `vendedor`, `no_rol` (enum `public.user_rol`)
 */

import React, { useState } from 'react';
import { motion, MotionConfig } from 'motion/react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  UserCheck,
  Clock,
  MagnifyingGlass,
  Funnel,
  Check,
  WarningCircle,
  PencilSimple,
  Trash,
  CaretLeft,
  CaretRight,
  X,
  Phone,
  EnvelopeSimple,
  Power,
  Shield,
  Key,
  Eye,
  EyeSlash,
  Copy,
} from '@phosphor-icons/react';
import {
  useAdminUsuariosController,
  FiltroRol,
  FiltroEstado,
} from '@/controllers/adminControllers/usuariosController';
import {
  Usuario,
  RolUsuarioDB,
  EstadoUsuario,
} from '@/models/modelos_dominio/userModel';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LIMITES_TEXTO, sanitizarTelefonoInput } from '@/lib/validaciones';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface AdminUsuariosViewProps {
  controller: ReturnType<typeof useAdminUsuariosController>;
}

export function AdminUsuariosView({ controller }: AdminUsuariosViewProps) {
  const {
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
    guardandoUsuario,
    crearUsuario,
    actualizarUsuario,
    cambiarRolRapido,
    toggleEstadoUsuario,
    eliminarUsuario,
    abrirModalEditar,
    abrirModalEliminar,
    limpiarFiltros,
    limpiarMensajes,
  } = controller;

  // Auto-animaciones para el cuerpo de la tabla
  const [tableBodyRef] = useAutoAnimate<HTMLTableSectionElement>({ duration: 200, easing: 'ease-out' });

  // Estado del formulario de creación
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoRol, setNuevoRol] = useState<RolUsuarioDB>('vendedor');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevoPassword, setNuevoPassword] = useState('');
  const [mostrarNuevoPassword, setMostrarNuevoPassword] = useState(false);
  const [copiadoPassword, setCopiadoPassword] = useState(false);

  // Estado del formulario de edición
  const [editNombre, setEditNombre] = useState('');
  const [editRol, setEditRol] = useState<RolUsuarioDB>('vendedor');
  const [editEstado, setEditEstado] = useState<EstadoUsuario>('activo');
  const [editTelefono, setEditTelefono] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [mostrarEditPassword, setMostrarEditPassword] = useState(false);
  const [copiadoEditPassword, setCopiadoEditPassword] = useState(false);

  const copiarAlPortapapeles = (texto: string, setCopiado: (val: boolean) => void) => {
    if (!texto) return;
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  // Al abrir edición, inicializar valores con estado normalizado ('activo' | 'inactivo')
  const handleAbrirEdicion = (usuario: Usuario) => {
    setEditNombre(usuario.nombre);
    setEditRol((usuario.rol as RolUsuarioDB) || 'vendedor');
    setEditEstado(usuario.estado === 'activo' ? 'activo' : 'inactivo');
    setEditTelefono(usuario.telefono || '');
    setEditPassword(usuario.password || '');
    setMostrarEditPassword(false);
    abrirModalEditar(usuario);
  };

  const handleCrearSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guardandoUsuario) return;
    const exito = await crearUsuario({
      nombre: nuevoNombre,
      email: nuevoEmail,
      rol: nuevoRol,
      telefono: nuevoTelefono || undefined,
      password: nuevoPassword.trim() || undefined,
    });
    if (exito) {
      setNuevoNombre('');
      setNuevoEmail('');
      setNuevoRol('vendedor');
      setNuevoTelefono('');
      setNuevoPassword('');
      setMostrarNuevoPassword(false);
    }
  };

  const handleEditarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioSeleccionado) return;
    actualizarUsuario(usuarioSeleccionado.id, {
      nombre: editNombre,
      rol: editRol,
      estado: editEstado,
      telefono: editTelefono || undefined,
      password: editPassword.trim() || undefined,
    });
  };

  const hayFiltrosActivos =
    busqueda.trim() !== '' || filtroRol !== 'todos' || filtroEstado !== 'todos';

  // Helper para iniciales de avatar
  const getIniciales = (nombre: string) => {
    const partes = nombre.trim().split(' ');
    if (partes.length >= 2) {
      return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
    }
    return nombre.slice(0, 2).toUpperCase() || 'US';
  };

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Encabezado Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E2F1F0] text-[#2A7A78]">
                <Users className="h-4 w-4" />
              </div>
              <h1 className="text-2xl font-bold text-[#1C2424] tracking-tight">
                Gestión de Usuarios
              </h1>
            </div>
            <p className="text-sm text-[#657373] mt-1">
              Administración de colaboradores, asignación de roles y habilitación de permisos de acceso.
            </p>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => setModalCrearAbierto(true)}
            className="bg-[#2A7A78] hover:bg-[#205E5C] text-white shadow-sm gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <UserPlus className="h-4 w-4" weight="bold" />
            <span>Nuevo Colaborador</span>
          </Button>
        </div>

        {/* Notificaciones Globales */}
        {mensajeExito && (
          <Alert variant="success" className="cursor-pointer shadow-sm" onClick={limpiarMensajes}>
            <Check className="h-4 w-4" weight="bold" />
            <AlertTitle>Operación Exitosa</AlertTitle>
            <AlertDescription>{mensajeExito}</AlertDescription>
          </Alert>
        )}

        {mensajeError && (
          <Alert variant="destructive" className="cursor-pointer shadow-sm" onClick={limpiarMensajes}>
            <WarningCircle className="h-4 w-4" weight="duotone" />
            <AlertTitle>Atención</AlertTitle>
            <AlertDescription>{mensajeError}</AlertDescription>
          </Alert>
        )}

        {/* Tarjetas KPI de Resumen de Cuentas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Colaboradores */}
          <Card className="p-4 border-[#E8E6DF] shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#657373]">
                Total Colaboradores
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E2F1F0] text-[#2A7A78]">
                <Users className="h-4 w-4" weight="duotone" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-[#1C2424] tracking-tight mt-2">
              {metricasUsuarios.total}
            </p>
            <p className="text-xs text-[#657373] mt-1">
              {metricasUsuarios.activos} cuentas activas en la empresa
            </p>
          </Card>

          {/* Card 2: Administradores */}
          <Card className="p-4 border-[#E8E6DF] shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#657373]">
                Administradores
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E2F1F0] text-[#2A7A78]">
                <ShieldCheck className="h-4 w-4" weight="duotone" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-[#1C2424] tracking-tight mt-2">
              {metricasUsuarios.admins}
            </p>
            <p className="text-xs text-[#657373] mt-1">
              Privilegios completos y finanzas
            </p>
          </Card>

          {/* Card 3: Vendedores / Cajeros */}
          <Card className="p-4 border-[#E8E6DF] shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#657373]">
                Vendedores (POS)
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <UserCheck className="h-4 w-4" weight="duotone" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-[#1C2424] tracking-tight mt-2">
              {metricasUsuarios.vendedores}
            </p>
            <p className="text-xs text-[#657373] mt-1">
              Operadores de venta y caja
            </p>
          </Card>

          {/* Card 4: Pendientes sin Rol */}
          <Card className="p-4 border-[#E8E6DF] shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#657373]">
                Pendientes de Rol
              </span>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  metricasUsuarios.noRol > 0
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-[#F8F7F2] text-[#657373]'
                }`}
              >
                <Clock className="h-4 w-4" weight="duotone" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-2xl font-extrabold text-[#1C2424] tracking-tight">
                {metricasUsuarios.noRol}
              </p>
              {metricasUsuarios.noRol > 0 && (
                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-[10px] px-1.5">
                  Por asignar
                </Badge>
              )}
            </div>
            <p className="text-xs text-[#657373] mt-1">
              Pendientes de asignación de rol
            </p>
          </Card>
        </div>

        {/* Tabla y Filtros de Colaboradores */}
        <Card className="border-[#E8E6DF] shadow-sm">
          <CardHeader className="pb-4 border-b border-[#E8E6DF] space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-bold text-[#1C2424]">
                    Listado de Colaboradores
                  </CardTitle>
                  <Badge variant="default" className="text-xs">
                    {usuariosFiltrados.length}{' '}
                    {usuariosFiltrados.length === 1 ? 'cuenta' : 'cuentas'}
                  </Badge>
                </div>
                <p className="text-xs text-[#657373] mt-0.5">
                  Gestiona las asignaciones de rol y el estado de habilitación de cada usuario.
                </p>
              </div>

              {/* Filtros: Búsqueda, Rol y Estado */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                {/* Buscador */}
                <div className="relative w-full sm:w-56">
                  <MagnifyingGlass className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#657373]" />
                  <Input
                    placeholder="Buscar por nombre o correo..."
                    maxLength={LIMITES_TEXTO.EMAIL_MAX}
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="h-9 pl-8 text-xs"
                  />
                </div>

                {/* Filtro Rol */}
                <div className="w-full sm:w-40">
                  <Select value={filtroRol} onValueChange={(val) => setFiltroRol(val as FiltroRol)}>
                    <SelectTrigger className="h-9 text-xs">
                      <Shield className="h-3.5 w-3.5 mr-1 text-[#657373]" />
                      <SelectValue placeholder="Rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los roles</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="vendedor">Vendedor</SelectItem>
                      <SelectItem value="no_rol">Sin Rol Asignado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro Estado Unificado */}
                <div className="w-full sm:w-36">
                  <Select
                    value={filtroEstado}
                    onValueChange={(val) => setFiltroEstado(val as FiltroEstado)}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <Funnel className="h-3.5 w-3.5 mr-1 text-[#657373]" />
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los estados</SelectItem>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="inactivo">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {hayFiltrosActivos && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={limpiarFiltros}
                    className="h-9 px-2 text-xs text-[#657373] hover:text-[#1C2424]"
                    title="Limpiar filtros"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {usuariosFiltrados.length === 0 ? (
              <div className="py-16 text-center flex flex-col items-center justify-center space-y-3 px-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F8F7F2] text-[#657373]">
                  <Users className="h-6 w-6" />
                </div>
                <div className="max-w-md">
                  <p className="font-semibold text-sm text-[#1C2424]">
                    No se encontraron colaboradores
                  </p>
                  <p className="text-xs text-[#657373] mt-1">
                    {hayFiltrosActivos
                      ? 'No hay usuarios que coincidan con los criterios de búsqueda o filtros aplicados.'
                      : 'Aún no hay colaboradores registrados en el sistema.'}
                  </p>
                </div>
                {hayFiltrosActivos && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-2 text-xs border-[#2A7A78] text-[#2A7A78] hover:bg-[#E2F1F0]"
                    onClick={limpiarFiltros}
                  >
                    Restablecer filtros
                  </Button>
                )}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Colaborador</TableHead>
                      <TableHead>Rol Asignado</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Último Acceso</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody ref={tableBodyRef}>
                    {usuariosPaginados.map((usr) => {
                      const esAdmin = usr.rol === 'admin';
                      const esVendedor = usr.rol === 'vendedor';

                      return (
                        <TableRow key={usr.id} className="hover:bg-[#F8F7F2]/50 transition-colors">
                          {/* Colaborador con Avatar e Identidad */}
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                                  esAdmin
                                    ? 'bg-[#2A7A78] text-white shadow-xs'
                                    : esVendedor
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {getIniciales(usr.nombre)}
                              </div>
                              <div>
                                <div className="font-semibold text-sm text-[#1C2424] flex items-center gap-1.5">
                                  <span>{usr.nombre}</span>
                                  {esAdmin && (
                                    <span title="Administrador">
                                      <ShieldCheck className="h-3.5 w-3.5 text-[#2A7A78]" weight="duotone" />
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-[#657373] mt-0.5">
                                  <span className="flex items-center gap-1">
                                    <EnvelopeSimple className="h-3 w-3" />
                                    {usr.email}
                                  </span>
                                  {usr.telefono && (
                                    <>
                                      <span>•</span>
                                      <span className="flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        {usr.telefono}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          {/* Rol con cambio rápido */}
                          <TableCell>
                            <Select
                              value={usr.rol}
                              onValueChange={(nuevo) => cambiarRolRapido(usr.id, nuevo as RolUsuarioDB)}
                            >
                              <SelectTrigger className="h-8 w-36 text-xs font-medium border-[#E8E6DF]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">
                                  <div className="flex items-center gap-1.5 font-medium text-[#2A7A78]">
                                    <ShieldCheck className="h-3.5 w-3.5" weight="duotone" />
                                    <span>Administrador</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="vendedor">
                                  <div className="flex items-center gap-1.5 font-medium text-emerald-700">
                                    <UserCheck className="h-3.5 w-3.5" weight="duotone" />
                                    <span>Vendedor</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="no_rol">
                                  <div className="flex items-center gap-1.5 font-medium text-amber-700">
                                    <Clock className="h-3.5 w-3.5" weight="duotone" />
                                    <span>Sin Rol</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>

                          {/* Estado de Cuenta Unificado */}
                          <TableCell>
                            {usr.estado === 'activo' ? (
                              <Badge variant="success" className="text-xs">
                                Activo
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                Inactivo
                              </Badge>
                            )}
                          </TableCell>

                          {/* Último Acceso */}
                          <TableCell className="text-xs text-[#657373]">
                            {usr.ultimoAcceso instanceof Date
                              ? usr.ultimoAcceso.toLocaleDateString('es-AR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : usr.ultimoAcceso || 'Sin registro'}
                          </TableCell>

                          {/* Acciones */}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Botón Editar */}
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs px-2 text-[#2A7A78] hover:bg-[#E2F1F0] border-[#E8E6DF] cursor-pointer"
                                onClick={() => handleAbrirEdicion(usr)}
                                title="Editar colaborador"
                              >
                                <PencilSimple className="h-3.5 w-3.5 mr-1" />
                                Editar
                              </Button>

                              {/* Toggle Activo / Inactivo */}
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className={`h-7 text-xs px-2 cursor-pointer ${
                                  usr.estado === 'activo'
                                    ? 'text-amber-700 hover:bg-amber-50 border-amber-200'
                                    : 'text-emerald-700 hover:bg-emerald-50 border-emerald-200'
                                }`}
                                onClick={() => toggleEstadoUsuario(usr.id)}
                                title={
                                  usr.estado === 'activo'
                                    ? 'Desactivar cuenta de usuario'
                                    : 'Reactivar cuenta de usuario'
                                }
                              >
                                <Power className="h-3.5 w-3.5" />
                              </Button>

                              {/* Botón Eliminar */}
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs px-2 text-red-600 hover:bg-red-50 border-red-200 cursor-pointer"
                                onClick={() => abrirModalEliminar(usr)}
                                title="Eliminar usuario"
                              >
                                <Trash className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Barra de Paginación */}
                {usuariosFiltrados.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 px-4 pb-3 border-t border-[#E8E6DF] text-xs text-[#657373]">
                    <div>
                      Mostrando <span className="font-semibold text-[#1C2424]">{inicioPaginacion + 1}</span> a{' '}
                      <span className="font-semibold text-[#1C2424]">
                        {Math.min(inicioPaginacion + itemsPorPagina, usuariosFiltrados.length)}
                      </span>{' '}
                      de <span className="font-semibold text-[#1C2424]">{usuariosFiltrados.length}</span> colaboradores
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-xs text-[#1C2424] border-[#E8E6DF] hover:bg-[#F8F7F2] active:scale-95 transition-all duration-150 cursor-pointer"
                        onClick={() => setPagina(Math.max(pagina - 1, 1))}
                        disabled={pagina <= 1}
                      >
                        <CaretLeft className="h-3.5 w-3.5 mr-1" />
                        Anterior
                      </Button>
                      <span className="px-2 font-medium text-[#1C2424]">
                        {pagina} / {totalPaginas}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-xs text-[#1C2424] border-[#E8E6DF] hover:bg-[#F8F7F2] active:scale-95 transition-all duration-150 cursor-pointer"
                        onClick={() => setPagina(Math.min(pagina + 1, totalPaginas))}
                        disabled={pagina >= totalPaginas}
                      >
                        Siguiente
                        <CaretRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* ====================================================================
            MODAL 1: ALTA DE NUEVO COLABORADOR / INVITACIÓN
            ==================================================================== */}
        <Dialog open={modalCrearAbierto} onOpenChange={setModalCrearAbierto}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E2F1F0] text-[#2A7A78]">
                  <UserPlus className="h-4 w-4" />
                </div>
                <DialogTitle className="text-base font-bold text-[#1C2424]">
                  Incorporar Colaborador
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-[#657373]">
                Ingresa los datos del nuevo miembro del equipo y asígnale su rol en el sistema.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCrearSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1C2424]">
                  Nombre y Apellido <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  placeholder="Ej: Marcos Gómez"
                  autoComplete="name"
                  minLength={LIMITES_TEXTO.NOMBRE_USUARIO_MIN}
                  maxLength={LIMITES_TEXTO.NOMBRE_USUARIO_MAX}
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1C2424]">
                  Correo Electrónico <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  type="email"
                  placeholder="marcos.gomez@empresa.com"
                  autoComplete="email"
                  maxLength={LIMITES_TEXTO.EMAIL_MAX}
                  value={nuevoEmail}
                  onChange={(e) => setNuevoEmail(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#1C2424]">
                    Rol Inicial <span className="text-red-500">*</span>
                  </label>
                  <Select value={nuevoRol} onValueChange={(val) => setNuevoRol(val as RolUsuarioDB)}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vendedor">Vendedor</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="no_rol">Sin Rol</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#1C2424]">
                    Teléfono (Opcional)
                  </label>
                  <Input
                    type="tel"
                    autoComplete="tel"
                    maxLength={LIMITES_TEXTO.TELEFONO_MAX}
                    placeholder="+54 9 11 ..."
                    value={nuevoTelefono}
                    onChange={(e) => setNuevoTelefono(sanitizarTelefonoInput(e.target.value))}
                  />
                </div>
              </div>

              {/* Contraseña de Acceso */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1C2424] flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-[#2A7A78]" weight="duotone" />
                  <span>Contraseña de Acceso <span className="text-red-500">*</span></span>
                </label>
                <div className="relative">
                  <Input
                    type={mostrarNuevoPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    minLength={LIMITES_TEXTO.PASSWORD_MIN}
                    maxLength={LIMITES_TEXTO.PASSWORD_MAX}
                    placeholder="Mínimo 6 caracteres (ej: Pass1234!)"
                    value={nuevoPassword}
                    onChange={(e) => setNuevoPassword(e.target.value)}
                    className="pr-16 text-xs font-mono"
                  />
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                    {nuevoPassword && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-[#657373] hover:text-[#1C2424] cursor-pointer"
                        onClick={() => copiarAlPortapapeles(nuevoPassword, setCopiadoPassword)}
                        title="Copiar contraseña"
                      >
                        {copiadoPassword ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" weight="bold" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-[#657373] hover:text-[#1C2424] cursor-pointer"
                      onClick={() => setMostrarNuevoPassword(!mostrarNuevoPassword)}
                      title={mostrarNuevoPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {mostrarNuevoPassword ? (
                        <EyeSlash className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
                {copiadoPassword && (
                  <p className="text-[11px] text-emerald-600 font-medium">
                    ¡Contraseña copiada al portapapeles!
                  </p>
                )}
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModalCrearAbierto(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-[#2A7A78] hover:bg-[#205E5C] text-white gap-1.5"
                >
                  <Check className="h-4 w-4" />
                  <span>{guardandoUsuario ? 'Registrando...' : 'Guardar Colaborador'}</span>
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ====================================================================
            MODAL 2: EDICIÓN DE USUARIO
            ==================================================================== */}
        <Dialog open={modalEditarAbierto} onOpenChange={setModalEditarAbierto}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E2F1F0] text-[#2A7A78]">
                  <PencilSimple className="h-4 w-4" weight="duotone" />
                </div>
                <DialogTitle className="text-base font-bold text-[#1C2424]">
                  Editar Datos de Usuario
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-[#657373]">
                Modifica el rol, permisos de acceso y estado del colaborador.
              </DialogDescription>
            </DialogHeader>

            {usuarioSeleccionado && (
              <form onSubmit={handleEditarSubmit} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#1C2424]">
                    Nombre Completo
                  </label>
                  <Input
                    required
                    autoComplete="name"
                    minLength={LIMITES_TEXTO.NOMBRE_USUARIO_MIN}
                    maxLength={LIMITES_TEXTO.NOMBRE_USUARIO_MAX}
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#1C2424]">
                    Correo Electrónico
                  </label>
                  <Input
                    disabled
                    value={usuarioSeleccionado.email}
                    className="bg-[#F8F7F2] text-[#657373] cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#1C2424]">
                      Rol en el Sistema
                    </label>
                    <Select value={editRol} onValueChange={(val) => setEditRol(val as RolUsuarioDB)}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="vendedor">Vendedor</SelectItem>
                        <SelectItem value="no_rol">Sin Rol</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#1C2424]">
                      Estado de Acceso
                    </label>
                    <Select
                      value={editEstado}
                      onValueChange={(val) => setEditEstado(val as EstadoUsuario)}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activo">Activo</SelectItem>
                        <SelectItem value="inactivo">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#1C2424]">
                    Teléfono de Contacto
                  </label>
                  <Input
                    type="tel"
                    autoComplete="tel"
                    maxLength={LIMITES_TEXTO.TELEFONO_MAX}
                    value={editTelefono}
                    onChange={(e) => setEditTelefono(sanitizarTelefonoInput(e.target.value))}
                  />
                </div>

                {/* Modificar Contraseña */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#1C2424] flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-[#2A7A78]" weight="duotone" />
                    <span>Modificar Contraseña</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={mostrarEditPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      minLength={LIMITES_TEXTO.PASSWORD_MIN}
                      maxLength={LIMITES_TEXTO.PASSWORD_MAX}
                      placeholder="Dejar en blanco para conservar la actual"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      className="pr-16 text-xs font-mono"
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                      {editPassword && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-[#657373] hover:text-[#1C2424] cursor-pointer"
                          onClick={() => copiarAlPortapapeles(editPassword, setCopiadoEditPassword)}
                          title="Copiar contraseña"
                        >
                          {copiadoEditPassword ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" weight="bold" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-[#657373] hover:text-[#1C2424] cursor-pointer"
                        onClick={() => setMostrarEditPassword(!mostrarEditPassword)}
                        title={mostrarEditPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                      >
                        {mostrarEditPassword ? (
                          <EyeSlash className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {copiadoEditPassword && (
                    <p className="text-[11px] text-emerald-600 font-medium">
                      ¡Nueva contraseña copiada al portapapeles!
                    </p>
                  )}
                </div>

                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setModalEditarAbierto(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-[#2A7A78] hover:bg-[#205E5C] text-white gap-1.5"
                  >
                    <Check className="h-4 w-4" weight="bold" />
                    <span>Guardar Cambios</span>
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* ====================================================================
            MODAL 3: CONFIRMACIÓN DE ELIMINACIÓN / DESVINCULACIÓN
            ==================================================================== */}
        <Dialog open={modalEliminarAbierto} onOpenChange={setModalEliminarAbierto}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
                  <Trash className="h-4 w-4" weight="duotone" />
                </div>
                <DialogTitle className="text-base font-bold text-[#1C2424]">
                  Confirmar Desvinculación
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-[#657373] pt-1">
                ¿Estás seguro de que deseas eliminar la cuenta de{' '}
                <strong className="text-[#1C2424]">{usuarioSeleccionado?.nombre}</strong> ({usuarioSeleccionado?.email})?
                El colaborador perderá acceso inmediato a la plataforma.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalEliminarAbierto(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="gap-1.5"
                onClick={() => {
                  if (usuarioSeleccionado) {
                    eliminarUsuario(usuarioSeleccionado.id);
                  }
                }}
              >
                <Trash className="h-4 w-4" weight="bold" />
                <span>Desvincular Usuario</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </MotionConfig>
  );
}
