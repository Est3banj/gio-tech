/* eslint-env node */
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

if (!admin.apps.length) admin.initializeApp();

// --- listas blancas y helpers ---
const RAM_SET = new Set([2, 3, 4, 6, 8, 12, 16, 24]);
const STORAGE_SET = new Set([32, 64, 128, 256, 512, 1024, 2048]);

const inRange = (n, min, max) => Number.isFinite(n) && n >= min && n <= max;
const toNum = (v) => (v === 0 || v ? Number(v) : null);

// --- Parser principal (nombre + descripción) ---
function parseSpecsFromText(nombre = "", descripcion = "") {
  const text = (nombre + " " + (descripcion || "")).toLowerCase();

  // RAM explícita
  let ram = (() => {
    const m = text.match(/(\d{1,2})\s*gb\s*(?:de\s*)?(?:ram|memoria)\b/);
    if (!m) return null;
    const n = Number(m[1]);
    return RAM_SET.has(n) ? n : null;
  })();

  // Almacenamiento explícito
  let almacenamiento = (() => {
    const m = text.match(/(\d{2,4})\s*gb\s*(?:de\s*)?(?:almacenamiento|rom|storage)\b/);
    if (!m) return null;
    let n = Number(m[1]);
    if (n === 1000) n = 1024;
    return STORAGE_SET.has(n) ? n : null;
  })();

  // Números genéricos "NNN gb"
  const gbNums = [...text.matchAll(/(\d{1,4})\s*gb\b/g)]
    .map((m) => Number(m[1]))
    .map((n) => (n === 1000 ? 1024 : n))
    .filter(Number.isFinite);

  // Si no hubo explícito, inferimos
  if (ram == null && gbNums.length) {
    const rCands = gbNums.filter((n) => RAM_SET.has(n));
    if (rCands.length) ram = Math.min(...rCands);
  }
  if (almacenamiento == null && gbNums.length) {
    const sCands = gbNums.filter((n) => STORAGE_SET.has(n));
    if (sCands.length) almacenamiento = Math.max(...sCands);
  }

  // Batería
  let bateria = (() => {
    const m = text.match(/(\d{3,5})\s*mAh/i);
    if (!m) return null;
    const n = Number(m[1]);
    return inRange(n, 800, 10000) ? n : null;
  })();

  // Cámara
  let camara = (() => {
    const m = text.match(/(\d{1,3})\s*mp\b/i);
    if (!m) return null;
    const n = Number(m[1]);
    return inRange(n, 2, 300) ? n : null;
  })();

  // Pantalla (pulgadas)
  let pantalla = (() => {
    const m = text.match(/(\d{1,2}(?:[.,]\d)?)\s*(?:"|”| pulgadas|inch(?:es)?)\b/i);
    if (!m) return null;
    const n = Number(String(m[1]).replace(",", "."));
    return inRange(n, 3, 8) ? n : null;
  })();

  return { ram, almacenamiento, bateria, camara, pantalla };
}

// --- Sanitizador ---
function sanitizeSpecs(specs = {}) {
  let { ram, almacenamiento, bateria, camara, pantalla } = specs;
  ram = toNum(ram);
  almacenamiento = toNum(almacenamiento);
  bateria = toNum(bateria);
  camara = toNum(camara);
  pantalla = toNum(pantalla);

  if (!RAM_SET.has(ram)) ram = null;
  if (!STORAGE_SET.has(almacenamiento)) almacenamiento = null;
  if (!inRange(bateria, 800, 10000)) bateria = null;
  if (!inRange(camara, 2, 300)) camara = null;
  if (!inRange(pantalla, 3, 8)) pantalla = null;

  return { ram, almacenamiento, bateria, camara, pantalla };
}

// --- Upsert idempotente ---
async function upsertSpecsIfNeeded(ref, currentData) {
  const nombre = currentData?.nombre || "";
  const descripcion = currentData?.descripcion || "";
  const before = currentData?.specs || {};

  const parsed = parseSpecsFromText(nombre, descripcion);
  const safe = sanitizeSpecs({
    ram: before.ram ?? parsed.ram,
    almacenamiento: before.almacenamiento ?? parsed.almacenamiento,
    bateria: before.bateria ?? parsed.bateria,
    camara: before.camara ?? parsed.camara,
    pantalla: before.pantalla ?? parsed.pantalla,
  });

  const next = {};
  let changed = false;

  const apply = (k, validCheck) => {
    const prev = toNum(before[k]);
    const val = toNum(safe[k]);
    const prevValid = validCheck(prev);
    const valValid = validCheck(val);

    if (!prevValid && valValid) {
      next[`specs.${k}`] = val;
      changed = true;
    } else if (prevValid && valValid && prev !== val) {
      next[`specs.${k}`] = val;
      changed = true;
    }
  };

  apply("ram", (v) => RAM_SET.has(v));
  apply("almacenamiento", (v) => STORAGE_SET.has(v));
  apply("bateria", (v) => inRange(v, 800, 10000));
  apply("camara", (v) => inRange(v, 2, 300));
  apply("pantalla", (v) => inRange(v, 3, 8));

  if (changed) await ref.update(next);
}

// 🔔 Create
exports.onProductCreate = functions.firestore
  .document("productos/{id}")
  .onCreate(async (snap) => {
    try {
      await upsertSpecsIfNeeded(snap.ref, snap.data() || {});
    } catch (e) {
      console.error("onProductCreate error:", e);
    }
  });

// 🔔 Update (evita loops si sólo cambian specs.*)
exports.onProductUpdate = functions.firestore
  .document("productos/{id}")
  .onUpdate(async (change) => {
    const before = change.before.data() || {};
    const after = change.after.data() || {};

    const changedKeys = new Set(
      Object.keys(after).filter((k) => JSON.stringify(after[k]) !== JSON.stringify(before[k]))
    );
    const onlySpecs =
      changedKeys.size > 0 &&
      Array.from(changedKeys).every((k) => k === "specs");

    if (onlySpecs) return;

    try {
      await upsertSpecsIfNeeded(change.after.ref, after);
    } catch (e) {
      console.error("onProductUpdate error:", e);
    }
  });
