import React, { useState, useEffect, type ReactNode } from 'react';
import {
  ThemeModeContext,
  type ThemeMode,
  type ThemeModeContextType,
} from './theme-mode-context';

export interface ThemeModeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
}

const getInitialTheme = (defaultFallback?: ThemeMode): ThemeMode => {
  if (typeof window === 'undefined') return defaultFallback || 'light';

  try {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme;
    }
  } catch {
    // ignore localStorage read error
  }

  if (defaultFallback) return defaultFallback;

  if (typeof window.matchMedia === 'function') {
    try {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    } catch {
      // ignore matchMedia error
    }
  }

  return 'light';
};

export const ThemeModeProvider: React.FC<ThemeModeProviderProps> = ({
  children,
  defaultMode,
}) => {
  const [mode, setMode] = useState<ThemeMode>(() => getInitialTheme(defaultMode));

  // Sincronización del DOM (document.body classList) y persistencia en localStorage
  useEffect(() => {
    const isDark = mode === 'dark';
    if (typeof document !== 'undefined' && document.body) {
      document.body.classList.toggle('dark-mode', isDark);
    }
    try {
      localStorage.setItem('theme', mode);
    } catch {
      // ignore localStorage write error
    }
  }, [mode]);

  // Sincronización multi-pestaña y respuesta a cambios de preferencia del sistema
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Listener multi-pestaña
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'theme' && event.newValue) {
        if (event.newValue === 'dark' || event.newValue === 'light') {
          setMode(event.newValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Listener de cambios del SO (solo si no hay preferencia manual forzada en localStorage)
    let mediaQuery: MediaQueryList | null = null;
    const handleSystemThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
      try {
        const saved = localStorage.getItem('theme');
        // Si no hay preferencia guardada por el usuario, reaccionamos al sistema
        if (!saved) {
          setMode(e.matches ? 'dark' : 'light');
        }
      } catch {
        // ignore
      }
    };

    if (typeof window.matchMedia === 'function') {
      try {
        mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        if (typeof mediaQuery.addEventListener === 'function') {
          mediaQuery.addEventListener('change', handleSystemThemeChange);
        } else if ('addListener' in mediaQuery && typeof (mediaQuery as { addListener: unknown }).addListener === 'function') {
          (mediaQuery as unknown as { addListener: (cb: (e: MediaQueryList) => void) => void }).addListener(handleSystemThemeChange);
        }
      } catch {
        // ignore
      }
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (mediaQuery) {
        if (typeof mediaQuery.removeEventListener === 'function') {
          mediaQuery.removeEventListener('change', handleSystemThemeChange);
        } else if ('removeListener' in mediaQuery && typeof (mediaQuery as { removeListener: unknown }).removeListener === 'function') {
          (mediaQuery as unknown as { removeListener: (cb: (e: MediaQueryList) => void) => void }).removeListener(handleSystemThemeChange);
        }
      }
    };
  }, []);

  const toggleTheme = () => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setThemeMode = (newMode: ThemeMode) => {
    setMode(newMode);
  };

  const isDarkMode = mode === 'dark';

  return (
    <ThemeModeContext.Provider
      value={{
        mode,
        isDarkMode,
        toggleTheme,
        setThemeMode,
      }}
    >
      {children}
    </ThemeModeContext.Provider>
  );
};

export { ThemeModeContext } from './theme-mode-context';
export type { ThemeMode, ThemeModeContextType } from './theme-mode-context';
export default ThemeModeProvider;
