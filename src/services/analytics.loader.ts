// src/services/analytics.loader.ts
// Carga condicional de trackers según el consentimiento guardado (opt-in).
// Nunca se pide red a Google/Meta si el usuario no lo autorizó.

import { getConsent, subscribeConsent } from './consent.service';

export const GA4_MEASUREMENT_ID = 'G-1KGCQBPN75';
export const META_PIXEL_ID = '939199705550194';

const META_PIXEL_SRC = 'https://connect.facebook.net/en_US/fbevents.js';

// Snippet oficial de Meta Pixel: define el stub de fbq (con cola) y carga la librería.
const META_PIXEL_SNIPPET = [
  "!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?",
  'n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;',
  'n.push=n;n.loaded=!0;n.version=\'2.0\';n.queue=[];t=b.createElement(e);t.async=!0;',
  't.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}',
  `(window,document,'script','${META_PIXEL_SRC}');`,
].join('');

type GtagFn = (...args: unknown[]) => void;
type FbqFn = (...args: unknown[]) => void;

interface AnalyticsGlobals {
  dataLayer?: unknown[];
  gtag?: GtagFn;
  fbq?: FbqFn;
  _fbq?: FbqFn;
}

// Evita declarar `gtag`/`fbq` en Window: src/utils/metaPixel.ts ya lo hace.
const globals = (): AnalyticsGlobals => window as unknown as AnalyticsGlobals;

let gtagLoaded = false;
let metaLoaded = false;
let started = false;

/**
 * Stub SIEMPRE presente de dataLayer + gtag (cola).
 * Así las llamadas existentes (trackLead) no explotan aunque el script no se cargue.
 */
const ensureGtagStub = (): GtagFn => {
  const w = globals();
  if (!Array.isArray(w.dataLayer)) {
    w.dataLayer = [];
  }
  if (typeof w.gtag !== 'function') {
    const queue = w.dataLayer;
    w.gtag = function () {
      // Stub canónico de Google: debe pushear el objeto `arguments`, no un array.
      // eslint-disable-next-line prefer-rest-params
      queue.push(arguments);
    };
  }
  return w.gtag as GtagFn;
};

const loadGtag = (): void => {
  if (gtagLoaded) return;
  gtagLoaded = true;

  const gtag = ensureGtagStub();

  // Google Consent Mode v2: denied por defecto, granted solo para analytics.
  gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  gtag('consent', 'update', { analytics_storage: 'granted' });
  gtag('js', new Date());
  gtag('config', GA4_MEASUREMENT_ID);
};

const loadMetaPixel = (): void => {
  if (metaLoaded) return;
  metaLoaded = true;

  const w = globals();

  if (typeof w.fbq !== 'function') {
    const script = document.createElement('script');
    script.textContent = META_PIXEL_SNIPPET;
    document.head.appendChild(script);
  }

  if (typeof w.fbq !== 'function') return;

  w.fbq('init', META_PIXEL_ID);
  w.fbq('consent', 'grant');
  w.fbq('track', 'PageView');
};

/** Carga únicamente los trackers autorizados. Idempotente. */
export const applyConsent = (): void => {
  const consent = getConsent();
  if (consent?.analytics) loadGtag();
  if (consent?.marketing) loadMetaPixel();
};

/**
 * Arranque: stub de gtag siempre + trackers según consentimiento guardado.
 * Se suscribe a cambios para cargar trackers recién otorgados sin recargar.
 */
export const initAnalytics = (): void => {
  if (started || typeof window === 'undefined') return;
  started = true;

  ensureGtagStub();
  applyConsent();
  subscribeConsent(() => applyConsent());
};
