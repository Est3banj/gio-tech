import { describe, it, expect } from 'vitest';
import { extractMatchedProducts } from './product-matcher';
import type { Product } from '../types';

const mockProducts: Product[] = [
  {
    id: '1',
    nombre: 'Samsung Galaxy A15 6/128',
    marca: 'Samsung',
    modelo: 'Galaxy A15',
    imagen: '/img/a15.jpg',
    contado: 650000,
  },
  {
    id: '2',
    nombre: 'Samsung Galaxy A05s 4/64',
    marca: 'Samsung',
    modelo: 'Galaxy A05s',
    imagen: '/img/a05s.jpg',
    contado: 420000,
  },
  {
    id: '3',
    nombre: 'Xiaomi Redmi Note 12 6/128',
    marca: 'Xiaomi',
    modelo: 'Redmi Note 12',
    imagen: '/img/note12.jpg',
    contado: 720000,
  },
  {
    id: '4',
    nombre: 'Motorola Moto G54 8/256',
    marca: 'Motorola',
    modelo: 'Moto G54',
    imagen: '/img/g54.jpg',
    contado: 580000,
  },
  {
    id: '5',
    nombre: 'iPhone 11 64GB',
    marca: 'Apple',
    modelo: 'iPhone 11',
    imagen: '/img/iphone11.jpg',
    contado: 1800000,
  },
];

describe('extractMatchedProducts', () => {
  it('encuentra producto mencionado exactamente en el texto', () => {
    const text = 'Te recomiendo el Samsung Galaxy A15 que tiene 6GB de RAM y 128GB de almacenamiento.';
    const result = extractMatchedProducts(text, mockProducts);

    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].product.id).toBe('1');
    expect(result[0].score).toBeLessThan(0.3); // match muy cercano
  });

  it('encuentra producto con variaciones ortográficas (fuzzy)', () => {
    const text = 'El Sansumg Galaxie A15 es una excelente opción';
    const result = extractMatchedProducts(text, mockProducts);

    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].product.id).toBe('1');
  });

  it('retorna array vacío cuando no hay mención de productos', () => {
    const text = 'Hola, ¿cómo estás? Soy el asistente de GIO TECH.';
    const result = extractMatchedProducts(text, mockProducts);

    expect(result).toEqual([]);
  });

  it('retorna array vacío cuando el catálogo está vacío', () => {
    const text = 'Te recomiendo el Samsung Galaxy A15';
    const result = extractMatchedProducts(text, []);

    expect(result).toEqual([]);
  });

  it('respeta el límite de resultados', () => {
    const text = 'Tenemos Samsung Galaxy A15, Samsung Galaxy A05s, Xiaomi Redmi Note 12, Motorola Moto G54 y iPhone 11 disponibles.';
    const result = extractMatchedProducts(text, mockProducts, { limit: 2 });

    expect(result.length).toBeLessThanOrEqual(2);
  });

  it('no duplica productos mencionados múltiples veces', () => {
    const text = 'El Samsung Galaxy A15 es buen equipo. El Samsung Galaxy A15 tiene buena cámara.';
    const result = extractMatchedProducts(text, mockProducts);

    const ids = result.map(m => m.product.id);
    expect(ids.filter(id => id === '1').length).toBe(1);
  });

  it('encuentra múltiples productos en una respuesta', () => {
    const text = 'Tenemos el Samsung Galaxy A15 por $650.000 y el Xiaomi Redmi Note 12 por $720.000.';
    const result = extractMatchedProducts(text, mockProducts);

    expect(result.length).toBeGreaterThanOrEqual(2);
    const ids = result.map(m => m.product.id);
    expect(ids).toContain('1');
    expect(ids).toContain('3');
  });

  it('encuentra match parcial (solo menciona "Galaxy A15" sin "Samsung")', () => {
    const text = 'El Galaxy A15 es una buena opción';
    const result = extractMatchedProducts(text, mockProducts);

    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].product.id).toBe('1');
  });

  it('retorna productos ordenados por score (mejor primero)', () => {
    const text = 'El Samsung Galaxy A15 y el iPhone 11';
    const result = extractMatchedProducts(text, mockProducts);

    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].score).toBeLessThanOrEqual(result[i].score);
    }
  });

  it('usa threshold personalizado más estricto', () => {
    const text = 'Quiero un Sansumg';
    const resultLax = extractMatchedProducts(text, mockProducts, { threshold: 0.6 });
    const resultStrict = extractMatchedProducts(text, mockProducts, { threshold: 0.2 });

    expect(resultLax.length).toBeGreaterThanOrEqual(1);
    expect(resultStrict.length).toBe(0);
  });
});
