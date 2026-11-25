import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  USUARIO_ACTIVO_STORAGE_KEY,
  USUARIO_ACTIVO_UPDATED_EVENT,
  guardarUsuarioActivoLocal,
  leerUsuarioActivoLocal,
  limpiarUsuarioActivoLocal,
  obtenerNombreUsuarioActivoLocal,
  suscribirUsuarioActivo,
} from '@/lib/usuarioActivoStorage';

describe('usuarioActivoStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('guarda, lee y notifica cambios del usuario activo', () => {
    const onUpdate = vi.fn();
    const unsub = suscribirUsuarioActivo(onUpdate);

    guardarUsuarioActivoLocal({
      nombre: 'Sofía Pérez',
      email: 'sofia@mistock.com',
      rol: 'vendedor',
    });

    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(leerUsuarioActivoLocal()).toEqual({
      nombre: 'Sofía Pérez',
      email: 'sofia@mistock.com',
      rol: 'vendedor',
    });
    expect(obtenerNombreUsuarioActivoLocal()).toBe('Sofía Pérez');

    unsub();
    window.dispatchEvent(new Event(USUARIO_ACTIVO_UPDATED_EVENT));
    expect(onUpdate).toHaveBeenCalledTimes(1);
  });

  it('tolera JSON corrupto o roles inválidos devolviendo null/fallback seguro', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    window.localStorage.setItem(USUARIO_ACTIVO_STORAGE_KEY, '{roto');
    expect(leerUsuarioActivoLocal()).toBeNull();
    expect(obtenerNombreUsuarioActivoLocal()).toBe('Administrador');
    expect(warnSpy).toHaveBeenCalled();

    window.localStorage.setItem(
      USUARIO_ACTIVO_STORAGE_KEY,
      JSON.stringify({ nombre: 'Juan', rol: 'superroot' })
    );
    expect(leerUsuarioActivoLocal()).toEqual({ nombre: 'Juan', email: undefined, rol: undefined });
  });

  it('limpiarUsuarioActivoLocal elimina la clave del almacenamiento', () => {
    guardarUsuarioActivoLocal({ nombre: 'Admin', email: 'a@b.com', rol: 'admin' });
    limpiarUsuarioActivoLocal();
    expect(leerUsuarioActivoLocal()).toBeNull();
  });
});
