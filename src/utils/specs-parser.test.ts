import { describe, it, expect } from 'vitest';
import { parseSpecs, parseDescriptionToSpecs } from './specs-parser';

describe('specs-parser: parseSpecs', () => {
  it('retorna valores nulos para entradas vacías o inválidas', () => {
    const emptyResult = {
      almacenamiento: null,
      ram: null,
      camara: null,
      pantalla: null,
      bateria: null,
    };

    expect(parseSpecs('')).toEqual(emptyResult);
    expect(parseSpecs(undefined as unknown as string)).toEqual(emptyResult);
    expect(parseSpecs(null as unknown as string)).toEqual(emptyResult);
    expect(parseSpecs(123 as unknown as string)).toEqual(emptyResult);
  });

  it('parseDescriptionToSpecs es un alias idéntico a parseSpecs', () => {
    expect(parseDescriptionToSpecs).toBe(parseSpecs);
  });

  describe('Extracción de RAM (2 a 24 GB)', () => {
    it('extrae RAM con formato "X GB de RAM"', () => {
      const specs = parseSpecs('8 GB de RAM');
      expect(specs.ram).toBe(8);
    });

    it('extrae RAM con formato "XGB RAM"', () => {
      const specs = parseSpecs('12GB RAM');
      expect(specs.ram).toBe(12);
    });

    it('extrae RAM con formato "RAM: 16GB"', () => {
      const specs = parseSpecs('RAM: 16GB');
      expect(specs.ram).toBe(16);
    });

    it('extrae RAM mínima soportada (2 GB)', () => {
      const specs = parseSpecs('2 GB RAM');
      expect(specs.ram).toBe(2);
    });

    it('extrae RAM máxima soportada (24 GB)', () => {
      const specs = parseSpecs('24 GB RAM');
      expect(specs.ram).toBe(24);
    });

    it('no asigna como RAM valores fuera del rango 2-24 GB', () => {
      const specs = parseSpecs('1 GB RAM');
      expect(specs.ram).toBeNull();
    });
  });

  describe('Extracción de Almacenamiento (32 a 2048 GB / 1-2 TB)', () => {
    it('extrae almacenamiento estándar en GB (128 GB, 256 GB, 512 GB)', () => {
      expect(parseSpecs('128 GB').almacenamiento).toBe(128);
      expect(parseSpecs('256GB').almacenamiento).toBe(256);
      expect(parseSpecs('512 GB de almacenamiento').almacenamiento).toBe(512);
    });

    it('extrae almacenamiento con formato ROM / Memoria Interna', () => {
      expect(parseSpecs('128GB ROM').almacenamiento).toBe(128);
      expect(parseSpecs('Memoria interna: 256GB').almacenamiento).toBe(256);
    });

    it('convierte 1 TB a 1024 GB', () => {
      expect(parseSpecs('1 TB').almacenamiento).toBe(1024);
      expect(parseSpecs('1TB almacenamiento').almacenamiento).toBe(1024);
    });

    it('convierte 2 TB a 2048 GB', () => {
      expect(parseSpecs('2 TB').almacenamiento).toBe(2048);
      expect(parseSpecs('2TB').almacenamiento).toBe(2048);
    });

    it('extrae almacenamiento de 32 GB y 64 GB', () => {
      expect(parseSpecs('32 GB').almacenamiento).toBe(32);
      expect(parseSpecs('64 GB').almacenamiento).toBe(64);
    });
  });

  describe('Combinaciones de RAM y Almacenamiento', () => {
    it('diferencia correctamente "8GB / 256GB"', () => {
      const specs = parseSpecs('8GB / 256GB');
      expect(specs.ram).toBe(8);
      expect(specs.almacenamiento).toBe(256);
    });

    it('diferencia correctamente "256GB / 8GB"', () => {
      const specs = parseSpecs('256GB / 8GB');
      expect(specs.ram).toBe(8);
      expect(specs.almacenamiento).toBe(256);
    });

    it('diferencia correctamente "12GB RAM + 512GB ROM"', () => {
      const specs = parseSpecs('12GB RAM + 512GB ROM');
      expect(specs.ram).toBe(12);
      expect(specs.almacenamiento).toBe(512);
    });

    it('soporta 1TB con 16GB RAM', () => {
      const specs = parseSpecs('16GB RAM, 1TB de almacenamiento');
      expect(specs.ram).toBe(16);
      expect(specs.almacenamiento).toBe(1024);
    });
  });

  describe('Extracción de Cámara (MP)', () => {
    it('extrae cámara con formato "200 MP"', () => {
      expect(parseSpecs('cámara de 200 MP').camara).toBe(200);
      expect(parseSpecs('200mp').camara).toBe(200);
    });

    it('extrae cámara con formato megapíxeles', () => {
      expect(parseSpecs('cámara principal de 108 megapíxeles').camara).toBe(108);
      expect(parseSpecs('50 megapixeles').camara).toBe(50);
    });

    it('extrae cámara estándar de 50 MP, 64 MP, 12 MP', () => {
      expect(parseSpecs('50 MP').camara).toBe(50);
      expect(parseSpecs('64MP').camara).toBe(64);
      expect(parseSpecs('12 MP').camara).toBe(12);
    });
  });

  describe('Extracción de Pantalla (pulgadas)', () => {
    it('extrae pantalla con comillas (" ej: 6.67")', () => {
      expect(parseSpecs('6.67"').pantalla).toBe(6.67);
      expect(parseSpecs('6.7" Super AMOLED').pantalla).toBe(6.7);
    });

    it('extrae pantalla con coma decimal (ej: 6,67 pulgadas)', () => {
      expect(parseSpecs('6,67 pulgadas').pantalla).toBe(6.67);
      expect(parseSpecs('6,5"').pantalla).toBe(6.5);
    });

    it('extrae pantalla con palabra "pulgadas" o "pulg"', () => {
      expect(parseSpecs('Pantalla AMOLED de 6.67 pulgadas 120Hz').pantalla).toBe(6.67);
      expect(parseSpecs('pantalla 6.5 pulg').pantalla).toBe(6.5);
    });
  });

  describe('Extracción de Batería (mAh)', () => {
    it('extrae batería con formato "5000 mAh"', () => {
      expect(parseSpecs('batería de 5000 mAh').bateria).toBe(5000);
      expect(parseSpecs('5000mah').bateria).toBe(5000);
    });

    it('extrae batería de 4500, 6000 mAh', () => {
      expect(parseSpecs('4500 mAh').bateria).toBe(4500);
      expect(parseSpecs('6000 mAh').bateria).toBe(6000);
    });
  });

  describe('Descripción completa de smartphones reales', () => {
    it('parsea correctamente Redmi Note 13 Pro', () => {
      const desc = '256 GB, 8 GB de RAM, cámara de 200 MP, pantalla 6.67 pulgadas 120Hz, batería de 5000 mAh';
      const specs = parseSpecs(desc);

      expect(specs).toEqual({
        almacenamiento: 256,
        ram: 8,
        camara: 200,
        pantalla: 6.67,
        bateria: 5000,
      });
    });

    it('parsea correctamente Samsung Galaxy S24 Ultra', () => {
      const desc = '512GB ROM, 12GB RAM, Cámara 200MP, Dynamic AMOLED 6.8", Batería 5000mAh';
      const specs = parseSpecs(desc);

      expect(specs).toEqual({
        almacenamiento: 512,
        ram: 12,
        camara: 200,
        pantalla: 6.8,
        bateria: 5000,
      });
    });

    it('parsea correctamente iPhone 15 Pro Max con 1TB', () => {
      const desc = '1 TB almacenamiento, 8 GB RAM, Pantalla Super Retina XDR 6.7 pulgadas, Cámara 48 MP, Batería 4441 mAh';
      const specs = parseSpecs(desc);

      expect(specs).toEqual({
        almacenamiento: 1024,
        ram: 8,
        camara: 48,
        pantalla: 6.7,
        bateria: 4441,
      });
    });
  });
});
