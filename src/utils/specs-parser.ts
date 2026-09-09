import type { ProductSpecs } from '../types';

export const SPEC_RANGES = {
  RAM_MIN: 2,
  RAM_MAX: 24,
  STORAGE_MIN: 32,
  STORAGE_MAX: 2048,
  SCREEN_MIN: 4.5,
  SCREEN_MAX: 7.5,
  BATTERY_MIN: 2000,
  BATTERY_MAX: 7500,
  CAMERA_MIN: 5,
  CAMERA_MAX: 500,
} as const;

/**
 * Normaliza y convierte un valor a número finito o null.
 */
function toNum(v: string | number | undefined | null): number | null {
  if (v === 0 || v) {
    const s = String(v)
      .replace(/[^0-9.,]/g, '')
      .replace(',', '.');
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Sanitiza especificaciones técnicas eliminando valores corruptos o fuera de rangos reales de smartphones.
 */
export function sanitizeSpecs(specs?: Partial<ProductSpecs> | null): ProductSpecs {
  const emptySpecs: ProductSpecs = {
    almacenamiento: null,
    ram: null,
    camara: null,
    pantalla: null,
    bateria: null,
  };

  if (!specs || typeof specs !== 'object') {
    return emptySpecs;
  }

  const cleanNum = (val: unknown, min: number, max: number): number | null => {
    const n = toNum(val as string | number);
    return n !== null && n >= min && n <= max ? n : null;
  };

  return {
    almacenamiento: cleanNum(specs.almacenamiento, SPEC_RANGES.STORAGE_MIN, SPEC_RANGES.STORAGE_MAX),
    ram: cleanNum(specs.ram, SPEC_RANGES.RAM_MIN, SPEC_RANGES.RAM_MAX),
    camara: cleanNum(specs.camara, SPEC_RANGES.CAMERA_MIN, SPEC_RANGES.CAMERA_MAX),
    pantalla: cleanNum(specs.pantalla, SPEC_RANGES.SCREEN_MIN, SPEC_RANGES.SCREEN_MAX),
    bateria: cleanNum(specs.bateria, SPEC_RANGES.BATTERY_MIN, SPEC_RANGES.BATTERY_MAX),
  };
}

/**
 * Parsea un texto descriptivo o combinación de título y descripción
 * para extraer especificaciones técnicas reales de smartphones:
 * - RAM (2 a 24 GB)
 * - Almacenamiento (32 a 2048 GB, o 1/2 TB -> 1024/2048 GB)
 * - Pantalla (4.5 a 7.5 pulgadas)
 * - Batería (2000 a 7500 mAh)
 * - Cámara (5 a 500 MP)
 *
 * @param description Texto descriptivo o título del producto
 * @returns ProductSpecs con los valores parseados o null
 */
export function parseSpecs(description: string = ''): ProductSpecs {
  const emptySpecs: ProductSpecs = {
    almacenamiento: null,
    ram: null,
    camara: null,
    pantalla: null,
    bateria: null,
  };

  if (!description || typeof description !== 'string') {
    return emptySpecs;
  }

  const text = description.toLowerCase();

  // 1. RAM (2 a 24 GB):
  let ram: number | null = null;

  // 1.1 Formato de RAM virtual/expandida: "8+8GB", "8+8 GB RAM", "4+4GB" (toma la física = 8)
  const virtualRamMatch = text.match(/\b(\d{1,2})\s*\+\s*\d{1,2}\s*gb(?:\s*(?:de\s+)?(?:memoria\s+)?ram)?\b/);
  if (virtualRamMatch) {
    const val = toNum(virtualRamMatch[1]);
    if (val !== null && val >= SPEC_RANGES.RAM_MIN && val <= SPEC_RANGES.RAM_MAX) {
      ram = val;
    }
  }

  // 1.2 Formatos explícitos con palabra RAM: "12GB RAM", "12 RAM", "16 RAM", "/4Ram", "8 GB de RAM", "RAM: 16GB"
  if (ram === null) {
    const ramKeywordsMatches = [
      text.match(/(?:[/+]|\b)(\d{1,2})\s*gb\s*(?:de\s+)?(?:memoria\s+)?ram\b/),
      text.match(/(?:[/+]|\b)(\d{1,2})\s*ram\b/),
      text.match(/\bram\s*(?:de\s+|:\s*)?(\d{1,2})\s*(?:gb)?\b/),
    ];

    for (const match of ramKeywordsMatches) {
      if (match) {
        const val = toNum(match[1]);
        if (val !== null && val >= SPEC_RANGES.RAM_MIN && val <= SPEC_RANGES.RAM_MAX) {
          ram = val;
          break;
        }
      }
    }
  }

  // 2. Almacenamiento (32 a 2048 GB / 1-2 TB):
  let almacenamiento: number | null = null;

  // 2.1 Soporta TB: 1 TB -> 1024, 2 TB -> 2048
  const tbMatch = text.match(/\b([1-2])\s?tb\b/);
  if (tbMatch) {
    almacenamiento = Number(tbMatch[1]) * 1024;
  } else {
    // 2.2 Buscar almacenamiento explícito (ej: "256 gb rom", "128gb almacenamiento", "almacenamiento de 512gb")
    const explicitStorageMatch =
      text.match(/\b(\d{2,4})\s?gb\s*(?:de\s+)?(?:almacenamiento|rom|memoria\s+interna|interna|espacio)\b/) ||
      text.match(/(?:almacenamiento|rom|memoria\s+interna|interna|espacio)\s*(?:de\s+|:\s*)?(\d{2,4})\s?gb\b/);

    if (explicitStorageMatch) {
      const val = toNum(explicitStorageMatch[1]);
      if (val !== null && val >= SPEC_RANGES.STORAGE_MIN && val <= SPEC_RANGES.STORAGE_MAX) {
        almacenamiento = val;
      }
    }
  }

  // 2.3 Combinaciones explícitas de RAM y Almacenamiento con slash o plus (ej: "512GB/12 RAM", "8GB / 256GB", "256GB / 8GB")
  if (almacenamiento === null || ram === null) {
    const slashComboMatch = text.match(/\b(\d{1,4})\s?(?:gb)?\s*[/+]\s*(\d{1,4})\s?(?:gb|ram)?\b/);
    if (slashComboMatch) {
      const num1 = toNum(slashComboMatch[1]);
      const num2 = toNum(slashComboMatch[2]);

      if (num1 !== null && num2 !== null) {
        if (num1 >= SPEC_RANGES.STORAGE_MIN && num1 <= SPEC_RANGES.STORAGE_MAX && num2 >= SPEC_RANGES.RAM_MIN && num2 <= SPEC_RANGES.RAM_MAX) {
          if (almacenamiento === null) almacenamiento = num1;
          if (ram === null) ram = num2;
        } else if (num1 >= SPEC_RANGES.RAM_MIN && num1 <= SPEC_RANGES.RAM_MAX && num2 >= SPEC_RANGES.STORAGE_MIN && num2 <= SPEC_RANGES.STORAGE_MAX) {
          if (ram === null) ram = num1;
          if (almacenamiento === null) almacenamiento = num2;
        }
      }
    }
  }

  // 2.4 Si aún falta almacenamiento o ram, analizar todos los matches "\b(\d+)\s?gb\b"
  if (almacenamiento === null || ram === null) {
    const allGbMatches = Array.from(text.matchAll(/\b(\d{1,4})\s?gb\b/g))
      .map((m) => toNum(m[1]))
      .filter((n): n is number => n !== null);

    for (const num of allGbMatches) {
      // Si está en rango de almacenamiento (32 a 2048) y no tenemos almacenamiento
      if (almacenamiento === null && num >= SPEC_RANGES.STORAGE_MIN && num <= SPEC_RANGES.STORAGE_MAX && num !== ram) {
        almacenamiento = num;
      }
      // Si está en rango de RAM (2 a 24) y no tenemos RAM
      else if (ram === null && num >= SPEC_RANGES.RAM_MIN && num <= SPEC_RANGES.RAM_MAX && num !== almacenamiento) {
        ram = num;
      }
    }
  }

  // 3. Cámara Principal (5 a 500 MP):
  // Si hay varios valores de megapíxeles (ej: "32 MP frontal y 200 MP principal"), seleccionar el principal (mayor sensor o explícito)
  let camara: number | null = null;
  const explicitPrincipalMatch =
    text.match(/(?:c[aá]mara\s+)?(?:principal|trasera|posterior|rear|main)\s*(?:de\s+|:\s*)?(\d{1,4})\s*(?:mp|megap[ií]xeles|megapixeles)\b/) ||
    text.match(/(\d{1,4})\s*(?:mp|megap[ií]xeles|megapixeles)\s*(?:principal|trasera|posterior|rear|main)\b/);

  if (explicitPrincipalMatch) {
    const val = toNum(explicitPrincipalMatch[1]);
    if (val !== null && val >= SPEC_RANGES.CAMERA_MIN && val <= SPEC_RANGES.CAMERA_MAX) {
      camara = val;
    }
  }

  if (camara === null) {
    const allMpMatches = Array.from(text.matchAll(/\b(\d{1,4})\s*(?:mp|megap[ií]xeles|megapixeles)\b/g))
      .map((m) => toNum(m[1]))
      .filter((n): n is number => n !== null && n >= SPEC_RANGES.CAMERA_MIN && n <= SPEC_RANGES.CAMERA_MAX);

    if (allMpMatches.length > 0) {
      camara = Math.max(...allMpMatches);
    }
  }

  // 4. Pantalla (4.5" a 7.5" pulgadas para smartphones):
  // Evita falsos positivos con audio jacks (3.5"), cables o pulgadas de TVs
  let pantalla: number | null = null;
  const screenCandidates: number[] = [];

  const screenMatches = Array.from(
    text.matchAll(/(?:pantalla\s+(?:[a-z0-9+-]+\s+)*?(?:de\s+|:\s*)?)?(\d{1,2}(?:[.,]\d+)?)\s*(?:pulgadas|pulg\b|")/gi)
  );

  for (const m of screenMatches) {
    const val = toNum(m[1]);
    if (val !== null && val >= SPEC_RANGES.SCREEN_MIN && val <= SPEC_RANGES.SCREEN_MAX) {
      screenCandidates.push(val);
    }
  }

  // Búsqueda con palabra "pantalla" si no se encontró con unidad
  if (screenCandidates.length === 0) {
    const pantallaWordMatches = Array.from(
      text.matchAll(/pantalla\s+(?:de\s+|:\s*)?(?:[a-z0-9+-]+\s+)*?(\d{1,2}(?:[.,]\d+)?)/gi)
    );
    for (const m of pantallaWordMatches) {
      const val = toNum(m[1]);
      if (val !== null && val >= SPEC_RANGES.SCREEN_MIN && val <= SPEC_RANGES.SCREEN_MAX) {
        screenCandidates.push(val);
      }
    }
  }

  if (screenCandidates.length > 0) {
    pantalla = screenCandidates[0];
  }

  // 5. Batería (2000 a 7500 mAh):
  // Exige unidad "mAh" o contexto explícito de "batería" para evitar falsos positivos con distancias ("1000m")
  let bateria: number | null = null;

  const batWithUnitMatch = text.match(/\b(\d{4,5})\s?mah\b/);
  const batWithContextMatch =
    text.match(/bater[ií]a\s+(?:de\s+|:\s*)?(\d{4,5})\s*(?:mah|m)?\b/) ||
    text.match(/(\d{4,5})\s*(?:mah|m)?\s*(?:de\s+)?bater[ií]a\b/);

  const rawBatVal = batWithUnitMatch ? toNum(batWithUnitMatch[1]) : batWithContextMatch ? toNum(batWithContextMatch[1]) : null;

  if (rawBatVal !== null && rawBatVal >= SPEC_RANGES.BATTERY_MIN && rawBatVal <= SPEC_RANGES.BATTERY_MAX) {
    bateria = rawBatVal;
  }

  return {
    almacenamiento,
    ram,
    camara,
    pantalla,
    bateria,
  };
}

// Alias para retrocompatibilidad
export const parseDescriptionToSpecs = parseSpecs;

/**
 * Extrae y sanitiza las especificaciones de un producto combinando Firestore specs
 * con la información parseada del nombre y descripción.
 * Si el producto es un accesorio, retorna todas las specs como null.
 */
export function extractProductSpecs(producto: {
  nombre?: string;
  descripcion?: string;
  specs?: Partial<ProductSpecs> | null;
  categoria?: string;
  marca?: string;
}): ProductSpecs {
  const emptySpecs: ProductSpecs = {
    almacenamiento: null,
    ram: null,
    camara: null,
    pantalla: null,
    bateria: null,
  };

  if (!producto || typeof producto !== 'object') {
    return emptySpecs;
  }

  const cat = (producto.categoria || '').toLowerCase();
  const nom = (producto.nombre || '').toLowerCase();

  const isAccesorio =
    cat.includes('accesorio') ||
    cat.includes('accessory') ||
    ['funda', 'case', 'cable', 'cargador', 'audifono', 'audifonos', 'auricular', 'auriculares', 'vidrio templado', 'protector'].some((kw) => nom.includes(kw));

  if (isAccesorio) {
    return emptySpecs;
  }

  const titleSpecs = parseSpecs(producto.nombre || '');
  const descSpecs = parseSpecs(producto.descripcion || '');
  const firestoreSpecs = sanitizeSpecs(producto.specs);

  return {
    almacenamiento: titleSpecs.almacenamiento ?? firestoreSpecs.almacenamiento ?? descSpecs.almacenamiento,
    ram: titleSpecs.ram ?? firestoreSpecs.ram ?? descSpecs.ram,
    camara: titleSpecs.camara ?? firestoreSpecs.camara ?? descSpecs.camara,
    pantalla: titleSpecs.pantalla ?? firestoreSpecs.pantalla ?? descSpecs.pantalla,
    bateria: titleSpecs.bateria ?? firestoreSpecs.bateria ?? descSpecs.bateria,
  };
}
