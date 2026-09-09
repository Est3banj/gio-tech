import { useContext } from 'react';
import { AuthContext, type AuthContextType } from '../contexts/auth-context';

/**
 * Hook personalizado para acceder al estado y métodos de autenticación centralizados.
 * Debe utilizarse dentro de un <AuthProvider>.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}

export type { AuthContextType };
