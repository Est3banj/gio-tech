import type { Product } from '../types';

export const FEATURED_COUNT = 4;

/**
 * Pool de candidatos para el carrusel de la ficha: candidatos del día
 * (rotación diaria) ANTES del shuffle por visita. Chico pero con variedad
 * suficiente para que dos visitas seguidas muestren subconjuntos distintos.
 */
export const RECOMENDADOS_POOL = 12;

/** Cards que muestra la ficha en "También te puede interesar". */
export const RECOMENDADOS_COUNT = 6;

/**
 * Seed numérica por día (YYYYMMDD): la rotación es estable durante todo el día
 * y cambia al día siguiente — el usuario ve variedad sin confusión de "se me
 * movieron los productos a mitad de sesión".
 */
function daySeed(fecha: Date): number {
  return (
    fecha.getFullYear() * 10000 +
    (fecha.getMonth() + 1) * 100 +
    fecha.getDate()
  );
}

/**
 * Hash determinístico FNV-1a: mismo id + mismo día → mismo orden, y el seed
 * diario se mezcla por TODO el string (los ids de Firestore tienen 20 chars,
 * así que dos días distintos producen permutaciones prácticamente distintas).
 */
function hashProductId(id: string, seed: number): number {
  let h = (seed ^ 2166136261) >>> 0;
  for (let i = 0; i < id.length; i++) {
    h = (h ^ id.charCodeAt(i)) >>> 0;
    h = (h * 16777619) >>> 0;
  }
  return h;
}

/**
 * Selecciona los productos destacados de la página de inicio:
 * 1. Rotación diaria determinística sobre TODO el catálogo elegible — mismo
 *    día → la misma lista para todos (consistencia compartida), día nuevo →
 *    lista nueva.
 * 2. El pool es el catálogo completo (deduplicado por id): antes el ranking
 *    de vistas (4 ids fijos) congelaba la sección para siempre y la rotación
 *    solo corría como fallback sin datos de vistas.
 * 3. Nunca duplica y nunca devuelve más de `count` (ni más de los existentes).
 */
export function seleccionarDestacados(
  products: Product[],
  fecha: Date = new Date(),
  count: number = FEATURED_COUNT,
): Product[] {
  const seed = daySeed(fecha);
  const vistos = new Set<string>();
  const pool = products.filter((p) => {
    const id = String(p.id);
    if (vistos.has(id)) return false;
    vistos.add(id);
    return true;
  });

  return [...pool]
    .sort(
      (a, b) =>
        hashProductId(String(a.id), seed) - hashProductId(String(b.id), seed),
    )
    .slice(0, count);
}

/**
 * PRNG mulberry32: convierte la semilla en una secuencia reproducible.
 * (seed >>> 0 no sirve porque la sembra es una fracción de Math.random().)
 */
function mulberry32(seed: number): () => number {
  let a = Math.floor(seed * 4294967295) >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fisher-Yates con PRNG sembrado: misma semilla → mismo orden (estable
 * durante la visita y determinista en tests), semilla distinta → mezcla
 * distinta (cada recarga de la ficha muestra otra cara). No muta la entrada.
 */
export function mezclarPorVisita<T>(items: readonly T[], seed: number): T[] {
  const resultado = [...items];
  const rnd = mulberry32(seed);
  for (let i = resultado.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const tmp = resultado[i];
    resultado[i] = resultado[j];
    resultado[j] = tmp;
  }
  return resultado;
}
