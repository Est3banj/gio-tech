import { describe, it, expect } from 'vitest';
import {
  parseSpecs,
  parseDescriptionToSpecs,
  sanitizeSpecs,
  extractProductSpecs,
} from './specs-parser';

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

  describe('Extracción de RAM (2 a 24 GB) y formatos reales de catálogo', () => {
    it('extrae RAM con formato "X GB de RAM"', () => {
      const specs = parseSpecs('8 GB de RAM');
      expect(specs.ram).toBe(8);
    });

    it('extrae RAM con formato "XGB RAM"', () => {
      const specs = parseSpecs('12GB RAM');
      expect(specs.ram).toBe(12);
    });

    it('extrae RAM con formato "12 RAM" y "16 RAM"', () => {
      expect(parseSpecs('12 RAM').ram).toBe(12);
      expect(parseSpecs('16 RAM').ram).toBe(16);
    });

    it('extrae RAM con formato "/4Ram"', () => {
      const specs = parseSpecs('Moto G54 /4Ram 128gb');
      expect(specs.ram).toBe(4);
      expect(specs.almacenamiento).toBe(128);
    });

    it('extrae RAM virtual "8+8GB" tomando únicamente la RAM física (8GB)', () => {
      const specs = parseSpecs('Xiaomi Redmi Note 13 8+8GB 256GB');
      expect(specs.ram).toBe(8);
      expect(specs.almacenamiento).toBe(256);
    });

    it('soporta formato título vendedor "Samsung S25 Ultra 512GB/12 RAM"', () => {
      const specs = parseSpecs('Samsung S25 Ultra 512GB/12 RAM');
      expect(specs.ram).toBe(12);
      expect(specs.almacenamiento).toBe(512);
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

    it('Escudo Anti-Basura: descarta valores corruptos históricos mayores a 24GB (28 RAM, 56 RAM, etc.)', () => {
      expect(parseSpecs('28 RAM').ram).toBeNull();
      expect(parseSpecs('56 RAM').ram).toBeNull();
      expect(parseSpecs('1 GB RAM').ram).toBeNull();
      expect(parseSpecs('32 RAM').ram).toBeNull();
    });
  });

  describe('Extracción de Almacenamiento (32 a 2048 GB / 1-2 TB)', () => {
    it('extrae almacenamiento estándar en GB (128 GB, 256 GB, 512 GB)', () => {
      expect(parseSpecs('iPhone 128GB').almacenamiento).toBe(128);
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

  describe('Extracción de Cámara Principal (5 a 500 MP)', () => {
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

    it('selecciona el sensor principal cuando hay múltiples cámaras (32 MP frontal y 200 MP principal)', () => {
      expect(parseSpecs('32 MP frontal y 200 MP principal').camara).toBe(200);
      expect(parseSpecs('200 MP principal y 32 MP frontal').camara).toBe(200);
      expect(parseSpecs('Cámara principal 50MP + 8MP + 2MP y frontal 16MP').camara).toBe(50);
    });
  });

  describe('Extracción de Pantalla Real (4.5" a 7.5" pulgadas)', () => {
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

    it('descarta cables y conectores de audio como "Jack 3.5"" por estar fuera de rango de smartphones', () => {
      expect(parseSpecs('Audio Jack 3.5" y conector Tipo C').pantalla).toBeNull();
      expect(parseSpecs('Audio Jack 3.5", pantalla de 6.67" AMOLED').pantalla).toBe(6.67);
    });
  });

  describe('Extracción de Batería Real (2000 a 7500 mAh)', () => {
    it('extrae batería con formato "5000 mAh"', () => {
      expect(parseSpecs('batería de 5000 mAh').bateria).toBe(5000);
      expect(parseSpecs('5000mah').bateria).toBe(5000);
    });

    it('extrae batería de 4500, 6000 mAh', () => {
      expect(parseSpecs('4500 mAh').bateria).toBe(4500);
      expect(parseSpecs('6000 mAh').bateria).toBe(6000);
    });

    it('descarta distancias como "1000m" o "5000m de cable" sin contexto de batería', () => {
      expect(parseSpecs('Resistencia al agua hasta 1000m').bateria).toBeNull();
      expect(parseSpecs('Distancia 1000m, batería 5000 mAh').bateria).toBe(5000);
      expect(parseSpecs('5000m de distancia').bateria).toBeNull();
    });
  });

  describe('Sanitización de specs y escudo anti-corrupción', () => {
    it('sanitizeSpecs elimina campos corruptos fuera de rangos de smartphones', () => {
      const corruptSpecs = {
        ram: 28,
        pantalla: 56,
        bateria: 1000,
        camara: 1000,
        almacenamiento: 10,
      };

      expect(sanitizeSpecs(corruptSpecs)).toEqual({
        ram: null,
        pantalla: null,
        bateria: null,
        camara: null,
        almacenamiento: null,
      });
    });

    it('sanitizeSpecs mantiene campos válidos', () => {
      const validSpecs = {
        ram: 12,
        almacenamiento: 512,
        camara: 200,
        pantalla: 6.8,
        bateria: 5000,
      };

      expect(sanitizeSpecs(validSpecs)).toEqual(validSpecs);
    });

    it('extractProductSpecs combina texto y specs sanitizadas corrigiendo datos corruptos', () => {
      const producto = {
        nombre: 'Samsung Galaxy S25 Ultra 512GB/12 RAM',
        descripcion: 'Cámara 200MP, Batería 5000 mAh, Pantalla 6.8"',
        specs: {
          ram: 28 as unknown as number, // Dato corrupto en base de datos
          almacenamiento: 512,
        },
      };

      const result = extractProductSpecs(producto);
      expect(result.ram).toBe(12); // Recalculado fielmente desde el título
      expect(result.almacenamiento).toBe(512);
      expect(result.camara).toBe(200);
      expect(result.pantalla).toBe(6.8);
      expect(result.bateria).toBe(5000);
    });

    it('extractProductSpecs retorna todas las specs en null para accesorios', () => {
      const accesorio = {
        nombre: 'Funda Protectora 128GB silicona 3.5"',
        categoria: 'Accesorios',
        descripcion: 'Funda resistente 5000m',
      };

      const result = extractProductSpecs(accesorio);
      expect(result).toEqual({
        almacenamiento: null,
        ram: null,
        camara: null,
        pantalla: null,
        bateria: null,
      });
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

  describe('Casos Reales de Títulos de Gio Tech', () => {
    it('iPhone 11 128GB EXIBICION ➔ Almacenamiento: 128', () => {
      const specs = parseSpecs('iPhone 11 128GB EXIBICION');
      expect(specs.almacenamiento).toBe(128);
      expect(specs.ram).toBeNull();
    });

    it('Samsung Galaxy S25 Ultra 5g 512GB/12 RAM ➔ Almacenamiento: 512, RAM: 12', () => {
      const specs = parseSpecs('Samsung Galaxy S25 Ultra 5g 512GB/12 RAM');
      expect(specs.almacenamiento).toBe(512);
      expect(specs.ram).toBe(12);
    });

    it('REDMI NOTE 14 PRO PLUS 5G/ 256 GB ➔ Almacenamiento: 256 (no confunde 5G con RAM)', () => {
      const specs = parseSpecs('REDMI NOTE 14 PRO PLUS 5G/ 256 GB');
      expect(specs.almacenamiento).toBe(256);
      expect(specs.ram).toBeNull();
    });

    it('iPhone 14 Pro Max 1TB ➔ Almacenamiento: 1024', () => {
      const specs = parseSpecs('iPhone 14 Pro Max 1TB');
      expect(specs.almacenamiento).toBe(1024);
      expect(specs.ram).toBeNull();
    });

    it('Celular Tecno Spark 20C 128GB ➔ Almacenamiento: 128', () => {
      const specs = parseSpecs('Celular Tecno Spark 20C 128GB');
      expect(specs.almacenamiento).toBe(128);
      expect(specs.ram).toBeNull();
    });

    it('Títulos estándar: iPhone 15 128 GB, Samsung S25 512GB, Redmi Note 13 256GB', () => {
      expect(parseSpecs('iPhone 15 128 GB').almacenamiento).toBe(128);
      expect(parseSpecs('Samsung S25 512GB').almacenamiento).toBe(512);
      expect(parseSpecs('Redmi Note 13 256GB').almacenamiento).toBe(256);
    });
  });

  describe('Prioridad de resolución de almacenamiento y RAM en extractProductSpecs', () => {
    it('MÁXIMA PRIORIDAD al título: manda sobre Firestore y sobre Descripción para almacenamiento', () => {
      const producto = {
        nombre: 'iPhone 15 128 GB',
        descripcion: 'Memoria interna 256GB, cámara 48MP',
        specs: {
          almacenamiento: 64, // Firestore desactualizado / erróneo
          camara: 48,
        },
      };

      const result = extractProductSpecs(producto);
      expect(result.almacenamiento).toBe(128); // Manda el título
      expect(result.camara).toBe(48);
    });

    it('MÁXIMA PRIORIDAD al título: manda sobre Firestore y sobre Descripción para RAM', () => {
      const producto = {
        nombre: 'Samsung Galaxy S25 Ultra 512GB/12 RAM',
        descripcion: '8 GB RAM, 256GB ROM, 5000 mAh',
        specs: {
          ram: 6, // Firestore erróneo
          almacenamiento: 256,
        },
      };

      const result = extractProductSpecs(producto);
      expect(result.almacenamiento).toBe(512); // Título manda en ROM
      expect(result.ram).toBe(12); // Título manda en RAM
      expect(result.bateria).toBe(5000);
    });

    it('Orden de fallback: Firestore manda sobre Descripción si no está en el título', () => {
      const producto = {
        nombre: 'iPhone 15', // Sin almacenamiento en el título
        descripcion: '256GB de almacenamiento',
        specs: {
          almacenamiento: 128, // Firestore presente
        },
      };

      const result = extractProductSpecs(producto);
      expect(result.almacenamiento).toBe(128); // Gana Firestore
    });

    it('Orden de fallback: Descripción se usa si ni título ni Firestore tienen almacenamiento', () => {
      const producto = {
        nombre: 'iPhone 15', // Sin almacenamiento en el título
        descripcion: 'Celular con 256GB de almacenamiento',
        specs: null,
      };

      const result = extractProductSpecs(producto);
      expect(result.almacenamiento).toBe(256); // Fallback a descripción
    });
  });
});

