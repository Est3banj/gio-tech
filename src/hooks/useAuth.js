import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

/**
 * Hook personalizado para gestionar la autenticación del usuario.
 * Suscribe al estado de auth y obtiene datos adicionales del usuario desde Firestore.
 * 
 * @returns {{ user: object | null, isLoading: boolean }}
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let userUnsub = null;

    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Usuario logueado - obtener datos adicionales de Firestore
        setUser({ uid: currentUser.uid, email: currentUser.email, rol: 'cargando...' });
        
        const userDocRef = doc(db, 'usuarios', currentUser.uid);
        userUnsub = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists() && docSnap.data().rol) {
              setUser((prev) => ({
                ...prev,
                rol: docSnap.data().rol,
                nombreCompleto: docSnap.data().nombreCompleto,
              }));
            } else {
              setUser((prev) => ({ ...prev, rol: 'cliente' }));
            }
            setIsLoading(false);
          },
          (error) => {
            console.error('Error al obtener datos del usuario:', error);
            setUser(null);
            setIsLoading(false);
          }
        );
      } else {
        // No hay usuario logueado
        if (userUnsub) {
          try { userUnsub(); } catch { /* ignore */ }
        }
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      if (userUnsub) {
        try { userUnsub(); } catch { /* ignore */ }
      }
      unsubAuth();
    };
  }, []);

  return { user, isLoading };
}
