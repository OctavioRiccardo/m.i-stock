'use client';

/**
 * ====================================================================
 * VISTA: FORMULARIO DE INICIO DE SESIÓN (Patrón MVC - View)
 * ====================================================================
 * 
 * Propósito:
 * Presentar la interfaz de acceso con la estética y componentes de Dub.co:
 * - Campos de correo y contraseña con iconos contextuales y restricciones nativas.
 * - Conmutador visual para mostrar/ocultar contraseña (estado efímero local).
 * - Notificaciones de error de autenticación mediante el componente `Alert`.
 * - Desacople total: la vista delega la lógica de negocio a `loginController`.
 */

import React, { useState } from 'react';
import {
  EnvelopeSimple,
  Lock,
  Eye,
  EyeSlash,
  ArrowRight,
  ShieldCheck,
  WarningCircle,
} from '@phosphor-icons/react';
import { useLoginController } from '@/controllers/authController';
import { LIMITES_TEXTO } from '@/lib/validaciones';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface LoginFormViewProps {
  loginController: ReturnType<typeof useLoginController>;
}

export function LoginFormView({ loginController }: LoginFormViewProps) {
  const { values, fieldErrors, setFieldValue, loading, error, handleSubmit } = loginController;
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="p-6 sm:p-8">
        <CardContent className="p-0 space-y-6">
          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2A7A78] text-white shadow-md">
                <ShieldCheck className="h-6 w-6" weight="duotone" />
              </div>
              <h1 className="text-2xl font-bold text-[#1C2424] tracking-tight">
                M.I Stock
              </h1>
            </div>

            <Badge variant="default" className="mt-1">
              Control de Inventario
            </Badge>

            <p className="text-sm text-[#657373] pt-1">
              Ingresa tus credenciales para acceder a tu panel de control.
            </p>
          </div>

          {/* Alert Error */}
          {error && (
            <Alert variant="destructive">
              <WarningCircle className="h-4 w-4" weight="duotone" />
              <AlertTitle>Error de Autenticación</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1C2424] uppercase tracking-wider">
                Correo Electrónico
              </label>
              <div className="relative">
                <Input
                  type="email"
                  autoComplete="email"
                  maxLength={LIMITES_TEXTO.EMAIL_MAX}
                  placeholder="usuario@ejemplo.com"
                  value={values.email}
                  onChange={(e) => setFieldValue('email', e.target.value)}
                  error={fieldErrors.email}
                  className="pl-9"
                  required
                />
                <EnvelopeSimple className="absolute left-3 top-2.5 h-4 w-4 text-[#657373]" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1C2424] uppercase tracking-wider">
                Contraseña
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  minLength={LIMITES_TEXTO.PASSWORD_MIN}
                  maxLength={LIMITES_TEXTO.PASSWORD_MAX}
                  placeholder="••••••••"
                  value={values.password}
                  onChange={(e) => setFieldValue('password', e.target.value)}
                  error={fieldErrors.password}
                  className="pl-9 pr-9"
                  required
                />
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[#657373]" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[#657373] hover:text-[#1C2424] transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              loading={loading}
            >
              <span>Iniciar Sesión</span>
              <ArrowRight className="ml-2 h-4 w-4" weight="bold" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
