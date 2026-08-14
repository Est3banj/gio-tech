---
id: secure-firestore-usuarios/spec
status: active
title: "Spec: secure-firestore-usuarios"
change_date: 2026-08-14
---

# Delta for Firestore (seguridad de acceso a datos)

## Purpose

Fidelity delta del change `secure-firestore-usuarios`: cierra la fuga de PII de la colección `usuarios` (read público actual, `firestore.rules:31`), bloquea la auto-escalación de rol (update sin restricción de campos, `firestore.rules:33`), valida la estructura de writes de `producto_stats` (write autenticado sin validación, `firestore.rules:8`), e introduce la colección `perfiles_publicos` como vista pública mínima para **no romper** la atribución del botón de WhatsApp del landing (`?asesor=uid`, lectura anónima hoy en `WhatsappNumberContext.tsx:48-51`) ni el listado completo del tab asesores (`AdminPanel.tsx:122-128`).

Comportamiento preservado (validado en exploración §3, §7, §8) que este change NO debe alterar: `App.tsx`, `useAuth.ts` y `Login.tsx` leen el doc propio de `usuarios` (siguen cubiertos); `carrusel`, `productos` y `configuracion` autorizan admin vía `get(usuarios/self)` (no se tocan); `functions/index.js` corre con Admin SDK y no consulta `usuarios` ni `producto_stats`.

## ADDED Requirements

### REQ-004: Colección `perfiles_publicos/{uid}` — vista pública mínima

El sistema DEBE exponer la colección `perfiles_publicos/{uid}` como vista pública de solo lectura, conteniendo EXCLUSIVAMENTE `nombreCompleto` (string) y `whatsappNumber` (string) de cada asesor. La colección NO DEBE contener `email`, `rol` ni ningún otro campo (refuerzo anti-PII: también en `create`/`update`, no solo por convención del backfill).

- El sistema DEBE permitir `read` sobre cualquier doc de `perfiles_publicos` sin autenticación (público por diseño de negocio: dato ya publicado vía `?asesor=`, sin PII).
- El sistema DEBE permitir `create` solo si `request.auth != null` y el uid autenticado es el owner del doc o tiene rol admin, con estructura restringida a `hasOnly(['nombreCompleto', 'whatsappNumber'])`.
- El sistema DEBE permitir `update` solo si el uid autenticado es el owner del doc o tiene rol admin, con `affectedKeys().hasOnly(['nombreCompleto', 'whatsappNumber'])` y ambos valores string.
- El sistema DEBE permitir `delete` solo a admin.
- El resto de operaciones (listado de colección, writes no autorizados) DEBEN quedar denegadas.

#### Scenario: Visitante anónimo lee el perfil público de un asesor

- GIVEN un visitante sin autenticación en el landing con `?asesor={uidAsesor}`
- WHEN solicita `getDoc(perfiles_publicos/{uidAsesor})`
- THEN la lectura es permitida
- AND el doc contiene solo `nombreCompleto` y `whatsappNumber`

#### Scenario: Visitante anónimo intenta leer datos no públicos vía perfiles_publicos

- GIVEN un visitante sin autenticación
- WHEN un `create` o `update` intenta escribir en `perfiles_publicos/{uid}` un doc con campos fuera de `['nombreCompleto', 'whatsappNumber']` (p. ej. `email`)
- THEN la escritura es DENEGADA con `hasOnly` (la colección pública nunca puede contener PII)

#### Scenario: Asesor que no es owner intenta actualizar un perfil ajeno

- GIVEN un asesor autenticado `A` y un doc `perfiles_publicos/{B}` de otro asesor
- WHEN `A` intenta `updateDoc(perfiles_publicos/{B}, { whatsappNumber: '...' })`
- THEN la operación es DENEGADA (permission-denied)

#### Scenario: Asesor actualiza su propio perfil público

- GIVEN un asesor autenticado `A`
- WHEN ejecuta `updateDoc(perfiles_publicos/{A}, { whatsappNumber: 'nuevo' })`
- THEN la operación es permitida

#### Scenario: Usuario no-admin intenta borrar un perfil público

- GIVEN un asesor autenticado (no admin)
- WHEN ejecuta `deleteDoc(perfiles_publicos/{cualquierUid})`
- THEN la operación es DENEGADA

#### Scenario: Admin borra un perfil público

- GIVEN un admin autenticado
- WHEN ejecuta `deleteDoc(perfiles_publicos/{uidAsesor})`
- THEN la operación es permitida

### REQ-005: Migración de `WhatsappNumberContext` a `perfiles_publicos`

