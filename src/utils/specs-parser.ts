import type { ProductSpecs } from '../types';

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
 * Parsea una descripción de producto para extraer especificaciones técnicas:
 * - RAM (2 a 24 GB)
 * - Almacenamiento (32 a 2048 GB, o 1/2 TB -> 1024/2048 GB)
 * - Pantalla (en pulgadas, soporta decimales con punto o coma)
 * - Batería (en mAh)
 * - Cámara (en MP)
 *
 * @param description Texto descriptivo del producto
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

  // 1. Almacenamiento:
  // - Soporta TB: 1 TB -> 1024, 2 TB -> 2048
  // - Soporta GB: 32 a 2048 GB (con mención explícita o match en rango de almacenamiento)
  let almacenamiento: number | null = null;

  const tbMatch = text.match(/\b([1-2])\s?tb\b/);
  if (tbMatch) {
    almacenamiento = Number(tbMatch[1]) * 1024;
  } else {
    // Buscar almacenamiento explícito primero (ej: "256 gb rom", "128gb almacenamiento", "almacenamiento de 512gb")
    const explicitStorageMatch =
      text.match(/\b(\d{2,4})\s?gb\s*(?:de\s+)?(?:almacenamiento|rom|memoria\s+interna|interna|espacio)\b/) ||
      text.match(/(?:almacenamiento|rom|memoria\s+interna|interna|espacio)\s*(?:de\s+|:\s*)?(\d{2,4})\s?gb\b/);

    if (explicitStorageMatch) {
      const val = toNum(explicitStorageMatch[1]);
      if (val !== null && val >= 32 && val <= 2048) {
        almacenamiento = val;
      }
    }
  }

  // 2. RAM:
  // - Soporta 2 a 24 GB
  // - Buscar RAM explícita primero (ej: "8 gb ram", "8 gb de ram", "ram: 12gb")
  let ram: number | null = null;
  const explicitRamMatch =
    text.match(/\b(\d{1,2})\s?gb\s*(?:de\s+)?(?:memoria\s+)?ram\b/) ||
    text.match(/\bram\s*(?:de\s+|:\s*)?(\d{1,2})\s?gb\b/) ||
    text.match(/\b(\d{1,2})\s?gb\s+ram\b/);

  if (explicitRamMatch) {
    const val = toNum(explicitRamMatch[1]);
    if (val !== null && val >= 2 && val <= 24) {
      ram = val;
    }
  }

  // Si almacenamiento o ram no se encontraron explícitamente, extraer todos los patrones "\b(\d+)\s?gb\b"
  if (almacenamiento === null || ram === null) {
    const allGbMatches = Array.from(text.matchAll(/\b(\d{1,4})\s?gb\b/g))
      .map((m) => toNum(m[1]))
      .filter((n): n is number => n !== null);

    for (const num of allGbMatches) {
      // Si está en rango de almacenamiento (32 a 2048) y no tenemos almacenamiento
      if (almacenamiento === null && num >= 32 && num <= 2048 && num !== ram) {
        almacenamiento = num;
      }
      // Si está en rango de RAM (2 a 24) y no tenemos RAM
      else if (ram === null && num >= 2 && num <= 24 && num !== almacenamiento) {
        ram = num;
      }
    }
  }

  // 3. Cámara (MP):
  // Ejemplos: "200 mp", "cámara de 50 mp", "50mp", "108 megapíxeles"
  let camara: number | null = null;
  const camMatch =
    text.match(/cámara\s+(?:principal\s+)?(?:de\s+)?(\d{1,4})\s?(?:mp|megap[ií]xeles)\b/) ||
    text.match(/\b(\d{1,4})\s?(?:mp|megap[ií]xeles)\b/);

  if (camMatch) {
    const val = toNum(camMatch[1]);
    if (val !== null && val > 0 && val <= 500) {
      camara = val;
    }
  }

  // 4. Pantalla (pulgadas):
  // Ejemplos: '6.67"', '6,67"', '6.7 pulgadas', 'pantalla de 6.5"', 'pantalla amoled 6.67 pulg'
  let pantalla: number | null = null;
  const screenMatch =
    text.match(/(\d{1,2}(?:[.,]\d+)?)\s?(?:pulgadas|pulg\b|")/i) ||
    text.match(/pantalla\s+(?:de\s+)?(?:[a-z0-9+-]+\s+)*?(\d{1,2}(?:[.,]\d+)?)/i);

  if (screenMatch) {
    const val = toNum(screenMatch[1]);
    if (val !== null && val >= 3 && val <= 20) {
      pantalla = val;
    }
  }

  // 5. Batería (mAh):
  // Ejemplos: "5000 mah", "5000mah", "batería de 4500 mah", "5000 m"
  let bateria: number | null = null;
  const batMatch =
    text.match(/bater[ií]a\s+(?:de\s+)?(\d{3,5})\s?m(?:ah)?\b/) ||
    text.match(/\b(\d{3,5})\s?mah\b/) ||
    text.match(/\b(\d{4,5})\s?m\b/);

  if (batMatch) {
    const val = toNum(batMatch[1]);
    if (val !== null && val >= 500 && val <= 30000) {
      bateria = val;
    }
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
