// src/components/ThemeProvider.tsx
import React, { useEffect, useState, type ReactNode } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

interface ThemeConfig {
  enabled?: boolean;
  name?: string;
  start?: { toMillis: () => number } | string | number;
  end?: { toMillis: () => number } | string | number;
  assets?: {
    bgUrl?: string;
  };
  vars?: Record<string, string>;
}

interface ThemeProviderProps {
  children: ReactNode;
}

// Normaliza fechas: soporta Firestore Timestamp o ISO/string
const toMillis = (v: ThemeConfig['start']): number | null => {
  if (!v) return null;
  try {
    if (typeof v === 'object' && 'toMillis' in v && typeof v.toMillis === 'function') {
      return v.toMillis();
    }
    const t = +new Date(v as string | number);
    return Number.isFinite(t) ? t : null;
  } catch {
    return null;
  }
};

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeConfig | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'configuracion', 'general'), (snap) => {
      setTheme(snap.data() as ThemeConfig || null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!theme?.enabled) return;
    const now = Date.now();
    const start = toMillis(theme.start);
    const end = toMillis(theme.end);
    if (start && now < start) return;
    if (end && now > end) return;

    const root = document.documentElement;
    const prevThemeName = root.getAttribute('data-theme-name') || '';
    if (theme.name) root.setAttribute('data-theme-name', String(theme.name));
    
    const body = document.body;
    const prevBg = body.style.backgroundImage;
    if (theme.assets?.bgUrl) {
      body.style.backgroundImage = `url("${theme.assets.bgUrl}")`;
      body.style.backgroundSize = body.style.backgroundSize || 'cover';
      body.style.backgroundPosition = body.style.backgroundPosition || 'center';
      body.style.backgroundRepeat = body.style.backgroundRepeat || 'no-repeat';
    }
    
    const prev: Record<string, string> = {};
    const vars = theme.vars || {};
    const themeName = vars['--theme-name'] || theme.name || '';

    Object.keys(vars).forEach(k => {
      prev[k] = root.style.getPropertyValue(k);
      root.style.setProperty(k, vars[k]);
    });

    if (themeName) {
      root.setAttribute('data-theme-name', String(themeName));
    }

    return () => {
      if (prevThemeName) root.setAttribute('data-theme-name', prevThemeName);
      else root.removeAttribute('data-theme-name');
      body.style.backgroundImage = prevBg || '';
      Object.keys(vars).forEach(k => root.style.setProperty(k, prev[k] || ''));
    };
  }, [theme]);

  return <>{children}</>;
};

export default ThemeProvider;
