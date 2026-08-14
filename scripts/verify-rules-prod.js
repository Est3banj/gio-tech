/**
 * verify-rules-prod.js — Verificación 1.7 (change secure-firestore-usuarios)
 *
 * Verifica las Firestore rules YA DEPLOYADAS en el proyecto `gio-tech` contra
 * la REST API de Firestore usando identidades REALES de producción (login
 * Firebase Auth por REST). Reemplaza el Rules Playground manual.
 *
 * Método elegido por el dueño: identidades reales + REST, sin writes reales.
 *
 * USO (las 4 credenciales son OBLIGATORIAS, nunca hardcodeadas):
 *   GIO_PROD_ADMIN_EMAIL=... GIO_PROD_ADMIN_PASS=... \
 *   GIO_PROD_ASESOR_EMAIL=... GIO_PROD_ASESOR_PASS=... \
 *   node scripts/verify-rules-prod.js
 *
 * La API key pública se lee de .env (VITE_FIREBASE_API_KEY). firebase-admin se
 * usa SOLO para el cleanup de emergencia del doc de test (service-account.json).
 *
 * Seguridad:
 *   - Los UNICOS writes permitidos son los casos 13 y 14 (crear y actualizar un
 *     doc de test ANÓNIMO, por diseño del fix REQ-013): el doc es ENTERAMENTE
 *     nuestro artefacto (productoId sentinel "__verify__") y se limpia con
 *     admin SDK al inicio y al final de la corrida.
 *   - Los casos 12 y 15 DEBEN ser rechazados (create con campo extra): si por
 *     bug fueran permitidos, cleanup inmediato via admin SDK.
 *   - Nunca se loguean tokens completos ni credenciales (solo email enmascarado).
 *   - Timeout 15s por request, retry una vez ante 429/5xx.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const PROJECT = "gio-tech";
const DATABASE = "(default)";
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/${DATABASE}/documents`;
const AUTH_URL = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword";
const TIMEOUT_MS = 15000;
const RETRY_DELAY_MS = 1500;

// Uids reales de asesores, tomados de scripts/backfill-perfiles-applied-*.json
// (camila = caso "uidAsesor1"; camilo = caso "uidAsesor2" / doc ajeno).
const UID_ASESOR_1 = "LZmMv5RaIGWD0xfFycXSSpgP0EC3"; // Camila muñoz
const UID_ASESOR_2 = "OPBGgnnpDYTPGkkpAzQruYOJL8K2"; // Camilo Vallejo
const OTROS_ASESORES = [
  "0FQmJN8yPsZvPMZAm1rTsmrjG5d2", // Luis Carlos
  "LZmMv5RaIGWD0xfFycXSSpgP0EC3", // Camila muñoz
  "OPBGgnnpDYTPGkkpAzQruYOJL8K2", // Camilo Vallejo
  "PYCu9m7EfKXnRrK6qj8jVLttfXx2", // Corymar
  "Rh8p9XTdGEhe8t4b7lTed3jSKRH2", // Giovanni
  "VhNc1nqYz7OnQAabxy8zqQ0bXK22", // STEVEN
  "u06BSWw4Z2ZgbVI0vQmUWwiVjbM2", // Lina
];

// Docs de test para los casos 12-15: prefijo verify_ para identificación
// inmediata. NOTA: Firestore RESERVA los ids que empiezan con "__" (p. ej.
// __name__) — un id tipo __verify_prod_test__ no se puede ni crear ni borrar
// (400 INVALID_ARGUMENT: reserved id), por eso se usa verify_prod_test. El
// campo sentinel productoId == "__verify__" garantiza que el cleanup jamás
// borre un doc real que casualmente tenga ese id.
const TEST_DOC_ID = "verify_prod_test";
const TEST_DOC_ID_2 = "verify_prod_test2";
const TEST_DOC_IDS = [TEST_DOC_ID, TEST_DOC_ID_2];
const TEST_SENTINEL = "__verify__";

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

function maskEmail(email) {
  if (!email || !email.includes("@")) return email ? email.slice(0, 2) + "***" : "?";
  const [user, domain] = email.split("@");
  return `${user.slice(0, 2)}***@${domain}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// GET / PATCH / POST generico con timeout, redirects respetados y un retry
// (solo 429/5xx). Devuelve { status, json }.
async function http(method, url, { token = null, body = null } = {}) {
  let last;
  for (let attempt = 0; attempt < 2; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(url, {
        method,
        redirect: "follow",
        headers,
        body: body != null ? JSON.stringify(body) : undefined,
        signal: ctrl.signal,
      });
      const json = await res.json().catch(() => null);
      last = { status: res.status, json };
      if ((res.status === 429 || res.status >= 500) && attempt === 0) {
        console.log(`  (retry por ${res.status} en ${method} ${url})`);
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      return last;
    } catch (err) {
      const msg = err.name === "AbortError" ? `timeout (>${TIMEOUT_MS}ms)` : err.message;
      last = { status: 0, json: { error: { message: msg } } };
      if (attempt === 0) {
        await sleep(RETRY_DELAY_MS);
        continue;
      }
    } finally {
      clearTimeout(timer);
    }
  }
  return last;
}

// Login Firebase Auth por REST con identidad REAL de produccion.
// Devuelve { idToken, uid (localId), email }.
async function login(apiKey, email, password, label) {
  const res = await http("POST", `${AUTH_URL}?key=${apiKey}`, {
    body: { email, password, returnSecureToken: true },
  });
  if (res.status !== 200 || !res.json || !res.json.idToken) {
    const msg = res.json && res.json.error ? res.json.error.message : "respuesta inesperada";
    throw new Error(
      `Login ${label} falló (status ${res.status}) para ${maskEmail(email)}: ${msg}`
    );
  }
  return { idToken: res.json.idToken, uid: res.json.localId, email: res.json.email };
}

// Cleanup de emergencia con admin SDK (service-account.json, gitignoreado).
// firebase-admin se carga LAZY: solo se toca si hay algo que limpiar.
// Traba de seguridad: SOLO borra el doc si es NUESTRO artefacto de test
// (productoId sentinel) — jamás toca un doc real con ese id.
async function deleteTestDoc(docId = TEST_DOC_ID) {
  const admin = require("firebase-admin");
  const serviceAccount = require("./service-account.json");
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }
  const ref = admin.firestore().collection("producto_stats").doc(docId);
  const snap = await ref.get();
  if (!snap.exists) return false;
  const data = snap.data() || {};
  if (data.productoId !== TEST_SENTINEL) {
    throw new Error(
      `SEGURIDAD: ${docId} NO es el artefacto de test (productoId=${JSON.stringify(data.productoId)}) — NO se borra`
    );
  }
  await ref.delete();
  return true;
}

// ---------------------------------------------------------------------------
// Entrada: credenciales desde env + API key desde .env (NUNCA hardcodeadas)
// ---------------------------------------------------------------------------

function loadApiKey() {
  const envFile = path.join(__dirname, "..", ".env");
  const raw = fs.readFileSync(envFile, "utf8");
  const line = raw
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.startsWith("VITE_FIREBASE_API_KEY="));
  if (!line) throw new Error("No se encontró VITE_FIREBASE_API_KEY en .env");
  return line.slice("VITE_FIREBASE_API_KEY=".length).trim().replace(/^["']|["']$/g, "");
}

async function main() {
  const {
    GIO_PROD_ADMIN_EMAIL,
    GIO_PROD_ADMIN_PASS,
    GIO_PROD_ASESOR_EMAIL,
    GIO_PROD_ASESOR_PASS,
  } = process.env;

  const missing = [];
  if (!GIO_PROD_ADMIN_EMAIL) missing.push("GIO_PROD_ADMIN_EMAIL");
  if (!GIO_PROD_ADMIN_PASS) missing.push("GIO_PROD_ADMIN_PASS");
  if (!GIO_PROD_ASESOR_EMAIL) missing.push("GIO_PROD_ASESOR_EMAIL");
  if (!GIO_PROD_ASESOR_PASS) missing.push("GIO_PROD_ASESOR_PASS");
  if (missing.length) {
    console.error("FALTAN credenciales de entorno:", missing.join(", "));
    console.error("");
    console.error("USO (cuentas REALES de producción, NUNCA hardcodear):");
    console.error("  GIO_PROD_ADMIN_EMAIL=<email admin real> GIO_PROD_ADMIN_PASS=<pass> \\");
    console.error("  GIO_PROD_ASESOR_EMAIL=<email asesor real> GIO_PROD_ASESOR_PASS=<pass> \\");
    console.error("  node scripts/verify-rules-prod.js");
    process.exit(1);
  }

  const apiKey = loadApiKey();

  // Pre-flight: limpiar docs de test stale de una corrida anterior (idempotencia).
  for (const docId of TEST_DOC_IDS) {
    try {
      const deleted = await deleteTestDoc(docId);
      if (deleted) {
        console.log(`Pre-cleanup: ${docId} existía de una corrida anterior — eliminado.`);
      }
    } catch (err) {
      console.error(`AVISO: pre-cleanup de ${docId} falló: ${err.message} (se reintenta en la verificación final)`);
    }
  }

  console.log("=== Verificación de Firestore Rules en producción (gio-tech) ===");
  console.log(`Identidades: admin=${maskEmail(GIO_PROD_ADMIN_EMAIL)} asesor=${maskEmail(GIO_PROD_ASESOR_EMAIL)}`);
  console.log(`Uids fijos de artefactos: asesor1=${UID_ASESOR_1} asesor2=${UID_ASESOR_2}`);
  console.log("");

  // Login con identidades REALES — el localId ES el uid real del usuario.
  const adminAuth = await login(apiKey, GIO_PROD_ADMIN_EMAIL, GIO_PROD_ADMIN_PASS, "admin");
  const asesorAuth = await login(apiKey, GIO_PROD_ASESOR_EMAIL, GIO_PROD_ASESOR_PASS, "asesor");
  console.log(`Logins OK — uid admin: ${adminAuth.uid} | uid asesor: ${asesorAuth.uid}`);
  console.log("");

  // Sanity checks: los escenarios cruzados requieren usuarios DISTINTOS.
  if (adminAuth.uid === asesorAuth.uid) {
    console.error("SEVERO: las credenciales de admin y asesor pertenecen al MISMO usuario —");
    console.error("imposible verificar reglas cruzadas. Usá cuentas distintas.");
    process.exit(1);
  }
  // uidOtro: por defecto UID_ASESOR_2 (Camilo), salvo que sea el propio asesor logueado.
  let uidOtro = UID_ASESOR_2;
  if (uidOtro === asesorAuth.uid) {
    uidOtro = OTROS_ASESORES.find((u) => u !== asesorAuth.uid);
    console.log(`AVISO: el asesor logueado ES Camilo (${UID_ASESOR_2}) — caso 6 usará uid ajeno ${uidOtro}`);
  }
  if (!uidOtro) {
    console.error("SEVERO: no hay uid ajeno disponible para el caso 6 — abortando.");
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // Definición de los 15 casos. cada uno devuelve { status, json, extra }.
  // -------------------------------------------------------------------------

  const cases = [
    {
      id: 1,
      desc: "anónimo GET usuarios/{asesor1}",
      esperado: "DENY 403",
      expectAllow: false,
      run: () => http("GET", `${BASE_URL}/usuarios/${UID_ASESOR_1}`),
      // Fuga de PII cerrada: read de usuarios exige auth.
    },
    {
      id: 2,
      desc: "anónimo GET perfiles_publicos/{asesor1}",
      esperado: "ALLOW 200",
      expectAllow: true,
      run: () => http("GET", `${BASE_URL}/perfiles_publicos/${UID_ASESOR_1}`),
      // Vista pública del enlace ?asesor= (doc respaldado por backfill).
    },
    {
      id: 3,
      desc: "anónimo GET carrusel/{doc}",
      esperado: "ALLOW 200/404",
      expectAllow: true,
      run: () => http("GET", `${BASE_URL}/carrusel/no-existe-verify`),
      // No-regresión: lectura pública del carrusel intacta. Sin id real a mano
      // (los slides se crean con addDoc -> ids auto), un 404 = regla ALLOW con
      // doc inexistente; 403 = regla rota. PASS = 200 o 404.
      // NOTA (14-08-2026): devuelve OBJETO { pass } — antes devolvía booleano y el
      // runner lo interpretaba mal (verdadero -> .pass undefined -> FAIL). 404 =
      // ALLOW con doc inexistente (si la regla negara, Firestore responde 403).
      isPass: (r) => ({ pass: r.status === 200 || r.status === 404 }),
    },
    {
      id: 4,
      desc: "asesor GET usuarios/{self}",
      esperado: "ALLOW 200",
      expectAllow: true,
      run: () => http("GET", `${BASE_URL}/usuarios/${asesorAuth.uid}`, { token: asesorAuth.idToken }),
      // Get del propio doc: el asesor puede leerse a sí mismo.
    },
    {
      id: 5,
      desc: "asesor GET usuarios/{uidAdmin}",
      esperado: "DENY 403",
      expectAllow: false,
      run: () => http("GET", `${BASE_URL}/usuarios/${adminAuth.uid}`, { token: asesorAuth.idToken }),
      // Un asesor NO puede leer el doc de un admin.
    },
    {
      id: 6,
      desc: `asesor GET usuarios/{asesor2=${uidOtro}}`,
      esperado: "DENY 403",
      expectAllow: false,
      run: () => http("GET", `${BASE_URL}/usuarios/${uidOtro}`, { token: asesorAuth.idToken }),
      // Un asesor NO puede leer el doc de OTRO asesor (get exige self o admin).
    },
    {
      id: 7,
      desc: "asesor PATCH usuarios/{self} rol=admin",
      esperado: "DENY 403",
      expectAllow: false,
      run: () =>
        http(
          "PATCH",
          `${BASE_URL}/usuarios/${asesorAuth.uid}?updateMask.fieldPaths=rol`,
          {
            token: asesorAuth.idToken,
            body: { fields: { rol: { stringValue: "admin" } } },
          }
        ),
      // ANTI-ESCALACIÓN: update self limitado a affectedKeys
      // [whatsappNumber, nombreCompleto]; rol NO puede auto-promoverse.
      isPass: (r) =>
        r.status === 200
          ? { pass: false, severo: true }
          : { pass: r.status === 403, severo: false },
    },
    {
      id: 8,
      desc: "asesor LIST usuarios",
      esperado: "DENY 403",
      expectAllow: false,
      run: () => http("GET", `${BASE_URL}/usuarios`, { token: asesorAuth.idToken }),
      // list exige isAdmin (invariante por request — AdminPanel.tsx:122).
    },
    {
      id: 9,
      desc: "admin LIST usuarios",
      esperado: "ALLOW 200",
      expectAllow: true,
      run: () => http("GET", `${BASE_URL}/usuarios`, { token: adminAuth.idToken }),
      // El listado admin sigue funcionando (tab asesores).
    },
    {
      id: 10,
      desc: "admin GET usuarios/{asesor1}",
      esperado: "ALLOW 200",
      expectAllow: true,
      run: () => http("GET", `${BASE_URL}/usuarios/${UID_ASESOR_1}`, { token: adminAuth.idToken }),
      // isAdmin() autoriza get de cualquier doc.
    },
    {
      id: 11,
      desc: "anónimo GET usuarios/{asesor1} (re-check fuga)",
      esperado: "DENY 403",
      expectAllow: false,
      run: () => http("GET", `${BASE_URL}/usuarios/${UID_ASESOR_1}`),
      // Repetición del caso 1 como control final: la fuga sigue cerrada luego
      // de TODOS los casos intermedios (ninguno pudo haberla reabierto).
    },
    {
      id: 12,
      desc: `asesor POST producto_stats?documentId=${TEST_DOC_ID} (+campo extra)`,
      esperado: "DENY 403",
      expectAllow: false,
      run: () =>
        http(
          "POST",
          `${BASE_URL}/producto_stats?documentId=${TEST_DOC_ID}`,
          {
            token: asesorAuth.idToken,
            body: {
              fields: {
                vistas: { integerValue: "1" },
                productoId: { stringValue: TEST_SENTINEL },
                ultimaVista: { timestampValue: "2026-08-14T00:00:00Z" },
                basura: { stringValue: "campo no permitido" },
              },
            },
          }
        ),
      // create exige hasOnly([vistas, productoId, ultimaVista]) && vistas==1.
      // El campo "basura" rompe hasOnly -> DENY. Si por bug diera 200,
      // cleanup inmediato (admin SDK) + FAIL severo.
      isPass: async (r) => {
        if (r.status === 200) {
          const deleted = await deleteTestDoc().catch((err) => {
            console.error(`  SEVERO: cleanup de ${TEST_DOC_ID} FALLÓ: ${err.message}`);
            return false;
          });
          return {
            pass: false,
            severo: true,
            note: deleted
              ? `cleanup ejecutado: ${TEST_DOC_ID} eliminado vía admin SDK`
              : `cleanup falló: ${TEST_DOC_ID} puede seguir existiendo — REVISAR MANUALMENTE`,
          };
        }
        return { pass: r.status === 403, severo: false };
      },
    },
    {
      id: 13,
      desc: "anónimo POST producto_stats?documentId=verify_prod_test (create válido)",
      esperado: "ALLOW 200",
      expectAllow: true,
      run: () =>
        http(
          "POST",
          `${BASE_URL}/producto_stats?documentId=${TEST_DOC_ID}`,
          {
            body: {
              fields: {
                vistas: { integerValue: "1" },
                productoId: { stringValue: TEST_SENTINEL },
                ultimaVista: { timestampValue: "2026-08-14T00:00:00Z" },
              },
            },
          }
        ),
      // FIX REQ-013: create SIN auth con estructura EXACTA (vistas==1, string,
      // timestamp, hasOnly) -> ALLOW. ESTE CASO CREA UN DOC REAL por diseño:
      // el caso 14 lo usa como resource (vistas 1 -> 2) y el cleanup pre/post
      // lo elimina (productoId sentinel "__verify__"). Sin token -> anónimo.
      // Si este caso fallara (403), el 14 recibirá 404 (dependencia encadenada).
    },
    {
      id: 14,
      desc: "anónimo PATCH producto_stats/verify_prod_test (update +1)",
      esperado: "ALLOW 200",
      expectAllow: true,
      run: () =>
        http(
          "PATCH",
          `${BASE_URL}/producto_stats/${TEST_DOC_ID}?updateMask.fieldPaths=vistas&updateMask.fieldPaths=ultimaVista`,
          {
            body: {
              fields: {
                vistas: { integerValue: "2" },
                ultimaVista: { timestampValue: "2026-08-14T00:00:00Z" },
              },
            },
          }
        ),
      // FIX REQ-013: update SIN auth, affectedKeys == [vistas, ultimaVista] y
      // vistas == resource + 1 (el caso 13 dejó vistas=1 -> 2 cumple) -> ALLOW.
      // Encadenado al caso 13: si ese falló, este recibe 404 (FAIL informativo).
    },
    {
      id: 15,
      desc: "anónimo POST producto_stats?documentId=verify_prod_test2 (+campo extra)",
      esperado: "DENY 403",
      expectAllow: false,
      run: () =>
        http(
          "POST",
          `${BASE_URL}/producto_stats?documentId=${TEST_DOC_ID_2}`,
          {
            body: {
              fields: {
                vistas: { integerValue: "1" },
                productoId: { stringValue: TEST_SENTINEL },
                ultimaVista: { timestampValue: "2026-08-14T00:00:00Z" },
                basura: { stringValue: "campo no permitido" },
              },
            },
          }
        ),
      // FIX REQ-013: AUNQUE el create anónimo esté permitido (caso 13), la
      // validación estructural sigue vigente: "basura" rompe hasOnly -> DENY.
      // Si por bug diera 200, cleanup inmediato (admin SDK) + FAIL severo.
      isPass: async (r) => {
        if (r.status === 200) {
          const deleted = await deleteTestDoc(TEST_DOC_ID_2).catch((err) => {
            console.error(`  SEVERO: cleanup de ${TEST_DOC_ID_2} FALLÓ: ${err.message}`);
            return false;
          });
          return {
            pass: false,
            severo: true,
            note: deleted
              ? `cleanup ejecutado: ${TEST_DOC_ID_2} eliminado vía admin SDK`
              : `cleanup falló: ${TEST_DOC_ID_2} puede seguir existiendo — REVISAR MANUALMENTE`,
          };
        }
        return { pass: r.status === 403, severo: false };
      },
    },
  ];

  // -------------------------------------------------------------------------
  // Ejecución y reporte
  // -------------------------------------------------------------------------
  const results = [];
  let fails = 0;
  let aborted = false;

  for (const c of cases) {
    process.stdout.write(`#${String(c.id).padStart(2)} ${c.desc} ... `);
    let res;
    try {
      res = await c.run();
    } catch (err) {
      res = { status: 0, json: { error: { message: err.message } } };
    }

    const verdict = c.isPass ? await c.isPass(res) : null;
    let pass;
    let severo = false;
    if (verdict !== null && verdict !== undefined) {
      // Contrato del veredicto: objeto { pass, severo? } o booleano (defensa).
      pass = typeof verdict === "object" ? !!verdict.pass : !!verdict;
      severo = typeof verdict === "object" && !!verdict.severo;
    } else {
      // Veredicto por defecto: status exacto según la expectativa del caso.
      pass = c.expectAllow ? res.status === 200 : res.status === 403;
    }

    const esperado = c.esperado;
    const obtenido = res.status ? String(res.status) : "ERR";
    const linea = `${c.id} | ${c.desc} | ${esperado} | ${obtenido} | ${pass ? "PASS" : "FAIL"}`;
    console.log(pass ? "PASS" : "***** FAIL *****");
    results.push(linea);
    if (!pass) {
      fails++;
      if (severo) {
        console.error(`  SEVERO: ${verdict.note || "regla permitió un write que debía ser denegado"}`);
        if (c.id === 7) {
          aborted = true;
          console.error("  SEVERO: el asesor pudo haber escalado a admin — SE ABORTA la corrida.");
          console.error("  Remediación manual requerida: revertir el rol del usuario en la consola de Firebase.");
          break;
        }
      }
    }
  }

  console.log("");
  console.log("=== Resultado por caso ===");
  console.log("# | descripción | esperado | obtenido | resultado");
  console.log("-".repeat(80));
  for (const l of results) console.log(l);

  const total = results.length;
  const ok = total - fails;
  console.log("");
  console.log(`Resumen: ${ok}/${total} PASS${aborted ? " (corrida abortada)" : ""}`);

  // Verificación final de que NO quedó ningún doc de test (post-casos).
  for (const docId of TEST_DOC_IDS) {
    try {
      const exists = await deleteTestDoc(docId);
      if (exists) {
        console.error(`SEVERO: ${docId} reapareció tras los casos 13-15 — eliminado por segunda vez.`);
      } else {
        console.log(`Cleanup verificado: ${docId} no existe en producción.`);
      }
    } catch (err) {
      console.error(`AVISO: verificación final de cleanup falló (${docId}): ${err.message}`);
    }
  }

  process.exit(ok === total && !aborted ? 0 : 1);
}

main().catch((err) => {
  console.error(`FATAL: ${err.message}`);
  process.exit(1);
});