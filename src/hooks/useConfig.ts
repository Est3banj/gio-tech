import { useState, useEffect, useSyncExternalStore } from 'react';
import { subscribeToConfig } from '../services/config.service';
import type { StoreConfig } from '../types';

// Store externo para compartir estado entre componentes (singleton pattern)
let configStore: StoreConfig = {};
let configListeners = new Set<() => void>();

function notifyConfigListeners(): void {
  configListeners.forEach((listener) => listener());
}

const configSubscribe = (listener: () => void): (() => boolean) => {
  configListeners.add(listener);
  return () => configListeners.delete(listener);
};

interface UseConfigReturn {
  config: StoreConfig;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook personalizado para suscribirse a la configuración general desde Firestore.
 * Usa store externo para evitar suscripciones duplicadas.
 */
export function useConfig(): UseConfigReturn {
  const [config, setConfig] = useState<StoreConfig>(configStore);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Sincronizar con store externo
  useSyncExternalStore(configSubscribe, () => configStore);

  useEffect(() => {
    // Si ya hay datos en el store, no cargar de nuevo
    if (Object.keys(configStore).length > 0) {
      setConfig(configStore);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToConfig(
      (data) => {
        configStore = data || {};
        setConfig(configStore);
        setIsLoading(false);
        notifyConfigListeners();
      },
      (err) => {
        console.error('Error en useConfig:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { config, isLoading, error };
}