El sistema DEBE migrar la lectura del `WhatsappNumberContext` de `usuarios/{asesorId}` a `perfiles_publicos/{asesorId}`, conservando el fallback al número default existente. La atribución del botón de WhatsApp del landing (`?asesor=uid`) DEBE seguir funcionando para visitantes sin autenticación, con comportamiento idéntico al actual: perfil existente → número del asesor; perfil inexistente → número default.

#### Scenario: Visitante por `?asesor=uid` con perfil público existente

- GIVEN un visitante sin autenticación con `?asesor={uidAsesor}` y un doc `perfiles_publicos/{uidAsesor}` con `whatsappNumber`
- WHEN carga el landing y se resuelve el contexto de WhatsApp
- THEN el botón de contacto usa el `whatsappNumber` del asesor (atribución preservada, sin login)

#### Scenario: Visitante por `?asesor=uid` sin perfil público

- GIVEN un visitante sin autenticación con `?asesor={uidAsesor}` y SIN doc en `perfiles_publicos/{uidAsesor}`
- WHEN carga el landing y se resuelve el contexto de WhatsApp
- THEN se usa el número default (mismo comportamiento que hoy cuando el asesor no tiene whatsapp)

#### Scenario: Asesor sin whatsappNumber en su perfil público

- GIVEN un asesor cuyo doc `perfiles_publicos/{uid}` no tiene el campo `whatsappNumber` (backfill sin datos inventados)
- WHEN un visitante llega por `?asesor={uid}`
- THEN el contexto resuelve al número default sin error

### REQ-006: Doble escritura `usuarios` + `perfiles_publicos` en front

El sistema DEBE escribir en AMBAS colecciones (`usuarios/{uid}` y `perfiles_publicos/{uid}`) en las operaciones de gestión de asesores: `AdminAsesoresTab` en create y delete, y `AsesorPanel` en update de whatsapp. Los docs en ambas colecciones DEBEN mantener los mismos valores de `nombreCompleto` y `whatsappNumber` tras cada operación (sincronización de largo plazo; la divergencia acotada a 2 campos públicos es tolerada y remediable re-corriendo el backfill idempotente).

#### Scenario: Admin crea un asesor

- GIVEN un admin autenticado en `AdminAsesoresTab`
- WHEN crea un asesor con `setDoc(usuarios/{nuevoUid}, { email, nombreCompleto, rol, whatsappNumber })`
- THEN la misma operación crea `perfiles_publicos/{nuevoUid}` con `{ nombreCompleto, whatsappNumber }`
- AND ambos docs son legibles con los mismos valores públicos

#### Scenario: Asesor actualiza su whatsapp

- GIVEN un asesor autenticado en `AsesorPanel`
- WHEN actualiza `whatsappNumber` con `updateDoc(usuarios/{uid}, ...)`
- THEN la misma operación actualiza `whatsappNumber` en `perfiles_publicos/{uid}`
- AND el landing (lectura anónima) muestra el nuevo número

#### Scenario: Admin borra un asesor

- GIVEN un admin autenticado en `AdminAsesoresTab`
- WHEN ejecuta `deleteDoc(usuarios/{idAsesor})`
- THEN la misma operación ejecuta `deleteDoc(perfiles_publicos/{idAsesor})`

### REQ-007: Backfill pre-deploy de `perfiles_publicos` con Admin SDK

El sistema DEBE proveer un script local one-off (con `firebase-admin` y service account, NO una Cloud Function) que cree `perfiles_publicos/{uid}` para TODO doc de `usuarios` con `rol == 'asesor'`, copiando `nombreCompleto` y `whatsappNumber` TAL CUAL existen en el doc original (sin transformación ni valores inventados). Los asesores sin `whatsappNumber` DEBEN recibir doc con los campos presentes solamente. El script DEBE ser idempotente (re-corrible sin duplicar ni sobrescribir con datos divergentes) y DEBE ejecutarse en modo dry-run con verificación de conteo antes de la corrida real. Los clientes (sin doc en `usuarios`) NO DEBEN recibir perfil público.

#### Scenario: Backfill de N asesores existentes

- GIVEN N docs en `usuarios` con `rol == 'asesor'` y 0 docs en `perfiles_publicos`
- WHEN se ejecuta el script (dry-run primero, luego run) y se verifica el conteo
- THEN se crean N docs `perfiles_publicos/{uid}` con los `nombreCompleto`/`whatsappNumber` copiados tal cual

#### Scenario: Asesor sin whatsappNumber en origen

