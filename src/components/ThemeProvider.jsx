import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

// Normaliza fechas: soporta Firestore Timestamp o ISO/string
const toMillis = (v) => {
  if (!v) return null;
  try {
    if (typeof v?.toMillis === 'function') return v.toMillis();
    const t = +new Date(v);
    return Number.isFinite(t) ? t : null;
  } catch {
    return null;
  }
};

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'configuracion', 'general'), (snap) => {
      setTheme(snap.data()?.theme || null);
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
    // Aplica nombre de tema como data-attr (útil para CSS específicos)
    const prevThemeName = root.getAttribute('data-theme-name') || '';
    if (theme.name) root.setAttribute('data-theme-name', String(theme.name));
    // Fondo opcional desde assets.bgUrl (si lo definiste en el panel)
    const body = document.body;
    const prevBg = body.style.backgroundImage;
    if (theme.assets?.bgUrl) {
      body.style.backgroundImage = `url("${theme.assets.bgUrl}")`;
      body.style.backgroundSize = body.style.backgroundSize || 'cover';
      body.style.backgroundPosition = body.style.backgroundPosition || 'center';
      body.style.backgroundRepeat = body.style.backgroundRepeat || 'no-repeat';
    }
    const prev = {};
    const vars = theme.vars || {};

    // Extraer el nombre del tema desde las variables CSS si existe
    const themeName = vars['--theme-name'] || theme.name || '';

    Object.keys(vars).forEach(k => {
      prev[k] = root.style.getPropertyValue(k);
      root.style.setProperty(k, vars[k]);
    });

    // Aplicar el nombre del tema como data-attribute
    if (themeName) {
      root.setAttribute('data-theme-name', String(themeName));
    }

    return () => {
      // Limpia nombre de tema y fondo de body
      if (prevThemeName) root.setAttribute('data-theme-name', prevThemeName);
      else root.removeAttribute('data-theme-name');
      body.style.backgroundImage = prevBg || '';
      Object.keys(vars).forEach(k => root.style.setProperty(k, prev[k] || ''));
    };
  }, [theme]);

  return children;
}