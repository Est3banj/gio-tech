/**
 * Gio-Tech Script: updateRealSpecsAndZeroCuotas.js
 * 
 * 1. Actualiza en Firestore las especificaciones técnicas reales de hardware:
 *    - Pantalla (pantalla): diagonal exacta en pulgadas (ej: 6.8, 6.7, 6.67, 6.78, 6.1, 10.9, 13.6, 15.3, 7.6)
 *    - Batería (bateria): capacidad real en mAh (ej: 5000, 6000, 4500, 3349, 4685, 7606, 8000, etc.)
 *    - Cámara principal (camara): sensor principal en MP (ej: 200, 108, 64, 50, 48, 13, 12)
 *    - RAM física (ram): memoria RAM real en GB (ej: 3, 4, 6, 8, 12, 16, 24)
 *    - Almacenamiento (almacenamiento): capacidad real en GB / TB (64, 128, 256, 512, 1024)
 * 
 * 2. Vacia / pone en 0 los campos de cuotas:
 *    - cuotas6: 0
 *    - cuotas8: 0
 *    - cuotas12: 0
 *    - cuotaInicial: 0
 * 
 * Uso:
 *   node scripts/updateRealSpecsAndZeroCuotas.js          -> MODO DRY-RUN (Preview)
 *   node scripts/updateRealSpecsAndZeroCuotas.js --apply  -> MODO REAL (Aplica en Firestore)
 */

const admin = require("./node_modules/firebase-admin");
const fs = require("fs");
const path = require("path");

const serviceAccount = require("./service-account.json");
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const isApply = process.argv.includes("--apply");
const isForce = process.env.ALLOW_BATCH_WRITE === "true";

if (isApply && !isForce) {
  console.error("🛑 BLOQUEO DE SEGURIDAD ACTIVADO:");
  console.error("No se permite ejecutar escrituras masivas sobre Firestore sin la variable de entorno explícita:");
  console.error("   ALLOW_BATCH_WRITE=true node scripts/updateRealSpecsAndZeroCuotas.js --apply");
  console.error("Esto evita pisar ediciones en vivo del usuario administrador.");
  process.exit(1);
}

function normalize(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\+/g, " plus ");
}

function detectBrand(name, desc, docMarca) {
  const m = (docMarca || "").toLowerCase().trim();
  if (m === "samsung") return "Samsung";
  if (m === "apple") return "Apple";
  if (m === "xiaomi") return "Xiaomi";
  if (m === "tecno") return "Tecno";
  if (m === "infinix") return "Infinix";
  if (m === "motorola") return "Motorola";
  if (m === "oppo") return "Oppo";
  if (m === "harvic") return "Harvic";

  const text = normalize(name + " " + desc);
  if (/\b(?:samsung|galaxy)\b/i.test(text)) return "Samsung";
  if (/\b(?:apple|iphone|ipad|macbook|airtag|airpods?)\b/i.test(text)) return "Apple";
  if (/\b(?:xiaomi|redmi|poco)\b/i.test(text)) return "Xiaomi";
  if (/\b(?:tecno|camon|pova|spark)\b/i.test(text)) return "Tecno";
  if (/\b(?:infinix|infinitix|hot\s*70|hot\s*60)\b/i.test(text)) return "Infinix";
  if (/\b(?:motorola|moto)\b/i.test(text)) return "Motorola";
  if (/\b(?:oppo)\b/i.test(text)) return "Oppo";
  if (/\b(?:harvic)\b/i.test(text)) return "Harvic";
  if (/\b(?:ugreen)\b/i.test(text)) return "UGREEN";

  return "Otra";
}

function extractRAM(text, defaultRam) {
  const t = normalize(text);
  const m = t.match(/\b(\d{1,2})\s*(?:gb)?\s*ram\b/i) ||
            t.match(/\b(\d{1,2})\s*plus\s*\d{1,2}\b/i) ||
            t.match(/(?:128|256|512|64)\s*[/]\s*(\d{1,2})\b/i);
  if (m) {
    const val = Number(m[1]);
    if ([2, 3, 4, 6, 8, 12, 16, 24].includes(val)) return val;
  }
  return defaultRam;
}

