# Tasks: secure-firestore-usuarios

**Change**: `secure-firestore-usuarios`
**Fecha**: 2026-08-14
**Dependencias**: `proposal.md` (Opción D) · `specs/firestore/spec.md` (REQ-001..REQ-012) · `design.md` (D1..D8)
**Formato commits**: conventional commits en inglés (openspec/config.yaml)

**GATE GLOBAL (crítico, aplica a TODO el flujo)**: NUNCA ejecutar `firebase deploy --only firestore:rules` hasta que la Fase 0 haya corrido y verificado (`preview → apply → preview` con "pendientes: 0"). Sin backfill previo, los asesores existentes pierden la atribución `?asesor=` (REQ-008). Orden estricto: **Fase 0 → Fase 1 → Fase 2 → Fase 3**.

---

## Fase 0 — Backfill pre-deploy (gate obligatorio ANTES de Fase 1)

- [x] **0.1** Verificar entorno de backfill existente en `scripts/` (NO crear credencial nueva)
  - REQ: REQ-007, REQ-008
  - Archivo: `scripts/service-account.json` (preexistente, backfill 2025-09-18), `scripts/package.json` (ya declara `firebase-admin ^12.5.0`), `scripts/backfillSpecs.js` (patrón preview/apply a imitar)
  - Done: confirmado que `scripts/service-account.json` existe, NO está trackeado en git (`git check-ignore` OK) y `firebase-admin` instalado en `scripts/node_modules`. Si faltara la credencial → parar y consultar al orquestador (no crear una nueva sin autorización).
  - Estimación: S
  - Dependencias: ninguna

- [x] **0.2** Crear `scripts/backfillPerfilesPublicos.js` (CommonJS, imitando `backfillSpecs.js`)
  - REQ: REQ-007, REQ-004
  - Archivo: `scripts/backfillPerfilesPublicos.js` (NUEVO)
  - Done: script con modo default = preview (NO escribe): lista `usuarios` con `where('rol', '==', 'asesor')` y por cada doc computa `{ uid, nombreCompleto, whatsappNumber, willCreate, willUpdate, write }`; escribe artefacto `scripts/backfill-perfiles-preview-<timestamp>.json`. Modo `--apply`: `set(perfil, { merge: true })` en `perfiles_publicos/{uid}` + artefacto `backfill-perfiles-applied-<timestamp>.json` + re-verificación de conteo. Regla de construcción del `write`: SOLO campos presentes en origen (`nombreCompleto` si `!= null`, `whatsappNumber` si `!= null`) — NO inventa datos; asesor sin whatsapp → perfil sin ese campo. Idempotente por `merge: true`. Credencial: `require('./service-account.json')` + `admin.credential.cert(...)`. NO tocar `functions/`.
  - Estimación: M
  - Dependencias: 0.1

- [x] **0.3** Agregar npm scripts de backfill a `scripts/package.json`
  - REQ: REQ-007
  - Archivo: `scripts/package.json`
  - Done: existen `"backfill:perfiles:preview": "node backfillPerfilesPublicos.js"` y `"backfill:perfiles:apply": "node backfillPerfilesPublicos.js --apply"` (además de los scripts existentes de `backfillSpecs.js`).
  - Estimación: S
  - Dependencias: 0.2

- [x] **0.4** Ejecutar preview y auditar los datos propuestos
  - REQ: REQ-007
  - Archivo: `scripts/backfill-perfiles-preview-<timestamp>.json` (artefacto generado)
  - Done: `npm run backfill:perfiles:preview` (workdir `scripts/`) corre sin errores; el conteo N de asesores coincide con `usuarios`; se auditan manualmente los `uid` (todos `rol == 'asesor'`, sin clientes ni admins) y los campos públicos coinciden con el doc origen. Commit del script vía `git commit` conventional en inglés (p. ej. `feat(scripts): add perfiles_publicos backfill script`).
  - NOTA BATCH 1: preview corrido y auditado (7/7 asesores, cero PII en write). Commit DIFERIDO por orden del orquestador (el commit va al final del change o cuando se defina).
  - Estimación: S
  - Dependencias: 0.3

