'use client';

/**
 * ====================================================================
 * COMPONENTE: MODAL DE ACCESO RESTRINGIDO POR ROLES (RBAC Guard)
 * ====================================================================
 * 
 * Propósito:
 * Bloquear de forma elegante y amigable el acceso a secciones no autorizadas:
 * 1. `vendedor_en_admin`: Un vendedor intenta entrar a la consola de administración.
 * 2. `sin_rol`: Un usuario nuevo registrado sin permisos asignados intenta operar.
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Clock, ArrowRight, LogOut, ShoppingCart } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RolUsuario } from '@/models/modelos_dominio/userModel';

export type TipoRestriccion = 'vendedor_en_admin' | 'sin_rol';

interface ModalAccesoRestringidoProps {
  tipo: TipoRestriccion;
  onCambiarRolDev?: (rol: RolUsuario) => void;
}

export function ModalAccesoRestringido({
  tipo,
  onCambiarRolDev,
}: ModalAccesoRestringidoProps) {
  const router = useRouter();

  const esVendedorEnAdmin = tipo === 'vendedor_en_admin';

  return (
    <Dialog open={true}>
      <DialogContent
        className="max-w-md p-6 border-[#E8E6DF] shadow-2xl [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="space-y-3 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                esVendedorEnAdmin ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {esVendedorEnAdmin ? (
                <ShieldAlert className="h-6 w-6" />
              ) : (
                <Clock className="h-6 w-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-base font-bold text-[#1C2424]">
                  {esVendedorEnAdmin
                    ? 'Acceso Restringido - Nivel Administrador'
                    : 'Cuenta Pendiente de Asignación de Rol'}
                </DialogTitle>
              </div>
              <Badge
                variant={esVendedorEnAdmin ? 'destructive' : 'warning'}
                className="text-[10px] mt-1"
              >
                {esVendedorEnAdmin ? 'Rol Actual: Vendedor (POS)' : 'Rol Actual: Sin Rol Asignado'}
              </Badge>
            </div>
          </div>

          <DialogDescription className="text-xs text-[#657373] leading-relaxed pt-2">
            {esVendedorEnAdmin ? (
              <>
                Esta sección contiene información financiera sensible, configuración de la empresa, márgenes de utilidad y gestión de usuarios reservada exclusivamente para el <strong>Nivel Administrador</strong>.
                <br /><br />
                Tu perfil de usuario está autorizado para operar el mostrador y la línea de cajas.
              </>
            ) : (
              <>
                Tu cuenta está registrada en el sistema pero aún no tiene un rol operativo activo (Administrador o Vendedor).
                <br /><br />
                Por favor, solicita al Administrador del comercio que active tus permisos de acceso desde el panel de Gestión de Usuarios.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-[#E8E6DF] mt-2">
          {esVendedorEnAdmin ? (
            <Button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="w-full sm:w-auto bg-[#2A7A78] hover:bg-[#205E5C] text-white text-xs gap-1.5 cursor-pointer"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>Volver a la Terminal de Caja</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/logout')}
              className="w-full sm:w-auto text-xs gap-1.5 text-red-600 border-red-200 hover:bg-red-50 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Cerrar Sesión</span>
            </Button>
          )}

          {/* Atajo de desarrollo para alternar roles en pruebas locales */}
          {process.env.NODE_ENV !== 'production' && onCambiarRolDev && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onCambiarRolDev(esVendedorEnAdmin ? 'admin' : 'vendedor')}
              className="text-[10px] text-[#657373] hover:text-[#1C2424]"
              title="Herramienta de pruebas para alternar rol en desarrollo"
            >
              [Simular como {esVendedorEnAdmin ? 'Admin' : 'Vendedor'}]
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
