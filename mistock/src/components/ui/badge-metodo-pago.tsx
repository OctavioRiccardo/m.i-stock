'use client';

import React from 'react';
import { Money, QrCode, CreditCard, ArrowsLeftRight } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function obtenerEtiquetaMetodoPago(
  metodo?: string | null,
  options?: { larga?: boolean }
): string {
  const normalizado = (metodo || 'efectivo').toLowerCase();
  const larga = options?.larga ?? false;

  switch (normalizado) {
    case 'efectivo':
      return 'Efectivo';
    case 'mercado_pago':
      return 'Mercado Pago';
    case 'tarjeta_debito':
      return larga ? 'Tarjeta Débito' : 'Débito';
    case 'tarjeta_credito':
      return larga ? 'Tarjeta Crédito' : 'Crédito';
    case 'transferencia':
      return 'Transferencia';
    default:
      return normalizado.replace(/_/g, ' ');
  }
}

export interface BadgeMetodoPagoProps {
  metodo?: string | null;
  size?: 'xs' | 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<BadgeMetodoPagoProps['size']>, string> = {
  xs: 'text-[9px] uppercase px-1.5 py-0 font-semibold gap-1',
  sm: 'text-[10px] uppercase px-2 py-0.5 font-bold gap-1',
  md: 'text-xs font-medium px-2.5 py-0.5 gap-1.5',
};

export function BadgeMetodoPago({
  metodo,
  size = 'sm',
  showIcon = true,
  className,
}: BadgeMetodoPagoProps) {
  const normalizado = (metodo || 'efectivo').toLowerCase();
  const etiqueta = obtenerEtiquetaMetodoPago(normalizado);
  const sizeClass = SIZE_CLASSES[size];

  switch (normalizado) {
    case 'efectivo':
      return (
        <Badge
          variant="outline"
          className={cn(
            'inline-flex items-center border-emerald-300 text-emerald-800 bg-emerald-50',
            sizeClass,
            className
          )}
        >
          {showIcon && <Money className="h-3 w-3 shrink-0" weight="bold" />}
          <span>{etiqueta}</span>
        </Badge>
      );
    case 'mercado_pago':
      return (
        <Badge
          variant="outline"
          className={cn(
            'inline-flex items-center border-[#009EE3]/40 text-[#009EE3] bg-[#009EE3]/10',
            sizeClass,
            className
          )}
        >
          {showIcon && <QrCode className="h-3 w-3 shrink-0" weight="bold" />}
          <span>{etiqueta}</span>
        </Badge>
      );
    case 'tarjeta_debito':
    case 'tarjeta_credito':
      return (
        <Badge
          variant="outline"
          className={cn(
            'inline-flex items-center border-[#2A7A78]/40 text-[#2A7A78] bg-[#E2F1F0]/60',
            sizeClass,
            className
          )}
        >
          {showIcon && <CreditCard className="h-3 w-3 shrink-0" weight="bold" />}
          <span>{etiqueta}</span>
        </Badge>
      );
    case 'transferencia':
      return (
        <Badge
          variant="outline"
          className={cn(
            'inline-flex items-center border-[#D5D2C9] text-[#455151] bg-[#F8F7F2]',
            sizeClass,
            className
          )}
        >
          {showIcon && <ArrowsLeftRight className="h-3 w-3 shrink-0" weight="bold" />}
          <span>{etiqueta}</span>
        </Badge>
      );
    default:
      return (
        <Badge
          variant="outline"
          className={cn(
            'inline-flex items-center border-[#E8E6DF] text-[#657373] bg-[#F8F7F2]/70',
            sizeClass,
            className
          )}
        >
          <span>{etiqueta}</span>
        </Badge>
      );
  }
}
