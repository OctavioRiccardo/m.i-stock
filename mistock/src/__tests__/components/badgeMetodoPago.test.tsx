import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BadgeMetodoPago, obtenerEtiquetaMetodoPago } from '@/components/ui/badge-metodo-pago';

describe('BadgeMetodoPago y obtenerEtiquetaMetodoPago', () => {
  it('normaliza etiquetas legibles para todos los métodos de pago conocidos', () => {
    expect(obtenerEtiquetaMetodoPago('efectivo')).toBe('Efectivo');
    expect(obtenerEtiquetaMetodoPago('mercado_pago')).toBe('Mercado Pago');
    expect(obtenerEtiquetaMetodoPago('tarjeta_debito')).toBe('Débito');
    expect(obtenerEtiquetaMetodoPago('tarjeta_credito')).toBe('Crédito');
    expect(obtenerEtiquetaMetodoPago('transferencia')).toBe('Transferencia');
    expect(obtenerEtiquetaMetodoPago('tarjeta_debito', { larga: true })).toBe('Tarjeta Débito');
    expect(obtenerEtiquetaMetodoPago('tarjeta_credito', { larga: true })).toBe('Tarjeta Crédito');
    expect(obtenerEtiquetaMetodoPago('otro_medio')).toBe('otro medio');
  });

  it('renderiza el badge con la etiqueta esperada y sin clases frías gray-*', () => {
    const { container } = render(<BadgeMetodoPago metodo="transferencia" />);
    expect(screen.getByText('Transferencia')).toBeTruthy();
    expect(container.innerHTML).not.toMatch(/\b(bg|text|border)-gray-/);
  });

  it('renderiza Mercado Pago y Efectivo en modo compacto con ícono', () => {
    render(
      <>
        <BadgeMetodoPago metodo="mercado_pago" size="xs" />
        <BadgeMetodoPago metodo="efectivo" size="sm" />
      </>
    );
    expect(screen.getByText('Mercado Pago')).toBeTruthy();
    expect(screen.getByText('Efectivo')).toBeTruthy();
  });
});
