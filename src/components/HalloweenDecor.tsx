import React from 'react';

/**
 * Decoración de Halloween v2 — anclada a secciones, NUNCA capa fixed.
 * "Decorar la tienda, no la pantalla": cada pieza vive dentro de la sección
 * que decora (header, hero, footer) con su propio wrapper recortado.
 *
 * - SVG inline propio, sin assets externos/raster.
 * - pointer-events:none + aria-hidden en cada wrapper.
 * - El gateo es 100% CSS (html[data-theme-name="halloween"] en
 *   src/styles/seasonal-decorations.css): sin ese atributo, display:none.
 *   Sin JS gate — el toggle del tema lo controla todo.
 * - Cards y ficha no llevan markup: su micro-detalle es CSS puro
 *   (::after con data-URI) en seasonal-decorations.css.
 */

const CobWeb: React.FC = () => (
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" focusable="false">
    <g fill="none" stroke="currentColor" strokeLinecap="round">
      <g strokeWidth="2.4">
        <path d="M0 0 L198.1 27.8" />
        <path d="M0 0 L178.2 90.8" />
        <path d="M0 0 L138.9 143.9" />
        <path d="M0 0 L84.5 181.3" />
        <path d="M0 0 L20.9 198.9" />
      </g>
      <g strokeWidth="1.7">
        <path d="M49.5 7 Q39.1 12.3 44.6 22.7 Q33 24.4 34.7 36 Q23.2 33.8 21.1 45.3 Q11 39.5 5.2 49.7" />
        <path d="M99 13.9 Q78.2 24.7 89.1 45.4 Q65.9 48.8 69.5 71.9 Q46.4 67.6 42.3 90.6 Q21.9 79 10.5 99.5" />
        <path d="M148.5 20.9 Q117.3 37 133.7 68.1 Q98.9 73.2 104.2 107.9 Q69.7 101.4 63.4 135.9 Q32.9 118.5 15.7 149.2" />
        <path d="M198.1 27.8 Q156.4 49.3 178.2 90.8 Q131.8 97.5 138.9 143.9 Q92.9 135.2 84.5 181.3 Q43.8 158 20.9 198.9" />
      </g>
    </g>
  </svg>
);

const Bat: React.FC = () => (
  <svg viewBox="0 0 120 46" xmlns="http://www.w3.org/2000/svg" focusable="false">
    <g fill="currentColor">
      <path d="M55 16 Q30 4 8 9 Q20 16 26 26 Q34 26 40 34 Q48 32 52 40 L57 32 Z" />
      <path transform="translate(120,0) scale(-1,1)" d="M55 16 Q30 4 8 9 Q20 16 26 26 Q34 26 40 34 Q48 32 52 40 L57 32 Z" />
      <ellipse cx="60" cy="24" rx="5" ry="7.5" />
      <circle cx="60" cy="16" r="4.6" />
      <path d="M56.5 14 L55.5 5 L59.5 11.5 Z" />
      <path d="M63.5 14 L64.5 5 L60.5 11.5 Z" />
    </g>
  </svg>
);

const SpiderOnThread: React.FC = () => (
  <svg viewBox="0 0 60 210" xmlns="http://www.w3.org/2000/svg" focusable="false">
    <line x1="30" y1="0" x2="30" y2="150" stroke="currentColor" strokeWidth="1.2" opacity="0.55" />
    <g transform="translate(30,150)">
      <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
        <path d="M-4 -6 L-13 -14 L-19 -8" />
        <path d="M-5 -2 L-15 -6 L-22 1" />
        <path d="M-5 2 L-15 7 L-21 15" />
        <path d="M-4 6 L-12 14 L-14 22" />
        <path transform="scale(-1,1)" d="M-4 -6 L-13 -14 L-19 -8" />
        <path transform="scale(-1,1)" d="M-5 -2 L-15 -6 L-22 1" />
        <path transform="scale(-1,1)" d="M-5 2 L-15 7 L-21 15" />
        <path transform="scale(-1,1)" d="M-4 6 L-12 14 L-14 22" />
      </g>
      <ellipse cx="0" cy="4" rx="7" ry="9" fill="currentColor" />
      <circle cx="0" cy="-6" r="4.5" fill="currentColor" />
    </g>
  </svg>
);

const Pumpkin: React.FC = () => (
  <svg viewBox="0 0 44 36" xmlns="http://www.w3.org/2000/svg" focusable="false">
    <path d="M21 8 Q20 3 24.5 2 Q26.5 4.5 24 8.5 Z" fill="currentColor" />
    <g fill="currentColor">
      <ellipse cx="22" cy="21" rx="14" ry="12.5" />
      <ellipse cx="12.5" cy="22" rx="9.5" ry="11" />
      <ellipse cx="31.5" cy="22" rx="9.5" ry="11" />
    </g>
    <g className="hd-face" fill="#ff6d00">
      <path d="M15 16 L20 16 L17.5 21 Z" />
      <path d="M24 16 L29 16 L26.5 21 Z" />
      <path d="M15 24 L18.5 26.5 L22 24 L25.5 26.5 L29 24 L27.5 28.8 L16.5 28.8 Z" />
    </g>
  </svg>
);

/**
 * Header: telaraña colgando de la esquina superior izquierda + 1-2 murciélagos.
 * El wrapper es quien recorta (overflow hidden EN EL WRAPPER, nunca en el
 * header completo — rompería el dropdown del buscador y otros).
 */
export const HalloweenHeaderDecor: React.FC = () => (
  <div className="hd-decor hd-header-decor" aria-hidden="true" style={{ pointerEvents: 'none' }}>
    <span className="hd-piece hd-h-web">
      <CobWeb />
    </span>
    <span className="hd-piece hd-h-bat hd-h-bat--1">
      <Bat />
    </span>
    <span className="hd-piece hd-h-bat hd-h-bat--2">
      <Bat />
    </span>
  </div>
);

/**
 * Hero (landing): murciélagos volando dentro de los bounds del hero
 * (wrapper clippeado al hero, detrás del texto) + calabazas apoyadas en el
 * borde inferior, en las esquinas, fuera de los CTAs.
 */
export const HalloweenHeroDecor: React.FC = () => (
  <div className="hd-decor hd-hero-decor" aria-hidden="true" style={{ pointerEvents: 'none' }}>
    <span className="hd-piece hd-hero-bat hd-hero-bat--1">
      <Bat />
    </span>
    <span className="hd-piece hd-hero-bat hd-hero-bat--2">
      <Bat />
    </span>
    <span className="hd-piece hd-hero-bat hd-hero-bat--3">
      <Bat />
    </span>
    <span className="hd-piece hd-hero-pumpkin hd-hero-pumpkin--left">
      <Pumpkin />
    </span>
    <span className="hd-piece hd-hero-pumpkin hd-hero-pumpkin--right">
      <Pumpkin />
    </span>
  </div>
);

/**
 * Footer: 1 araña colgando de un hilo del borde superior, lateral
 * (wrapper clippeado, fuera de las columnas de links).
 */
export const HalloweenFooterDecor: React.FC = () => (
  <div className="hd-decor hd-footer-decor" aria-hidden="true" style={{ pointerEvents: 'none' }}>
    <span className="hd-piece hd-footer-spider">
      <SpiderOnThread />
    </span>
  </div>
);
