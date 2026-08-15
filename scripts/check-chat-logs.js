const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const isApply = process.argv.includes("--apply");
const BATCH_SIZE = 250;

const serviceAccount = require("./service-account.json");
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const COLLECTION = "chat_logs";

function saveArtifact(kind, ts, payload) {
  const file = path.join(__dirname, `chat-logs-cleanup-${kind}-${ts}.json`);
  fs.writeFileSync(file, JSON.stringify(payload, null, 2));
  console.log(`Artefacto: ${file}`);
}

async function countDocs() {
  let count = 0;
  let offset = 0;
  while (true) {
    const snap = await db.collection(COLLECTION).limit(BATCH_SIZE).offset(offset).select().get();
    count += snap.size;
    if (snap.size < BATCH_SIZE) break;
    offset += BATCH_SIZE;
  }
  return count;
}

async function sampleIds(limit) {
  const snap = await db.collection(COLLECTION).limit(limit).select().get();
  return snap.docs.map((doc) => doc.id);
}

async function deleteAllDocs() {
  let deleted = 0;
  while (true) {
    const snap = await db.collection(COLLECTION).limit(BATCH_SIZE).select().get();
    if (snap.empty) break;
    const batch = db.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    deleted += snap.size;
    if (snap.size < BATCH_SIZE) break;
  }
  return deleted;
}

async function main() {
  const ts = new Date().toISOString();
  const fileTs = ts.replace(/:/g, "-");

  console.log(`=== Chat logs cleanup (${isApply ? "APPLY" : "PREVIEW"}) ===`);
  console.log(`Colección: ${COLLECTION}`);

  const preCount = await countDocs();
  console.log(`Docs en ${COLLECTION}: ${preCount}`);

  if (!isApply) {
    const sample = preCount > 0 ? await sampleIds(Math.min(preCount, 10)) : [];
    console.log(`Sample de ids (${sample.length}):`);
    sample.forEach((id) => console.log(`  - ${id}`));
    saveArtifact("preview", fileTs, {
      collection: COLLECTION,
      mode: "preview",
      count: preCount,
      sampleIds: sample,
      timestamp: ts,
    });
    if (preCount === 0) {
      console.log("Cero docs: no hay nada que borrar.");
    }
    return;
  }

  if (preCount === 0) {
    console.log("0 docs, nada que hacer.");
    saveArtifact("applied", fileTs, {
      collection: COLLECTION,
      mode: "apply",
      preCount: 0,
      deleted: 0,
      postCount: 0,
      timestamp: ts,
    });
    return;
  }

  console.log(`Borrando ${preCount} docs en batches de ${BATCH_SIZE}...`);
  const deleted = await deleteAllDocs();
  const postCount = await countDocs();
  console.log(`Borrados: ${deleted}`);
  console.log(`Conteo post-borrado: ${postCount}`);

  saveArtifact("applied", fileTs, {
    collection: COLLECTION,
    mode: "apply",
    preCount,
    deleted,
    postCount,
    timestamp: ts,
  });
}

main().then(() => process.exit(0)).catch((err) => {
  console.error("ERROR en check-chat-logs:", err);
  process.exit(1);
});