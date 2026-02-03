// src/utils/specsParser.js
export function parseDescriptionToSpecs(description = "") {
  if (!description || typeof description !== "string") return {};

  const text = description.toLowerCase();

  const toNum = (v) => {
    if (v === 0 || v) {
      const s = String(v).replace(/[^0-9.,]/g, "").replace(",", ".");
      const n = Number(s);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  // Buscar almacenamiento (GB)
  const almacenamientoMatch = text.match(/\b(\d{2,4})\s?gb\b/);
  const almacenamiento = almacenamientoMatch ? toNum(almacenamientoMatch[1]) : null;

  // RAM (GB)
  const ramMatch = text.match(/\b(\d{1,2})\s?gb\s?de\s?ram\b/) || text.match(/\b(\d{1,2})\s?gb\s?ram\b/) || text.match(/\b(\d{1,2})\s?gb\b/);
  const ram = ramMatch ? toNum(ramMatch[1]) : null;

  // Cámara (MP)
  const camMatch = text.match(/(\d{2,4})\s?mp\b/) || text.match(/cámara\s?de\s?(\d{2,4})\s?mp/);
  const camara = camMatch ? toNum(camMatch[1] || camMatch[2]) : null;

  // Pantalla (pulgadas)
  const screenMatch = text.match(/(\d{1,2}(?:[.,]\d)?)\s?(?:pulgadas|")/) || text.match(/pantalla.*?(\d{1,2}(?:[.,]\d)?)/);
  const pantalla = screenMatch ? toNum((screenMatch[1] || screenMatch[2] || "").replace(",", ".")) : null;

  // Batería (mAh)
  const batMatch = text.match(/(\d{3,5})\s?m(?:ah)?\b/);
  const bateria = batMatch ? toNum(batMatch[1]) : null;

  return {
    almacenamiento: almacenamiento || null,
    ram: ram || null,
    camara: camara || null,
    pantalla: pantalla || null,
    bateria: bateria || null
  };
}