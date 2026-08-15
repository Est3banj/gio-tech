# Design: secure-storage-rules

**Change**: `secure-storage-rules`
**Fecha**: 2026-08-15
**Dependencias**: `proposal.md` (Opción A aprobada por el dueño) · `exploration.md` (§1 estado publicado, §3 único upload, §6 patrón admin) · `specs/storage/spec.md` (REQ-001..REQ-006)

---

## Technical Approach

Se reemplazan las reglas actuales del bucket `gio-tech.firebasestorage.app` (ABIERTAS TOTAL desde 26/06/2025, ruleset `f5eadf4f`) por un archivo `storage.rules` versionado en el repo, con la regla exacta de la decisión del dueño (Opción A): **write global denegado** (catch-all `allow write: if false`), **write en `/config/{file}` solo para admin** (rol leído de Firestore vía cross-service `firestore.get()`, mismo criterio que `firestore.rules:5-7`) **con validación de tipo y tamaño** (PNG/JPEG/WebP, < 2 MiB), y **read público preservado** en todo el bucket (requisito funcional: el logo se sirve por `getDownloadURL` a anónimos, `AdminBusinessConfig.tsx:56`).

El deploy pasa a ser por CLI (`firebase deploy --only storage`) con la sección `"storage"` nueva en `firebase.json` (patrón idéntico al de `firestore`). Verificación post-deploy documentada y reproducible vía REST (deny anónimo 403 + ruleset publicado verificado contra el repo con el token existente del configstore), más checklist funcional del dueño (upload admin válido/inválido + logo público).

Cero cambios de front (el flujo de logo admin queda funcional para PNG/JPEG/WebP < 2MB; SVG/>2MB da error visible en la UI, `AdminBusinessConfig.tsx:70-74`) y cero cambios en `firestore.rules`.

---

## Architecture Decisions

### D1. Rol de admin en Storage rules: cross-service `firestore.get()`

**Choice**:

```
function isAdmin() {
  return request.auth != null
    && firestore.get(/databases/(default)/documents/usuarios/$(request.auth.uid)).data.rol == 'admin';
}
```

**Alternatives considered**: custom claims (scope creep: change de authz completo, funciones de gestión de claims, refresco de token); duplicar el criterio inline en Storage con otra fuente de verdad (divergencia futura); regla sin rol (Opción B, descartada por el dueño).
**Rationale**: REHUSO del criterio ya desplegado y probado en `firestore.rules:5-7` (`usuarios/{uid}.data.rol == 'admin'`). Cloud Storage rules soporta cross-service desde 2022 (doc oficial verificada): `firestore.get()`/`firestore.exists()` con path **literal** `(/databases/(default)/documents/...)` — la sintaxis `$(database)` de Firestore rules NO compila en Storage rules (error documentado). Guard `request.auth != null` ANTES del get (no interpolar uid con auth null). Costo: 1 read facturado de Firestore por evaluación — frecuencia de writes de admin al logo: despreciable; límite de la feature (2 docs/evaluación) no se acerca (consultamos 1).

### D2. Orden de declaración: `/config/{file}` ANTES del catch-all (FIRST-MATCH-WINS)

**Choice**: el archivo declara primero `match /config/{file}`, después `match /{allPaths=**}`.

**Rationale**: en Cloud Storage rules la evaluación es **primer match que calza gana** (el request matchea un único bloque; a diferencia de Firestore, donde múltiples matches son OR). Si el catch-all `/{allPaths=**}` estuviera primero, TODO write —incluido el upload legítimo del admin a `config/`— caería en `write: if false` y la regla de `/config` jamás se evaluaría: regresión funcional del logo denegada SILENCIOSAMENTE como "regla mal puesta", indistinguible de un fix roto. Riesgo #1 de implementación; el bloque final fija el orden y la Fase 2 del plan lo prueba con un upload admin real.

### D3. Validación en `request.resource` (create/update) y comportamiento del delete

**Choice**: `request.resource.size < 2 * 1024 * 1024` y `request.resource.contentType.matches('image/(png|jpeg|jpg|webp)$')` en la regla de write de `/config/{file}`.

**Rationale**:
- `request.resource` = metadata del archivo en create/update (bytes + Content-Type, que el SDK JS deriva del Blob/File del input `accept="image/*"`). La regex mata `image/svg+xml` (vector XSS servido desde el dominio del proyecto, hoy aceptado por `AdminBusinessConfig.tsx:114`) y cualquier no-imagen; el tope de 2 MiB pone el límite de tamaño que no existía.
- **Delete**: en un remove `request.resource` es null → las condiciones de tamaño/tipo fallan → delete denegado también para admin. Es el COMPORTAMIENTO DESEADO para este change: los objetos existentes (`config/logo_1750909570905` y el huérfano `Photoroom_20250624_195858.JPEG` de la raíz) quedan inmutables vía reglas. El front NO usa `deleteObject` (grep src/ → 0 matches) → ningún flujo se rompe. La limpieza de esos objetos queda anotada como change futuro (decisión del dueño; requiere mecanismo aparte: consola/Admin SDK o regla futura de delete admin) — NO en este change.

