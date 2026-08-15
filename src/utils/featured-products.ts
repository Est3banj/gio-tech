import type { Product } from '../types';

export const FEATURED_COUNT = 4;

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
 * 1. Respeta el ranking real de vistas (popularIds) en el orden del backend.
 * 2. Si faltan productos para completar el cupo, los llena con una rotación
 *    diaria determinística — evita el fallback estático de "primeros 4 del
 *    catálogo" que congelaba la sección para siempre.
 * 3. Nunca duplica y nunca devuelve más de `count` (ni más de los existentes).
 */
export function seleccionarDestacados(
  products: Product[],
  popularIds: string[],
  fecha: Date = new Date(),
  count: number = FEATURED_COUNT,
): Product[] {
  const destacados: Product[] = [];
  const yaIncluidos = new Set<string>();

  for (const id of popularIds) {
    if (destacados.length >= count) break;
    const producto = products.find((p) => p.id === id);
    if (producto && !yaIncluidos.has(producto.id)) {
      destacados.push(producto);
      yaIncluidos.add(producto.id);
    }
  }

  if (destacados.length < count) {
    const seed = daySeed(fecha);
    const rotativos = [...products]
      .filter((p) => !yaIncluidos.has(p.id))
      .sort((a, b) => hashProductId(a.id, seed) - hashProductId(b.id, seed));

    for (const producto of rotativos) {
      if (destacados.length >= count) break;
      destacados.push(producto);
      yaIncluidos.add(producto.id);
    }
  }

  return destacados;
}