- [x] **0.5** Ejecutar apply y re-verificar con preview (pendientes 0)
  - REQ: REQ-007, REQ-008
  - Archivo: `scripts/backfill-perfiles-applied-<timestamp>.json` (artefacto generado)
  - Done: `npm run backfill:perfiles:apply` corre y crea N docs; re-correr preview reporta `willCreate: false` para todos y **"pendientes: 0"** (idempotencia confirmada: sin duplicados ni sobrescritura divergente); conteo verificado contra Firestore.
  - Estimación: S
  - Dependencias: 0.4
  - NOTA BATCH 3: apply corrido 2026-08-14 ~22:04 UTC: 7 perfiles creados, post-apply 7/7 verificados, re-preview con pendientes 0. Auditoría independiente sobre Firestore: 7/7 docs con SOLO `nombreCompleto`+`whatsappNumber` (cero email/rol).

- [x] **0.6** GATE: confirmar condición de despliegue de rules
  - REQ: REQ-008
  - Archivo: ninguno (verificación)
  - Done: `gate.md` inline en el reporte de apply — 100% de asesores existentes con doc en `perfiles_publicos`. Si hay pendientes > 0 → NO avanzar a Fase 1 (regresión crítica: atribución caída al default). Registrar el estado como evidencia en el artefacto `applied`.
  - Estimación: S
  - Dependencias: 0.5
  - NOTA BATCH 3: GATE PASADO — re-preview post-apply reporta 7 asesores, 0 a crear, 0 a actualizar, **Pendientes: 0**. Gate = 100% de asesores (7/7) con perfil en `perfiles_publicos`. Fase 0 COMPLETA; listo para Fase 1 (rules).

## Fase 1 — Firestore Rules (bloqueado por GATE de Fase 0)

- [x] **1.1** Agregar función auxiliar `isAdmin()` en `firestore.rules`
  - REQ: REQ-011
  - Archivo: `firestore.rules` (tras línea 3, nivel de servicio)
  - Done: `function isAdmin() { return get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.rol == 'admin'; }` — invocada SIEMPRE detrás de guard `request.auth != null`. Solo para las ramas nuevas; `carrusel`/`productos`/`configuracion` conservan su `get()` inline.
  - Estimación: S
  - Dependencias: 0.6 (gate)
  - NOTA BATCH 4: implementada literal según design.md D1.

- [x] **1.2** Reescribir bloque `producto_stats` (reemplaza `firestore.rules:6-9`)
  - REQ: REQ-003
  - Archivo: `firestore.rules`
  - Done: `allow read: if true` (POR DISEÑO, consistencia con `orderBy('vistas','desc')`); `create` con `keys().hasOnly(['vistas','productoId','ultimaVista'])` && `vistas == 1` && tipos (string/timestamp); `update` con `affectedKeys().hasOnly(['vistas','ultimaVista'])` && `vistas == resource.data.vistas + 1` && `ultimaVista` timestamp; SIN `allow delete` (deny implícito). Bloque EXACTO según design.md D4.
  - Estimación: M
  - Dependencias: 1.1
  - NOTA BATCH 4: implementada literal según design.md D4.

- [x] **1.3** Reescribir bloque `usuarios` (reemplaza `firestore.rules:30-35`)
  - REQ: REQ-001, REQ-002, REQ-010
  - Archivo: `firestore.rules`
  - Done: `get` solo `request.auth.uid == userId || isAdmin()`; `list` solo `isAdmin()` (condición invariante por request — imprescindible para la query sin `where` de AdminPanel.tsx:122); `create`/`delete` solo admin; `update` con rama self (`!isAdmin()`, `affectedKeys().hasOnly(['whatsappNumber','nombreCompleto'])`, ambos `is string`) O rama admin. OJO: en update self NO usar `keys().hasOnly` (el doc resultante trae email/rol existentes). Bloque EXACTO según design.md D2/D3.
  - Estimación: M
  - Dependencias: 1.1
  - NOTA BATCH 4: implementada literal según design.md D2/D3.

- [x] **1.4** Agregar bloque `perfiles_publicos/{uid}` (colección nueva)
  - REQ: REQ-004
  - Archivo: `firestore.rules` (tras el bloque `usuarios`)
  - Done: `read: if true` (público POR DISEÑO, solo 2 campos); `create` self/admin; `update` self/admin con `affectedKeys().hasOnly(['nombreCompleto','whatsappNumber'])`; `delete` solo admin. Sin regla de listado → list denegado implícitamente. Bloque EXACTO según design.md D5.
  - Estimación: S
  - Dependencias: 1.1
  - NOTA BATCH 4: implementada literal según design.md D5.

