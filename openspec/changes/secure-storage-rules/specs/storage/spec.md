---
id: secure-storage-rules/spec
status: active
title: "Spec: secure-storage-rules"
change_date: 2026-08-15
---

# Delta for Storage (seguridad del bucket de Cloud Storage)

## Purpose

Delta del change `secure-storage-rules`: cierra el bucket `gio-tech.firebasestorage.app`, que tiene publicadas reglas **ABIERTAS TOTAL** desde el 26/06/2025 (ruleset `f5eadf4f`): `match /{allPaths=**} { allow read, write: if true; }` — cualquier persona sin autenticación puede leer, subir, sobrescribir y borrar cualquier objeto. Las reglas jamás se versionaron (no existe `storage.rules` en el repo; `firebase.json` no tiene sección `"storage"`). Existe un ruleset `04df2ff0` más nuevo (mismo día) que NUNCA se publicó — material previo a revisar en el deploy, no condición del change.

La decisión del dueño (15-08-2026, vinculante) es la **Opción A**: write global prohibido, write a `/config/` solo para admin con validación de tipo (PNG/JPEG/WebP) y tamaño (< 2 MiB), y **read público preservado en todo el bucket** — el logo del negocio se sirve por URL directa (`getDownloadURL`) a usuarios ANÓNIMOS (`src/components/AdminBusinessConfig.tsx:54-56` + lectura en landing/catálogo); el read público es requisito funcional.

Comportamiento preservado que este change NO debe alterar: el flujo actual de subida de logo del admin (PNG/JPEG/WebP < 2MB → funciona igual); la lectura pública del logo y de cualquier objeto existente; `firestore.rules` (sin cambios — el criterio de admin se lee desde Storage vía cross-service `firestore.get()` con path literal `(default)`); el código front (`AdminBusinessConfig.tsx`) — sin tocar.

Fuera de scope (anotado como futuro, NO requisito de este change): cambios de front (extensión del path, límite en cliente, `deleteObject`), y la limpieza de los 2 objetos existentes (logo viejo `config/logo_1750909570905` + huérfano `Photoroom_20250624_195858.JPEG` en la raíz), que quedan legibles pero inmutables vía reglas (el delete se deniega por evaluación, ver REQ-001 escenarios).

## ADDED Requirements

### REQ-001: Write global del bucket denegado

El sistema DEBE denegar todo write sobre el bucket fuera del path `/config/{file}`: el match catch-all `/{allPaths=**}` DEBE declarar `allow write: if false`. Los paths existentes fuera de `/config/` (p. ej. el objeto huérfano en la raíz) DEBEN quedar inmutables (ni sobrescribir, ni borrar, ni crear): `allow read` no implica write, y el delete —que en Storage rules NO tiene `request.resource`— DEBE quedar denegado por la evaluación de la regla de write. NO DEBEN existir excepciones a este deny fuera de la regla de `/config/{file}` (REQ-002).

#### Scenario: Upload anónimo a la raíz del bucket denegado

- GIVEN un cliente REST sin autenticación y el ruleset nuevo publicado
- WHEN ejecuta `POST https://firebasestorage.googleapis.com/v0/b/gio-tech.firebasestorage.app/o?name=verify_anon_raiz.png` con `Content-Type: image/png`
- THEN la operación es **DENEGADA** (403 permission-denied) — sin auth, sin excepción
- AND la denegación es verificable aunque el billing esté cerrado (el deny se evalúa antes de facturar lecturas/descargas)

#### Scenario: Sobrescribir un objeto existente fuera de /config denegado

- GIVEN el objeto huérfano `Photoroom_20250624_195858.JPEG` en la raíz del bucket y el ruleset nuevo publicado
- WHEN un cliente (con o sin auth) intenta sobrescribir ese path
- THEN la operación es **DENEGADA** (el catch-all matchea primero para paths fuera de `/config/` → `write: if false`)

#### Scenario: Borrar cualquier objeto denegado (incluido por admin)

- GIVEN el ruleset nuevo publicado
- WHEN un cliente (incluido el admin autenticado) ejecuta `delete` sobre cualquier objeto
- THEN la operación es **DENEGADA**: en un remove `request.resource` es null, las condiciones de tamaño/tipo de la regla de `/config/` fallan, y el catch-all deniega todo lo demás
- AND los objetos existentes (logo viejo + huérfano de la raíz) quedan inmutables vía reglas — su limpieza es un change futuro con decisión explícita (fuera de scope)

### REQ-002: Write a `/config/{file}` solo para admin

El sistema DEBE permitir write sobre `/config/{file}` SOLO si `request.auth != null` y el uid autenticado tiene rol `admin` en su doc de Firestore `usuarios/{uid}`, evaluado con la función cross-service `firestore.get(/databases/(default)/documents/usuarios/$(request.auth.uid)).data.rol == 'admin'` (mismo criterio que `firestore.rules:5-7`, path LITERAL `(default)` — la sintaxis `$(database)` de Firestore rules NO aplica en Storage rules). El role IAM "Firebase Rules Firestore Service Agent" DEBE quedar habilitado en el primer deploy (prompt del CLI o bind manual). Un asesor, un cliente o un anónimo NO DEBE poder escribir en `/config/`.

