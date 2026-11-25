import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { inventarioService } from '@/services/inventarioService';
import { supabaseService } from '@/services/supabaseService';

describe('inventarioService (reglas de negocio de catálogo y stock)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    inventarioService.limpiarCacheLocal();

    vi.spyOn(supabaseService, 'insertCategoria').mockImplementation(async (datos) => ({
      id: datos.id || '11111111-1111-4111-8111-111111111111',
      nombre: datos.nombre,
      descripcion: datos.descripcion || '',
      activo: true,
    }));

    vi.spyOn(supabaseService, 'insertProducto').mockImplementation(async (prod) => ({
      id: prod.id || '22222222-2222-4222-8222-222222222222',
      codigo: prod.sku,
      nombre: prod.nombre,
      descripcion: prod.descripcion || '',
      precioCosto: prod.precioCosto,
      precioVenta: prod.precioVenta,
      stockActual: prod.stockActual,
      stockMinimo: prod.stockMinimo,
      categoriaId: prod.categoriaId,
      unidadMedida: prod.unidadMedida,
      oferta: Boolean(prod.oferta),
      activo: true,
      fechaCreacion: new Date(),
      fechaActualizacion: new Date(),
    }));

    vi.spyOn(supabaseService, 'updateProducto').mockResolvedValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    inventarioService.limpiarCacheLocal();
  });

  it('crea categorías válidas y rechaza nombres cortos o duplicados (case-insensitive)', () => {
    expect(inventarioService.agregarCategoria('A').exito).toBe(false);

    const alta = inventarioService.agregarCategoria('Bebidas', 'Gaseosas y aguas');
    expect(alta.exito).toBe(true);
    expect(inventarioService.getCategorias()).toHaveLength(1);

    const duplicada = inventarioService.agregarCategoria('  bebidas ');
    expect(duplicada.exito).toBe(false);
    expect(inventarioService.getCategorias()).toHaveLength(1);
  });

  it('impide registrar un producto sin categoría válida y valida SKU duplicado', () => {
    const sinCategoria = inventarioService.guardarProducto({
      nombre: 'Agua 500ml',
      codigo: 'AGU-500',
      descripcion: '',
      precioCosto: 500,
      precioVenta: 900,
      stockInicial: 10,
      stockMinimo: 2,
      categoriaId: '',
      unidadMedida: 'unidad',
    });
    expect(sinCategoria.exito).toBe(false);

    const cat = inventarioService.agregarCategoria('Bebidas');
    const categoriaId = cat.categoria!.id;

    const ok = inventarioService.guardarProducto({
      nombre: 'Agua Mineral 500ml',
      codigo: 'AGU-500',
      descripcion: 'Sin gas',
      precioCosto: 500,
      precioVenta: 900,
      stockInicial: 10,
      stockMinimo: 2,
      categoriaId,
      unidadMedida: 'unidad',
    });
    expect(ok.exito).toBe(true);

    const skuDuplicado = inventarioService.guardarProducto({
      nombre: 'Otra Agua 500ml',
      codigo: 'agu-500',
      descripcion: '',
      precioCosto: 500,
      precioVenta: 950,
      stockInicial: 5,
      stockMinimo: 1,
      categoriaId,
      unidadMedida: 'unidad',
    });
    expect(skuDuplicado.exito).toBe(false);
  });

  it('descuenta y reintegra stock respetando piso 0 salvo permitirNegativo=true', () => {
    const cat = inventarioService.agregarCategoria('Almacén');
    const alta = inventarioService.guardarProducto({
      nombre: 'Fideos 500g',
      codigo: 'FID-500',
      descripcion: '',
      precioCosto: 800,
      precioVenta: 1300,
      stockInicial: 3,
      stockMinimo: 1,
      categoriaId: cat.categoria!.id,
      unidadMedida: 'unidad',
    });
    const prodId = alta.producto!.id;

    expect(inventarioService.descontarStock(prodId, 5, false, false)).toBe(true);
    expect(inventarioService.getProductos()[0].stockActual).toBe(0);

    expect(inventarioService.reintegrarStock(prodId, 4, false)).toBe(true);
    expect(inventarioService.getProductos()[0].stockActual).toBe(4);

    expect(inventarioService.descontarStock(prodId, 6, true, false)).toBe(true);
    expect(inventarioService.getProductos()[0].stockActual).toBe(-2);
  });

  it('da de baja lógica y reactiva un producto correctamente', () => {
    const cat = inventarioService.agregarCategoria('Limpieza');
    const alta = inventarioService.guardarProducto({
      nombre: 'Detergente 750ml',
      codigo: 'DET-750',
      descripcion: '',
      precioCosto: 1000,
      precioVenta: 1800,
      stockInicial: 8,
      stockMinimo: 2,
      categoriaId: cat.categoria!.id,
      unidadMedida: 'unidad',
    });
    const prodId = alta.producto!.id;

    expect(inventarioService.darDeBajaProducto(prodId).exito).toBe(true);
    expect(inventarioService.getProductos()[0].activo).toBe(false);

    expect(inventarioService.reactivarProducto(prodId).exito).toBe(true);
    expect(inventarioService.getProductos()[0].activo).toBe(true);
  });
});
