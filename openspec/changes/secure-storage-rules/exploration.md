# Exploración: secure-storage-rules

**Change**: `secure-storage-rules`
**Fecha**: 2026-08-15
**Fuente**: auditoría de seguridad con doble evidencia (ruleset publicado + verificación REST) del 15/08/2026
**Modo de exploración**: SOLO lectura — no modifiqué código fuente, `firebase.json` ni reglas; solo este artefacto.

---

## 1. Estado publicado de Cloud Storage (riesgo CRÍTICO)

El bucket `gio-tech.firebasestorage.app` tiene publicadas desde el 26/06/2025 (ruleset **`f5eadf4f`**) estas reglas:

```
match /{allPaths=**} { allow read, write: if true; }
```

**ABIERTO TOTAL**: cualquier persona sin autenticación puede leer, subir, sobrescribir y BORRAR cualquier objeto del bucket. Sin auth, sin validación de tipo, sin límite de tamaño, sin rate-limit. El bucket puede usarse como storage de malware gratuito (los objetos se sirven desde el dominio del proyecto) o vaciarse por completo vía REST (delete permite).

**Material previo a revisar**: existe un ruleset más nuevo, **`04df2ff0`** (mismo día, 26/06/2025), que **NUNCA se publicó** (no aparece en el release activo). Vale inspeccionarlo antes de deployar (puede contener la intención original de endurecer; si es más estricto que lo publicado, documentar qué cambió y por qué no se publicó).

## 2. Estado en el repo (cero versionado)

| Ítem | Estado | Evidencia |
|---|---|---|
| `storage.rules` en el repo | **NO existe** | `ls storage.rules` → no encontrado |
| Sección `"storage"` en `firebase.json` | **NO existe** | `grep -c '"storage"' firebase.json` → 0; el archivo solo tiene `firestore` + `hosting` |
| Historial de reglas | Nulo | Las reglas viven solo en la consola; nunca versionadas ni deployadas por CLI |

→ Las reglas de Storage del proyecto son invisibles para el repo: cero trazabilidad, cero review, cero rollback reproducible. Misma familia de hallazgo que ya relevó la exploración de `secure-chat-logs` (archivada, §5): *"Storage SIN reglas en el repo... las reglas de Storage viven en la consola (no versionadas)"*.

## 3. Quién escribe el bucket (único upload en el código)

**UN solo call site real** — `src/components/AdminBusinessConfig.tsx` (admin):

- `:54` — `const logoRef = ref(storage, `config/logo_${Date.now()}`)` → path `config/logo_<timestamp>` **SIN extensión**.
- `:55` — `await uploadBytes(logoRef, logoNegocio)`.
- `:56` — `logoUrl = await getDownloadURL(logoRef)` → la URL pública se guarda en `configuracion` (doc `general`, campo `logo`).
- `:114` — input `type="file" accept="image/*"` → **acepta `image/svg+xml`**: un SVG subido se sirve desde el dominio del proyecto con content-type SVG (vector XSS servido con origen de confianza).
- Sin límite de tamaño en cliente ni en reglas (hoy).
- `:70-74` — `catch` con `setError("Error al actualizar configuración: ...")` → un write denegado por reglas nuevas se muestra al admin (no es silencioso).

**Sin `deleteObject` en todo el repo** (grep `deleteObject` sobre `src/` → 0 matches): el flujo de logo es write-only. Cada cambio de logo acumula un objeto nuevo para siempre. Hoy hay 1 objeto `config/logo_1750909570905` (jun/2025, primer/único logo vía app) que jamás se borrará con el código actual.

## 4. Objetos existentes en el bucket (inventario conocido de la auditoría)

| Objeto | Path | Origen |
|---|---|---|
| `config/logo_1750909570905` | `config/` | Único upload por la app (jun/2025) |
| `Photoroom_20250624_195858.JPEG` | **RAÍZ del bucket** | Subido a mano por consola (jun/2025) — huérfano, sin consumidor en el código |

