import { 
  doc,
  updateDoc,
  increment,
  getDoc,
  setDoc 
} from 'firebase/firestore';
import { db } from '../firebase';

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

