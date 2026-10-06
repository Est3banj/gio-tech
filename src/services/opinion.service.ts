import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  type DocumentData,
  type QuerySnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Opinion } from "../types";

/** Tope de opiniones que la home muestra en el feed rotativo. */
export const OPINIONES_MAX_PUBLICAS = 10;

function mapDoc(snap: DocumentData): Opinion {
  const data = snap.data();
  const raw = data.createdAt;
  let createdAt: Date | undefined;
  if (raw && typeof raw.toDate === "function") {
    createdAt = raw.toDate();
  } else if (raw instanceof Date) {
    createdAt = raw;
  }
  return {
    id: snap.id,
    autor: String(data.autor ?? "").trim(),
    estrellas: Math.min(5, Math.max(1, Number(data.estrellas) || 5)),
    texto: String(data.texto ?? "").trim(),
    ubicacion: data.ubicacion ? String(data.ubicacion).trim() : "",
    perfilUrl: data.perfilUrl ? String(data.perfilUrl).trim() : "",
    activo: data.activo !== false,
    createdAt,
  };
}

/**
 * Suscripción a opiniones ordenadas por fecha (las más recientes primero).
 *
 * NOTA deliberada: NO filtramos `activo` en Firestore. Un `where(activo==true)`
 * junto a `orderBy(createdAt)` exigiría desplegar un índice compuesto; la
 * colección es diminuta (limit 50) y el filtro real (activas + tope de 10)
 * se hace en el hook de lectura pública.
 */
export function subscribeToOpiniones(
  onData: (opiniones: Opinion[]) => void,
  onError: (err: Error) => void
): () => void {
  const q = query(collection(db, "opiniones"), orderBy("createdAt", "desc"), limit(50));
  return onSnapshot(
    q,
    (snap: QuerySnapshot) => onData(snap.docs.map(mapDoc)),
    (err) => onError(err instanceof Error ? err : new Error(String(err)))
  );
}