- [x] **1.5** Verificar que `carrusel`, `productos` y `configuracion` quedaron INTACTOS
  - REQ: REQ-012
  - Archivo: `firestore.rules`
  - Done: diff de git muestra 0 cambios en los bloques `carrusel`/`productos`/`configuracion` (siguen con read público + write admin vía `get` inline). El archivo completo cierra el archivo propuesto del design.md (62 líneas).
  - Estimación: S
  - Dependencias: 1.2, 1.3, 1.4
  - NOTA BATCH 4: verificación byte-a-byte vs HEAD: los 3 bloques reportan IDENTICO (script de comparación por secciones). Archivo final: 64 líneas (62 del design + 2 por layout de blank lines — contenido estructural idéntico).

- [x] **1.6** Deploy de rules a producción
  - REQ: REQ-008
  - Archivo: `firestore.rules` → `firebase deploy --only firestore:rules` (desde raíz del repo; `firebase.json` ya apunta a `firestore.rules`)
  - Done: deploy exitoso y confirmado. **SOLO después de 0.6 verde (pendientes 0)**. Commit con conventional commit en inglés (p. ej. `feat(rules): restrict usuarios reads and validate producto_stats writes`).
  - Estimación: S
  - Dependencias: 0.6 (GATE), 1.5
  - NOTA BATCH 4: deploy CORRIDO con éxito 2026-08-14 (proyecto `gio-tech`): "rules file firestore.rules compiled successfully" + "released rules firestore.rules to cloud.firestore". COMMIT DIFERIDO por orden del orquestador (el commit va al cierre del change).

- [ ] **1.7** Verificar con Rules Playground — 4 perfiles + escenarios anti-regresión
  - REQ: REQ-001, REQ-002, REQ-003, REQ-004, REQ-010, REQ-011
  - Archivo: Rules Playground (consola Firebase)
  - NOTA 2026-08-14: método CAMBIADO por decisión del dueño → verificación automatizada con identidades REALES vía REST: `scripts/verify-rules-prod.js` (12 casos, login Firebase Auth por REST, REST API de Firestore, cleanup de emergencia con admin SDK). Script LISTO con `node --check` OK; ejecución PENDIENTE de credenciales de env (GIO_PROD_*).
  - Done: TODOS los escenarios de la tabla design.md (4 perfiles):
    - **Visitante** (auth null): `get usuarios/{UID_ADMIN}` y `list usuarios` → DENIED; `get perfiles_publicos/{UID_ASESOR}` y `read producto_stats` → ALLOW; query `producto_stats` con `orderBy('vistas','desc') limit(4)` → ALLOW
    - **Asesor**: `get usuarios/{self}` → ALLOW; `get usuarios/{UID_ADMIN}`/`list` → DENIED; `update {whatsappNumber}` → ALLOW; `update {rol:'admin'}` → **DENIED** (anti-escalación); `delete perfiles_publicos/{self}` → DENIED
    - **Admin**: `get usuarios/{otro}`/`list`/`create`/`delete perfiles_publicos` → ALLOW
    - **producto_stats writes**: `create {vistas: 5}` → DENIED; `update {vistas: 999}` → DENIED; `update {increment(1), ultimaVista}` → ALLOW
  - Estimación: M
  - Dependencias: 1.6
  - NOTA BATCH 4: NO ejecutable por agente (consola web). Checklist de 10 casos listo para el dueño (reporte de batch). Pendiente de corrida del dueño.

- [x] **1.8** Fix: quitar gate auth de `producto_stats` manteniendo validación estructural (ranking público de vistas)
  - REQ: REQ-013, REQ-003
  - Archivo: `firestore.rules` (bloque `producto_stats`)
  - Done: eliminado `request.auth != null` de `create`/`update` — el write real del front va ANÓNIMO (`ProductCard.tsx:38-42` → `productStats.service.ts:30-40`) y la regla con auth producía 403 preexistente que mataba el ranking desde mayo. Validación estructural INTACTA: `create` con `keys().hasOnly(['vistas','productoId','ultimaVista'])` && `vistas == 1` && tipos (string/timestamp); `update` con `affectedKeys().hasOnly(['vistas','ultimaVista'])` && `vistas == resource.data.vistas + 1` (anti-inflación) && `ultimaVista` timestamp. SIN `allow delete` (deny implícito). Bloque EXACTO según criterio del dueño (Opción A). Las demás secciones (carrusel/productos/configuracion/usuarios/perfiles_publicos) NO se tocaron.
  - Estimación: S
  - Dependencias: 1.7