### D4. Read público preservado por diseño (requisito funcional)

**Choice**: `allow read: if true` explícito en `/config/{file}` Y en el catch-all.

**Rationale**: el front sirve el logo por URL directa (`getDownloadURL`, `AdminBusinessConfig.tsx:56`) a usuarios ANÓNIMOS (landing/catálogo sin login). Restringir read (Opción C, descartada) rompería la funcionalidad core; la alternativa (servir por hosting/CDN) es rediseño de serving — fuera de scope. El read público del catch-all también cubre el objeto huérfano de la raíz (legible, inmutable).

### D5. Variables descartadas de la decisión del dueño (documentadas, no re-debatidas)

- **Opción B** (`allow write: if request.auth != null`): no distingue admin — con el registro público por email/password, cualquier cliente escribe en el bucket. Falso cierre.
- **Opción C** (read restringido): rompe el logo público. Inaceptable sin rediseño de serving.

### D6. Permisos de deploy: prompt IAM cross-service + token existente

**Choice**: primer deploy con `firebase deploy --only storage` acepta el prompt de habilitar el cross-service IAM (role "Firebase Rules Firestore Service Agent" — requisito oficial de las reglas con `firestore.get()`); si el CLI no ofrece el prompt, bind manual documentado:

```
gcloud projects add-iam-policy-binding gio-tech \
  --member=serviceAccount:firebase-storage-<project-id>@firebaserules.iam.gserviceaccount.com \
  --role=roles/firebaserules.firestoreServiceAgent
```

**Rationale**: sin ese role, las reglas con `firestore.get()` se compilan pero las operaciones deniegan con error interno (documentado en la comunidad). La verificación de rulesets post-deploy usa el refresh_token EXISTENTE de `~/.config/configstore/firebase-tools.json` (verificado presente) → access token vía `securetoken.googleapis.com` (API key del proyecto, `VITE_FIREBASE_API_KEY` de `.env`) → `firebaserules.googleapis.com` (releases/rulesets). NO se usa `firebase login:ci` (no generar credenciales nuevas).

---

## Reglas Storage — bloque EXACTO final (`storage.rules`, raíz del repo)