El nombre en raíz no matchea ningún path que el código use (`config/...`). El read público de ambos queda cubierto por el catch-all; el segundo no es leído por la app (el `logo` de `configuracion` apunta al de `config/`).

## 5. Quién LEE el bucket (requisito funcional innegociable)

El front sirve el logo por **URL directa de Storage** (`getDownloadURL`) a usuarios **ANÓNIMOS** (landing y catálogo público, sin login).

→ **El read público NO es un accidente: es requisito funcional.** Cualquier regla que restrinja read rompe el logo en todas las páginas públicas. La única vía alternativa sería servir el logo desde hosting (cambio de front + pipeline de deploy), fuera del alcance de este change.

## 6. Patrón de admin ya instalado (reutilizable)

`firestore.rules:5-7` define oficialmente el criterio de admin del proyecto:

```
function isAdmin() {
  return get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.rol == 'admin';
}
```

**Cloud Storage rules soporta cross-service `firestore.get()`** (desde 2022, verificado en doc oficial): se puede consultar el doc de `usuarios/{uid}` desde las reglas de Storage con sintaxis de path **literal** `(default)` (NO `$(database)`):

```
firestore.get(/databases/(default)/documents/usuarios/$(request.auth.uid)).data.rol == 'admin'
```

- El rol vive en el doc `usuarios/{uid}` (campo `rol: 'admin' | 'asesor' | 'cliente'`, `src/types/index.ts:58`); sin custom claims (verificado en change anterior).
- **Requisito de infra**: el primer deploy de reglas con `firestore.get()` pide habilitar el IAM role "Firebase Rules Firestore Service Agent" (prompt del CLI/consola) — contemplado en tasks (Fase 1).
- **Costo**: cada evaluación de regla con `firestore.get()` = 1 lectura facturada de Firestore, incluso si la operación se deniega (doc oficial). Frecuencia esperada: solo writes de admin al logo (raros) → costo despreciable. Limitación: máx. 2 docs distintos por evaluación (no aplica: consultamos 1).

## 7. Contexto operativo: billing

El proyecto tiene **billing cerrado** (descargas con 402 — `billing disabled`). El dueño está reactivándolo en consola. **Riesgo operativo, NO condición del change**: la verificación funcional del read (curl → 200) depende de billing activo; con billing cerrado el curl devuelve 402 **aunque la regla permita el read**. La verificación de DENY (upload anónimo → 403) NO depende del billing (la denegación ocurre en la evaluación de reglas). El plan distingue ambas evidencias y marca el 200 como gate que se re-corre una vez reactivado el billing.

## 8. Opciones de solución

### Opción A — read público + write SOLO admin en `/config/` (**DECISIÓN DEL DUEÑO, aprobada**)

```
match /{allPaths=**} { allow read: if true; allow write: if false; }
match /config/{file} {
  allow read: if true;
  allow write: if isAdmin() && request.resource.size < 2 * 1024 * 1024
    && request.resource.contentType.matches('image/(png|jpeg|jpg|webp)$');
}
```

- **Pros**: cierra el bucket casi completo (write segue denegado en TODA la superficie excepto `/config/` y solo admin); conserva el read público funcional; valida tipo (mata el SVG/XSS) y tamaño (2 MB); consistente con el criterio de admin ya desplegado en Firestore; requiere SOLO rules + `firebase.json` + verificación — sin tocar front.
- **Contras**: el admin NO puede borrar objetos (delete = write y en delete no hay `request.resource` → las condiciones de tamaño/tipo fallan): los 2 objetos existentes quedan inmutables vía reglas; el path `config/` sin extensión sigue siendo feo (los content-type los determina el upload, no el nombre); el logo futuro que exceda 2 MB o no sea PNG/JPEG/WebP fallará con error visible en el admin (aceptable, se anota como evolución de front).
- **Esfuerzo**: **Bajo** (1 archivo de rules + 3 líneas en `firebase.json` + verificación REST).

### Opción B — write solo `request.auth != null` (descartada)