- [ ] **1.9** Ampliar `verify-rules-prod.js` de 12 a 15 casos (3 nuevos anónimos) + re-corrida
  - REQ: REQ-013
  - Archivo: `scripts/verify-rules-prod.js`
  - Done: casos 13 (anónimo POST create válido → ALLOW 200, crea doc real con sentinel `productoId == "__verify__"`), 14 (anónimo PATCH update +1 sobre el mismo doc → ALLOW 200, encadenado al 13), 15 (anónimo POST con campo extra en `verify_prod_test2` → DENIED 403). Cleanup admin SDK (pre y post) extendido a AMBOS ids de test con guard sentinel. `node --check` OK.
  - Estimación: M
  - Dependencias: 1.8
  - NOTA BATCH 6: script ACTUALIZADO y verificado (`node --check`); la CORRIDA contra producción queda PENDIENTE del orquestador (credenciales GIO_PROD_* de env) — NO la ejecuta el agente.

## Fase 2 — Front (requiere Fase 1 deployada: la colección nueva debe existir en rules)

- [x] **2.1** Migrar `WhatsappNumberContext` a `perfiles_publicos` con fallback intacto
  - REQ: REQ-005
  - Archivo: `src/contexts/WhatsappNumberContext.tsx` (línea 48)
  - Done: `doc(db, "usuarios", asesorIdFromUrl)` → `doc(db, "perfiles_publicos", asesorIdFromUrl)`. El resto del efecto (:46-62) NO cambia: doc con `whatsappNumber` → ese valor; doc inexistente / sin campo / snapshot con error → `DEFAULT_WHATSAPP_NUMBER = '573223652569'`. Lógica de `?asesor=`/`localStorage` (:27-43) intacta.
  - Estimación: M
  - Dependencias: 1.6
  - NOTA BATCH 5: aplicada literal (diff de 1 línea). Contrato del contexto intacto.

- [x] **2.2** Crear test unitario de `WhatsappNumberContext` (migración)
  - REQ: REQ-005
  - Archivo: `src/contexts/WhatsappNumberContext.test.tsx` (NUEVO)
  - Done: test con patrón `vi.mock('firebase/firestore')` + `vi.mock('../firebase')` (imitar `product.service.test.ts:3-23`) y `@testing-library/react`. Casos: (a) snapshot con `{ whatsappNumber }` → provider expone ese valor; (b) snapshot inexistente o sin campo → default `'573223652569'`; (c) error de snapshot → default. `npm test` pasa el archivo nuevo.
  - Estimación: M
  - Dependencias: 2.1
  - NOTA BATCH 5: creado con 4 casos (a, b-inexistente, b-sin-campo, c-error). 4/4 verde. `onSnapshot` mockeado devolviendo `vi.fn()` (unsubscribe) para no romper el unmount.

- [x] **2.3** Doble escritura create en `AdminAsesoresTab`
  - REQ: REQ-006
  - Archivo: `src/components/AdminAsesoresTab.tsx` (:70-75, handleAddAsesor)
  - Done: tras `setDoc(usuarios/{user.uid}, { email, nombreCompleto, rol, whatsappNumber })` → `setDoc(doc(db, "perfiles_publicos", user.uid), { nombreCompleto: nombreCompletoAsesor, whatsappNumber: whatsappAsesor })`. Secuencia `usuarios` primero, `perfiles_publicos` después; ante fallo del segundo → log para remediación con backfill idempotente.
  - Estimación: M
  - Dependencias: 2.1 (orden lógico), 1.6
  - NOTA BATCH 5: aplicada. Espejo en try/catch propio con `console.error` (no rompe el alta principal; log "remediar con backfill"). Objeto literal SOLO con los 2 campos públicos (salvaguarda D6).

