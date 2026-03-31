import { useState, useEffect, useSyncExternalStore } from 'react';
import { subscribeToProducts } from '../services/product.service';

// Store externo para compartir estado entre componentes (singleton pattern)
let productsStore = [];
let productsListeners = new Set();

function notifyProductsListeners() {
  productsListeners.forEach((listener) => listener());
}

const productsSubscribe = (listener) => {
  productsListeners.add(listener);
  return () => productsListeners.delete(listener);
};

/**
 * Hook personalizado para suscribirse a la lista de productos desde Firestore.
 * Usa store externo para evitar suscripciones duplicadas.
 * 
 * @returns {{ products: object[], isLoading: boolean, error: Error | null }}
 */
export function useProducts() {
  const [products, setProducts] = useState(productsStore);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
