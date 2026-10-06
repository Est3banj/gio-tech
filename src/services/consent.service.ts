// src/services/consent.service.ts
// Persistencia y sincronización del consentimiento de cookies (opt-in).
// Sin elección explícita del usuario NO hay consentimiento: todo queda en false.

export const CONSENT_STORAGE_KEY = 'gio-cookie-consent-v1';

export interface CookieConsent {
  v: 1;
  analytics: boolean;
  marketing: boolean;
  savedAt: string;
}

export type ConsentInput = Pick<CookieConsent, 'analytics' | 'marketing'>;

type ConsentListener = (consent: CookieConsent | null) => void;
type VoidListener = () => void;

const consentListeners = new Set<ConsentListener>();
const preferencesListeners = new Set<VoidListener>();

const canUseStorage = (): boolean =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

/**
 * Devuelve el consentimiento guardado, o null si el usuario nunca eligió.
 */
export const getConsent = (): CookieConsent | null => {
  if (!canUseStorage()) return null;

  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    const candidate = parsed as Partial<CookieConsent>;
    if (
      candidate.v !== 1 ||
      typeof candidate.analytics !== 'boolean' ||
      typeof candidate.marketing !== 'boolean'
    ) {
      return null;
    }

    return {
      v: 1,
      analytics: candidate.analytics,
      marketing: candidate.marketing,
      savedAt: typeof candidate.savedAt === 'string' ? candidate.savedAt : '',
    };
  } catch {
    return null;
  }
};

const notifyConsentListeners = (consent: CookieConsent | null): void => {
  consentListeners.forEach((listener) => {
    try {
      listener(consent);
    } catch (error) {
      console.error('[consent] listener error:', error);
    }
  });
};

/**
 * Guarda la elección del usuario.
 * Si la nueva elección revoca permisos que ya estaban otorgados, recarga la
 * página para descargar los trackers de forma limpia (teardown simple).
 */
export const saveConsent = (input: ConsentInput): CookieConsent => {
  const previous = getConsent();
  const next: CookieConsent = {
    v: 1,
    analytics: input.analytics === true,
    marketing: input.marketing === true,
    savedAt: new Date().toISOString(),
  };

  if (canUseStorage()) {
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.error('[consent] no se pudo persistir la elección:', error);
    }
  }

  notifyConsentListeners(next);

  const revoked =
    previous !== null &&
    ((!next.analytics && previous.analytics) || (!next.marketing && previous.marketing));

  if (revoked && typeof window !== 'undefined' && typeof window.location !== 'undefined') {
    window.location.reload();
  }

  return next;
};

export const hasAnalyticsConsent = (): boolean => getConsent()?.analytics === true;

export const hasMarketingConsent = (): boolean => getConsent()?.marketing === true;

export const hasAnyConsent = (): boolean => getConsent() !== null;

/** Se suscribe a cambios de consentimiento (banner <-> loader). Devuelve el unsubscribe. */
export const subscribeConsent = (listener: ConsentListener): (() => void) => {
  consentListeners.add(listener);
  return () => {
    consentListeners.delete(listener);
  };
};

/** Pide abrir el banner de preferencias (lo escucha CookieConsentBanner). */
export const openCookiePreferences = (): void => {
  preferencesListeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      console.error('[consent] preferences listener error:', error);
    }
  });
};

/** Se suscribe a la petición de abrir preferencias. Devuelve el unsubscribe. */
export const subscribeCookiePreferences = (listener: VoidListener): (() => void) => {
  preferencesListeners.add(listener);
  return () => {
    preferencesListeners.delete(listener);
  };
};