function resolveProductHardwareSpecs(item) {
  const name = item.nombre || "";
  const desc = item.descripcion || "";
  const s = normalize(name + " " + desc);
  const brand = detectBrand(name, desc, item.marca);

  // 1. TVs
  if (s.includes("harvic") || (s.includes("tv") && s.includes("harvic"))) {
    return {
      marca: "Harvic",
      categoria: "Televisores",
      specs: { pantalla: 55, bateria: null, camara: null, ram: null, almacenamiento: null }
    };
  }
  if (s.includes("qled") || (s.includes("tv") && s.includes("samsung"))) {
    return {
      marca: "Samsung",
      categoria: "Televisores",
      specs: { pantalla: 65, bateria: null, camara: null, ram: null, almacenamiento: null }
    };
  }

  // 2. Accesorios
  const isAccessory = (item.categoria || "").toLowerCase().includes("accesorio") ||
    /\b(?:funda|cargador|adaptador|cable|power bank|estuche|audifonos|smartwatch|auriculares|airtag|buds|bloque de cargador)\b/i.test(name);
  if (isAccessory) {
    let finalBrand = brand;
    if (finalBrand === "Otra") finalBrand = name.includes("UGREEN") ? "UGREEN" : "Accesorio";
    return {
      marca: finalBrand,
      categoria: "Accesorios",
      specs: { pantalla: null, bateria: null, camara: null, ram: null, almacenamiento: null }
    };
  }

  // 3. Apple MacBooks
  if (brand === "Apple" && s.includes("macbook")) {
    if (s.includes("neo")) {
      return { marca: "Apple", categoria: "Laptops", specs: { pantalla: 13.6, bateria: null, camara: 12, ram: 8, almacenamiento: 256 } };
    }
    if (s.includes("15")) {
      const rom = s.includes("512") ? 512 : 256;
      const ram = extractRAM(name, rom === 512 ? 24 : 16);
      return { marca: "Apple", categoria: "Laptops", specs: { pantalla: 15.3, bateria: null, camara: 12, ram, almacenamiento: rom } };
    }
    if (s.includes("m5") || s.includes("512")) {
      return { marca: "Apple", categoria: "Laptops", specs: { pantalla: 13.6, bateria: null, camara: 12, ram: 16, almacenamiento: 512 } };
    }
    return { marca: "Apple", categoria: "Laptops", specs: { pantalla: 13.6, bateria: null, camara: 12, ram: 8, almacenamiento: 256 } };
  }

  // 4. Apple iPads
  if (brand === "Apple" && s.includes("ipad")) {
    if (s.includes("pro")) {
      const size = s.includes("13") ? 13.0 : 11.0;
      const bat = size === 13.0 ? 10290 : 8160;
      return { marca: "Apple", categoria: "Tablets", specs: { pantalla: size, bateria: bat, camara: 12, ram: 12, almacenamiento: 256 } };
    }
    if (s.includes("air")) {
      const rom = s.includes("256") ? 256 : 128;
      return { marca: "Apple", categoria: "Tablets", specs: { pantalla: 11.0, bateria: 7606, camara: 12, ram: 8, almacenamiento: rom } };
    }
    const rom = s.includes("256") ? 256 : 128;
    return { marca: "Apple", categoria: "Tablets", specs: { pantalla: 10.9, bateria: 7606, camara: 12, ram: 4, almacenamiento: rom } };
  }

  // 5. Apple iPhones
  if (brand === "Apple") {
    if (s.includes("16 pro max")) {
      const rom = s.includes("512") ? 512 : 256;
      return { marca: "Apple", categoria: "Celulares", specs: { pantalla: 6.9, bateria: 4685, camara: 48, ram: 8, almacenamiento: rom } };
    }
    if (s.includes("17 pro max")) {
      const rom = s.includes("512") ? 512 : 256;
      return { marca: "Apple", categoria: "Celulares", specs: { pantalla: 6.9, bateria: 4800, camara: 48, ram: 12, almacenamiento: rom } };
    }
    if (s.includes("17 pro")) {
      return { marca: "Apple", categoria: "Celulares", specs: { pantalla: 6.3, bateria: 3700, camara: 48, ram: 8, almacenamiento: 256 } };
    }
    if (s.includes("iphone air") || (s.includes("air") && s.includes("azul cielo"))) {
      return { marca: "Apple", categoria: "Celulares", specs: { pantalla: 6.5, bateria: 3600, camara: 48, ram: 8, almacenamiento: 256 } };
    }
    if (s.includes("17")) {
      return { marca: "Apple", categoria: "Celulares", specs: { pantalla: 6.3, bateria: 3600, camara: 48, ram: 8, almacenamiento: 256 } };
    }
    if (s.includes("16")) {
      return { marca: "Apple", categoria: "Celulares", specs: { pantalla: 6.1, bateria: 3561, camara: 48, ram: 8, almacenamiento: 128 } };
    }
    if (s.includes("15")) {
      return { marca: "Apple", categoria: "Celulares", specs: { pantalla: 6.1, bateria: 3349, camara: 48, ram: 6, almacenamiento: 128 } };
    }
    if (s.includes("13")) {
      return { marca: "Apple", categoria: "Celulares", specs: { pantalla: 6.1, bateria: 3227, camara: 12, ram: 4, almacenamiento: 128 } };
    }
  }

  // 6. Samsung
  if (brand === "Samsung") {
    if (s.includes("s20 plus") || s.includes("s20plus") || s.includes("s20+")) {
      return { marca: "Samsung", categoria: "Celulares", specs: { pantalla: 6.7, bateria: 4500, camara: 64, ram: 12, almacenamiento: 128 } };
    }
    if (s.includes("z flip 8") || s.includes("flip 8")) {
      return { marca: "Samsung", categoria: "Celulares", specs: { pantalla: 6.7, bateria: 4000, camara: 50, ram: 12, almacenamiento: 512 } };
    }
    if (s.includes("z fold 8 ultra") || s.includes("fold 8 ultra")) {
      return { marca: "Samsung", categoria: "Celulares", specs: { pantalla: 7.6, bateria: 4500, camara: 200, ram: 12, almacenamiento: 512 } };
    }
    if (s.includes("z fold 8") || s.includes("fold 8")) {
      return { marca: "Samsung", categoria: "Celulares", specs: { pantalla: 7.6, bateria: 4400, camara: 50, ram: 12, almacenamiento: 512 } };
    }
    if (s.includes("s25 fe")) {
      return { marca: "Samsung", categoria: "Celulares", specs: { pantalla: 6.4, bateria: 4500, camara: 50, ram: 8, almacenamiento: 512 } };
    }
    if (s.includes("s26 fe")) {
      const rom = s.includes("512") ? 512 : 256;
      return { marca: "Samsung", categoria: "Celulares", specs: { pantalla: 6.4, bateria: 4700, camara: 50, ram: 8, almacenamiento: rom } };
    }
    if (s.includes("s25 ultra")) {
      const rom = s.includes("1tb") || s.includes("1 tb") || s.includes("1024") ? 1024 : s.includes("512") ? 512 : 256;
      return { marca: "Samsung", categoria: "Celulares", specs: { pantalla: 6.8, bateria: 5000, camara: 200, ram: 12, almacenamiento: rom } };
    }
    if (s.includes("s26 ultra")) {
      const rom = s.includes("512") ? 512 : 256;
      return { marca: "Samsung", categoria: "Celulares", specs: { pantalla: 6.8, bateria: 5000, camara: 200, ram: 12, almacenamiento: rom } };
    }
    if (s.includes("s25")) {
      return { marca: "Samsung", categoria: "Celulares", specs: { pantalla: 6.2, bateria: 4000, camara: 50, ram: 12, almacenamiento: 256 } };
    }
    if (s.includes("a26")) {
      return { marca: "Samsung", categoria: "Celulares", specs: { pantalla: 6.5, bateria: 5000, camara: 50, ram: 8, almacenamiento: 256 } };
    }
    if (s.includes("a27")) {
      return { marca: "Samsung", categoria: "Celulares", specs: { pantalla: 6.5, bateria: 5000, camara: 50, ram: 8, almacenamiento: 256 } };
    }
    if (s.includes("a36")) {
      return { marca: "Samsung", categoria: "Celulares", specs: { pantalla: 6.6, bateria: 5000, camara: 50, ram: 8, almacenamiento: 256 } };
    }
    if (s.includes("a37")) {
      const rom = s.includes("256") ? 256 : 128;
      const ram = extractRAM(name, rom === 256 ? 8 : 6);
      return { marca: "Samsung", categoria: "Celulares", specs: { pantalla: 6.6, bateria: 5000, camara: 50, ram, almacenamiento: rom } };
    }
    if (s.includes("a56")) {
      return { marca: "Samsung", categoria: "Celulares", specs: { pantalla: 6.6, bateria: 5000, camara: 50, ram: 8, almacenamiento: 256 } };
    }
    if (s.includes("a57")) {
      return { marca: "Samsung", categoria: "Celulares", specs: { pantalla: 6.6, bateria: 5000, camara: 50, ram: 8, almacenamiento: 256 } };
    }
    if (s.includes("a07")) {
      const is64 = s.includes("64");
      const rom = is64 ? 64 : 128;
      const ram = extractRAM(name, is64 ? 4 : 4);
      return { marca: "Samsung", categoria: "Celulares", specs: { pantalla: 6.5, bateria: 5000, camara: 50, ram, almacenamiento: rom } };
    }
    if (s.includes("a17")) {
      const rom = s.includes("256") ? 256 : 128;
      const ram = extractRAM(name, rom === 256 ? 8 : 4);
      return { marca: "Samsung", categoria: "Celulares", specs: { pantalla: 6.5, bateria: 5000, camara: 50, ram, almacenamiento: rom } };
    }
  }

  // 7. Xiaomi / Redmi / Poco
  if (brand === "Xiaomi") {
    if (s.includes("17t pro")) {
      return { marca: "Xiaomi", categoria: "Celulares", specs: { pantalla: 6.67, bateria: 5000, camara: 50, ram: 12, almacenamiento: 512 } };
    }
    if (s.includes("17t")) {
      return { marca: "Xiaomi", categoria: "Celulares", specs: { pantalla: 6.67, bateria: 5000, camara: 50, ram: 12, almacenamiento: 512 } };
    }
    if ((s.includes("mi 17") || s.includes("xiaomi 17")) && !s.includes("redmi")) {
      return { marca: "Xiaomi", categoria: "Celulares", specs: { pantalla: 6.36, bateria: 5000, camara: 50, ram: 12, almacenamiento: 512 } };
    }
    if (s.includes("poco c71") || s.includes("c71")) {
      const rom = s.includes("128") ? 128 : 64;
      return { marca: "Xiaomi", categoria: "Celulares", specs: { pantalla: 6.7, bateria: 5000, camara: 50, ram: 4, almacenamiento: rom } };
    }
    if (s.includes("poco m8 pro") || s.includes("m8 pro")) {
      return { marca: "Xiaomi", categoria: "Celulares", specs: { pantalla: 6.67, bateria: 5000, camara: 64, ram: 12, almacenamiento: 512 } };
    }
    if (s.includes("poco x8 pro max") || s.includes("x8 pro max")) {
      return { marca: "Xiaomi", categoria: "Celulares", specs: { pantalla: 6.67, bateria: 5500, camara: 108, ram: 12, almacenamiento: 512 } };
    }
    if (s.includes("poco x8 pro") || s.includes("x8 pro")) {
      const ram = extractRAM(name, 8);
      return { marca: "Xiaomi", categoria: "Celulares", specs: { pantalla: 6.67, bateria: 5000, camara: 64, ram, almacenamiento: 512 } };
    }
    if (s.includes("poco f8 pro") || s.includes("f8 pro")) {
      return { marca: "Xiaomi", categoria: "Celulares", specs: { pantalla: 6.67, bateria: 5000, camara: 50, ram: 12, almacenamiento: 512 } };
    }
    if (s.includes("redmi 17")) {
      const rom = s.includes("256") ? 256 : 128;
      const ram = extractRAM(name, rom === 128 ? 4 : 4);
      return { marca: "Xiaomi", categoria: "Celulares", specs: { pantalla: 6.7, bateria: 5000, camara: 50, ram, almacenamiento: rom } };
    }
    if (s.includes("note 15 pro plus") || s.includes("note 15 pro+")) {
      const rom = s.includes("512") ? 512 : 256;
      const ram = extractRAM(name, rom === 512 ? 12 : 8);
      return { marca: "Xiaomi", categoria: "Celulares", specs: { pantalla: 6.67, bateria: 5000, camara: 200, ram, almacenamiento: rom } };
    }
    if (s.includes("note 15 pro") && s.includes("5g")) {
      const rom = s.includes("512") ? 512 : 256;
      const ram = extractRAM(name, 8);
      return { marca: "Xiaomi", categoria: "Celulares", specs: { pantalla: 6.67, bateria: 5000, camara: 200, ram, almacenamiento: rom } };
    }
    if (s.includes("note 15 pro") && (s.includes("4g") || s.includes("titanium"))) {
      const rom = s.includes("512") ? 512 : 256;
      const ram = extractRAM(name, rom === 512 ? 12 : 8);
      return { marca: "Xiaomi", categoria: "Celulares", specs: { pantalla: 6.67, bateria: 5000, camara: 200, ram, almacenamiento: rom } };
    }
    if (s.includes("note 15 pro")) {
      const rom = s.includes("512") ? 512 : 256;
      const ram = extractRAM(name, rom === 512 ? 12 : 8);
      return { marca: "Xiaomi", categoria: "Celulares", specs: { pantalla: 6.67, bateria: 5000, camara: 200, ram, almacenamiento: rom } };
    }
    if (s.includes("note 15") && !s.includes("pro")) {
      const rom = s.includes("512") ? 512 : 256;
      return { marca: "Xiaomi", categoria: "Celulares", specs: { pantalla: 6.67, bateria: 5000, camara: 108, ram: 8, almacenamiento: rom } };
    }
    if (s.includes("note 14 pro plus") || s.includes("note 14 pro+")) {
      return { marca: "Xiaomi", categoria: "Celulares", specs: { pantalla: 6.67, bateria: 5000, camara: 200, ram: 8, almacenamiento: 256 } };
    }
    if (s.includes("redmi 15c") || s.includes("15c")) {
      const rom = s.includes("128") ? 128 : 256;
      const ram = extractRAM(name, rom === 128 ? 4 : 4);
      return { marca: "Xiaomi", categoria: "Celulares", specs: { pantalla: 6.7, bateria: 5000, camara: 50, ram, almacenamiento: rom } };
    }
    if (s.includes("redmi 15") && !s.includes("15c") && !s.includes("note")) {
      return { marca: "Xiaomi", categoria: "Celulares", specs: { pantalla: 6.7, bateria: 5000, camara: 50, ram: 8, almacenamiento: 256 } };
    }
    if (s.includes("redmi a7 pro") || s.includes("a7 pro")) {
      const rom = s.includes("128") ? 128 : 64;
      const ram = extractRAM(name, rom === 128 ? 4 : 3);
      return { marca: "Xiaomi", categoria: "Celulares", specs: { pantalla: 6.5, bateria: 5000, camara: 50, ram, almacenamiento: rom } };
    }
  }

  // 8. Tecno
  if (brand === "Tecno") {
    if (s.includes("camon 50 ultra") || s.includes("camon 50")) {
      return { marca: "Tecno", categoria: "Celulares", specs: { pantalla: 6.78, bateria: 5000, camara: 50, ram: 8, almacenamiento: 256 } };
    }
    if (s.includes("spark 50") && s.includes("5g")) {
      const ram = extractRAM(name, 8);
      return { marca: "Tecno", categoria: "Celulares", specs: { pantalla: 6.78, bateria: 5000, camara: 50, ram, almacenamiento: 256 } };
    }
    if (s.includes("spark 50") && (s.includes("4g") || s.includes("kn4"))) {
      const ram = extractRAM(name, 4);
      return { marca: "Tecno", categoria: "Celulares", specs: { pantalla: 6.78, bateria: 5000, camara: 50, ram, almacenamiento: 256 } };
    }
    if (s.includes("pova curve 2")) {
      return { marca: "Tecno", categoria: "Celulares", specs: { pantalla: 6.78, bateria: 8000, camara: 50, ram: 8, almacenamiento: 256 } };
    }
    if (s.includes("pova 6")) {
      return { marca: "Tecno", categoria: "Celulares", specs: { pantalla: 6.78, bateria: 6000, camara: 50, ram: 8, almacenamiento: 256 } };
    }
    if (s.includes("pova slim")) {
      return { marca: "Tecno", categoria: "Celulares", specs: { pantalla: 6.78, bateria: 5000, camara: 50, ram: 8, almacenamiento: 256 } };
    }
    if (s.includes("spark go 3")) {
      const rom = s.includes("128") ? 128 : 64;
      const ram = extractRAM(name, rom === 128 ? 4 : 3);
      return { marca: "Tecno", categoria: "Celulares", specs: { pantalla: 6.6, bateria: 5000, camara: 13, ram, almacenamiento: rom } };
    }
    if (s.includes("spark 40c")) {
      return { marca: "Tecno", categoria: "Celulares", specs: { pantalla: 6.6, bateria: 5000, camara: 13, ram: 4, almacenamiento: 256 } };
    }
  }

  // 9. Infinix
  if (brand === "Infinix") {
    if (s.includes("note edge")) {
      return { marca: "Infinix", categoria: "Celulares", specs: { pantalla: 6.78, bateria: 6500, camara: 50, ram: 8, almacenamiento: 256 } };
    }
    if (s.includes("note 60 pro")) {
      return { marca: "Infinix", categoria: "Celulares", specs: { pantalla: 6.78, bateria: 5000, camara: 108, ram: 8, almacenamiento: 256 } };
    }
    if (s.includes("note 60") && !s.includes("pro")) {
      return { marca: "Infinix", categoria: "Celulares", specs: { pantalla: 6.78, bateria: 5000, camara: 50, ram: 8, almacenamiento: 256 } };
    }
    if (s.includes("note 50 pro")) {
      const ram = extractRAM(name, 12);
      return { marca: "Infinix", categoria: "Celulares", specs: { pantalla: 6.78, bateria: 5000, camara: 108, ram, almacenamiento: 256 } };
    }
    if (s.includes("hot 70")) {
      const ram = extractRAM(name, 4);
      return { marca: "Infinix", categoria: "Celulares", specs: { pantalla: 6.78, bateria: 5000, camara: 50, ram, almacenamiento: 256 } };
    }
    if (s.includes("hot 60 pro plus") || s.includes("hot 60 pro+")) {
      const ram = extractRAM(name, 8);
      return { marca: "Infinix", categoria: "Celulares", specs: { pantalla: 6.78, bateria: 5000, camara: 50, ram, almacenamiento: 256 } };
    }
    if (s.includes("smart 10")) {
      const ram = extractRAM(name, 4);
      return { marca: "Infinix", categoria: "Celulares", specs: { pantalla: 6.7, bateria: 5000, camara: 13, ram, almacenamiento: 256 } };
    }
  }

  // 10. Motorola
  if (brand === "Motorola") {
    if (s.includes("edge 50 fusion")) {
      return { marca: "Motorola", categoria: "Celulares", specs: { pantalla: 6.7, bateria: 5000, camara: 50, ram: 8, almacenamiento: 256 } };
    }
  }

  // 11. Oppo
  if (brand === "Oppo") {
    if (s.includes("a60")) {
      return { marca: "Oppo", categoria: "Celulares", specs: { pantalla: 6.67, bateria: 5000, camara: 50, ram: 8, almacenamiento: 256 } };
    }
  }

  return {
    marca: item.marca || "Otra",
    categoria: item.categoria || "Celulares",
    specs: item.specs || { pantalla: null, bateria: null, camara: null, ram: null, almacenamiento: null }
  };
}

