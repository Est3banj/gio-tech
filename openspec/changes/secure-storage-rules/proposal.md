---
id: secure-storage-rules/proposal
status: approved
title: "Proposal: secure-storage-rules"
change_date: 2026-08-15
---

# Proposal: secure-storage-rules

## Intent

El bucket `gio-tech.firebasestorage.app` tiene publicadas reglas **ABIERTAS TOTAL** desde el 26/06/2025 (ruleset `f5eadf4f`): `match /{allPaths=**} { allow read, write: if true; }` — cualquier persona sin autenticación puede leer, subir, sobrescribir y BORRAR cualquier objeto (verificado por auditoría con doble evidencia; existe un ruleset `04df2ff0` más nuevo, mismo día, que NUNCA se publicó — material previo a revisar). Las reglas jamás se versionaron en el repo: no existe `storage.rules` y `firebase.json` no tiene sección `"storage"`. Riesgos concretos: malware/UGC servido desde el dominio del proyecto, vaciado del bucket por REST (delete abierto), SVG subido como logo (vector XSS servido desde dominio de confianza, `AdminBusinessConfig.tsx:114` con `accept="image/*"` y `:55` upload sin validación de tipo ni tamaño).

El único write legítimo del sistema es el logo del negocio: `src/components/AdminBusinessConfig.tsx:54-56` → `config/logo_${Date.now()}` (sin extensión, sin límite de tamaño, sin `deleteObject` en todo el repo — los logos viejos se acumulan). El read del logo es **requisito funcional**: el front sirve la URL directa (`getDownloadURL`) a usuarios ANÓNIMOS (landing/catálogo sin login) → el read público se preserva por diseño.

**Decisión del dueño (15-08-2026, vinculante)**: **Opción A** — read público + write solo admin en `/config/` con validación de tipo (PNG/JPEG/WebP) y tamaño (< 2 MB); write global denegado.

## Scope

### In Scope

1. Crear `storage.rules` en la raíz del repo (source of truth versionada) con la regla de la decisión del dueño.
2. Agregar la sección `"storage": { "rules": "storage.rules" }` en `firebase.json`.
3. Deploy de las rules vía CLI (`firebase deploy --only storage`) — primera vez que Storage se gestiona por CLI en el proyecto.
4. Verificación REST post-deploy: (a) ruleset publicado = el del repo (API de releases/rulesets con el token existente de `~/.config/configstore/firebase-tools.json`, NO `firebase login:ci`); (b) upload anónimo → 403 (deny probado sin depender del billing); (c) GET del logo → 200 (gate con billing activo; con billing cerrado el 402 NO es fallo de rules, se re-corre).
5. Checklist funcional del dueño: subir logo nuevo desde admin (PNG/JPEG/WebP < 2MB → OK; SVG o > 2MB → error visible en la UI, `AdminBusinessConfig.tsx:70-74`), logo público carga en landing/catálogo sin login.

### Out of Scope

- **Cambios de front** (`AdminBusinessConfig.tsx`): NO se tocan. El `accept="image/*"`, la extensión ausente, el límite de tamaño en cliente y la falta de `deleteObject` quedan anotados como FUTURO (ver Futuro).
- **Limpieza de objetos existentes**: el objeto huérfano `Photoroom_20250624_195858.JPEG` (raíz del bucket, subido a mano) y el logo viejo `config/logo_1750909570905` NO se borran en este change (quedan documentados; con las rules nuevas quedan inmutables vía remove — ver diseño). Limpieza = change futuro con decisión explícita.
- **`firestore.rules`**: no se toca. El criterio de admin se REUTILIZA vía cross-service `firestore.get()` desde Storage rules (no se modifica nada en Firestore).
- **Servir el logo desde hosting/CDN** (alternativa para read restringido): descartada — scope creep, rompe el diseño actual sin beneficio para este change.
- **Reglas de Firestore, Auth, Functions**: intactas.

## Approach

**Opción A — read público + write solo admin validado en `/config/`:**

