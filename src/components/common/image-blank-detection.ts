/**
 * Detección de imágenes "vacías" (BUG: stage en blanco sin placeholder).
 *
 * Un <img> puede cargar con status 200 y seguir mostrando NADA: PNGs casi
 * totalmente transparentes o archivos planos/uniformes (media blanca sobre
 * fondo claro). onError NUNCA se dispara en ese caso, así que el fallback
 * clásico no cubre el escenario. La única forma de detectarlo es leer
 * píxeles, y eso requiere CORS: si el host no lo soporta (o el canvas queda
 * tainted), se hace FAIL-OPEN — se queda la imagen y no se concluye nada.
 */

const BLANK_SAMPLE_SIZE = 64;
const BLANK_VISIBLE_RATIO_MAX = 0.2;
const BLANK_LUMINANCE_STD_MAX = 18;

// Los umbrales se calibraron contra las 83 URLs reales del catálogo (muestreo
// 64×64): los3 casos "en blanco" del catálogo miden std ≤ 14.4 o vr ≤ 0.132,
// y la siguiente imagen sana arranca en std 24.9 / vr 0.269 — hay margen.

/** Convierte un blob URL de GitHub (?raw=true) a su raw.githubusercontent equivalente. */
export const toCanvasProbeUrl = (url: string): string => {
  const match = url.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^?]+)\?raw=true$/);
  if (!match) return url;
  return `https://raw.githubusercontent.com/${match[1]}/${match[2]}/${match[3]}`;
};

/** ¿Estos píxeles representan una imagen "vacía" (transparente o plana)? */
export const isVisuallyBlankMetrics = (visibleRatio: number, luminanceStd: number): boolean =>
  visibleRatio < BLANK_VISIBLE_RATIO_MAX || luminanceStd < BLANK_LUMINANCE_STD_MAX;

/** Resuelve true solo si la imagen está vacía; false = conservar (fail-open). */
const corsUnsupportedOrigins = new Set<string>();

export const probeVisuallyBlank = (src: string): Promise<boolean> =>
  new Promise((resolve) => {
    if (typeof document === "undefined" || typeof Image === "undefined") {
      resolve(false);
      return;
    }
    let origin: string;
    try {
      origin = new URL(src).origin;
    } catch {
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
    probe.src = toCanvasProbeUrl(src);
  });
