import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { StoreConfig } from "../types";

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
                callback(docSnap.data() as StoreConfig);
            } else {
                callback({});
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