async function main() {
  console.log(`\n======================================================`);
  console.log(` 🚀 GIO-TECH: INYECCIÓN DE SPECS REALES Y CUOTAS EN 0`);
  console.log(` 📌 Estado: ${isApply ? "🟢 APLICANDO CAMBIOS EN FIRESTORE" : "🟡 MODO PREVIEW (DRY-RUN)"}`);
  console.log(`======================================================\n`);

  const snap = await db.collection("productos").get();
  const existingDocs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  console.log(`📦 Total productos leídos de Firestore: ${existingDocs.length}\n`);

  const updates = [];

  for (const doc of existingDocs) {
    const resolved = resolveProductHardwareSpecs(doc);

    const payload = {
      specs: resolved.specs,
      cuotas6: 0,
      cuotas8: 0,
      cuotas12: 0,
      cuotaInicial: 0,
    };

    if (resolved.marca && (!doc.marca || doc.marca === "Otra" || doc.marca === "Sin marca")) {
      payload.marca = resolved.marca;
    }
    if (resolved.categoria && (!doc.categoria || doc.categoria === "Sin cat")) {
      payload.categoria = resolved.categoria;
    }

    updates.push({
      id: doc.id,
      nombre: doc.nombre,
      marca: resolved.marca,
      categoria: resolved.categoria,
      contado: doc.contado,
      cuotasAnteriores: {
        cuotas6: doc.cuotas6,
        cuotas8: doc.cuotas8,
        cuotas12: doc.cuotas12,
        cuotaInicial: doc.cuotaInicial,
      },
      specsAnteriores: doc.specs || null,
      nuevasSpecs: resolved.specs,
      payload,
    });
  }

  console.log(`📋 Tabla de cambios preparados (101 productos):`);
  console.log(`------------------------------------------------------------------------------------------------`);
  updates.forEach((u, idx) => {
    const sp = u.nuevasSpecs;
    const specStr = [
      sp.pantalla ? `📱 ${sp.pantalla}"` : null,
      sp.bateria ? `🔋 ${sp.bateria}mAh` : null,
      sp.camara ? `📸 ${sp.camara}MP` : null,
      sp.ram ? `⚡ ${sp.ram}GB RAM` : null,
      sp.almacenamiento ? `💾 ${sp.almacenamiento >= 1024 ? `${sp.almacenamiento/1024}TB` : `${sp.almacenamiento}GB`}` : null,
    ].filter(Boolean).join(" | ") || "Sin specs físicas (Accesorio/TV)";

    console.log(`${(idx + 1).toString().padStart(3, " ")}. [${u.id}] [${u.marca}] "${u.nombre}"`);
    console.log(`     💵 Contado: $${u.contado?.toLocaleString() || "N/A"} | Cuotas: [6: 0, 8: 0, 12: 0, inicial: 0] (Antes: 6:${u.cuotasAnteriores.cuotas6}, 8:${u.cuotasAnteriores.cuotas8})`);
    console.log(`     ⚙️  Specs: ${specStr}\n`);
  });

  if (isApply) {
    console.log(`⏳ Aplicando actualizaciones en Firestore (Batch write)...`);
    const BATCH_SIZE = 400;
    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const chunk = updates.slice(i, i + BATCH_SIZE);
      for (const item of chunk) {
        const ref = db.collection("productos").doc(item.id);
        batch.update(ref, item.payload);
      }
      await batch.commit();
    }
    console.log(`\n✅ ¡${updates.length} productos actualizados exitosamente en Firestore!`);
  } else {
    console.log(`\n⚠️  MODO DRY-RUN: Ejecutá con --apply para confirmar y persistir en Firestore:`);
    console.log(`   node scripts/updateRealSpecsAndZeroCuotas.js --apply\n`);
  }

  const auditPath = path.join(__dirname, `audit-updateRealSpecsAndZeroCuotas-${Date.now()}.json`);
  fs.writeFileSync(auditPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    isApply,
    totalUpdated: updates.length,
    updates,
  }, null, 2));

  console.log(`📄 Auditoría guardada en: ${auditPath}\n`);
}

main().catch((err) => {
  console.error("❌ Error ejecutando actualización:", err);
  process.exit(1);
});
