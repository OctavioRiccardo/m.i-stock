import { describe, expect, it } from 'vitest';
import { normalizarSupabaseUrl } from '@/lib/supabase/url';

describe('normalizarSupabaseUrl', () => {
  it('retorna cadena vacía ante undefined o espacios', () => {
    expect(normalizarSupabaseUrl(undefined)).toBe('');
    expect(normalizarSupabaseUrl('   ')).toBe('');
  });

  it('elimina el sufijo accidental /rest/v1 o /rest/v1/ (case-insensitive)', () => {
    expect(normalizarSupabaseUrl('https://abc.supabase.co/rest/v1')).toBe('https://abc.supabase.co');
    expect(normalizarSupabaseUrl('https://abc.supabase.co/REST/V1/')).toBe('https://abc.supabase.co');
  });

  it('elimina espacios exteriores y barras finales redundantes', () => {
    expect(normalizarSupabaseUrl('  https://abc.supabase.co///  ')).toBe('https://abc.supabase.co');
  });

  it('mantiene intacta una URL ya normalizada', () => {
    expect(normalizarSupabaseUrl('https://abc.supabase.co')).toBe('https://abc.supabase.co');
  });
});