1. **`storage.rules`** (rules_version 2) con helper `isAdmin()` vía cross-service `firestore.get()` (mismo criterio que `firestore.rules:5-7`, path literal `(/databases/(default)/documents/usuarios/$(request.auth.uid))` — NOTA: en Storage rules el path Firestore NO usa `$(database)`):
   - `match /config/{file}` **PRIMERO** (Storage rules = first-match-wins; si el catch-all va primero, la regla de `/config` jamás se evalúa): `allow read: if true;` + `allow write: if isAdmin() && request.resource.size < 2 * 1024 * 1024 && request.resource.contentType.matches('image/(png|jpeg|jpg|webp)$')`.
   - `match /{allPaths=**}`: `allow read: if true;` (requisito funcional) + `allow write: if false;` (cierra el resto del bucket).
2. **`firebase.json`**: sección `"storage"` apuntando a `storage.rules` (patrón idéntico al de `firestore` ya presente).
3. **Deploy + verificación**: `firebase deploy --only storage` (primer deploy de rules pide habilitar el IAM "Firebase Rules Firestore Service Agent" por el `firestore.get()` — aceptar); verificación REST documentada en tasks (Fase 1) con el token existente del configstore.

## Solution — Decisiones Clave

### D1. Admin vía cross-service `firestore.get()` (reutiliza el criterio de Firestore)

```
function isAdmin() {
  return request.auth != null
    && firestore.get(/databases/(default)/documents/usuarios/$(request.auth.uid)).data.rol == 'admin';
}
```

- El rol ya vive en el doc `usuarios/{uid}` y las reglas de Firestore ya lo usan exactamente así → **un solo criterio de admin en todo el proyecto**, sin duplicar lógica en dos lenguajes de reglas.
- Costo: 1 read facturado de Firestore por evaluación de write admin (frecuencia: cambios de logo — despreciable). El `request.auth != null` evita evaluar con auth null (la interpolación de uid sin auth fallaría).
- Requisito operativo: habilitar el role IAM "Firebase Rules Firestore Service Agent" en el primer deploy (prompt del CLI).

### D2. Orden de declaración en Storage rules (FIRST-MATCH-WINS)

Storage rules evalúan **el primer match que calza** (a diferencia de Firestore, que hace OR entre matches). Por eso `match /config/{file}` se declara ANTES que `match /{allPaths=**}`. Si se invierte, el catch-all captura todo write (`if false`) y el upload del admin a `config/` queda denegado — regresión funcional del logo SILENCIOSA (el error aparece en la UI del admin, `AdminBusinessConfig.tsx:70-74`, pero la causa sería un orden equivocado, no una regla mala). El bloque exacto final del design.md fija el orden.

### D3. Validación en `request.resource` (create/update) y delete

- `request.resource.size` = bytes del archivo en create/update → `< 2 * 1024 * 1024` (2 MiB). `request.resource.contentType` = header Content-Type del upload (el SDK JS lo deriva del Blob/File del input `accept="image/*"`) → regex `image/(png|jpeg|jpg|webp)$` mata SVG (`image/svg+xml`) y cualquier no-imagen.
- **Delete**: en un remove `request.resource` es null → las condiciones de tamaño/tipo fallan → el delete queda denegado INCLUSO para admin. Consecuencia documentada: los objetos existentes (`config/logo_1750909570905` y el huérfano de la raíz) quedan inmutables vía rules; la limpieza queda como change futuro (decisión del dueño, ver Futuro). El front no usa `deleteObject` (grep → 0) → ningún flujo se rompe.

### D4. Variables descartadas de la decisión (documentar, NO re-debatir)

