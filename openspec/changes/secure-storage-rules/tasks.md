# Tasks: secure-storage-rules

**Change**: `secure-storage-rules`
**Fecha**: 2026-08-15
**Dependencias**: `proposal.md` (Opción A aprobada, dueño 15-08-2026) · `specs/storage/spec.md` (REQ-001..REQ-006) · `design.md` (D1..D6, bloque EXACTO de reglas)
**Formato commits**: conventional commits en inglés (openspec/config.yaml)

**GATE GLOBAL**: NUNCA considerar el change listo sin la verificación REST de la Fase 1 (upload anónimo → 403) — es la evidencia de que el ruleset quedó publicado. El gate del read (curl → 200) depende del billing activo: con billing cerrado se documenta el 402 y se re-corre al reactivar (NO es fallo de rules — REQ-006). Orden estricto: **Fase 0 → Fase 1 → Fase 2 → Fase 3**.

---

## Fase 0 — Reglas en el repo (storage.rules + firebase.json)

- [ ] **0.1** Crear `storage.rules` en la raíz del repo con el bloque EXACTO del design.md
  - REQ: REQ-001, REQ-002, REQ-003, REQ-004, REQ-005
  - Archivo: `storage.rules` (NUEVO, raíz del repo)
  - Done: archivo con `rules_version = '2'` + helper `isAdmin()` (cross-service `firestore.get(/databases/(default)/documents/usuarios/$(request.auth.uid)).data.rol == 'admin'`, guard `request.auth != null` ANTES) + `match /config/{file}` **PRIMERO** (read público + write `isAdmin() && size < 2*1024*1024 && contentType.matches('image/(png|jpeg|jpg|webp)$')`) + `match /{allPaths=**}` **ÚLTIMO** (read público + write: if false). ⚠️ ORDEN CRÍTICO (design D2): `/config` ANTES del catch-all (first-match-wins).
  - Estimación: S
  - Dependencias: ninguna

- [ ] **0.2** Agregar sección `"storage"` a `firebase.json`
  - REQ: REQ-005
  - Archivo: `firebase.json`
  - Done: `"storage": { "rules": "storage.rules" }` (patrón idéntico al bloque `"firestore"` existente). Verificar con `node -e "JSON.parse(require('fs').readFileSync('firebase.json'))"` → OK sin errores de sintaxis.
  - Estimación: S
  - Dependencias: 0.1

- [ ] **0.3** GATE: revisión del diff antes de cualquier deploy
  - REQ: REQ-005
  - Archivo: verificación
  - Done: `git diff --stat` muestra SOLO `storage.rules` (new) y `firebase.json` (modified); re-leer el bloque final: orden de match `/config` → catch-all; regex `image/(png|jpeg|jpg|webp)$`; `2 * 1024 * 1024`. Si algún punto no calza → NO avanzar a Fase 1.
  - Estimación: S
  - Dependencias: 0.2

## Fase 1 — Deploy + verificación REST (requiere token existente, NO `firebase login:ci`)

- [ ] **1.1** Inspeccionar el ruleset `04df2ff0` (material previo, nunca publicado — informativo)
  - REQ: ninguna (contexto)
  - Comando (curl con access token del contrato design.md, sección Interfaces/Contracts, item e):
    - `REFRESH=$(node -e "console.log(require(process.env.HOME+'/.config/configstore/firebase-tools.json').tokens.refresh_token)")` (verificado: presente)
    - `ACCESS=$(curl -s -X POST "https://securetoken.googleapis.com/v1/token?key=$VITE_FIREBASE_API_KEY" -H 'Content-Type: application/json' -d "{\"grant_type\":\"refresh_token\",\"refresh_token\":\"$REFRESH\"}" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).access_token))")` (API key de `.env` o Project Settings; NO loguear tokens)
    - `curl -s "https://firebaserules.googleapis.com/v1/projects/gio-tech/rulesets/04df2ff0" -H "Authorization: Bearer $ACCESS"`
  - Done: contenido del ruleset nunca publicado inspeccionado y documentado (una línea en la nota de deploy). Si revela intención distinta a la Opción A → anotarlo, NO cambia la decisión aprobada.
  - Estimación: S
  - Dependencias: 0.3 (gate)

- [ ] **1.2** Deploy de Storage rules a producción
  - REQ: REQ-005
  - Comando (raíz del repo): `firebase deploy --only storage`
  - Done: deploy exitoso con "rules file storage.rules compiled successfully" + release publicado. NOTA: el primer deploy con `firestore.get()` solicita habilitar el cross-service IAM ("Firebase Rules Firestore Service Agent") → ACEPTAR el prompt; si no aparece y los writes admin fallan → bind manual del design.md D6 (`gcloud projects add-iam-policy-binding gio-tech --member=serviceAccount:firebase-storage-<id>@firebaserules.iam.gserviceaccount.com --role=roles/firebaserules.firestoreServiceAgent`).
  - Estimación: S
  - Dependencias: 1.1

