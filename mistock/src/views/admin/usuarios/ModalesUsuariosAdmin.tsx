'use client';

import React, { useState } from 'react';
import {
  UserPlus,
  Check,
  PencilSimple,
  Trash,
  Key,
  Eye,
  EyeSlash,
  Copy,
} from '@phosphor-icons/react';
import { useAdminUsuariosController } from '@/controllers/adminControllers/usuariosController';
import { RolUsuarioDB, EstadoUsuario } from '@/models/modelos_dominio/userModel';
import {
  LIMITES_TEXTO,
  sanitizarNombrePersonaInput,
  sanitizarTelefonoInput,
} from '@/lib/validaciones';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface ModalesUsuariosAdminProps {
  controller: ReturnType<typeof useAdminUsuariosController>;
}

export function ModalesUsuariosAdmin({ controller }: ModalesUsuariosAdminProps) {
  const {
    modalCrearAbierto,
    setModalCrearAbierto,
    modalEditarAbierto,
    setModalEditarAbierto,
    modalEliminarAbierto,
    setModalEliminarAbierto,
    usuarioSeleccionado,
    guardandoUsuario,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario,
  } = controller;

  // Estado del formulario de creación
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoRol, setNuevoRol] = useState<RolUsuarioDB>('vendedor');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevoPassword, setNuevoPassword] = useState('');
  const [mostrarNuevoPassword, setMostrarNuevoPassword] = useState(false);
  const [copiadoPassword, setCopiadoPassword] = useState(false);

  // Estado del formulario de edición (reinicializado limpiamente al cambiar usuario seleccionado)
  const [editNombre, setEditNombre] = useState('');
  const [editRol, setEditRol] = useState<RolUsuarioDB>('vendedor');
  const [editEstado, setEditEstado] = useState<EstadoUsuario>('activo');
  const [editTelefono, setEditTelefono] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [mostrarEditPassword, setMostrarEditPassword] = useState(false);
  const [copiadoEditPassword, setCopiadoEditPassword] = useState(false);

  const editKey = `${modalEditarAbierto}:${usuarioSeleccionado?.id ?? ''}`;
  const [prevEditKey, setPrevEditKey] = useState(editKey);
  if (editKey !== prevEditKey) {
    setPrevEditKey(editKey);
    if (modalEditarAbierto && usuarioSeleccionado) {
      setEditNombre(usuarioSeleccionado.nombre);
      setEditRol((usuarioSeleccionado.rol as RolUsuarioDB) || 'vendedor');
      setEditEstado(usuarioSeleccionado.estado === 'activo' ? 'activo' : 'inactivo');
      setEditTelefono(usuarioSeleccionado.telefono || '');
      setEditPassword(usuarioSeleccionado.password || '');
      setMostrarEditPassword(false);
    }
  }

  const copiarAlPortapapeles = (texto: string, setCopiado: (val: boolean) => void) => {
    if (!texto) return;
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
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

  return (
    <>
      {/* MODAL 1: ALTA DE NUEVO COLABORADOR / INVITACIÓN */}
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
            <DialogDescription className="text-xs text-muted-foreground">
              Completar los datos del nuevo integrante del equipo y asignar su rol en el sistema.
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
                onChange={(e) => setNuevoNombre(sanitizarNombrePersonaInput(e.target.value))}
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
                onChange={(e) => setNuevoEmail(e.target.value.replace(/\s+/g, '').toLowerCase())}
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

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1C2424] flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-[#2A7A78]" weight="duotone" />
                <span>
                  Contraseña de Acceso <span className="text-red-500">*</span>
                </span>
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

      {/* MODAL 2: EDICIÓN DE USUARIO */}
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
                <label className="text-xs font-semibold text-[#1C2424]">Nombre Completo</label>
                <Input
                  required
                  autoComplete="name"
                  minLength={LIMITES_TEXTO.NOMBRE_USUARIO_MIN}
                  maxLength={LIMITES_TEXTO.NOMBRE_USUARIO_MAX}
                  value={editNombre}
                  onChange={(e) => setEditNombre(sanitizarNombrePersonaInput(e.target.value))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1C2424]">Correo Electrónico</label>
                <Input
                  disabled
                  value={usuarioSeleccionado.email}
                  className="bg-[#F8F7F2] text-[#657373] cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#1C2424]">Rol en el Sistema</label>
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
                  <label className="text-xs font-semibold text-[#1C2424]">Estado de Acceso</label>
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

      {/* MODAL 3: CONFIRMACIÓN DE ELIMINACIÓN / DESVINCULACIÓN */}
      <Dialog open={modalEliminarAbierto} onOpenChange={setModalEliminarAbierto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
                <Trash className="h-4 w-4" weight="duotone" />
              </div>
              <DialogTitle className="text-base font-bold text-foreground">
                ¿Eliminar cuenta de usuario?
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Se eliminará la cuenta de{' '}
              <strong className="text-foreground">{usuarioSeleccionado?.nombre}</strong> (
              {usuarioSeleccionado?.email}). El usuario perderá el acceso a la plataforma de
              inmediato.
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
    </>
  );
}