- GIVEN un doc `usuarios/{uid}` con `rol == 'asesor'` y SIN campo `whatsappNumber`
- WHEN se ejecuta el backfill
- THEN se crea `perfiles_publicos/{uid}` con `nombreCompleto` y sin campo `whatsappNumber` (el script NO inventa datos)

#### Scenario: Backfill re-corrido (idempotencia)

- GIVEN que el backfill ya corrió y creó los N docs de `perfiles_publicos`
- WHEN se vuelve a ejecutar el script
- THEN no se crean duplicados ni se sobrescriben los campos públicos existentes con valores divergentes

#### Scenario: Clientes sin doc en usuarios

- GIVEN un usuario autenticado con rol `cliente` (default, sin doc en `usuarios`)
- WHEN se ejecuta el backfill
- THEN NO se crea ningún `perfiles_publicos` para ese uid (solo `rol == 'asesor'`)

### REQ-008: Rollout ordenado backfill → rules → front con verificación manual

El sistema DEBE desplegar el cambio en el orden estricto: (1) backfill verificado, (2) deploy de `firestore.rules`, (3) deploy del front. El backfill DEBE estar ejecutado y verificado (100% de asesores con doc en `perfiles_publicos`) ANTES de publicar las rules nuevas; en caso contrario, los asesores existentes pierden la atribución `?asesor=` hasta la migración. Post-deploy DEBE verificarse manualmente el tab asesores y el enlace `?asesor=`. El plan de rollback DEBE ser: revert de rules → revert de front (orden atómico inverso).

#### Scenario: Orden correcto de despliegue

- GIVEN el backfill corrido y verificado (N asesores con perfil público)
- WHEN se deployan las rules nuevas y luego el front nuevo
- THEN el tab asesores del admin sigue listando toda la colección y el enlace `?asesor=` sigue resolviendo

#### Scenario: Deploy de rules sin backfill previo (regresión crítica)

- GIVEN asesores existentes SIN docs en `perfiles_publicos` y rules nuevas desplegadas
- WHEN un visitante accede por `?asesor={uidAsesor}`
- THEN la atribución cae al número default (pérdida de captación) — este estado NO DEBE existir: la condición de despliegue del backfill es previa y obligatoria

#### Scenario: Rollback atómico

- GIVEN un deploy del change con regresión detectada en el tab asesores o en `?asesor=`
- WHEN se ejecuta el rollback
- THEN se revierten las rules (restaurando el estado pre-cambio) ANTES que el front (el front revertido depende de las rules revertidas para no quedar denegado)

### REQ-010: `usuarios` — create/delete solo admin (comportamiento preservado y explicitado)

El sistema DEBE mantener la creación y borrado de docs en `usuarios` restringidos a admin (comportamiento ya vigente, `firestore.rules:32,34`). Este requisito se explicita para que la regresión de create/delete quede cubierta por verificación en las pruebas de reglas.

#### Scenario: Admin crea un usuario

- GIVEN un admin autenticado
- WHEN ejecuta `setDoc(usuarios/{nuevoUid}, { email, nombreCompleto, rol, whatsappNumber })`
- THEN la operación es permitida

#### Scenario: Usuario no-admin intenta crear un usuario

- GIVEN un asesor autenticado (no admin)
- WHEN ejecuta `setDoc(usuarios/{cualquierUid}, {...})`
- THEN la operación es DENEGADA

#### Scenario: Usuario no-admin intenta borrar un usuario

- GIVEN un asesor autenticado (no admin)
- WHEN ejecuta `deleteDoc(usuarios/{cualquierUid})`
- THEN la operación es DENEGADA

### REQ-011: Determinación de admin por rol en doc propio, sin custom claims

El sistema DEBE autorizar operaciones administrativas comparando `get(usuarios/$(request.auth.uid)).data.rol == 'admin'`, reutilizando el patrón ya instalado en el proyecto (mismo mecanismo que `carrusel`, `productos` y `configuracion`). El sistema NO DEBE requerir custom claims ni re-login: un cambio de rol en el doc DEBE propagarse como autorización de manera inmediata en la siguiente evaluación de reglas.

#### Scenario: Rol cambiado se propaga sin re-login

- GIVEN un admin que degrada a un asesor editando su doc `usuarios/{uid}` (rol → 'cliente')
- WHEN el asesor degradado (sesión vigente, token sin claims) intenta una operación de admin
- THEN la operación es DENEGADA de inmediato (sin esperar refresh de token)

#### Scenario: Admin autorizado vía get al doc propio

- GIVEN un admin autenticado cuyo doc `usuarios/{uid}` tiene `rol == 'admin'`
- WHEN ejecuta una operación administrativa (create/update/delete en `carrusel`, `productos`, `configuracion` o `usuarios`)
- THEN la operación es permitida (patrón `get` intacto, sin cambios en las reglas de esas colecciones)

