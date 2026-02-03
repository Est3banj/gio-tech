function parseSpecs(producto) {
  const raw = ((producto?.nombre || "") + " " + (producto?.descripcion || ""))
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // quitar tildes

  // Normalizaciones simples
  const text = raw
    .replace(/\b1\s*t\b|\b1\s*tb\b/g, "1024 gb") // 1T, 1TB -> 1024 GB
    .replace(/\s+/g, " ")
    .trim();

  // Listas blancas
  const ALLOWED_RAM = new Set([2, 3, 4, 6, 8, 12, 16]);
  const ALLOWED_STORAGE = new Set([32, 64, 128, 256, 512, 1024]);

  // Detectores de contexto
  const isRamContext = (s) =>
    /\bram\b|\bmemoria\s*ram\b/.test(s);

  const isStorageContext = (s) =>
    /\brom\b|\balmacenamiento\b|\bmemoria\s*interna\b|\bstorage\b|\bmemoria\b(?!\s*ram)/.test(s);

  // Candidatos GB y TB
  const candidates = [];
  const reGB = /(?<!\d)(\d{1,4})\s*(?:gb|g|giga|gigas)(?!\d)/g;
  let m;
  while ((m = reGB.exec(text))) {
    const val = Number(m[1]);
    const idx = m.index;
    const ctx = text.slice(Math.max(0, idx - 25), Math.min(text.length, idx + 25));
    candidates.push({ val, idx, unit: "gb", ctx });
  }

  const reTB = /(?<!\d)(\d{1,2})\s*tb(?!\d)/g;
  while ((m = reTB.exec(text))) {
    const val = Number(m[1]) * 1024;
    const idx = m.index;
    const ctx = text.slice(Math.max(0, idx - 25), Math.min(text.length, idx + 25));
    candidates.push({ val, idx, unit: "gb", ctx }); // ya en GB
  }

  // Filtrado por listas blancas y contexto
  const ramTagged = candidates.filter(c => ALLOWED_RAM.has(c.val) && isRamContext(c.ctx));
  const storageTagged = candidates.filter(c => ALLOWED_STORAGE.has(c.val) && isStorageContext(c.ctx));

  let ram = null;
  let almacenamiento = null;

  // 1) Preferir matches con contexto
  if (ramTagged.length) ram = Math.max(...ramTagged.map(c => c.val));
  if (storageTagged.length) almacenamiento = Math.max(...storageTagged.map(c => c.val));

  // 2) Deducción segura sin etiquetas: menor permitido = RAM, mayor permitido = ROM
  if ((ram == null || almacenamiento == null) && candidates.length) {
    const onlyAllowed = candidates.map(c => c.val);
    const allowedRams = onlyAllowed.filter(v => ALLOWED_RAM.has(v));
    const allowedStorages = onlyAllowed.filter(v => ALLOWED_STORAGE.has(v));

    if (ram == null && allowedRams.length) ram = Math.min(...allowedRams);
    if (almacenamiento == null && allowedStorages.length) almacenamiento = Math.max(...allowedStorages);

    // Si hay exactamente dos valores permitidos distintos, aplicar regla menor/mayor
    const uniq = Array.from(new Set([...allowedRams, ...allowedStorages])).sort((a, b) => a - b);
    if ((ram == null || almacenamiento == null) && uniq.length >= 2) {
      if (ram == null) ram = uniq[0];
      if (almacenamiento == null) almacenamiento = uniq[uniq.length - 1];
    }
  }

  // Batería (mAh) 800–10000
  let bateria = null;
  const bat = text.match(/(\d{3,5})\s*mah/);
  if (bat) {
    const b = Number(bat[1]);
    if (b >= 800 && b <= 10000) bateria = b;
  }

  // Cámara (MP) 2–300
  let camara = null;
  const camCandidates = [...text.matchAll(/(?<!\d)(\d{1,3})\s*mp\b/g)].map(m => Number(m[1]));
  if (camCandidates.length) {
    const maxMp = Math.max(...camCandidates);
    if (maxMp >= 2 && maxMp <= 300) camara = maxMp;
  }

  // Pantalla (pulgadas) 3–8, admite coma/punto
  let pantalla = null;
  const pant =
    text.match(/(\d+(?:[.,]\d+)?)\s*(?:pulgadas|\"|”)\b/) ||
    text.match(/pantalla\s*(\d+(?:[.,]\d+)?)\s*(?:\"|”|\bpulgadas\b)/);
  if (pant) {
    const p = Number(String(pant[1]).replace(",", "."));
    if (p >= 3 && p <= 8) pantalla = p;
  }

  // Salida (si no hay match confiable, queda null)
  return { ram, almacenamiento, bateria, camara, pantalla };
}