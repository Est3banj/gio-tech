import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { StoreConfig } from "../types";

export const DEFAULT_CONFIG: StoreConfig = {
  nombre: "GIO TECH",
  telefono: "3223652569",
  whatsappNumber: "3223652569",
  direccion: "Cra. 32 #13 36, Puerto Asís, Putumayo",
  theme: {
    enabled: false,
    start: null,
    end: null,
    vars: {
      '--theme-name': 'standard',
    },
  },
};

const parseMillis = (v: unknown): number | null => {
  if (!v) return null;
  try {
    if (typeof v === 'object' && v !== null) {
      if ('toMillis' in v && typeof (v as { toMillis: () => number }).toMillis === 'function') {
        const ms = (v as { toMillis: () => number }).toMillis();
        return Number.isFinite(ms) ? ms : null;
      }
      if ('seconds' in v && typeof (v as { seconds: number }).seconds === 'number') {
        const ms = (v as { seconds: number }).seconds * 1000;
        return Number.isFinite(ms) ? ms : null;
      }
      if (v instanceof Date) {
        const ms = v.getTime();
        return Number.isFinite(ms) ? ms : null;
      }
    }
    if (typeof v === 'number') {
      return Number.isFinite(v) ? v : null;
    }
    if (typeof v === 'string') {
      const ms = Date.parse(v);
      return Number.isFinite(ms) ? ms : null;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Suscribe a los cambios en la configuración general.
 * @param callback - Función que recibe la data de configuración.
 * @param onError - Función de error opcional.
 * @returns Unsubscribe function.
 */
export const subscribeToConfig = (
  callback: (config: StoreConfig) => void, 
  onError?: (error: Error) => void
): (() => void) => {
    return onSnapshot(
        doc(db, "configuracion", "general"),
        (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data() as StoreConfig;
                let mergedTheme = DEFAULT_CONFIG.theme;
                if (data.theme !== undefined && data.theme !== null) {
                    const explicitThemeName = data.theme.vars?.['--theme-name'] || (data.theme as { name?: string })?.name;
                    const themeName = explicitThemeName || DEFAULT_CONFIG.theme?.vars?.['--theme-name'] || 'standard';

                    const defaultVars = DEFAULT_CONFIG.theme?.vars || {
                        '--theme-name': 'standard',
                    };

                    const themeVars = {
                        ...defaultVars,
                        ...(data.theme?.vars || {}),
                        '--theme-name': themeName,
                    };

                    // Respetar explícitamente el estado de habilitación de tema (enabled: false debe desactivar inmediatamente)
                    let isEnabled = data.theme.enabled !== undefined
                        ? Boolean(data.theme.enabled)
                        : (DEFAULT_CONFIG.theme?.enabled ?? false);

                    if (themeName === 'standard') {
                        isEnabled = false;
                    }

                    let startDate = data.theme.start ?? null;
                    let endDate = data.theme.end ?? null;

                    // Si las fechas ya expiraron
                    if (endDate) {
                        const endMs = parseMillis(endDate);
                        if (endMs && endMs < Date.now() && data.theme.enabled === undefined) {
                            isEnabled = false;
                            startDate = null;
                            endDate = null;
                        }
                    }

                    mergedTheme = {
                        ...DEFAULT_CONFIG.theme,
                        ...data.theme,
                        enabled: isEnabled,
                        start: startDate,
                        end: endDate,
                        vars: themeVars,
                    };
                }
                callback({
                    ...DEFAULT_CONFIG,
                    ...data,
                    theme: mergedTheme,
                });
            } else {
                callback(DEFAULT_CONFIG);
            }
        },
        (error) => {
            console.error("Error en subscribeToConfig:", error);
            if (onError) onError(error);
        }
    );
};

/**
 * Actualiza la configuración general.
 * @param configData - Datos de la configuración.
 * @returns Promise<void>
 */
export const updateConfig = async (configData: Partial<StoreConfig>): Promise<void> => {
    await setDoc(doc(db, "configuracion", "general"), configData, { merge: true });
};
