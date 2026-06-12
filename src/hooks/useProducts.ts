import { useState, useEffect, useSyncExternalStore } from 'react';
import { subscribeToProducts } from '../services/product.service';
import type { Product } from '../types';

// Store externo para compartir estado entre componentes (singleton pattern)
let productsStore: Product[] = [];
const productsListeners = new Set<() => void>();

function notifyProductsListeners(): void {
  productsListeners.forEach((listener) => listener());
}

const productsSubscribe = (listener: () => void): (() => boolean) => {
  productsListeners.add(listener);
  return () => productsListeners.delete(listener);
};

interface UseProductsReturn {
  products: Product[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook personalizado para suscribirse a la lista de productos desde Firestore.
 * Usa store externo para evitar suscripciones duplicadas.
 */
export function useProducts(): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>(productsStore);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Sincronizar con store externo
  useSyncExternalStore(productsSubscribe, () => productsStore);

  useEffect(() => {
    // Si ya hay datos en el store, no cargar de nuevo
    if (productsStore.length > 0) {
      setProducts(productsStore);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToProducts(
      (lista) => {
        productsStore = lista;
        setProducts(lista);
        setIsLoading(false);
        notifyProductsListeners();
      },
      (err) => {
        console.error('Error en useProducts:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { products, isLoading, error };
}