- [x] **2.4** Doble escritura update en `AdminAsesoresTab`
  - REQ: REQ-006
  - Archivo: `src/components/AdminAsesoresTab.tsx` (:111-114, handleUpdateAsesor)
  - Done: tras `updateDoc(usuarios/{editandoAsesor.id}, { nombreCompleto, whatsappNumber })` → `updateDoc(doc(db, "perfiles_publicos", editandoAsesor.id), { nombreCompleto, whatsappNumber })` con los mismos valores.
  - Estimación: S
  - Dependencias: 2.3
  - NOTA BATCH 5: aplicada. Mismo patrón try/catch + log del espejo.

- [x] **2.5** Doble escritura delete en `AdminAsesoresTab`
  - REQ: REQ-006
  - Archivo: `src/components/AdminAsesoresTab.tsx` (:137, handleDeleteAsesor)
  - Done: tras `deleteDoc(usuarios/{id})` → `deleteDoc(doc(db, "perfiles_publicos", id))`. (El admin sí puede borrar perfiles: `allow delete: if isAdmin`.)
  - Estimación: S
  - Dependencias: 2.3
  - NOTA BATCH 5: aplicada. Si el espejo falla, log "queda doc huérfano del perfil" (el backfill es aditivo y NO limpia huérfanos — riesgo residual declarado en reporte).

- [x] **2.6** Doble escritura update whatsapp en `AsesorPanel`
  - REQ: REQ-002, REQ-006
  - Archivo: `src/components/AsesorPanel.tsx` (:63-65, handleUpdateWhatsapp)
  - Done: tras `updateDoc(usuarios/{currentUser.uid}, { whatsappNumber })` → `updateDoc(doc(db, "perfiles_publicos", currentUser.uid), { whatsappNumber })` (cubre REQ-002 escenario "asesor actualiza su propio whatsapp" Y REQ-006).
  - Estimación: S
  - Dependencias: 2.4 (mismo patrón), 1.6
  - NOTA BATCH 5: aplicada. Solo `whatsappNumber` viaja al espejo (salvaguarda D6).

- [x] **2.7** Salvaguarda anti-PII: revisar que NINGÚN write de `perfiles_publicos` lleva `email`/`rol`
  - REQ: REQ-004
  - Archivo: `src/components/AdminAsesoresTab.tsx`, `src/components/AsesorPanel.tsx` (revisión cruzada)
  - Done: revisión manual de las 4 escrituras nuevas (create/update/delete/update whatsapp) — en `perfiles_publicos` SOLO se escriben `nombreCompleto` y `whatsappNumber`. Verificado por grep: no hay `email` ni `rol` en ningún `setDoc`/`updateDoc` de perfiles_publicos.
  - Estimación: S
  - Dependencias: 2.3, 2.4, 2.5, 2.6
  - NOTA BATCH 5: verificado por grep cruzado (objetos literales, cero spread; regex `perfiles_publicos[\s\S]{0,200}(email|rol)` sin matches).

- [x] **2.8** (SHOULD, no bloqueante) Filtrar query del tab asesores con `where`
  - REQ: REQ-009
  - Archivo: `src/components/AdminPanel.tsx` (:122)
  - Done: query con `where('rol', 'in', ['admin', 'asesor'])` + imports de `query` y `where` de `firebase/firestore`. NO cambia la validez frente a la regla `list` (isAdmin). Si se omite, el tab sigue funcionando sin filtro — la tarea queda marcada SHOULD.
  - Estimación: S
  - Dependencias: 1.6
  - NOTA BATCH 5: APLICADA (segura: regla `list` invariante por request → la query con where sigue siendo consistente; subset de docs admin/asesor — los clientes no tienen doc en `usuarios`; sin cambios de comportamiento del listado).