- Opción B (`allow write: if request.auth != null`): no distingue admin de asesor/cliente; cualquier cuenta del sistema (registro público por email/password) escribiría en el bucket. Descartada por el dueño.
- Opción C (read restringido): rompe el logo público servido por `getDownloadURL` a anónimos. Descartada por el dueño.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `storage.rules` | **Create** | Nuevo archivo en la raíz — única source of truth de reglas de Storage (antes: solo consola, nunca versionado) |
| `firebase.json` | Modified | + sección `"storage": { "rules": "storage.rules" }` (hoy solo tiene `firestore` + `hosting`) |
| Rules publicadas del bucket `gio-tech.firebasestorage.app` | Modified (deploy) | Reemplaza el ruleset `f5eadf4f` (abierto total) por la Opción A |
| `src/components/AdminBusinessConfig.tsx` | None | NO se toca (el upload admin con PNG/JPEG/WebP < 2MB sigue funcionando; SVG/>2MB dan error visible en la UI) |
| `firestore.rules` | None | No se toca; el criterio de admin se lee desde Storage (cross-service) |
| `openspec/changes/secure-storage-rules/` | New | Artefactos SDD de este change |
| Objetos existentes del bucket (2) | None (immutables) | Read público preservado; write/delete denegados por las reglas nuevas (limpieza = futuro) |

## Alternatives Considered

1. **Opción B — write solo `request.auth != null`** (descartada por el dueño): no distingue admin; cualquier cliente registrado (registro público) queda habilitado a escribir en el bucket. No resuelve spam/storage ni SVG; es un falso cierre.
2. **Opción C — read restringido** (descartada por el dueño): rompe la funcionalidad principal — el logo se sirve por URL directa a usuarios anónimos. Alternativa real (hosting/CDN) = change aparte con diseño de serving, no este.
3. **Sin `firestore.get()` (admin por claims o por regla estática)**: custom claims = scope creep (change de authz completo); doblar la lógica de admin en Storage (otra fuente de verdad) = divergencia futura. Ganó el cross-service: 1 criterio, cero código nuevo.
4. **Basearse en el ruleset `04df2ff0` (nunca publicado)**: revisarlo en Fase 1 como material; NO se adopta a ciegas (sin evidencia de que esté probado; la decisión del dueño ya fijó la Opción A).

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Orden de match invertido (catch-all primero) → upload del admin a `config/` denegado silenciosamente | Med | D2: `/config/{file}` declarado ANTES del catch-all; el bloque final del design.md fija el orden; verificación de upload admin real en Fase 2 (checklist del dueño) |
| Primer deploy con `firestore.get()` falla por IAM no habilitado ("Firebase Rules Firestore Service Agent") | Med | Prompt del CLI en Fase 1 documentado (aceptar con 'y'); si el CLI no lo ofrece, documento con el comando `gcloud projects add-iam-policy-binding` (patrón soportado: `roles/firebaserules.firestoreServiceAgent`) |
| 402 por billing cerrado interpretado como fallo de rules en la verificación del read | Med | Diferencia explícita en tasks: el 403 del upload anónimo se verifica SIEMPRE; el 200 del GET es gate con billing activo (re-correr tras reactivación). Documentado en spec REQ-006 |
| El logo actual `config/logo_1750909570905` no pasa la validación si se re-subiera (sin extensión; contentType del upload original puede no matchear) | Low | El front usa `Date.now()` → nunca re-usa el path. El READ del objeto existente sigue permitido (no se ve afectado). Sin deleteObject → nadie intenta borrarlo |
| Admin sube SVG/archivo > 2MB y cree que "se rompió" | Med | Es el comportamiento deseado (validación nueva); el error es visible en la UI; se comunica en el checklist Fase 2 (probar un PNG válido y un SVG rechazado) |
| Depender de un `get()` Firestore por evaluación (latencias/costo) | Low | Uploads de admin = frecuencia bajísima; 1 doc; límite de la feature (2 docs/evaluación) no se acerca |

## Rollback Plan

1. **Rules**: `git revert` del commit de `storage.rules` + `firebase.json`, luego `firebase deploy --only storage` para reponer el ruleset anterior (volver a reglas abiertas = estado pre-cambio). Deploy atómico; el ruleset previo queda en el historial de releases.
2. **Sin estado a revertir en objetos**: el change no crea/borra/sobrescribe objetos (solo reglas). Zero riesgo de pérdida de datos.
3. **Regla de oro**: la verificación REST (Fase 1) corre ANTES de considerar el deploy exitoso; si el `403` del upload anónimo no aparece → NO avanzar (indica que el ruleset no quedó publicado).

