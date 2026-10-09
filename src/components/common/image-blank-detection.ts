/**
 * Detección de imágenes "vacías" (BUG: stage en blanco sin placeholder).
 *
 * Un <img> puede cargar con status 200 y seguir mostrando NADA: PNGs casi
 * totalmente transparentes o archivos planos/uniformes (media blanca sobre
 * fondo claro). onError NUNCA se dispara en ese caso, así que el fallback
 * clásico no cubre el escenario. La única forma de detectarlo es leer
 * píxeles, y eso requiere CORS: si el host no lo soporta (o el canvas queda
 * tainted), se hace FAIL-OPEN — se queda la imagen y no se concluye nada.
 *
 * Además, el probe SOLO se ejecuta contra hosts de una allowlist de origen
 * conocido por servir CORS (isCorsProbeSafeHost): un host fuera de la lista
 * (ej. cemelectronix.com) no emite NINGÚN request de sondeo, evitando los
 * errores CORS que el navegador loguea en consola. Imagen intacta = fail-open.
 */

const BLANK_SAMPLE_SIZE = 64;
const BLANK_VISIBLE_RATIO_MAX = 0.2;
const BLANK_LUMINANCE_STD_MAX = 18;

// Los umbrales se calibraron contra las 83 URLs reales del catálogo (muestreo
// 64×64): los3 casos "en blanco" del catálogo miden std ≤ 14.4 o vr ≤ 0.132,
// y la siguiente imagen sana arranca en std 24.9 / vr 0.269 — hay margen.

/**
 * Convierte un blob URL de GitHub (?raw=true) a su raw.githubusercontent
 * equivalente: sin el path /blob/ y sin la query ?raw=true. Cualquier otra
 * URL (amazon/mlstatic/cemelectronix/etc.) se devuelve intacta.
 * Es la normalización compartida: la usa el <img> de ProductImage para
 * servir el asset directo (evita la cadena de redirects de github.com)
 * y el probe de píxeles, que sondea exactamente la misma URL final.
 */
export const toDisplayUrl = (url: string): string => {
  const match = url.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^?]+)\?raw=true$/);
  if (!match) return url;
  return `https://raw.githubusercontent.com/${match[1]}/${match[2]}/${match[3]}`;
};

/** Normalización del probe (alias de toDisplayUrl, comportamiento idéntico). */
export const toCanvasProbeUrl = (url: string): string => toDisplayUrl(url);

/** ¿Estos píxeles representan una imagen "vacía" (transparente o plana)? */
export const isVisuallyBlankMetrics = (visibleRatio: number, luminanceStd: number): boolean =>
  visibleRatio < BLANK_VISIBLE_RATIO_MAX || luminanceStd < BLANK_LUMINANCE_STD_MAX;

// Allowlist de hosts sondeables: solo estos sirven CORS (ACAO) y por lo tanto
// permiten leer píxeles sin tainted canvas. Se matchea por SUFIJO de hostname
// (no host exacto) para cubrir subdominios variables (http2.mlstatic.com,
// m.media-amazon.com, cualquier *.appmifile.com). Verificado con curl -I:
// raw.githubusercontent.com / mlstatic / media-amazon / appmifile /
// ssl-images-amazon responden ACAO; cemelectronix.com NO.
const CORS_SAFE_HOST_SUFFIXES = [
  "githubusercontent.com", // raw.githubusercontent.com, avatars, objects...
  "mlstatic.com", // http0/http2/http4.mlstatic.com (MercadoLibre CDN)
  "media-amazon.com", // m.media-amazon.com y subdominios
  "ssl-images-amazon.com", // CDN vieja de Amazon
  "appmifile.com", // CDN de Xiaomi (appmifile.com)
];

/**
 * ¿Este URL apunta a un host conocido por servir CORS?
 * Debe evaluarse SOBRE la URL ya normalizada (toCanvasProbeUrl): los blob de
 * github.com se reescriben a raw.githubusercontent.com (que sí sirve ACAO),
 * mientras github.com en crudo no lo hace.
 */
export const isCorsProbeSafeHost = (url: string): boolean => {
  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return false;
  }
  return CORS_SAFE_HOST_SUFFIXES.some(
    (suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`)
  );
};

/** Resuelve true solo si la imagen está vacía; false = conservar (fail-open). */
const corsUnsupportedOrigins = new Set<string>();

export const probeVisuallyBlank = (src: string): Promise<boolean> =>
  new Promise((resolve) => {
    if (typeof document === "undefined" || typeof Image === "undefined") {
      resolve(false);
      return;
    }
    // Normalización PRIMERO (blob de GitHub → raw), porque el host normalizado
    // es el que realmente se sondea y el que decide la puerta de allowlist.
    const probeUrl = toCanvasProbeUrl(src);
    let origin: string;
    try {
      origin = new URL(probeUrl).origin;
    } catch {
      resolve(false);
      return;
    }
    // Puerta allowlist: host fuera de la lista = SKIP TOTAL del probe, sin
    // request de sondeo y sin errores CORS en consola. La imagen se conserva
    // (fail-open idéntico al comportamiento pre-fix).
    if (!isCorsProbeSafeHost(probeUrl)) {
      resolve(false);
      return;
    }
    // Un origin que ya falló CORS no vuelve a sondearse en esta sesión:
    // menos requests inútiles y menos ruido en consola (el navegador loguea
    // cada bloqueo CORS como error de red).
    if (corsUnsupportedOrigins.has(origin)) {
      resolve(false);
      return;
    }
    const probe = new Image();
    probe.crossOrigin = "anonymous";
    let settled = false;
    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const timeoutId = window.setTimeout(() => finish(false), 15000);
    probe.onload = () => {
      window.clearTimeout(timeoutId);
      try {
        const canvas = document.createElement("canvas");
        canvas.width = BLANK_SAMPLE_SIZE;
        canvas.height = BLANK_SAMPLE_SIZE;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          finish(false);
          return;
        }
        ctx.drawImage(probe, 0, 0, BLANK_SAMPLE_SIZE, BLANK_SAMPLE_SIZE);
        const { data } = ctx.getImageData(0, 0, BLANK_SAMPLE_SIZE, BLANK_SAMPLE_SIZE);
        let visible = 0;
        let sum = 0;
        let sumSq = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 10) continue;
          visible += 1;
          const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          sum += lum;
          sumSq += lum * lum;
        }
        if (visible === 0) {
          finish(true);
          return;
        }
        const mean = sum / visible;
        const std = Math.sqrt(Math.max(0, sumSq / visible - mean * mean));
        finish(isVisuallyBlankMetrics(visible / (BLANK_SAMPLE_SIZE * BLANK_SAMPLE_SIZE), std));
      } catch {
        finish(false);
      }
    };
    probe.onerror = () => {
      window.clearTimeout(timeoutId);
      corsUnsupportedOrigins.add(origin);
      finish(false);
    };
    probe.src = probeUrl;
  });
