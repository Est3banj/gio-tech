import { useSyncExternalStore } from 'react';
import { subscribeToProducts } from '../services/product.service';
import type { Product } from '../types';

export interface UseProductsReturn {
  products: Product[];
  isLoading: boolean;
  error: Error | null;
}

let storeState: UseProductsReturn = {
  products: [],
  isLoading: true,
  error: null,
};

let activeUnsubscribe: (() => void) | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  if (listeners.size === 1) {
    activeUnsubscribe = subscribeToProducts(
      (lista) => {
        storeState = {
          products: lista,
          isLoading: false,
          error: null,
        };
        notify();
      },
      (err) => {
        console.error('Error en useProducts:', err);
        storeState = {
          ...storeState,
          isLoading: false,
          error: err,
        };
        notify();
      }
    );
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && activeUnsubscribe) {
      activeUnsubscribe();
      activeUnsubscribe = null;
    }
  };
}

function getSnapshot(): UseProductsReturn {
  return storeState;
}

/**
 * Hook personalizado para suscribirse a la lista de productos desde Firestore.
 * Usa store externo con useSyncExternalStore para compartir suscripción y estado.
 */
export function useProducts(): UseProductsReturn {
  return useSyncExternalStore(subscribe, getSnapshot);
}