⚠️ **ORDEN CRÍTICO**: `match /config/{file}` va PRIMERO (D2 — first-match-wins). El catch-all va ÚLTIMO.

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Helper: rol admin desde Firestore (cross-service rules)
    // - path LITERAL (default) — NO usar $(database) en Storage rules
    // - guard request.auth != null ANTES del get (no interpolar uid con auth null)
    function isAdmin() {
      return request.auth != null
        && firestore.get(/databases/(default)/documents/usuarios/$(request.auth.uid)).data.rol == 'admin';
    }

    // --- LOGO DEL NEGOCIO: write SOLO admin + validación de tipo y tamaño ---
    match /config/{file} {
      allow read: if true;
      allow write: if isAdmin()
        && request.resource.size < 2 * 1024 * 1024
        && request.resource.contentType.matches('image/(png|jpeg|jpg|webp)$');
    }

    // --- RESTO DEL BUCKET: read público POR DISEÑO (logo servido a anónimos),
    //     write PROHIBIDO (ABIERTO TOTAL => CERRADO; sin excepciones) ---
    match /{allPaths=**} {
      allow read: if true;
      allow write: if false;
    }

  }
}
```

### `firebase.json` — diff planificado (NO aplicado en planificación)

```diff
 {
+  "storage": {
+    "rules": "storage.rules"
+  },
   "firestore": {
     "rules": "firestore.rules",
     "indexes": "firestore.indexes.json"
```

---

## Data Flow

```
[Admin sube logo]  AdminBusinessConfig.tsx:55  uploadBytes(config/logo_<ts>)
   └─ Storage rules match /config/{file} (PRIMERO)
        ├─ isAdmin() → firestore.get(usuarios/{uid}).data.rol == 'admin'   [1 read Firestore]
        ├─ size < 2 MiB  ├─ contentType ∈ png|jpeg|jpg|webp
        ├─ ALLOW ──► getDownloadURL (:56) ──► configuracion.logo ──► landing/catálogo [anónimos]
        └─ DENY   ──► catch (:70-74) ──► setError("Error al actualizar configuración: ...") [visible]

[Anónimo (REST directo)]
   ├─ GET o/config%2Flogo_1750909570905?alt=media ──► catch-all read: if true ──► 200 (billing activo)
   ├─ POST o?name=verify_anon_raiz.png ──► catch-all write: if false ──► 403
   └─ POST o?name=config%2Fverify_anon.png ──► /config write: isAdmin()→false ──► 403

[Delete de cualquier objeto]
   └─ request.resource == null ──► condiciones de /config fallan; catch-all write:if false ──► DENY
        (objetos existentes inmutables vía reglas — limpieza = change futuro)
```

---

## File Changes

| File | Acción | Descripción |
|------|--------|-------------|
| `storage.rules` | **Create** | Raíz del repo. Bloque EXACTO de arriba (rules_version 2, helper `isAdmin()`, `/config` primero, catch-all último). Única source of truth de reglas de Storage (antes: solo consola) |
| `firebase.json` | Modify | + sección `"storage": { "rules": "storage.rules" }` (diff arriba) |
| Rules publicadas bucket `gio-tech.firebasestorage.app` | Modify (deploy) | `firebase deploy --only storage` reemplaza el ruleset `f5eadf4f` (abierto total) por el del repo |
| `src/components/AdminBusinessConfig.tsx` | None | No se toca (REQ-002/003: uploads válidos siguen funcionando; inválidos → error visible) |
| `firestore.rules` | None | No se toca (0 líneas de diff en el change) |
| `openspec/changes/secure-storage-rules/` | New | Artefactos SDD de este change |

---

## Interfaces / Contracts

### Token de verificación (reutiliza el existente, NO genera credenciales nuevas)

```bash
# 1. Access token desde el refresh_token EXISTENTE del configstore (usado por el CLI)
REFRESH=$(node -e "console.log(require(process.env.HOME+'/.config/configstore/firebase-tools.json').tokens.refresh_token)")
ACCESS=$(curl -s -X POST "https://securetoken.googleapis.com/v1/token?key=${VITE_FIREBASE_API_KEY}" \
  -H 'Content-Type: application/json' \
  -d "{\"grant_type\":\"refresh_token\",\"refresh_token\":\"${REFRESH}\"}" \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).access_token))")
# Nota: $VITE_FIREBASE_API_KEY se toma de .env (o Project Settings de la consola); es pública por diseño en el front.
# NO loguear ACCESS/REFRESH en consola ni commits.
```

### Evidencia post-deploy (REQ-006) — comandos documentados

```bash
# (a) Read público: logo servido SIN 402 (gate con billing ACTIVO; con billing cerrado → 402 documentado, re-correr al reactivar)
curl -s -o /dev/null -w "%{http_code}\n" \
  "https://firebasestorage.googleapis.com/v0/b/gio-tech.firebasestorage.app/o/config%2Flogo_1750909570905?alt=media"
# → 200 esperado (billing activo)

# (b) Write deny: upload anónimo a la RAÍZ → 403 (verificable con billing cerrado)
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  -H "Content-Type: image/png" \
  --data-binary 'verify-anon' \
  "https://firebasestorage.googleapis.com/v0/b/gio-tech.firebasestorage.app/o?name=verify_anon_raiz.png"
# → 403 esperado

# (c) Write deny: upload anónimo a /config/ → 403
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  -H "Content-Type: image/png" \
  --data-binary 'verify-anon' \
  "https://firebasestorage.googleapis.com/v0/b/gio-tech.firebasestorage.app/o?name=config%2Fverify_anon.png"
# → 403 esperado

# (d) Ruleset publicado == repo: lista de rulesets (el más reciente DEBE contener el match /config + regex)
curl -s "https://firebaserules.googleapis.com/v1/projects/gio-tech/rulesets?pageSize=5" \
  -H "Authorization: Bearer $ACCESS"
# Inspeccionar createTime (post-deploy) y que el source contenga contentType.matches('image/(png|jpeg|jpg|webp)$')
# y el catch-all write: if false → verificación del release: el ruleset activo del bucket es el nuevo.

# (e) Material previo de la auditoría: ruleset 04df2ff0 (nunca publicado) — inspeccionar en Fase 1
curl -s "https://firebaserules.googleapis.com/v1/projects/gio-tech/rulesets/04df2ff0" \
  -H "Authorization: Bearer $ACCESS" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).source?.files?.[0]?.content ?? d))"
