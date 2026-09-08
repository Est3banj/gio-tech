// src/components/ThemeProvider.tsx
import React, { useEffect, type ReactNode } from 'react';
import { useConfig } from '../hooks/useConfig';
import { DEFAULT_CONFIG } from '../services/config.service';
import type { ThemeConfig } from '../types';

interface ExtendedThemeConfig extends Omit<ThemeConfig, 'start' | 'end'> {
  name?: string;
  start?: { toMillis: () => number } | { seconds: number } | string | number | Date | null;
  end?: { toMillis: () => number } | { seconds: number } | string | number | Date | null;
  assets?: {
    bgUrl?: string;
  };
}

interface ThemeProviderProps {
  children: ReactNode;
}

// Normaliza fechas: soporta Firestore Timestamp, Date, ISO o timestamp numérico
const toMillis = (v: unknown): number | null => {
  if (!v) return null;
  try {
    if (typeof v === 'object' && v !== null) {
      if ('toMillis' in v && typeof (v as { toMillis: () => number }).toMillis === 'function') {
        const ms = (v as { toMillis: () => number }).toMillis();
        return Number.isFinite(ms) ? ms : null;
      }
      if ('seconds' in v && typeof (v as { seconds: number }).seconds === 'number') {
        const ms = (v as { seconds: number }).seconds * 1000;
        return Number.isFinite(ms) ? ms : null;
      }
      if (v instanceof Date) {
        const ms = v.getTime();
        return Number.isFinite(ms) ? ms : null;
      }
    }
    if (typeof v === 'number') {
      return Number.isFinite(v) ? v : null;
    }
    if (typeof v === 'string') {
      const t = Date.parse(v);
      return Number.isFinite(t) ? t : null;
    }
    return null;
  } catch {
    return null;
  }
};

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { config } = useConfig();
  const rawTheme = config?.theme !== undefined && config?.theme !== null ? config.theme : DEFAULT_CONFIG.theme;
  const theme = rawTheme as ExtendedThemeConfig | null;
  const appliedVarsRef = React.useRef<string[]>([]);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    const isExplicitlyDisabled = theme?.enabled === false;

    const vars: Record<string, string> = {
      ...(DEFAULT_CONFIG.theme?.vars || {}),
      ...(theme?.vars || {}),
    };
    const themeName = vars['--theme-name'] || theme?.name || DEFAULT_CONFIG.theme?.vars?.['--theme-name'] || 'valentine';
    const isValentine = themeName === 'valentine';

    const now = Date.now();
    const start = toMillis(theme?.start);
    const end = toMillis(theme?.end);

    let isActive = !isExplicitlyDisabled && Boolean(theme);

    if (isActive) {
      if (!isValentine) {
        if (start && now < start) {
          isActive = false;
        } else if (end && now > end) {
          isActive = false;
        }
      } else {
        if (start && now < start) {
          isActive = false;
        }
      }
    }

    if (!isActive) {
      root.removeAttribute('data-theme-name');
      const allVarsToClean = new Set([
        ...appliedVarsRef.current,
        ...Object.keys(DEFAULT_CONFIG.theme?.vars || {}),
        ...(theme?.vars ? Object.keys(theme.vars) : []),
      ]);
      allVarsToClean.forEach((k) => {
        root.style.removeProperty(k);
      });
      appliedVarsRef.current = [];
      body.style.backgroundImage = '';
      return;
    }

    // Activar tema y setear data-theme-name y variables CSS de forma atómica e idempotente
    root.setAttribute('data-theme-name', String(themeName));

    if (theme?.assets?.bgUrl) {
      body.style.backgroundImage = `url("${theme.assets.bgUrl}")`;
      body.style.backgroundSize = body.style.backgroundSize || 'cover';
      body.style.backgroundPosition = body.style.backgroundPosition || 'center';
      body.style.backgroundRepeat = body.style.backgroundRepeat || 'no-repeat';
    } else {
      body.style.backgroundImage = '';
    }

    const currentVarKeys = Object.keys(vars);
    appliedVarsRef.current.forEach((prevKey) => {
      if (!currentVarKeys.includes(prevKey)) {
        root.style.removeProperty(prevKey);
      }
    });

    currentVarKeys.forEach((k) => {
      const val = vars[k];
      if (val !== undefined) {
        root.style.setProperty(k, val);
      }
    });

    appliedVarsRef.current = currentVarKeys;
  }, [theme]);

  // Limpieza exclusiva al desmontar el componente (unmount)
  useEffect(() => {
    return () => {
      const root = document.documentElement;
      root.removeAttribute('data-theme-name');
      const allVarsToClean = new Set([
        ...appliedVarsRef.current,
        ...Object.keys(DEFAULT_CONFIG.theme?.vars || {}),
      ]);
      allVarsToClean.forEach((k) => {
        root.style.removeProperty(k);
      });
      document.body.style.backgroundImage = '';
    };
  }, []);

  return <>{children}</>;
};

export default ThemeProvider;