### REQ-012: Reglas existentes de `carrusel`, `productos` y `configuracion` no se modifican

El sistema DEBE conservar sin cambios las reglas de `carrusel`, `productos` y `configuracion` (read público + write admin vía `get`). La restricción del read de `usuarios` NO DEBE romper el `get(usuarios/self)` que esas reglas realizan (autoconsistencia: el admin puede leer su propio doc).

#### Scenario: Regresión del carrusel evitada

- GIVEN un admin autenticado
- WHEN ejecuta una escritura en `carrusel` (crear/actualizar/borrar slide)
- THEN la operación es permitida por la regla admin existente (sin cambios en el change)

#### Scenario: Catálogo y configuración siguen públicos con write admin

- GIVEN las reglas nuevas desplegadas
- WHEN un visitante anónimo lee `productos` o `configuracion`, o un no-admin intenta escribirlas
- THEN la lectura es permitida y la escritura DENEGADA (comportamiento idéntico al actual)

## MODIFIED Requirements

### REQ-001: `usuarios` — get solo owner/admin, list solo admin

(Previously: `allow read: if true` en `firestore.rules:31` — cualquier persona sin autenticar podía leer TODOS los docs de `usuarios`, incluyendo `email`, `whatsappNumber` y `rol` de todos los usuarios: fuga de PII en masa.)

El sistema DEBE separar explícitamente `get` y `list` en `usuarios`:

- `get` sobre `usuarios/{userId}` DEBE requerir autenticación y solo permitirse si `request.auth.uid == userId` o el uid autenticado tiene rol admin.
- `list` sobre la colección `usuarios` DEBE requerir autenticación y solo permitirse a admin (condición invariante por request, evaluable sin leer cada doc objetivo — requisito para que la query SIN `where` de `AdminPanel.tsx:122-128` siga siendo válida).
- Un visitante anónimo NO DEBE poder ni `get` ni `list`.

#### Scenario: Asesor lee su propio doc

- GIVEN un asesor autenticado
- WHEN ejecuta `getDoc(usuarios/{suPropioUid})`
- THEN la lectura es permitida

#### Scenario: Anónimo lee el doc de un usuario

- GIVEN un visitante sin autenticación
- WHEN intenta `getDoc(usuarios/{cualquierUid})`
- THEN la operación es DENEGADA (permission-denied) — la fuga de PII queda cerrada

#### Scenario: Anónimo lista la colección de usuarios

- GIVEN un visitante sin autenticación
- WHEN intenta `collection(usuarios).get()` o suscribirse con `onSnapshot`
- THEN la operación es DENEGADA

#### Scenario: Admin lista la colección completa (tab asesores, query sin where)

- GIVEN un admin autenticado y la query `onSnapshot(collection(db, "usuarios"))` SIN `where` de `AdminPanel.tsx:122-128`
- WHEN se evalúa la suscripción a la colección completa
- THEN la operación es permitida (la regla de `list` es consistente para todos los docs devueltos; el filtrado de asesores sigue en cliente)

#### Scenario: Usuario no-admin lista la colección de usuarios

- GIVEN un asesor autenticado (no admin)
- WHEN intenta listar la colección `usuarios` (o suscribirse a ella)
- THEN la operación es DENEGADA

#### Scenario: Admin lee el doc de otro usuario

- GIVEN un admin autenticado
- WHEN ejecuta `getDoc(usuarios/{uidDeOtroUsuario})`
- THEN la lectura es permitida (por rol admin)

### REQ-002: `usuarios` — update de self restringido a campos permitidos

(Previously: `allow update` sin restricción de campos (`firestore.rules:33`) — un asesor podía `updateDoc(usuarios/{suUid}, { rol: 'admin' })` y auto-escalarse. A su vez, `email` era editable por el propio usuario.)

El sistema DEBE denegar el `update` de un usuario sobre su propio doc a menos que los únicos campos afectados sean `whatsappNumber` y `nombreCompleto` (ambos string). `rol` y `email` DEBEN quedar inmutables para el self: un usuario NO DEBE poder cambiar su propio rol ni su propio email. El admin DEBE mantener update completo (crear/asignar roles sigue siendo tarea de admin).

#### Scenario: Asesor intenta escalarse a admin

- GIVEN un asesor autenticado
- WHEN ejecuta `updateDoc(usuarios/{suUid}, { rol: 'admin' })`
- THEN la operación es DENEGADA con permission-denied (cierra la auto-escalación de `firestore.rules:33`)

