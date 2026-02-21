import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Suscribe a los cambios en la colección de productos.
 * @param {function} callback - Función a ejecutar con la lista de productos actualizada.
 * @param {function} onError - Función a ejecutar en caso de error.
 * @returns {function} - Función para desuscribirse.
 */
export const subscribeToProducts = (callback, onError) => {
    return onSnapshot(
        collection(db, "productos"),
        (snapshot) => {
            const products = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            callback(products);
        },
        (error) => {
            console.error("Error en subscribeToProducts:", error);
            if (onError) onError(error);
        }
    );
};

/**
 * Crea un nuevo producto.
 * @param {object} productData - Datos del producto.
 * @returns {Promise<string>} - ID del nuevo producto.
 */
export const createProduct = async (productData) => {
    const docRef = await addDoc(collection(db, "productos"), productData);
    return docRef.id;
};

/**
 * Actualiza un producto existente.
 * @param {string} productId - ID del producto.
 * @param {object} productData - Datos actualizados.
 * @returns {Promise<void>}
 */
export const updateProduct = async (productId, productData) => {
    const productRef = doc(db, "productos", productId);
    await updateDoc(productRef, productData);
};

/**
 * Elimina un producto.
 * @param {string} productId - ID del producto.
 * @returns {Promise<void>}
 */
export const deleteProduct = async (productId) => {
    const productRef = doc(db, "productos", productId);
    await deleteDoc(productRef);
};

/**
 * Busca productos con filtros específicos.
 * @param {object[]} filters - Lista de filtros { field, op, value }.
 * @param {number} limitCount - Límite de resultados.
 * @returns {Promise<object[]>} - Lista de productos encontrados.
 */
export const searchProducts = async (filters = [], limitCount = 20) => {
    const col = collection(db, "productos");
    const queryConstraints = [];

    // Agregar filtros
    filters.forEach(f => {
        queryConstraints.push(where(f.field, f.op, f.value));
    });

    // Agregar ordenamiento y límite
    queryConstraints.push(orderBy("contado", "asc"));
    queryConstraints.push(limit(limitCount));

    const qRef = query(col, ...queryConstraints);
    const snap = await getDocs(qRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};