import { useContext } from 'react';
import {
  ThemeModeContext,
  type ThemeModeContextType,
  type ThemeMode,
} from '../contexts/theme-mode-context';

/**
 * Hook personalizado para acceder al estado y métodos de Modo Claro / Modo Oscuro.
 * Debe utilizarse dentro de un <ThemeModeProvider>.
 */
export function useThemeMode(): ThemeModeContextType {
  const context = useContext(ThemeModeContext);
  if (!context) {
    throw new Error('useThemeMode debe ser utilizado dentro de un ThemeModeProvider');
  }
  return context;
}

export type { ThemeModeContextType, ThemeMode };
