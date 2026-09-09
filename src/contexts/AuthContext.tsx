import { useState, useEffect, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import type { User, UserRole } from '../types';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let userDocUnsub: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(
      auth,
      (currentUser) => {
        if (userDocUnsub) {
          try {
            userDocUnsub();
          } catch {
            /* ignore */
          }
          userDocUnsub = null;
        }

        if (currentUser) {
          const userDocRef = doc(db, 'usuarios', currentUser.uid);
          userDocUnsub = onSnapshot(
            userDocRef,
            (docSnap) => {
              if (docSnap.exists()) {
                const data = docSnap.data();
                const validRoles: UserRole[] = ['admin', 'asesor', 'cliente'];
                const userRol: UserRole = validRoles.includes(data.rol as UserRole)
                  ? (data.rol as UserRole)
                  : 'cliente';

                setUser({
                  uid: currentUser.uid,
                  email: currentUser.email || '',
                  rol: userRol,
                  nombreCompleto: data.nombreCompleto || currentUser.displayName || undefined,
                  whatsappNumber: data.whatsappNumber || undefined,
                  fechaCreacion: data.fechaCreacion
                    ? typeof data.fechaCreacion.toDate === 'function'
                      ? data.fechaCreacion.toDate()
                      : new Date(data.fechaCreacion)
                    : undefined,
                });
              } else {
                setUser({
                  uid: currentUser.uid,
                  email: currentUser.email || '',
                  rol: 'cliente',
                });
              }
              setLoading(false);
            },
            (snapshotError) => {
              console.error('Error al obtener datos del usuario desde Firestore:', snapshotError);
              setUser({
                uid: currentUser.uid,
                email: currentUser.email || '',
                rol: 'cliente',
              });
              setLoading(false);
            }
          );
        } else {
          setUser(null);
          setLoading(false);
        }
      },
      (authError) => {
        console.error('Error en onAuthStateChanged:', authError);
        setError(authError.message);
        setLoading(false);
      }
    );

    return () => {
      if (userDocUnsub) {
        try {
          userDocUnsub();
        } catch {
          /* ignore */
        }
      }
      unsubAuth();
    };
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean = true): Promise<void> => {
    setError(null);
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: unknown) {
      const fbErr = err as { code?: string; message?: string };
      setError(fbErr.message || 'Error al iniciar sesión');
      throw err;
    }
  };

  const logout = async (): Promise<void> => {
    setError(null);
    try {
      await signOut(auth);
      setUser(null);
    } catch (err: unknown) {
      const fbErr = err as { code?: string; message?: string };
      setError(fbErr.message || 'Error al cerrar sesión');
      throw err;
    }
  };

  const role: UserRole | null = user?.rol || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        isLoading: loading,
        error,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext } from './auth-context';
export type { AuthContextType } from './auth-context';