## Dependencies

- Token de deploy existente en `~/.config/configstore/firebase-tools.json` (refresh_token verificado) — se usa para obtener access token vía `securetoken.googleapis.com` (API key del proyecto, `VITE_FIREBASE_API_KEY` en `.env`) y llamar a la API de rulesets para la verificación. NO se usa `firebase login:ci` (no generar tokens nuevos).
- CLI de Firebase (`firebase deploy --only storage`).
- Habilitación del IAM role para cross-service rules en el primer deploy (prompt del CLI o comando `gcloud` documentado en Fase 1).
- Sin dependencias nuevas de terceros en el front (no se toca).

## Success Criteria

- [ ] `storage.rules` versionado en el repo con la regla exacta de la decisión del dueño (Opción A) y `firebase.json` con la sección `"storage"`
- [ ] Ruleset publicado en el bucket = el del repo (verificado por API de releases/rulesets con el token existente — el ruleset nuevo contiene el match `/config` con la regex de contentType)
- [ ] Upload anónimo a la raíz del bucket → **403** (REST, sin auth)
- [ ] Upload anónimo a `config/` → **403**
- [ ] GET anónimo del logo existente (`config/logo_1750909570905`) → **200** con billing activo (con billing cerrado: 402 documentado y re-corrido al reactivar — NO condición de éxito del deploy de rules)
- [ ] Desde el admin: subir PNG/JPEG/WebP < 2MB → logo actualizado y visible en landing/catálogo sin login; subir SVG o > 2MB → error visible en la UI (`AdminBusinessConfig.tsx:70-74`)
- [ ] `firestore.rules` sin cambios en el diff del change (0 líneas tocadas)
- [ ] `npm test` verde sin regresiones (no se toca front — sanity check)

## Implementation Plan (fases)

| Fase | Paso | Entregable | Gate |
|---|---|---|---|
| 0 | Reglas en repo | `storage.rules` (raíz) + sección `"storage"` en `firebase.json` | `firebase.json` parsea OK; diff de rules sin typos (revisión del bloque final del design.md); `git status` solo con los 2 archivos |
| 1 | Deploy + verificación REST | `firebase deploy --only storage` (+ prompt IAM) + API de rulesets + curl de deny/allow | Ruleset publicado = repo; upload anónimo → 403; GET logo → 200 (gate billing) |
| 2 | Verificación funcional | Checklist del dueño (admin sube logo válido/inválido; logo público) | Logo OK en front con billing activo; error 403 visible para SVG/2MB+ |
| 3 | Cierre | Commits conventional + archive del change (spec → main specs) | Todo lo anterior verificado; tracability de tasks |

## Spec Deltas (requisitos preliminares — detalle completo en sdd-spec)

- **REQ-001** (MUST): write global denegado — `match /{allPaths=**}` con `allow write: if false`; sin excepciones fuera de `/config/`.
- **REQ-002** (MUST): write a `/config/{file}` solo admin (criterio `usuarios/{uid}.rol == 'admin'` vía cross-service `firestore.get()`), con `request.auth != null`.
- **REQ-003** (MUST): validación de tipo y tamaño en `/config/` — `contentType.matches('image/(png|jpeg|jpg|webp)$')` y `size < 2 * 1024 * 1024`.
- **REQ-004** (MUST): read público preservado en todo el bucket (logo servido a anónimos por `getDownloadURL`).
- **REQ-005** (MUST): versionado en repo (`storage.rules`) + sección `"storage"` en `firebase.json` + deploy vía CLI; ruleset publicado verificable contra el repo.
- **REQ-006** (MUST): evidencia post-deploy — GET del logo servido SIN 402 (curl, gate con billing activo) + intento de upload anónimo rechazado con 403 (REST, sin auth).