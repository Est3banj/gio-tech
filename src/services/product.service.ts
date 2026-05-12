import { 
  collection, 
  onSnapshot, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  QueryConstraint 
} from "firebase/firestore";
import { db } from "../firebase";
import type { Product } from "../types";

/**
 * Suscribe a los cambios en la colección de productos.
 * @param callback - Función a ejecutar con la lista de productos actualizada.
 * @param onError - Función a ejecutar en caso de error.
 * @returns Función para desuscribirse.
 */
export const subscribeToProducts = (
  callback: (products: Product[]) => void, 
  onError?: (error: Error) => void
): (() => void) => {
    return onSnapshot(
        collection(db, "productos"),
        (snapshot) => {
            const products = snapshot.docs.map((docSnap) => ({ 
              id: docSnap.id, 
              ...docSnap.data() 
            } as Product));
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
 * @param productData - Datos del producto.
 * @returns ID del nuevo producto.
 */
export const createProduct = async (productData: Omit<Product, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, "productos"), productData);
    return docRef.id;
};

/**
 * Actualiza un producto existente.
 * @param productId - ID del producto.
 * @param productData - Datos actualizados.
 * @returns Promise<void>
 */
export const updateProduct = async (
  productId: string, 
  productData: Partial<Product>
): Promise<void> => {
    const productRef = doc(db, "productos", productId);
    await updateDoc(productRef, productData);
};

/**
 * Elimina un producto.
 * @param productId - ID del producto.
 * @returns Promise<void>
 */
export const deleteProduct = async (productId: string): Promise<void> => {
    const productRef = doc(db, "productos", productId);
    await deleteDoc(productRef);
};

/**
 * Filtro para búsqueda de productos.
 */
export interface ProductFilter {
  field: string;
  op: '==' | '!=' | '<' | '<=' | '>' | '>=';
  value: unknown;
}

/**
 * Busca productos con filtros específicos.
 * @param filters - Lista de filtros { field, op, value }.
 * @param limitCount - Límite de resultados.
 * @returns Lista de productos encontrados.
 */
export const searchProducts = async (
  filters: ProductFilter[] = [], 
  limitCount = 20
): Promise<Product[]> => {
    const col = collection(db, "productos");
    const queryConstraints: QueryConstraint[] = [];

    // Agregar filtros
    filters.forEach(f => {
        queryConstraints.push(where(f.field, f.op, f.value));
    });

    // Agregar ordenamiento y límite
    queryConstraints.push(orderBy("contado", "asc"));
    queryConstraints.push(limit(limitCount));

    const qRef = query(col, ...queryConstraints);
    const snap = await getDocs(qRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
};