`allow write: if request.auth != null` no distingue admin de asesor/cliente: **cualquier usuario logueado del sistema** (los clientes se loguean por email/password) podría escribir en el bucket. No cierra nada real: el vector de abuso pasa de "cualquiera" a "cualquiera con cuenta", que en este proyecto es registro público. No aporta frente a Opción A y deja el bucket igual de abusable para el registro (spam de storage, SVG, etc.).

### Opción C — read restringido (descartada)

`allow read: if request.auth != null` o similar rompe la funcionalidad principal (logo servido a anónimos vía `getDownloadURL`, exploración §5). Inaceptable sin re-diseñar cómo se sirven las imágenes públicas (hosting, CDN aparte) — scope creep puro para este change.

## 9. Riesgos de reglarla mal (lección instalada)

1. **Orden de match en Storage rules es FIRST-MATCH-WINS** (a diferencia de Firestore, donde múltiples matches hacen OR): si el catch-all `/{allPaths=**}` se declara ANTES que `/config/{file}`, todo write —incluido el del admin a `config/`— cae en el catch-all (`write: if false`) y **la regla de `/config` jamás se evalúa**. El bloque `/config/{file}` DEBE ir PRIMERO. Es el riesgo #1 de implementación: el orden listado en la decisión del dueño (catch-all primero) no refleja el orden de declaración correcto.
2. **Sintaxis cross-service**: en Storage rules el path de Firestore es literal `(/databases/(default)/documents/...)`; usar `$(database)` (sintaxis de Firestore rules) NO compila/falla en runtime (errores documentados en StackOverflow/doc oficial). El prompt de IAM del primer deploy es obligatorio (Fase 1).
3. **`request.resource` es null en delete**: las reglas de write con validación de `request.resource.size`/`contentType` deniegan también los delete (incluso admin). No es un bug: es el comportamiento a documentar (objetos viejos inmutables vía reglas → limpieza queda fuera de scope).
4. **Verificar en producción, no "a ciegas"**: la lección de los changes previos (`producto_stats`, `chat_logs`) es que los 403 mueren en silencio sin suite. Este change define evidencia REST reproducible: upload anónimo → 403, upload anónimo a `config/` → 403, GET del logo → 200 (gate billing), ruleset publicado = el del repo (API de rulesets con el token existente, NO `firebase login:ci`).
5. **Billing cerrado**: el 402 en descargas NO es fallo de rules (ver §7) — el gate del read se re-corre con billing activo y el 403 de deny se verifica igualmente.

## Verificación realizada

- `git status --short` → **vacío**: cero cambios en el repo al terminar esta exploración.
- Evidencia recogida: `AdminBusinessConfig.tsx:2,44,54-56,114`; `firebase.json` (sin sección storage); ausencia de `storage.rules`; `firestore.rules:5-7` (patrón isAdmin a reutilizar); grep `deleteObject` en `src/` → 0 matches; doc oficial cross-service rules (firestore.get / firestore.exists, path literal `(default)`, límite 2 docs, prompt IAM); token de deploy existente en `~/.config/configstore/firebase-tools.json` (refresh_token presente — verificado, para los comandos curl de la Fase 1); rulesets publicados según auditoría (`f5eadf4f` activo desde 26/06/2025; `04df2ff0` nunca publicado — material previo a revisar en Fase 1).

### Ready for Proposal

Sí. El orchestrator debe informar al dueño: (1) el bucket está ABIERTO TOTAL desde 26/06/2025 (read+write anónimos, delete incluido); (2) las reglas nunca se versionaron en el repo; (3) la decisión A (aprobada) cierra el write global y deja `/config/` para admin con validación de tipo (PNG/JPEG/WebP) y tamaño (2 MB), preservando el read público funcional; (4) riesgos operativos: billing cerrado (verificación 200 diferida) y objetos existentes que quedan inmutables (limpieza fuera de scope); (5) OJO implementación: orden de match `/config` ANTES del catch-all.