#### Scenario: Asesor actualiza su propio whatsapp

- GIVEN un asesor autenticado en `AsesorPanel`
- WHEN ejecuta `updateDoc(usuarios/{suUid}, { whatsappNumber: 'nuevo' })`
- THEN la operación es permitida

#### Scenario: Asesor actualiza su nombre completo

- GIVEN un asesor autenticado
- WHEN ejecuta `updateDoc(usuarios/{suUid}, { nombreCompleto: 'nuevo' })`
- THEN la operación es permitida

#### Scenario: Admin cambia el rol de un usuario

- GIVEN un admin autenticado
- WHEN ejecuta `updateDoc(usuarios/{uidAsesor}, { rol: 'admin' })`
- THEN la operación es permitida (gestión de roles sigue siendo privilegio del admin)

### REQ-003: `producto_stats` — read público preservado, write validado

(Previously: `allow write: if request.auth != null` en `firestore.rules:8` — cualquier usuario autenticado podía crear docs basura o escribir `vistas` con valores arbitrarios, inflando el ranking de populares.)

El sistema DEBE mantener `read` público en `producto_stats` (condición "siempre true") para que la query `orderBy('vistas', 'desc')` de `getPopularProductsStats` siga siendo consistente con las reglas y no sea denegada. El sistema DEBE validar los writes:

- `create` DEBE requerir autenticación y estructura EXACTA: `keys().hasOnly(['vistas', 'productoId', 'ultimaVista'])`, con `vistas == 1` (número), `productoId` string y `ultimaVista` timestamp.
- `update` DEBE requerir autenticación, afectar SOLO `['vistas', 'ultimaVista']` (hasOnly), exigir `vistas == resource.data.vistas + 1` (incremento de exactamente 1, compatible con `FieldValue.increment(1)`) y `ultimaVista` timestamp.
- `delete` DEBE quedar denegado (sin regla explícita → deny implícito).
- Sobrescribir `vistas` con valores absolutos arbitrarios o crear docs con campos extra DEBE ser denegado.

#### Scenario: Anónimo lee el ranking de populares (query orderBy)

- GIVEN un visitante sin autenticación
- WHEN ejecuta la query `orderBy('vistas', 'desc')` con `limit(4)` sobre `producto_stats`
- THEN la operación es permitida y devuelve resultados ordenados (sin permission-denied)

#### Scenario: Usuario logueado registra una vista (update +1)

- GIVEN un usuario autenticado y un doc `producto_stats/{productId}` existente
- WHEN ejecuta `updateDoc` con `vistas: FieldValue.increment(1)` y `ultimaVista`
- THEN la operación es permitida y `vistas` aumenta en exactamente 1

#### Scenario: Create válido de un stat nuevo

- GIVEN un usuario autenticado
- WHEN ejecuta `setDoc(producto_stats/{productId}, { vistas: 1, productoId, ultimaVista })`
- THEN la operación es permitida

#### Scenario: Create con campos extra es denegado

- GIVEN un usuario autenticado
- WHEN ejecuta `setDoc(producto_stats/{id}, { vistas: 1, productoId, ultimaVista, camposBasura: 'x' })`
- THEN la operación es DENEGADA

#### Scenario: Update con valor absoluto arbitrario es denegado

- GIVEN un usuario autenticado y `resource.data.vistas == 10`
- WHEN ejecuta `updateDoc(producto_stats/{productId}, { vistas: 999 })`
- THEN la operación es DENEGADA (`vistas != resource.data.vistas + 1`)

### REQ-009: `AdminPanel` — filtro opcional con `where('rol', 'in', ['admin', 'asesor'])`

(Previously: la query sin `where` de `AdminPanel.tsx:122-128` trae TODA la colección `usuarios`, clientes incluidos, y filtra en cliente.)

El sistema DEBERÍA (SHOULD, no bloqueante para el deploy) modificar la query del tab asesores para filtrar con `where('rol', 'in', ['admin', 'asesor'])`, reduciendo el tráfico. Esta mejora NO DEBE cambiar la validez de la query frente a las reglas nuevas (la regla de `list` admin sigue siendo consistente con la query filtrada) y NO DEBE ser requisito de despliegue: si se omite, el tab sigue funcionando con la query completa.

#### Scenario: Query con where sigue siendo válida para admin

- GIVEN un admin autenticado y las rules nuevas desplegadas
- WHEN ejecuta la query `collection(usuarios).where('rol', 'in', ['admin', 'asesor'])` con `onSnapshot`
- THEN la operación es permitida y devuelve solo los docs con los roles indicados