#### Scenario: Admin sube un logo válido a /config/

- GIVEN un admin autenticado (usuario con doc `usuarios/{uid}` y `rol == 'admin'`) y el ruleset nuevo publicado
- WHEN ejecuta `uploadBytes(ref(storage, 'config/logo_<timestamp>'), <PNG o JPEG o WebP de < 2 MiB>)` (flujo real de `AdminBusinessConfig.tsx:54-56`)
- THEN la operación es **PERMITIDA** y `getDownloadURL` devuelve la URL pública del objeto
- AND el objeto queda legible por cualquier visitante (REQ-004)

#### Scenario: Asesor autenticado intenta escribir en /config/

- GIVEN un asesor autenticado (doc `usuarios/{uid}` con `rol == 'asesor'`)
- WHEN ejecuta un upload a `config/`
- THEN la operación es **DENEGADA** (`firestore.get(...).data.rol != 'admin'` → write denegado)

#### Scenario: Anónimo intenta escribir en /config/

- GIVEN un cliente sin autenticación y el ruleset nuevo publicado
- WHEN ejecuta `POST .../o?name=config%2Fverify_anon.png` con `Content-Type: image/png`
- THEN la operación es **DENEGADA** (403): `request.auth` es null → el guard de `isAdmin()` falla, no se evalúa `firestore.get` con uid inexistente

#### Scenario: Cliente intenta escribir en /config/

- GIVEN un cliente autenticado por email/password (sin doc `usuarios`, rol default 'cliente' en la UI)
- WHEN ejecuta un upload a `config/`
- THEN la operación es **DENEGADA** (no matchea `rol == 'admin'` en su doc inexistente)

### REQ-003: Validación de tipo y tamaño en `/config/`

El sistema DEBE validar en `/config/{file}`: `request.resource.contentType` DEBE cumplir `matches('image/(png|jpeg|jpg|webp)$')` y `request.resource.size` DEBE ser menor a `2 * 1024 * 1024` (2 MiB). Un upload que no cumpla cualquiera de las dos condiciones DEBE ser denegado, aunque el autor sea admin (la validación es independiente del role). Esto elimina el vector SVG (`image/svg+xml`, aceptado hoy por `accept="image/*"` de `AdminBusinessConfig.tsx:114` — vector XSS servido desde el dominio del proyecto) y el límite de tamaño inexistente.

#### Scenario: PNG válido menor a 2 MiB permitido

- GIVEN un admin autenticado y un archivo PNG de 1 MiB
- WHEN sube ese archivo a `config/`
- THEN la operación es **PERMITIDA** (contentType `image/png` matchea la regex; size < 2 MiB)

#### Scenario: SVG denegado (anti-XSS)

- GIVEN un admin autenticado y un archivo SVG (`image/svg+xml`, permitido hoy por `accept="image/*"`)
- WHEN sube ese archivo a `config/`
- THEN la operación es **DENEGADA** (la regex solo acepta png/jpeg/jpg/webp)
- AND en la UI del admin se muestra el error del `catch` (`AdminBusinessConfig.tsx:70-74`): el fallo NO es silencioso

#### Scenario: Archivo mayor a 2 MiB denegado

- GIVEN un admin autenticado y un PNG de 3 MiB
- WHEN sube ese archivo a `config/`
- THEN la operación es **DENEGADA** (`request.resource.size < 2 * 1024 * 1024` falso)

#### Scenario: Upload con content-type no determinado denegado

- GIVEN un admin autenticado y un upload cuyo `Content-Type` no es una imagen de la lista (p. ej. `application/octet-stream` o ausente)
- WHEN sube ese archivo a `config/`
- THEN la operación es **DENEGADA** (no matchea la regex)

### REQ-004: Read público preservado en todo el bucket

El sistema DEBE mantener `allow read: if true` en el match catch-all `/{allPaths=**}` (y en `/config/{file}`): el logo del negocio se sirve por URL directa (`getDownloadURL`, `AdminBusinessConfig.tsx:56`) a usuarios ANÓNIMOS del landing y catálogo, sin login. El read NO DEBE condicionarse a auth ni a rol — cualquier restricción rompería la funcionalidad pública existente.

#### Scenario: Anónimo lee el logo del negocio

- GIVEN un visitante sin autenticación y el ruleset nuevo publicado
- WHEN ejecuta `GET .../o/config%2Flogo_1750909570905?alt=media`
- THEN la lectura es **PERMITIDA** (200) — el logo público sigue funcionando sin login (gate con billing activo; con billing cerrado el 402 es estado operativo del proyecto, NO fallo de rules)

#### Scenario: Anónimo lee el objeto huérfano de la raíz

