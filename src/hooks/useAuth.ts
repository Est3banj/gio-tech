import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import type { User } from '../types';

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
}

/**
 * Hook personalizado para gestionar la autenticación del usuario.
 * Suscribe al estado de auth y obtiene datos adicionales del usuario desde Firestore.
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let userUnsub: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser({ 
          uid: currentUser.uid, 
          email: currentUser.email || '', 
          rol: 'cargando' 
        });
        
        const userDocRef = doc(db, 'usuarios', currentUser.uid);
        userUnsub = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists() && docSnap.data().rol) {
              setUser((prev) => prev ? ({
                ...prev,
                rol: docSnap.data().rol,
                nombreCompleto: docSnap.data().nombreCompleto,
              }) : null);
            } else {
              setUser((prev) => prev ? { ...prev, rol: 'cliente' } : null);
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
