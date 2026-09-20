'use client';

/**
 * ====================================================================
 * VISTA: MÓDULO EN PROGRESO (Placeholder Informativo)
 * ====================================================================
 * 
 * Propósito:
 * Pantalla informativa estándar con diseño Dub.co para las secciones
 * que se encuentran en fase de desarrollo o próximas iteraciones.
 */

import React from 'react';
import {
  Clock,
  ArrowLeft,
  Users,
  Layers,
  Settings,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EnProgresoViewProps {
  seccion: string;
  descripcion?: string;
  icono?: 'usuarios' | 'inventario' | 'stock' | 'configuracion' | 'default';
}

export function EnProgresoView({
  seccion,
  descripcion,
  icono = 'default',
}: EnProgresoViewProps) {
  // Selección dinámica del icono de la sección
  const renderIcon = () => {
    switch (icono) {
      case 'usuarios':
        return <Users className="h-8 w-8 text-[#2A7A78]" />;
      case 'inventario':
        return <Layers className="h-8 w-8 text-[#2A7A78]" />;
      case 'stock':
        return <AlertTriangle className="h-8 w-8 text-amber-600" />;
      case 'configuracion':
        return <Settings className="h-8 w-8 text-[#2A7A78]" />;
      default:
        return <Clock className="h-8 w-8 text-[#2A7A78]" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <Card className="border-[#E8E6DF] bg-white p-8 sm:p-12 text-center shadow-sm">
        <CardContent className="p-0 flex flex-col items-center max-w-lg mx-auto space-y-5">
          {/* Contenedor del Icono */}
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E2F1F0] shadow-sm">
            {renderIcon()}
          </div>

          {/* Badge de Estado */}
          <Badge variant="secondary" className="gap-1.5 px-3 py-1 font-semibold text-xs text-[#2A7A78] bg-[#E2F1F0]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Todavía en progreso</span>
          </Badge>

          {/* Título de la Sección */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1C2424] tracking-tight">
              {seccion}
            </h1>
            {descripcion && (
              <p className="text-sm text-[#657373] leading-relaxed">
                {descripcion}
              </p>
            )}
          </div>

          {/* Botón de Navegación */}
          <div className="flex items-center justify-center pt-2">
            <Button asChild size="default" className="gap-2">
              <a href="/admin">
                <ArrowLeft className="h-4 w-4" />
                <span>Volver al Dashboard</span>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
