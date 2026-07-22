// src/utils/product-matcher.ts
// Extrae productos mencionados en texto usando Fuse.js (fuzzy matching)
import Fuse from 'fuse.js';
import type { Product } from '../types';

export interface MatchedProduct {
  product: Product;
  /** Fuse.js score (lower = better match, 0 = perfect) */
  score: number;
}

export interface MatcherOptions {
  /** Fuse.js threshold: 0.0 (strict) to 1.0 (muy permisivo). Default: 0.4 */
  threshold?: number;
  /** Máximo de productos a retornar por llamada. Default: 5 */
  limit?: number;
}

const defaultOptions: Required<MatcherOptions> = {
  threshold: 0.4,
  limit: 5,
};

/**
 * Dado el texto de respuesta del asistente y el catálogo de productos,
 * devuelve los productos que fueron mencionados (fuzzy matching).
 *
 * Estrategia: divide el texto en ventanas deslizantes de palabras (1 a 5 tokens)
 * y busca cada ventana contra el catálogo con Fuse.js.
 * Esto funciona mejor que pasar el texto completo como query porque
 * Fuse.js busca patrones cortos, no frases largas.
 */
export function extractMatchedProducts(
  text: string,
  products: Product[],
  options?: MatcherOptions,
): MatchedProduct[] {
  const { threshold, limit } = { ...defaultOptions, ...options };

  if (!text || !products || products.length === 0) {
    return [];
  }

  const fuse = new Fuse(products, {
    keys: [
      { name: 'nombre', weight: 0.6 },
      { name: 'marca', weight: 0.3 },
      { name: 'modelo', weight: 0.1 },
    ],
    threshold,
    includeScore: true,
    minMatchCharLength: 3,
  });

  // Separar en palabras y generar ventanas deslizantes de 1 a 5 palabras
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const seen = new Map<string, MatchedProduct>();

  for (let i = 0; i < words.length; i++) {
    // Probar ventanas de 1 a 5 palabras
    const maxLen = Math.min(5, words.length - i);
    for (let len = 1; len <= maxLen; len++) {
      const phrase = words.slice(i, i + len).join(' ');
      // Ignorar frases muy cortas (menos de 5 caracteres)
      if (phrase.length < 5) continue;

      const results = fuse.search(phrase);
      for (const result of results) {
        const id = result.item.id;
        const score = result.score ?? 1;
        const current = seen.get(id);
        // Quedarse con el mejor score (más bajo)
        if (!current || current.score > score) {
          seen.set(id, { product: result.item, score });
        }
      }
    }
  }

  // Ordenar por score (mejor primero) y limitar
  return Array.from(seen.values())
    .sort((a, b) => a.score - b.score)
    .slice(0, limit);
}
