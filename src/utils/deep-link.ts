/**
 * Helper compartido de deep links legacy.
 *
 * Replica la lógica que vivía inline en `Catalogo.tsx` (query params
 * `?producto=ID` o `?id=ID`) para poder consumirla desde los 3 puntos de
 * redirect (App RootRoute, LandingPage, Catalogo) sin triplicar
 * decode/trim/try-catch.
 *
 * Devuelve `null` cuando el parámetro está ausente, vacío o no aporta un ID
 * usable — el consumidor en ese caso NO redirige (igual que el comportamiento
 * preexistente del catálogo).
 */
export function getProductIdFromSearchParams(params: URLSearchParams): string | null {
  const rawTargetId = params.get('producto') || params.get('id');
  if (!rawTargetId) return null;

  let decoded: string;
  try {
    decoded = decodeURIComponent(rawTargetId);
  } catch {
    // Malformado (ej. "%E0%A4%A"): conservar el valor crudo, igual que hoy.
    decoded = rawTargetId;
  }

  const trimmed = decoded.trim();
  return trimmed === '' ? null : trimmed;
}