```

---

## Testing Strategy

| Capa | Qué | Cómo |
|---|---|---|
| Rules (pre-deploy) | Compilación/validez sintáctica del `storage.rules` | `firebase deploy --only storage --dry-run` (solo compila; NO publica) o Rules Playground de la consola; revisar que match `/config` está ANTES del catch-all |
| Rules (post-deploy, REST) | Deny de write global + deny anónimo a /config + allow de read público | Curl (a), (b), (c) del contrato — evidencia documentada en tasks Fase 1 (REQ-001, REQ-002, REQ-004, REQ-006) |
| Rules (post-deploy, API) | Ruleset publicado == repo | Curl (d): ruleset más reciente contiene el bloque `/config` con regex; release activo apunta al ruleset nuevo (REQ-005) |
| Funcional (browser, dueño) | Upload admin: PNG/JPEG/WebP < 2MB → OK; SVG → error visible; > 2MB → error visible; logo público sin login | Checklist Fase 2 (REQ-002, REQ-003, REQ-004) |
| Suite front | Sin regresiones (no se toca código) | `npm test` sanity check (REQ-005 preservado) |

---

## Migration / Rollout

**Fase 0 → 1 → 2 → 3** (dependencia estricta; NO hay backfill de datos — no aplica: solo reglas).

| Fase | Paso | Gate |
|---|---|---|
| 0 | Crear `storage.rules` (bloque EXACTO) + sección `"storage"` en `firebase.json` | `node -e "JSON.parse(fs.readFileSync('firebase.json'))"` OK; diff solo de los 2 archivos; orden de match verificado contra el bloque final |
| 1 | `firebase deploy --only storage` (aceptar prompt IAM cross-service; si no aparece → bind manual D6) + verificación REST (contrato, a-e) | Deploy "released rules"; curl (b)/(c) → 403; curl (d) → ruleset nuevo publicado; curl (a) → 200 (billing activo) o 402 documentado (re-correr tras reactivación) |
| 2 | Verificación funcional del dueño (browser): upload logo válido (PNG), logo visible en landing/catálogo sin login, SVG y >2MB rechazados con error visible | Checklist completo; logo carga con billing activo (REQ-006) |
| 3 | Commit conventional + archive del change (spec → main specs `openspec/specs/storage/spec.md`) | Trazabilidad REQ→tasks completa |

Rollback (rules puras, sin estado de datos que revertir): `git revert` de `storage.rules` + `firebase.json` → `firebase deploy --only storage` repone el ruleset anterior (el historial de releases conserva el previo; el estado abierto original queda restaurado). El change no crea/borra/sobrescribe ningún objeto → riesgo de pérdida de datos: CERO.

---

## Riesgos y mitigaciones

| # | Riesgo | Mitigación |
|---|---|---|
| R1 | Orden de match invertido (catch-all primero) → upload admin a `/config/` denegado silenciosamente | D2 + bloque final fija el orden + prueba funcional Fase 2 (upload admin real) |
| R2 | Cross-service IAM no habilitado → deny con error "interno" en writes admin | D6: prompt del CLI o bind manual `roles/firebaserules.firestoreServiceAgent`; verificación funcional Fase 2 lo detectaría |
| R3 | Sintaxis `$(database)` (estilo Firestore) usada en Storage → regla rota en runtime | D1: path LITERAL `(default)` documentado en el bloque final; dry-run + playground antes del deploy |
| R4 | 402 por billing cerrado leído como fallo de rules | Diferenciación explícita REQ-006/escenario billing: el 403 de deny se verifica SIEMPRE; el 200 es gate con billing activo (re-correr) |
| R5 | Admin "rompió" el upload (SVG/2MB+) y lo interpreta como bug | Comportamiento deseado; error visible en UI (`:70-74`); comunicado en el checklist Fase 2 con ejemplo válido e inválido |
| R6 | Logo existente `config/logo_1750909570905` (sin extensión) quedaría ilegible | NO: el READ no valida contentType (read: if true en /config y catch-all) — el objeto existente sigue sirviéndose igual |
| R7 | Costo/latencia del `firestore.get()` por evaluación | 1 read por write admin de logo (frecuencia mínima); límite de la feature en 2 docs — holgado |
| R8 | Ruleset `04df2ff0` (nunca publicado) como sorpresa en el historial | Inspeccionar en Fase 1 (curl e) como material; documentar si revela intención distinta; la Opción A aprobada no cambia |

---

## Open Questions

- [ ] ¿Borrar el ruleset `04df2ff0` del historial o conservarlo? Conservación por defecto (nunca publicado; inspección informativa en Fase 1). No bloquea.
- [ ] Limpieza futura del bucket (huérfano de la raíz + logo viejo): mecanismo elegido será decisión del dueño en change aparte (consola/Admin SDK/regla futura de delete admin). No bloquea este change.
- [ ] Evolución futura del front (`AdminBusinessConfig.tsx`): extensión en el path, límite en cliente, `deleteObject`. Anotado en spec §Futuro. No bloquea.