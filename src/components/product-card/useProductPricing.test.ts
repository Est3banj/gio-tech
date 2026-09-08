import { describe, it, expect } from 'vitest';
import { useProductPricing } from './useProductPricing';
import type { Product } from '../../types';

describe('useProductPricing', () => {
  it('identifies iPhone as not eligible for Krediya and disables fixed cuotas simulation', () => {
    const iphone: Product = {
      id: 'iphone-1',
      nombre: 'iPhone 15 Pro',
      marca: 'Apple',
      categoria: 'Celulares',
      contado: 4500000,
      cuotas6: 350000,
      cuotas8: 250000,
    };

    const der = useProductPricing(iphone);

    expect(der.productType).toBe('iphone');
    expect(der.tieneFinanciacion).toBe(true);
    expect(der.aplicaKrediya).toBe(false);
    expect(der.mostrarPlanCuotas).toBe(false);
    expect(der.cuotas6Str).toBe('');
    expect(der.cuotas8Str).toBe('');
    expect(der.financierasDisponibles.map((f) => f.id)).toEqual(['sistecredito', 'esmiopcion']);
  });

  it('identifies accessory as not eligible for Krediya and disables fixed cuotas simulation', () => {
    const accesorio: Product = {
      id: 'acc-1',
      nombre: 'Smartwatch Amazfit',
      marca: 'Amazfit',
      categoria: 'Accesorios',
      contado: 180000,
      cuotas6: 18000,
      cuotas8: 14000,
    };

    const der = useProductPricing(accesorio);

    expect(der.productType).toBe('accesorio');
    expect(der.tieneFinanciacion).toBe(true);
    expect(der.aplicaKrediya).toBe(false);
    expect(der.mostrarPlanCuotas).toBe(false);
    expect(der.cuotas6Str).toBe('');
    expect(der.cuotas8Str).toBe('');
    expect(der.financierasDisponibles.map((f) => f.id)).toEqual(['sistecredito', 'esmiopcion']);
  });

  it('identifies accessory <= 100k as not having financing at all', () => {
    const accesorioEco: Product = {
      id: 'acc-2',
      nombre: 'Funda Silicona',
      categoria: 'Accesorios',
      contado: 45000,
    };

    const der = useProductPricing(accesorioEco);

    expect(der.productType).toBe('accesorio');
    expect(der.tieneFinanciacion).toBe(false);
    expect(der.aplicaKrediya).toBe(false);
    expect(der.mostrarPlanCuotas).toBe(false);
    expect(der.financierasDisponibles).toHaveLength(0);
  });

  it('enables PlanCuotas for Android phone with Krediya and configured cuotas', () => {
    const android: Product = {
      id: 'android-1',
      nombre: 'Samsung Galaxy A54',
      marca: 'Samsung',
      categoria: 'Celulares',
      contado: 1600000,
      cuotas6: 160000,
      cuotas8: 120000,
    };

    const der = useProductPricing(android);

    expect(der.productType).toBe('android');
    expect(der.tieneFinanciacion).toBe(true);
    expect(der.aplicaKrediya).toBe(true);
    expect(der.mostrarPlanCuotas).toBe(true);
    expect(der.cuotas6Str).not.toBe('');
    expect(der.cuotas8Str).not.toBe('');
  });

  it('disables PlanCuotas for Android phone if cuotas are not configured (0 or undefined)', () => {
    const androidSinCuotas: Product = {
      id: 'android-2',
      nombre: 'Xiaomi 13T',
      marca: 'Xiaomi',
      categoria: 'Celulares',
      contado: 2200000,
      cuotas6: undefined,
      cuotas8: undefined,
    };

    const der = useProductPricing(androidSinCuotas);

    expect(der.productType).toBe('android');
    expect(der.tieneFinanciacion).toBe(true);
    expect(der.aplicaKrediya).toBe(true);
    expect(der.mostrarPlanCuotas).toBe(false);
    expect(der.cuotas6Str).toBe('');
    expect(der.cuotas8Str).toBe('');
  });
});
