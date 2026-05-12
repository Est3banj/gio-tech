import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  doc, 
  updateDoc, 
  increment, 
  getDoc, 
  setDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import type { ProductStats } from '../types';

/**
 * Registra una vista de producto.
 * Incrementa el contador en Firebase.
 * @param productId - ID del producto visto
 */
export const recordProductView = async (productId: string): Promise<void> => {
  if (!productId) return;
  
  try {
    const statsRef = doc(db, 'producto_stats', productId);
    const docSnap = await getDoc(statsRef);
    
    if (docSnap.exists()) {
      // Ya existe, incrementamos
      await updateDoc(statsRef, {
        vistas: increment(1),
        ultimaVista: new Date()
      });
    } else {
      // Creamos el documento con primera vista
      await setDoc(statsRef, {
        vistas: 1,
        ultimaVista: new Date(),
        productoId: productId
      });
    }
  } catch (error) {
    console.error('Error registrando vista:', error);
  }
};

/**
 * Obtiene los productos más vistos.
 * @param limitCount - Cantidad de productos a retornar
 * @returns Array de stats de productos
 */
export const getPopularProductsStats = async (limitCount = 4): Promise<ProductStats[]> => {
  try {
    const statsRef = collection(db, 'producto_stats');
    const q = query(
      statsRef,
      orderBy('vistas', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      productoId: docSnap.data().productoId || docSnap.id,
      vistas: docSnap.data().vistas || 0,
      ultimaVista: docSnap.data().ultimaVista?.toDate()
    } as ProductStats));
  } catch (error) {
    console.error('Error obteniendo productos populares:', error);
    return [];
  }
};
