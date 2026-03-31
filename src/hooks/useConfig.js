import { useState, useEffect, useSyncExternalStore } from 'react';
import { subscribeToConfig } from '../services/config.service';

// Store externo para compartir estado entre componentes (singleton pattern)
let configStore = {};
let configListeners = new Set();

function notifyConfigListeners() {
  configListeners.forEach((listener) => listener());
}

const configSubscribe = (listener) => {
  configListeners.add(listener);
  return () => configListeners.delete(listener);
};

/**
 * Hook personalizado para suscribirse a la configuración general desde Firestore.
 * Usa store externo para evitar suscripciones duplicadas.
 * 
 * @returns {{ config: object, isLoading: boolean, error: Error | null }}
 */
export function useConfig() {
  const [config, setConfig] = useState(configStore);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