- [ ] **1.3** Verificar ruleset publicado == repo (API de rulesets)
  - REQ: REQ-005
  - Comando (contrato design.md, item d): `curl -s "https://firebaserules.googleapis.com/v1/projects/gio-tech/rulesets?pageSize=5" -H "Authorization: Bearer $ACCESS"`
  - Done: el ruleset de `createTime` más reciente contiene el bloque `match /config/{file}` con `contentType.matches('image/(png|jpeg|jpg|webp)$')` y el catch-all con `write: if false`; el release activo del bucket apunta al ruleset nuevo. Evidencia registrada.
  - Estimación: S
  - Dependencias: 1.2

- [ ] **1.4** Verificar DENY: upload anónimo → 403 (no depende del billing)
  - REQ: REQ-001, REQ-002, REQ-006
  - Comandos (contrato design.md, items b y c):
    - Raíz: `curl -s -o /dev/null -w "%{http_code}\n" -X POST -H "Content-Type: image/png" --data-binary 'verify-anon' "https://firebasestorage.googleapis.com/v0/b/gio-tech.firebasestorage.app/o?name=verify_anon_raiz.png"` → **403**
    - `config/`: `... "https://firebasestorage.googleapis.com/v0/b/gio-tech.firebasestorage.app/o?name=config%2Fverify_anon.png"` → **403**
  - Done: ambos devuelven 403 (permission-denied). Si alguno devuelve 200 → el ruleset NO quedó publicado: PARAR (GATE 1.6 no superado).
  - Estimación: S
  - Dependencias: 1.3

- [ ] **1.5** Verificar ALLOW: GET del logo SIN 402 (gate con billing activo)
  - REQ: REQ-004, REQ-006
  - Comando (contrato design.md, item a): `curl -s -o /dev/null -w "%{http_code}\n" "https://firebasestorage.googleapis.com/v0/b/gio-tech.firebasestorage.app/o/config%2Flogo_1750909570905?alt=media"`
  - Done: **200** = read público probado de punta a punta. **402** = billing aún cerrado (estado operativo del proyecto, NO fallo de rules): registrar el 402 como evidencia y re-correr al reactivar el billing (REQ-006 escenario billing cerrado).
  - Estimación: S
  - Dependencias: 1.4

- [ ] **1.6** GATE de Fase 1: condiciones de avance a Fase 2
  - REQ: REQ-006
  - Archivo: ninguno (verificación)
  - Done: (1) 1.3 confirma ruleset publicado == repo; (2) 1.4 confirma 403 en raíz Y en `config/`; (3) 1.5 con 200 (billing activo) o 402 documentado + fecha de re-corrida. Con (1) y (2) verdes el deploy de rules es exitoso; el gate del read se cierra con el 200 (se puede avanzar a Fase 2 igualmente con 402 anotado).
  - Estimación: S
  - Dependencias: 1.5

## Fase 2 — Verificación funcional (browser + dueño/orquestador)

- [ ] **2.1** Upload admin de logo VÁLIDO (PNG < 2MB)
  - REQ: REQ-002, REQ-003
  - Pasos: (1) login admin; (2) Admin → Configuración del Negocio → subir PNG de ~100KB; (3) "Configuración actualizada exitosamente!"
  - Done: logo subido a `config/logo_<ts>` y visible en el preview; sin errores en consola; `firestore.get()` del rol admin evalúa correctamente (cross-service activo).
  - Estimación: S
  - Dependencias: 1.6 (gate)

- [ ] **2.2** Logo público sin login (requisito funcional)
  - REQ: REQ-004
  - Pasos: ventana inPrivate/sin auth → landing y `/catalogo` → el logo del negocio carga (URL directa de Storage, sin 401/403).
  - Done: logo visible para visitantes anónimos; si la página no tiene logo activo visible → verificar el `configuracion.logo` apunta al objeto nuevo (REQ-004 escenario read /config).
  - Estimación: S
  - Dependencias: 2.1

- [ ] **2.3** Upload admin INVÁLIDO: SVG rechazado con error visible
  - REQ: REQ-003
  - Pasos: (1) admin → subir un archivo `.svg` (hoy aceptado por `accept="image/*"`, `AdminBusinessConfig.tsx:114`); (2) observar el error en pantalla
  - Done: aparece "Error al actualizar configuración: ..." (catch `:70-74`) — el vector XSS por SVG queda cerrado y el admin VE el fallo (no silencioso).
  - Estimación: S
  - Dependencias: 2.1

- [ ] **2.4** Upload admin INVÁLIDO: archivo > 2MB rechazado
  - REQ: REQ-003
  - Pasos: (1) admin → subir un archivo PNG de > 2MB; (2) observar el error en pantalla
  - Done: error visible en la UI; el objeto NO se crea en el bucket (verificar con listado de la consola si se desea).
  - Estimación: S
  - Dependencias: 2.1

