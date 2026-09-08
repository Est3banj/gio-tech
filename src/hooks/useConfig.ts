import { useSyncExternalStore } from 'react';
import { subscribeToConfig, DEFAULT_CONFIG } from '../services/config.service';
import type { StoreConfig } from '../types';

export interface UseConfigReturn {
  config: StoreConfig;
  isLoading: boolean;
  error: Error | null;
}

let storeState: UseConfigReturn = {
  config: DEFAULT_CONFIG,
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
    activeUnsubscribe = subscribeToConfig(
      (data) => {
        storeState = {
          config: data || DEFAULT_CONFIG,
          isLoading: false,
          error: null,
        };
        notify();
      },
      (err) => {
        console.error('Error en useConfig:', err);
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

function getSnapshot(): UseConfigReturn {
  return storeState;
}

/**
 * Hook personalizado para suscribirse a la configuración general desde Firestore.
 * Usa store externo con useSyncExternalStore para compartir suscripción y estado.
 */
export function useConfig(): UseConfigReturn {
  return useSyncExternalStore(subscribe, getSnapshot);
}
