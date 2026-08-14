const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const isApply = process.argv.includes("--apply");

const serviceAccount = require("./service-account.json");
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

function buildWrite(data) {
  const write = {};
  if (data.nombreCompleto != null) write.nombreCompleto = data.nombreCompleto;
  if (data.whatsappNumber != null) write.whatsappNumber = data.whatsappNumber;
  return write;
}

function saveArtifact(kind, ts, payload) {
  const file = path.join(__dirname, `backfill-perfiles-${kind}-${ts}.json`);
  fs.writeFileSync(file, JSON.stringify(payload, null, 2));
  console.log(`Artefacto: ${file}`);
}

async function main() {
  const ts = new Date().toISOString();
  const fileTs = ts.replace(/:/g, "-");

  const [usuariosSnap, asesoresSnap] = await Promise.all([
    db.collection("usuarios").get(),
    db.collection("usuarios").where("rol", "==", "asesor").get(),
  ]);

  const rows = [];
  for (const doc of asesoresSnap.docs) {
    const data = doc.data();
    const write = buildWrite(data);
    const perfil = await db.collection("perfiles_publicos").doc(doc.id).get();
    const willCreate = !perfil.exists;
    const willUpdate =
      perfil.exists &&
      Object.keys(write).some((key) => perfil.data()[key] !== write[key]);
    rows.push({
      uid: doc.id,
      nombreCompleto: data.nombreCompleto ?? null,
      whatsappNumber: data.whatsappNumber ?? null,
      willCreate,
      willUpdate,
      write,
    });
  }

  const sinWhatsapp = rows.filter((r) => r.whatsappNumber == null).length;
  const pendientes = rows.filter((r) => r.willCreate || r.willUpdate).length;

  console.log(`=== Backfill perfiles_publicos (${isApply ? "APPLY" : "PREVIEW"}) ===`);
  console.log(`Total usuarios (coleccion): ${usuariosSnap.size}`);
  console.log(`Asesores (rol == 'asesor'): ${rows.length}`);
  console.log(`Asesores sin whatsappNumber: ${sinWhatsapp}`);
  console.log(`Perfiles a crear: ${rows.filter((r) => r.willCreate).length}`);
  console.log(`Perfiles a actualizar: ${rows.filter((r) => r.willUpdate).length}`);
  console.log(`Pendientes: ${pendientes}`);

  if (isApply) {
    for (const r of rows) {
      if (r.willCreate || r.willUpdate) {
        await db.collection("perfiles_publicos").doc(r.uid).set(r.write, { merge: true });
      }
    }
    let verificados = 0;
    for (const r of rows) {
      const perfil = await db.collection("perfiles_publicos").doc(r.uid).get();
      if (perfil.exists && Object.keys(r.write).every((key) => perfil.data()[key] === r.write[key])) {
        verificados++;
      }
    }
    console.log(`Post-apply verificados (doc existe + campos coinciden): ${verificados}/${rows.length}`);
  }

  saveArtifact(isApply ? "applied" : "preview", fileTs, rows);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error("ERROR en backfill:", err);
  process.exit(1);
});