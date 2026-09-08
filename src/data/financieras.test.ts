import { describe, it, expect } from 'vitest';
import {
  getProductType,
  getFinancierasForProduct,
  getFinancierasDisponibles,
  UMBRAL_PRECIO_ACCESORIOS_CREDITO,
} from './financieras';

describe('financieras - getProductType', () => {
  it('detects Apple / iPhone products correctly', () => {
    expect(getProductType('Apple', 'iPhone 15 Pro', 'Celulares')).toBe('iphone');
    expect(getProductType('Apple', 'Cualquier cosa', 'Smartphones')).toBe('iphone');
    expect(getProductType(undefined, 'iPhone 13 128GB', 'Celulares')).toBe('iphone');
    expect(getProductType(undefined, 'iPad Air M2', 'Tablets')).toBe('iphone');
    expect(getProductType(undefined, 'MacBook Pro M3', 'Computadores')).toBe('iphone');
  });

  it('detects Android / generic phone products correctly', () => {
    expect(getProductType('Samsung', 'Galaxy S24 Ultra', 'Celulares')).toBe('android');
    expect(getProductType('Xiaomi', 'Redmi Note 13', 'Celulares')).toBe('android');
    expect(getProductType('Motorola', 'Edge 40', 'Smartphones')).toBe('android');
  });

  it('detects Electrodomésticos correctly', () => {
    expect(getProductType('LG', 'Smart TV 55 Pulgadas 4K', 'Electrodoméstico')).toBe('electrodomestico');
    expect(getProductType('Samsung', 'Nevera No Frost', 'Nevera')).toBe('electrodomestico');
    expect(getProductType('Whirlpool', 'Lavadora 18kg', 'Lavadora')).toBe('electrodomestico');
    expect(getProductType(undefined, 'Licuadora', 'Hogar')).toBe('electrodomestico');
  });

  it('detects Accesorios by category correctly', () => {
    expect(getProductType('Apple', 'Funda de Silicona MagSafe', 'accesorio')).toBe('accesorio');
    expect(getProductType('Samsung', 'Galaxy Buds 2', 'accesorios')).toBe('accesorio');
    expect(getProductType(undefined, 'Cargador Rápido', 'Accesorios')).toBe('accesorio');
    expect(getProductType(undefined, 'Vidrio Templado', 'Accessories')).toBe('accesorio');
  });

  it('detects Accesorios by product name keywords when category is not phone', () => {
    expect(getProductType(undefined, 'Cargador Carga Rápida 25W Type-C')).toBe('accesorio');
    expect(getProductType(undefined, 'Cable USB-C a Lightning')).toBe('accesorio');
    expect(getProductType(undefined, 'Funda Antigolpes Transparente')).toBe('accesorio');
    expect(getProductType(undefined, 'Estuche Silicona')).toBe('accesorio');
    expect(getProductType(undefined, 'Audífonos Bluetooth Inalámbricos')).toBe('accesorio');
    expect(getProductType(undefined, 'Smartwatch Deportivo Amazfit')).toBe('accesorio');
    expect(getProductType(undefined, 'Powerbank 10000mAh Batería Portátil')).toBe('accesorio');
    expect(getProductType(undefined, 'Vidrio Templado 9D')).toBe('accesorio');
  });
});

describe('financieras - getFinancierasForProduct & getFinancierasDisponibles', () => {
  it('celular iPhone: returns Sistecrédito and Esmiopción only', () => {
    const financieras = getFinancierasForProduct('Apple', 'Celulares', 'iPhone 15', 4200000);
    const ids = financieras.map((f) => f.id);

    expect(ids).toEqual(['sistecredito', 'esmiopcion']);
    expect(ids).not.toContain('pajoy');
    expect(ids).not.toContain('krediya');
    expect(ids).not.toContain('celya');
  });

  it('celular Android: returns all 5 financieras', () => {
    const financieras = getFinancierasForProduct('Samsung', 'Celulares', 'Galaxy S24', 3500000);
    const ids = financieras.map((f) => f.id);

    expect(ids).toEqual(['sistecredito', 'esmiopcion', 'pajoy', 'krediya', 'celya']);
    expect(financieras).toHaveLength(5);
  });

  it('electrodoméstico: returns Sistecrédito, Esmiopción, PayJoy, and Krediya (excludes Celya)', () => {
    const financieras = getFinancierasForProduct('LG', 'Electrodoméstico', 'Smart TV 55', 2000000);
    const ids = financieras.map((f) => f.id);

    expect(ids).toEqual(['sistecredito', 'esmiopcion', 'pajoy', 'krediya']);
    expect(ids).not.toContain('celya');
  });

  describe('Accesorios business rules', () => {
    it('accesorio <= $100.000 COP ($50.000): returns 0 financieras (no credit)', () => {
      const financieras = getFinancierasForProduct('Genérica', 'Accesorios', 'Funda Silicona', 50000);
      expect(financieras).toHaveLength(0);
      expect(financieras).toEqual([]);
    });

    it('accesorio at exact threshold ($100.000 COP): returns 0 financieras (no credit)', () => {
      const financieras = getFinancierasForProduct(undefined, 'accesorio', 'Cargador 20W', 100000);
      expect(financieras).toHaveLength(0);
      expect(financieras).toEqual([]);
    });

    it('accesorio > $100.000 COP ($100.001): returns only Sistecrédito and Esmiopción', () => {
      const financieras = getFinancierasForProduct(undefined, 'accesorio', 'Cargador Dual', 100001);
      const ids = financieras.map((f) => f.id);

      expect(ids).toEqual(['sistecredito', 'esmiopcion']);
      expect(ids).not.toContain('pajoy');
      expect(ids).not.toContain('krediya');
      expect(ids).not.toContain('celya');
    });

    it('accesorio > $100.000 COP ($150.000): returns only Sistecrédito and Esmiopción', () => {
      const financieras = getFinancierasForProduct('Amazfit', 'Accesorios', 'Smartwatch GTS', 150000);
      const ids = financieras.map((f) => f.id);

      expect(ids).toEqual(['sistecredito', 'esmiopcion']);
      expect(ids).not.toContain('pajoy');
      expect(ids).not.toContain('krediya');
      expect(ids).not.toContain('celya');
    });

    it('supports product object signature overload', () => {
      // Accessory <= 100k
      const noCredito = getFinancierasForProduct({
        categoria: 'Accesorios',
        nombre: 'Funda Pro',
        contado: 45000,
      });
      expect(noCredito).toEqual([]);

      // Accessory > 100k
      const conCredito = getFinancierasForProduct({
        categoria: 'Accesorios',
        nombre: 'AirPods Pro Genéricos',
        contado: 180000,
      });
      expect(conCredito.map((f) => f.id)).toEqual(['sistecredito', 'esmiopcion']);

      // Celular iPhone
      const iphone = getFinancierasForProduct({
        marca: 'Apple',
        nombre: 'iPhone 14',
        categoria: 'Celulares',
        contado: 3800000,
      });
      expect(iphone.map((f) => f.id)).toEqual(['sistecredito', 'esmiopcion']);
    });

    it('getFinancierasDisponibles is an exact alias of getFinancierasForProduct', () => {
      expect(getFinancierasDisponibles).toBe(getFinancierasForProduct);
    });

    it('exports UMBRAL_PRECIO_ACCESORIOS_CREDITO = 100000', () => {
      expect(UMBRAL_PRECIO_ACCESORIOS_CREDITO).toBe(100000);
    });
  });
});
