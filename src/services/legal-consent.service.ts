// src/services/legal-consent.service.ts
// Registro persistente de la autorización de tratamiento de datos personales
// (Ley 1581/2012): qué formulario, cuándo y con qué versión de políticas.

import { POLICY_VERSION } from '../data/legal-copy';

export const LEGAL_CONSENT_STORAGE_KEY = 'gio-legal-consent-v1';

export type LegalConsentForm = 'checkout' | 'credit' | 'service';

export interface LegalConsentRecord {
  form: LegalConsentForm;
  acceptedAt: string;
  policyVersion: string;
}

const canUseStorage = (): boolean =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const isLegalConsentForm = (value: unknown): value is LegalConsentForm =>
  value === 'checkout' || value === 'credit' || value === 'service';

/**
 * Devuelve el historial de autorizaciones registradas (vacío si no hay nada).
 */
export const getLegalConsentRecords = (): LegalConsentRecord[] => {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(LEGAL_CONSENT_STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is LegalConsentRecord => {
      if (!item || typeof item !== 'object') return false;
      const candidate = item as Partial<LegalConsentRecord>;
      return (
        isLegalConsentForm(candidate.form) &&
        typeof candidate.acceptedAt === 'string' &&
        typeof candidate.policyVersion === 'string'
      );
    });
  } catch {
    return [];
  }
};

/**
 * Registra la autorización aceptada al enviar un formulario.
 * Dedupe: si el último registro es del mismo formulario y la misma versión
 * de políticas, no se agrega un duplicado.
 */
export const recordLegalConsent = (form: LegalConsentForm): LegalConsentRecord | null => {
  const records = getLegalConsentRecords();
  const last = records[records.length - 1];

  if (last && last.form === form && last.policyVersion === POLICY_VERSION) {
    return last;
  }

  const entry: LegalConsentRecord = {
    form,
    acceptedAt: new Date().toISOString(),
    policyVersion: POLICY_VERSION,
  };

  if (canUseStorage()) {
    try {
      window.localStorage.setItem(
        LEGAL_CONSENT_STORAGE_KEY,
        JSON.stringify([...records, entry])
      );
    } catch (error) {
      console.error('[legal-consent] no se pudo persistir la autorización:', error);
    }
  }

  return entry;
};
