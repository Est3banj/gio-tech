import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { StoreConfig } from "../types";

export const DEFAULT_CONFIG: StoreConfig = {
  nombre: "GIO TECH",
  telefono: "3223652569",
  whatsappNumber: "3223652569",
  direccion: "Cra. 32 #13 36, Puerto Asís, Putumayo",
  theme: {
    enabled: true,
    start: null,
    end: null,
    vars: {
      '--theme-name': 'valentine',
      '--promo-badge-bg': '#d81b60',
      '--promo-badge-text': '#ffffff',
      '--promo-highlight': 'rgba(216,27,96,.18)',
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
                    const themeName = explicitThemeName || DEFAULT_CONFIG.theme?.vars?.['--theme-name'] || 'valentine';
                    const isExplicitOtherTheme = Boolean(
                        explicitThemeName && explicitThemeName !== 'valentine'
                    );

                    const defaultVars = DEFAULT_CONFIG.theme?.vars || {
                        '--theme-name': 'valentine',
                        '--promo-badge-bg': '#d81b60',
                        '--promo-badge-text': '#ffffff',
                        '--promo-highlight': 'rgba(216,27,96,.18)',
                    };

                    const themeVars = {
                        ...defaultVars,
                        ...(data.theme?.vars || {}),
                        '--theme-name': themeName,
                    };

                    // Si no es otro tema explícito (ej. christmas/halloween), Amor y Amistad se mantiene activo por defecto
                    const isEnabled = isExplicitOtherTheme 
                        ? (data.theme.enabled !== undefined ? Boolean(data.theme.enabled) : true)
                        : true;

                    let startDate = data.theme.start ?? null;
                    let endDate = data.theme.end ?? null;

                    // Si es valentine o tema por defecto, ignoramos fechas expiradas del pasado para garantizar activación
                    if (!isExplicitOtherTheme) {
                        const endMs = parseMillis(endDate);
                        if (endMs && endMs < Date.now()) {
                            startDate = null;
                            endDate = null;
                        }
                    } else if (endDate) {
                        const endMs = parseMillis(endDate);
                        if (endMs && endMs < Date.now()) {
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
