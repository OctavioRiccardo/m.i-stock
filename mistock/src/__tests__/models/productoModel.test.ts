import { describe, it, expect } from 'vitest';
import {
  toProducto,
  toCategoria,
  ProductoRow,
  CategoriaRow,
} from '@/models/modelos_dominio/productoModel';

/**
 * Helper de cálculo de margen comercial y rentabilidad
 * Fórmula de Margen sobre Venta: ((Precio Venta - Precio Costo) / Precio Venta) * 100
 */
export function calcularMargenComercial(precioCosto: number, precioVenta: number): number {
  if (precioVenta <= 0) return 0;
  return Number((((precioVenta - precioCosto) / precioVenta) * 100).toFixed(2));
}

/**
 * Helper de clasificación de salud de inventario
 */
export function clasificarNivelStock(
  stockActual: number,
  stockMinimo: number
): 'agotado' | 'critico' | 'bajo' | 'optimo' {
  if (stockActual <= 0) return 'agotado';
  if (stockActual <= stockMinimo) return 'critico';
  if (stockActual <= stockMinimo * 1.5) return 'bajo';
  return 'optimo';
}

/**
 * Helper para calcular unidades en déficit para reposición
 */
export function calcularDeficitStock(stockActual: number, stockMinimo: number): number {
  return stockActual < stockMinimo ? stockMinimo - stockActual : 0;
}

describe('Reglas de Dominio: Producto y Rentabilidad', () => {
  it('debe mapear correctamente un ProductoRow de Supabase a la entidad Producto', () => {
    const rowMock: ProductoRow = {
      id_producto: 'prod-uuid-1',
      id_categoria: 'cat-uuid-1',
      nombre: 'Mouse Inalámbrico',
      descripcion: 'Mouse óptico 2.4Ghz',
      sku: 'MOU-001',
      precio_costo: 12000,
      precio_venta: 18000,
      stock_actual: 25,
      stock_minimo: 5,
      unidad_medida: 'unidad',
      imagen_url: null,
      oferta: false,
      activo: true,
      creado_el: '2026-10-01T10:00:00Z',
      actualizado_el: '2026-10-01T10:00:00Z',
    };

    const producto = toProducto(rowMock);

    expect(producto.id).toBe('prod-uuid-1');
    expect(producto.codigo).toBe('MOU-001');
    expect(producto.precioCosto).toBe(12000);
    expect(producto.precioVenta).toBe(18000);
    expect(producto.stockActual).toBe(25);
    expect(producto.activo).toBe(true);
  });

  it('debe mapear correctamente un CategoriaRow de Supabase a Categoria', () => {
    const catRow: CategoriaRow = {
      id_categoria: 'cat-123',
      nombre: 'Periféricos',
      descripcion: 'Accesorios de informática',
      activo: true,
      creado_el: '2026-10-01T10:00:00Z',
      actualizado_el: '2026-10-01T10:00:00Z',
    };

    const categoria = toCategoria(catRow);
    expect(categoria.id).toBe('cat-123');
    expect(categoria.nombre).toBe('Periféricos');
    expect(categoria.activo).toBe(true);
  });

  describe('Cálculo de Margen Comercial', () => {
    it('debe calcular correctamente el margen porcentual estándar', () => {
      // Costo $10.000, Venta $15.000 -> Ganancia $5.000 -> Margen: (5.000 / 15.000) * 100 = 33.33%
      const margen = calcularMargenComercial(10000, 15000);
      expect(margen).toBe(33.33);
    });

    it('debe dar margen 0 si el precio de venta es igual al costo (sin ganancia)', () => {
      const margen = calcularMargenComercial(5000, 5000);
      expect(margen).toBe(0);
    });

    it('debe arrojar margen negativo si el precio de venta es menor al costo', () => {
      // Costo $10.000, Venta $8.000 -> Pérdida de $2.000 -> Margen negativo (-25%)
      const margen = calcularMargenComercial(10000, 8000);
      expect(margen).toBe(-25);
      expect(margen < 0).toBe(true);
    });

    it('debe manejar precio de venta 0 evitando divisiones por cero', () => {
      const margen = calcularMargenComercial(1000, 0);
      expect(margen).toBe(0);
    });
  });

  describe('Semáforo Diagnóstico y Salud del Stock', () => {
    const stockMinimo = 10;

    it('debe clasificar como "agotado" cuando las existencias son 0 o menores', () => {
      expect(clasificarNivelStock(0, stockMinimo)).toBe('agotado');
      expect(clasificarNivelStock(-1, stockMinimo)).toBe('agotado');
    });

    it('debe clasificar como "critico" cuando el stock es menor o igual al mínimo', () => {
      expect(clasificarNivelStock(5, stockMinimo)).toBe('critico');
      expect(clasificarNivelStock(10, stockMinimo)).toBe('critico');
    });

    it('debe clasificar como "bajo" cuando está próximo al umbral (hasta 1.5x del mínimo)', () => {
      expect(clasificarNivelStock(12, stockMinimo)).toBe('bajo');
      expect(clasificarNivelStock(15, stockMinimo)).toBe('bajo');
    });

    it('debe clasificar como "optimo" cuando supera 1.5 veces el umbral de seguridad', () => {
      expect(clasificarNivelStock(16, stockMinimo)).toBe('optimo');
      expect(clasificarNivelStock(50, stockMinimo)).toBe('optimo');
    });

    it('debe calcular exactamente el déficit de reposición de mercadería', () => {
      // Stock actual 4, Mínimo 10 -> Faltan 6 unidades para el umbral
      expect(calcularDeficitStock(4, 10)).toBe(6);
      // Stock actual 10, Mínimo 10 -> Déficit 0
      expect(calcularDeficitStock(10, 10)).toBe(0);
      // Stock actual 15, Mínimo 10 -> Déficit 0
      expect(calcularDeficitStock(15, 10)).toBe(0);
    });
  });
});
