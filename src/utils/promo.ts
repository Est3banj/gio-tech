export type BadgeMode = 'none' | 'promo' | 'nuevo' | 'ambos';

export function getMillis(ts: unknown): number | null {
  if (!ts) return null;
  if (typeof ts === 'number') return ts;
  if (typeof ts === 'object' && ts !== null && 'toMillis' in ts && typeof (ts as { toMillis: () => number }).toMillis === 'function') {
    return (ts as { toMillis: () => number }).toMillis();
  }
  const n = +new Date(ts as string | number);
  return Number.isFinite(n) ? n : null;
}

export function esVentanaPromo(promoStart: unknown, promoEnd: unknown, nowMs: number): boolean {
  const startMs = getMillis(promoStart);
  const endMs = getMillis(promoEnd);
  return (!startMs || nowMs >= startMs) && (!endMs || nowMs <= endMs);
}

export function hasValidPromoPrice(promoPrice: unknown, contado: unknown): boolean {
  const countedPromoPrice = Number(promoPrice);
  const countedContado = Number(contado);
  return Number.isFinite(countedPromoPrice) && countedPromoPrice > 0 && Number.isFinite(countedContado) && countedContado > 0 && countedPromoPrice < countedContado;
}

export function badgeModeEfectivo(badgeMode: BadgeMode | null | undefined): BadgeMode {
  return badgeMode || 'promo';
}

export function debeMostrarPromoBadge(badgeMode: BadgeMode | null | undefined, promoActivo: unknown, enVentana: boolean): boolean {
  const mode = badgeModeEfectivo(badgeMode);
  return (mode === 'promo' || mode === 'ambos') && !!promoActivo && enVentana;
}

export function debeMostrarNuevoBadge(badgeMode: BadgeMode | null | undefined, nuevo: unknown): boolean {
  const mode = badgeModeEfectivo(badgeMode);
  return (mode === 'nuevo' || mode === 'ambos') && !!nuevo;
}

export function debeMostrarPrecioPromo(precioPromoValido: boolean, enVentana: boolean, promoActivo: unknown): boolean {
  return precioPromoValido && enVentana && !!promoActivo;
}

export function calcularCuotaInicial(valor: number | null | undefined): number {
  return Number(valor || 0);
}

export function resolveBadgeBg(promoBadgeBg: string | null | undefined): string {
  return promoBadgeBg || 'var(--promo-badge-bg, #ff5722)';
}

export function resolveHighlightColor(promoHighlight: string | null | undefined): string {
  return (promoHighlight && String(promoHighlight).trim()) || 'var(--promo-highlight, rgba(255,87,34,.25))';
}