- GIVEN un visitante sin autenticación y el object `Photoroom_20250624_195858.JPEG` en la raíz (existente pre-change)
- WHEN ejecuta `GET .../o/Photoroom_20250624_195858.JPEG?alt=media`
- THEN la lectura es **PERMITIDA** (read público del catch-all, sin excepción de path)

#### Scenario: Read de /config/ también público

- GIVEN un visitante sin autenticación
- WHEN lee cualquier objeto bajo `config/`
- THEN la lectura es **PERMITIDA** (la regla de `/config/{file}` mantiene `allow read: if true` explícito)

### REQ-005: Reglas versionadas en el repo y deploy vía CLI

El sistema DEBE versionar las reglas de Storage en el repo: archivo `storage.rules` en la raíz (rules_version 2) y sección `"storage": { "rules": "storage.rules" }` en `firebase.json` (patrón idéntico al de `firestore`). El deploy DEBE hacerse por CLI (`firebase deploy --only storage`), y el ruleset publicado en el bucket DEBE ser verificable contra el archivo del repo (API de releases/rulesets con el token existente de `~/.config/configstore/firebase-tools.json` — NO generar token nuevo con `firebase login:ci`). A partir de este change, el estado de reglas deja de vivir "solo en la consola".

#### Scenario: Configuración de deploy presente y válida

- GIVEN el change aplicado
- WHEN se revisa `firebase.json` y el directorio raíz del repo
- THEN existe `storage.rules` y la sección `"storage"` apunta a él
- AND el ruleset publicado (API de rulesets, token existente) contiene el bloque `match /config/{file}` con la regex `image/(png|jpeg|jpg|webp)$` y el catch-all con `write: if false` — el contenido publicado coincide con el repo

#### Scenario: Deploy por CLI con prompt de cross-service IAM

- GIVEN el primer `firebase deploy --only storage` con la regla nueva (que usa `firestore.get()`)
- WHEN el CLI solicita habilitar los permisos de cross-service ("Firebase Rules Firestore Service Agent")
- THEN se acepta el prompt (o se configura el bind IAM manualmente — comando documentado en tasks Fase 1)
- AND el deploy completa: "rules file storage.rules compiled successfully" + release publicado

### REQ-006: Evidencia de verificación post-deploy

El sistema DEBE dejar evidencia reproducible post-deploy del efecto de las reglas: (a) el GET de la URL del logo servida SIN 402 (con billing activo; con billing cerrado se documenta el 402 como estado operativo y se re-corre al reactivar — NO condición de éxito del deploy de rules); (b) el intento de upload anónimo rechazado con 403 (REST, sin auth), que SÍ es verificable con billing cerrado. La evidencia se documenta en el artefacto de verificación del change (sección en `tasks.md` Fase 1).

#### Scenario: Logo servido sin 402 (billing activo)

- GIVEN el ruleset nuevo publicado y el billing del proyecto reactivado
- WHEN se ejecuta `curl -s -o /dev/null -w "%{http_code}" "https://firebasestorage.googleapis.com/v0/b/gio-tech.firebasestorage.app/o/config%2Flogo_1750909570905?alt=media"`
- THEN devuelve **200** (el logo público se sirve; el read público de REQ-004 queda probado de punta a punta)

#### Scenario: Upload anónimo rechazado (403)

- GIVEN el ruleset nuevo publicado (billing activo o cerrado)
- WHEN se ejecuta `curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: image/png" --data-binary 'x' "https://firebasestorage.googleapis.com/v0/b/gio-tech.firebasestorage.app/o?name=verify_anon_raiz.png"`
- THEN devuelve **403** (permission-denied — el write global denegado de REQ-001 queda probado en producción)

#### Scenario: Billing cerrado documentado (estado operativo, no fallo de rules)

- GIVEN el ruleset nuevo publicado y el billing del proyecto cerrado
- WHEN se ejecuta el GET de verificación del logo
- THEN la respuesta puede ser **402** (billing disabled) — se registra como estado operativo del proyecto, se re-corre el gate al reactivar el billing, y NO se considera fallo de reglas
- AND los tests de deny (403) se ejecutan igual y con éxito (no dependen del billing)

## Futuro (anotado, FUERA de este change)

- **Front**: agregar extensión al path del logo (`config/logo_<ts>.png`), límite de tamaño en cliente (UI), y `deleteObject` del logo anterior al subir uno nuevo (evita acumulación) — change futuro con `AdminBusinessConfig.tsx` (`:54-56`, `:114`).
- **Limpieza del bucket**: borrado deliberado del huérfano de la raíz y del logo viejo (hoy inmutables vía reglas) — requiere decisión del dueño y mecanismo de borrado (consola/Admin SDK/regla futura de delete admin).
- **Revisión del ruleset `04df2ff0`** (nunca publicado): inspección en Fase 1 como material; si revela intención original distinta, documentar y decidir por separado — no altera la Opción A ya aprobada.