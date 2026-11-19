'use client';

/**
 * ====================================================================
 * VISTA: FORMULARIO DE INICIO DE SESIÓN (Patrón MVC - View)
 * ====================================================================
 *
 * Propósito:
 * Pantalla de acceso calibrada al sistema visual Mostrador & Libro Mayor:
 * - Emblema unificado M.I Stock y jerarquía tipográfica clara.
 * - Inputs con superficie inset cálida, labels asociados (`htmlFor`) y foco nítido.
 * - Desacople total: delega la lógica de negocio a `loginController`.
 */

import React, { useId, useState } from 'react';
import {
  EnvelopeSimple,
  Lock,
  Eye,
  EyeSlash,
  Package,
  WarningCircle,
} from '@phosphor-icons/react';
import { useLoginController } from '@/controllers/authController';
import { LIMITES_TEXTO } from '@/lib/validaciones';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface LoginFormViewProps {
  loginController: ReturnType<typeof useLoginController>;
}

export function LoginFormView({ loginController }: LoginFormViewProps) {
  const { values, fieldErrors, setFieldValue, loading, error, handleSubmit } = loginController;
  const [showPassword, setShowPassword] = useState(false);
  const emailId = useId();
  const passwordId = useId();

  return (
    <div className="w-full max-w-[420px] mx-auto">
      <Card className="overflow-hidden">
        {/* Franja superior de identidad */}
        <div className="h-1 w-full bg-primary" aria-hidden="true" />

        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_1px_2px_rgba(28,36,36,0.16)]">
                  <Package className="h-5 w-5" weight="duotone" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground tracking-[-0.02em] leading-none">
                    M.I Stock
                  </h1>
                  <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground mt-1">
                    Inventario &amp; Mostrador
                  </p>
                </div>
              </div>
              <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] font-semibold text-muted-foreground border border-border">
                POS
              </span>
            </div>

            <div className="pt-2 border-t border-border/70">
              <h2 className="text-base font-semibold text-foreground">
                Acceso al sistema
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Ingresar credenciales para acceder al panel o a la terminal de caja.
              </p>
            </div>
          </div>

          {/* Alert Error */}
          {error && (
            <Alert variant="destructive">
              <WarningCircle className="h-4 w-4" weight="duotone" />
              <AlertTitle>No se pudo iniciar sesión</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor={emailId}
                className="block text-xs font-semibold text-foreground-secondary"
              >
                Correo electrónico
              </label>
              <div className="relative">
                <Input
                  id={emailId}
                  type="email"
                  autoComplete="email"
                  maxLength={LIMITES_TEXTO.EMAIL_MAX}
                  placeholder="usuario@ejemplo.com"
                  value={values.email}
                  onChange={(e) =>
                    setFieldValue('email', e.target.value.replace(/\s+/g, '').toLowerCase())
                  }
                  error={fieldErrors.email}
                  className="pl-9 h-10"
                  required
                />
                <EnvelopeSimple className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor={passwordId}
                className="block text-xs font-semibold text-foreground-secondary"
              >
                Contraseña
              </label>
              <div className="relative">
                <Input
                  id={passwordId}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  minLength={LIMITES_TEXTO.PASSWORD_MIN}
                  maxLength={LIMITES_TEXTO.PASSWORD_MAX}
                  placeholder="••••••••"
                  value={values.password}
                  onChange={(e) => setFieldValue('password', e.target.value)}
                  error={fieldErrors.password}
                  className="pl-9 pr-10 h-10"
                  required
                />
                <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1.5 rounded-md p-1.5 text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors cursor-pointer"
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
              Iniciar Sesión
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
