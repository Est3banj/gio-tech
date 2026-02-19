import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Suscribe a los cambios en la configuración general.
 * @param {function} callback - Función que recibe la data de configuración.
 * @param {function} onError - Función de error opcional.
 * @returns {function} - Unsubscribe function.
 */
export const subscribeToConfig = (callback, onError) => {
    return onSnapshot(
        doc(db, "configuracion", "general"),
        (docSnap) => {
            if (docSnap.exists()) {
                callback(docSnap.data());
            } else {
                // Opción: llamar con null o un objeto vacío si no existe
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
 * @param {object} configData - Datos de la configuración.
 * @returns {Promise<void>}
 */
export const updateConfig = async (configData) => {
    await setDoc(doc(db, "configuracion", "general"), configData, { merge: true });
};