- [ ] **2.5** No-regresión: write fuera de /config denegado y read del bucket público
  - REQ: REQ-001, REQ-004
  - Pasos: (1) REST: POST anónimo a un path cualquiera (p. ej. `name=verify_anon_otro.png`) → 403 (caso extra a 1.4); (2) GET anónimo del objeto huérfano de la raíz (`Photoroom_20250624_195858.JPEG`) → 200 (read público del catch-all); (3) confirmar que el objeto NO se puede borrar por REST ni por consola como sesión normal (si el dueño es owner de la consola, puede ver la denegación como permiso; NO borrar en este change — la limpieza es futura)
  - Done: los 3 puntos verificados y documentados.
  - Estimación: S
  - Dependencias: 2.2

- [ ] **2.6** Gates automatizados finales (sin cambios de código esperados)
  - REQ: REQ-005
  - Comandos (raíz): `npm test` (suite verde — sanity check, no se toca front) · `git status` (solo `storage.rules`, `firebase.json` + artefactos openspec)
  - Done: suite verde; `git diff firestore.rules` VACÍO (cero líneas tocadas — REQ-005 preservado); `git diff src/` VACÍO.
  - Estimación: S
  - Dependencias: 2.5

- [ ] **2.7** GATE de Fase 2 + checklist del dueño
  - REQ: REQ-002, REQ-003, REQ-004, REQ-006
  - Checklist para el dueño (requiere browser): (1) logo válido subido y visible (2.1); (2) logo público sin login (2.2); (3) SVG rechazado con error visible (2.3); (4) > 2MB rechazado (2.4); (5) [si el read dio 402 en 1.5] re-correr 1.5 con billing activo → 200.
  - Done: checklist completado por el dueño/orquestador. Con billing activo, la evidencia de REQ-006 queda cerrada (1.5 → 200).
  - Estimación: S
  - Dependencias: 2.6

## Fase 3 — Commits + archive

- [ ] **3.1** Commit de las reglas y la configuración
  - REQ: REQ-005
  - Comando (raíz): `git add storage.rules firebase.json` + commit conventional en inglés (p. ej. `feat(storage): secure bucket with admin-only config writes`)
  - Done: commit con SOLO los 2 archivos de producción + artefactos openspec del change (si el orquestador los incluye en el mismo commit o en `docs(sdd):`).
  - Estimación: S
  - Dependencias: 2.7 (gate)

- [ ] **3.2** Archive del change (sdd-archive)
  - REQ: ninguna (cierre)
  - Pasos: (1) sincronizar el spec delta a main specs (`openspec/specs/storage/spec.md`, primer spec del dominio storage); (2) mover `openspec/changes/secure-storage-rules/` a `openspec/changes/archive/2026-08-15-secure-storage-rules/`; (3) actualizar `state.yaml` a ARCHIVED con notas y evidencia (403/200/ruleset)
  - Done: carpeta archivada con prefijo ISO 2026-08-15; spec sincronizada; estado documentado. Sin push (lo realiza el orquestador si corresponde).
  - Estimación: S
  - Dependencias: 3.1

---

## Resumen de trazabilidad

| REQ | Tareas | Verificación |
|-----|--------|--------------|
| REQ-001 (write global denegado) | 0.1, 1.4, 2.5 | POST anónimo raíz → 403; POST path arbitrario → 403; delete denegado por evaluación |
| REQ-002 (write /config solo admin) | 0.1, 1.2, 1.4, 2.1, 2.7 | Upload admin PNG → OK; POST anónimo a `config/` → 403; upload asesor/cliente → deny (cross-service) |
| REQ-003 (validación tipo/tamaño) | 0.1, 2.3, 2.4, 2.7 | SVG → deny con error visible; PNG 3MB → deny; PNG 1MB → allow |
| REQ-004 (read público preservado) | 0.1, 1.5, 2.2, 2.5 | curl logo → 200 (billing activo); logo sin login; GET huérfano raíz → 200 |
| REQ-005 (versionado + deploy CLI) | 0.1, 0.2, 0.3, 1.2, 1.3, 2.6, 3.1 | `storage.rules` + sección storage en `firebase.json`; deploy `--only storage`; ruleset publicado == repo (API); `git diff firestore.rules` vacío |
| REQ-006 (evidencia post-deploy) | 1.4, 1.5, 1.6, 2.7 | curl 403 (deny) + curl 200 sin 402 (gate billing) + 402 documentado si billing cerrado |

Estimaciones: Fase 0 en S (2 archivos + revisión), Fase 1 en S/M (deploy + 4 verificaciones REST con token existente), Fase 2 en S (checklist funcional del dueño), Fase 3 en S. Total: 13 tareas en 4 fases. Orden de ejecución estricto: Fase 0 → Fase 1 → Fase 2 → Fase 3 (el deploy nunca antes de la revisión del diff; la verificación funcional nunca antes del gate 1.6; el archive nunca antes del checklist del dueño).