import { createContext } from 'react';

export type ThemeMode = 'light' | 'dark';

export interface ThemeModeContextType {
  mode: ThemeMode;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

export const ThemeModeContext = createContext<ThemeModeContextType | undefined>(undefined);
