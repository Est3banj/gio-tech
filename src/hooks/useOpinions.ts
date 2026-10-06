import { useSyncExternalStore } from "react";
import { OPINIONES_MAX_PUBLICAS, subscribeToOpiniones } from "../services/opinion.service";
import type { Opinion } from "../types";

export interface UseOpinionsReturn {
  /** Solo opiniones activas, más recientes primero, tope para la home. */
  opinions: Opinion[];
  isLoading: boolean;
  error: Error | null;
}

let storeState: UseOpinionsReturn = {
  opinions: [],
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
    activeUnsubscribe = subscribeToOpiniones(
      (lista) => {
        storeState = {
          opinions: lista.filter((o) => o.activo).slice(0, OPINIONES_MAX_PUBLICAS),
          isLoading: false,
          error: null,
        };
        notify();
      },
      (err) => {
        console.error("Error en useOpinions:", err);
        storeState = {
          opinions: [],
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

function getSnapshot(): UseOpinionsReturn {
  return storeState;
}

/**
 * Hook de opiniones para la home: store externo compartido con
 * useSyncExternalStore (mismo patrón que useProducts).
 */
export function useOpinions(): UseOpinionsReturn {
  return useSyncExternalStore(subscribe, getSnapshot);
}