- [x] **2.9** Correr suite completa del front (test + lint + build)
  - REQ: REQ-008
  - Archivo: raíz del repo — `npm test` (vitest), `npm run lint` (ESLint 9), `npm run build` (Vite)
  - Done: `npm test` verde sin regresiones (incluye `product.service.test.ts`, `product-matcher.test.ts`, `formatters.test.ts` + test nuevo 2.2), `npm run lint` 0 errores, `npm run build` OK. Commit con conventional commit en inglés (p. ej. `feat(front): read whatsapp from perfiles_publicos with dual-write`).
  - Estimación: M
  - Dependencias: 2.7, 2.8 (si se incluye)
  - NOTA BATCH 5: `npm test` 28/28 (4 archivos, incluido el nuevo); `npm run build` OK (419ms). Lint: 1 error + 4 warnings PREEXISTENTES y NO relacionados (comprobado con `git stash` de src/ → mismísimo resultado en HEAD): `ProductCard.tsx:117` (error `mensajeWhatsAppCreditoDirecto` unused), warnings en App.tsx:47, CartContext.tsx:10 y WhatsappNumberContext.tsx:10/:43. Ningún problema en los 5 archivos tocados. COMMIT DIFERIDO por orden del orquestador.

## Fase 3 — Verificación manual post-deploy y checklist anti-regresión

- [ ] **3.1** Verificar tab Asesores (listado completo de colección sin permission-denied)
  - REQ: REQ-001, REQ-008
  - Done: admin logueado → tab Asesores lista TODA la colección `usuarios` (query sin `where` de `AdminPanel.tsx:122`), sin errores de permisos en consola (escenario REQ-001 "admin lista la colección completa").
  - Estimación: S
  - Dependencias: 2.9 + deploy front (`firebase deploy --only hosting`)

- [ ] **3.2** Verificar atribución `?asesor=uid` en landing (sin login)
  - REQ: REQ-004, REQ-005, REQ-008
  - Done: con pestaña/inPrivate sin auth, abrir `?asesor={uidAsesor existente}` → el botón de contacto usa SU whatsapp (vía `perfiles_publicos`); probar también `?asesor={uidSinPerfil}` → número default `'573223652569'`; y asesor sin campo `whatsappNumber` → default sin error.
  - Estimación: S
  - Dependencias: 3.1

- [ ] **3.3** Verificar ranking de populares (query `orderBy('vistas','desc')`)
  - REQ: REQ-003
  - Done: `getPopularProductsStats` devuelve resultados ordenados sin permission-denied; registrar una vista → `vistas` incrementa en exactamente 1.
  - Estimación: S
  - Dependencias: 3.1

- [ ] **3.4** Verificar intento de escalación bloqueado (asesor → admin)
  - REQ: REQ-002, REQ-011
  - Done: con sesión de asesor (no admin), ejecutar en consola `updateDoc(usuarios/{self}, { rol: 'admin' })` → permission-denied; `updateDoc(usuarios/{self}, { email: 'otro@x.com' })` → denegado; `updateDoc(usuarios/{self}, { whatsappNumber })` → permitido (AsesorPanel).
  - Estimación: S
  - Dependencias: 3.1

- [ ] **3.5** Verificar writes inválidos de `producto_stats` denegados + fuga de PII cerrada
  - REQ: REQ-003, REQ-001
  - Done: sesión logueada → `setDoc(producto_stats/{x}, { vistas: 1, productoId, ultimaVista, basura: 'x' })` → denegado; `updateDoc` con `vistas: 999` → denegado; delete → denegado. Visitante sin auth → `getDoc(usuarios/{cualquiera})` y `collection(usuarios).get()` → permission-denied (fuga cerrada).
  - Estimación: S
  - Dependencias: 3.1

- [ ] **3.6** Verificar que `perfiles_publicos` no expone PII y respeta owner/roles
  - REQ: REQ-004
  - Done: doc `perfiles_publicos/{uid}` contiene SOLO `nombreCompleto`/`whatsappNumber` (sin `email`/`rol`); asesor A no puede `updateDoc(perfiles_publicos/{B})`; asesor no-admin no puede `deleteDoc` (denegado); admin puede borrar; visitante puede leer.
  - Estimación: S
  - Dependencias: 3.1

- [ ] **3.7** Verificar no-regresión de reglas admin preexistentes (carrusel/productos/configuración)
  - REQ: REQ-011, REQ-012
  - Done: admin logueado → crear/editar/borrar slide de carrusel, editar `productos` y `configuracion` → permitido (patrón `get(usuarios/self)` intacto); no-admin → write denegado; degradar a un asesor en el doc (rol → 'cliente') → pierde autorización de admin INMEDIATAMENTE sin re-login (escenario REQ-011).
  - Estimación: S
  - Dependencias: 3.1