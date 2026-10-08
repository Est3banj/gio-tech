import { describe, it, expect } from 'vitest';
import { getProductIdFromSearchParams } from './deep-link';

describe('getProductIdFromSearchParams', () => {
  it('lee el id desde el parámetro "producto"', () => {
    expect(getProductIdFromSearchParams(new URLSearchParams('producto=7'))).toBe('7');
  });

  it('lee el id desde la variante "id"', () => {
    expect(getProductIdFromSearchParams(new URLSearchParams('id=7'))).toBe('7');
  });

  it('"producto" tiene prioridad sobre "id" cuando ambos existen', () => {
    expect(getProductIdFromSearchParams(new URLSearchParams('producto=3&id=9'))).toBe('3');
  });

  it('decodifica percent-encoding y recorta espacios (%20)', () => {
    expect(getProductIdFromSearchParams(new URLSearchParams('producto=%20prod-1%20'))).toBe('prod-1');
  });

  it('devuelve null cuando el parámetro está vacío', () => {
    expect(getProductIdFromSearchParams(new URLSearchParams('producto='))).toBeNull();
    expect(getProductIdFromSearchParams(new URLSearchParams('producto=%20'))).toBeNull();
  });

  it('devuelve null cuando no hay parámetros de deep link', () => {
    expect(getProductIdFromSearchParams(new URLSearchParams(''))).toBeNull();
    expect(getProductIdFromSearchParams(new URLSearchParams('marca=Samsung'))).toBeNull();
  });

  it('tolera percent-encoding malformado sin lanzar (fallback al valor crudo)', () => {
    const params = new URLSearchParams();
    params.set('producto', '%E0%A4%A');
    expect(() => getProductIdFromSearchParams(params)).not.toThrow();
    expect(getProductIdFromSearchParams(params)).toBe('%E0%A4%A');
  });
});
