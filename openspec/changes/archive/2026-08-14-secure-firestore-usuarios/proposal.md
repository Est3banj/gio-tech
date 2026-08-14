---
id: secure-firestore-usuarios/proposal
status: proposed
title: "Proposal: secure-firestore-usuarios"
change_date: 2026-08-14
---

# Proposal: secure-firestore-usuarios

## Intent

La colección `usuarios` de Firestore es legible públicamente (`firestore.rules:31` → `allow read: if true`): cualquier persona sin autenticarse puede leer los documentos de TODOS los usuarios del sistema, incluyendo `email`, `whatsappNumber` y `rol`. Es fuga de PII en masa (riesgo alto), detectada en la auditoría de seguridad del 14/08/2026.

Riesgos secundarios a cerrar en el mismo change:

1. **Escalación de privilegios** (`firestore.rules:33`): `allow update` sin restricción de campos permite que un asesor haga `updateDoc(usuarios/{uid}, { rol: 'admin' })` y se auto-escale a admin.
2. **`producto_stats` sin validación de estructura** (`firestore.rules:8`): cualquier usuario autenticado puede crear docs basura o inflar `vistas` arbitrariamente (riesgo medio).

La solución no puede romper dos funcionalidades existentes:
- **Tab "Asesores" del admin** (`src/components/AdminPanel.tsx:122-128`): `onSnapshot` sobre TODA la colección sin `where`, filtrado en cliente.
- **Botón de WhatsApp del landing** (`src/contexts/WhatsappNumberContext.tsx:48-51`): lectura ANÓNIMA de `usuarios/{asesorId}` para el enlace público `?asesor=uid` (funcionalidad de captación). Sin alternativa pública, todo visitante cae al número default y se pierde la atribución por asesor.

## Scope

### In Scope

1. Reglas granulares de read/update para `usuarios`: read solo owner del doc o admin; `list` solo admin; update de self restringido por campos (`affectedKeys`); create/delete solo admin.
2. Validación estructural en writes de `producto_stats` (create/update con tipos y reglas de incremento), manteniendo read público (requisito de `orderBy('vistas','desc')`).
3. Nueva colección `perfiles_publicos/{uid}` con subconjunto público mínimo (`nombreCompleto`, `whatsappNumber`), read público por diseño, write self/admin.
4. Migración de `WhatsappNumberContext` a `perfiles_publicos` (con fallback al default existente).
5. Doble escritura en `AdminAsesoresTab` (create) y `AsesorPanel` (update whatsapp).
6. Backfill pre-deploy de `perfiles_publicos` para asesores existentes (script local con Admin SDK).
7. (SHOULD, no bloqueante) `AdminPanel` filtrando con `where('rol', 'in', ['admin', 'asesor'])`.

### Out of Scope

- Branch zombie `refactor/admin-panel-redesign`: decisión aparte, no se toca.
- Refactor de `ProductCard` y del flujo de productos populares (`usePopularProducts`).
- Otras colecciones abiertas detectadas en el barrido: `chat_logs` sin regla (deny implícito, bug latente en `ai-assistant.service.ts:29`), `productos`, `carrusel`, `configuracion` (reglas admin OK por diseño, no se modifican).
- Migrar el rol a custom claims (Opción B, descartada — ver Alternatives).
- `deleteDoc` de admin no elimina la cuenta de Auth del asesor (observación de diseño, requiere decisión separada).
- Rate-limit real contra inflado de vistas (no hay mecanismo confiable en rules; ver Riesgos Residuales).

## Approach

**Opción D (A + C de la exploración)** — validada y adoptada sin modificaciones sustanciales:

1. **Rules granulares con rol en doc** (no claims): `usuarios` pasa a read self/admin + list admin + update por campos; `producto_stats` valida estructura; nueva colección `perfiles_publicos` con read público mínimo.
2. **Vista pública separada**: el whatsapp del asesor se publica en `perfiles_publicos` (dato público por diseño del negocio, sin PII email/rol), y `WhatsappNumberContext` migra a esa colección. El enlace `?asesor=` sigue funcionando anónimamente.
3. **Rollout ordenado**: backfill → deploy de rules → deploy de front. La double escritura en front queda como mecanismo de sincronización de largo plazo.

## Solution — Decisiones Clave

### D1. Mecanismo de admin en rules: `get()` al doc propio, NO custom claims

Se mantiene el patrón ya instalado en el proyecto:

```
get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.rol == 'admin'
```

Justificación (por qué `get()` y no `request.auth.token.rol`):

- **Patrón ya existente**: `carrusel` (`.rules:14`), `productos` (`.rules:20`) y `configuracion` (`.rules:26`) ya autorizan admin vía `get`. Cambiar a claims obligaría a reescribir esas reglas (scope creep).
- **Cero custom claims hoy**: no hay functions ni código que los setee (`grep customClaims` → 0 resultados). Adoptar claims exige Cloud Function de gestión + migración + refresco de token en el cliente (`onIdTokenChanged`) — esfuerzo alto para el tamaño del problema.
- **Autoconsistencia sin recursión**: la regla de `usuarios` corto-circuita con `request.auth.uid == userId || get(...)`. Como el admin lee su propio doc, el `get()` es válido; el resto de colecciones que hacen `get(usuarios/self)` siguen funcionando sin cambios (la exploración §11 lo confirma).
- **Autorización en tiempo real**: el rol en doc se propaga al instante; con claims, un rol cambiado en el doc quedaría autorizando por claims vencidos hasta el refresh del token (latencia de seguridad).
- **Costo**: 1 doc-read extra por evaluación de regla admin — aceptable (operaciones administrativas, baja frecuencia).

### D2. Regla de `list` — clave para que AdminPanel.tsx:122 siga funcionando

Separar `get` y `list` explícitamente en `usuarios`:

```
allow get: if request.auth != null && (request.auth.uid == userId || isAdmin);
allow list: if request.auth != null && isAdmin;
```

Donde `isAdmin` es la función reusable que hace `get(usuarios/self).data.rol == 'admin'`.

Por qué funciona con la query sin `where` del AdminPanel: `list` solo depende de `request.auth` y del doc del PROPIO uid (invariante por request, no por doc objetivo). Firestore puede probar que la query es consistente con la regla para TODOS los docs devueltos → la suscripción de colección entera queda habilitada. Si la regla de `list` dependiera de `userId` (p. ej. `request.auth.uid == userId`), Firestore la denegaría porque no puede garantizar la condición para más de un doc. El filtrado de la lista (solo asesores) sigue en cliente, como hoy; el `where('rol','in',...)` opcional (REQ-009) es mejora y no cambia la validez de la query.

### D3. Update restrictivo anti-escalación

```
allow update: if (request.auth.uid == userId && isAdmin == false &&
    request.resource.data.diff(resource.data).affectedKeys().hasOnly(['whatsappNumber', 'nombreCompleto']) &&
    request.resource.data.whatsappNumber is string &&
    request.resource.data.nombreCompleto is string)
  || isAdmin;
```

- `AsesorPanel.tsx:65` solo actualiza `whatsappNumber` → sigue funcionando.
- `rol` y `email` quedan **inmutables para el self**: se cierra la auto-escalación asesor→admin (`firestore.rules:33`).
- El admin mantiene update completo (crear/asignar roles sigue siendo tarea de admin vía `AdminAsesoresTab`).

### D4. `producto_stats`: read público se MANTIENE, write validado

```
allow read: if true;                    // POR DISEÑO: query orderBy('vistas','desc') del ranking
allow create: if request.auth != null &&
  request.resource.data.keys().hasOnly(['vistas', 'productoId', 'ultimaVista']) &&
  request.resource.data.vistas == 1 &&
  request.resource.data.productoId is string &&
  request.resource.data.ultimaVista is timestamp;
allow update: if request.auth != null &&
  request.resource.data.diff(resource.data).affectedKeys().hasOnly(['vistas', 'ultimaVista']) &&
  request.resource.data.vistas == resource.data.vistas + 1 &&
  request.resource.data.ultimaVista is timestamp;
```

- **`orderBy('vistas','desc')`** (`productStats.service.ts:52-71`): Firestore exige que toda query sea consistente con las reglas; una condición de `get` por doc rompería la query. Al mantener `read: if true` (condición "siempre true"), la query sigue siendo válida — riesgo de denegación eliminado por diseño. `producto_stats` es público por diseño (datos agregados de popularidad, sin PII).
- **`vistas == resource.data.vistas + 1`** es seguro con `FieldValue.increment(1)` (`productStats.service.ts:31`): el valor de `request.resource.data` es el resultado server-side de aplicar el increment sobre el valor vigente → la condición siempre se cumple para incrementos legítimos y bloquea escrituras de valores absolutos arbitrarios.
- Bloquea: crear docs fuera de la estructura (spam), sobreescribir `vistas` con valores arbitrarios, borrar (sin regla `delete` → deny implícito).
- Crear un stat sobre un `productId` existente sigue siendo posible (solo se puede escribir el mismo doc con la misma estructura + incremento) — riesgo residual aceptado (sin rate-limit real).

### D5. `perfiles_publicos/{uid}` — vista pública mínima

```
match /perfiles_publicos/{uid} {
  allow read: if true;   // público POR DISEÑO: solo nombreCompleto + whatsappNumber
  allow create: if request.auth != null && (request.auth.uid == uid || isAdmin);
  allow update: if request.auth != null && (request.auth.uid == uid || isAdmin) &&
    request.resource.data.diff(resource.data).affectedKeys().hasOnly(['nombreCompleto', 'whatsappNumber']);
  allow delete: if isAdmin;
}
```

- Patrón estándar: datos mínimos públicos separados de PII. Expone únicamente lo que el negocio ya publicaba por el enlace `?asesor=`, sin `email` ni `rol`.
- `WhatsappNumberContext.tsx:48-51` migra a `onSnapshot(perfiles_publicos/{asesorId})` conservando el fallback al número default (comportamiento idéntico al de hoy).

### D6. Doble escritura en front (sincronización de largo plazo)

- `AdminAsesoresTab.tsx:70-75` (create): `setDoc` en `usuarios/{uid}` + `setDoc` en `perfiles_publicos/{uid}` con `{ nombreCompleto, whatsappNumber }`.
- `AsesorPanel.tsx:65` (update whatsapp): `updateDoc` en ambos docs.
- `AdminAsesoresTab.tsx:137` (delete): `deleteDoc` en ambos docs.
- La divergencia es posible (fuente de verdad duplicada) pero acotada a 2 campos públicos no sensibles; el script de backfill es idempotente y re-corrible como remediación.

### D7. Backfill: script local con Admin SDK (NO función onUserWrite/onCall)

Elegido: **script local one-off** (`firebase-admin` + service account, corrido desde `functions/` que ya tiene la dependencia).

Justificación de tradeoffs vs. función `onUserWrite`:

| Criterio | Script local (elegido) | Función onUserWrite |
|---|---|---|
| Superficie en producción | Cero código nuevo en `functions/` | Nueva function deployada, siempre activa |
| Control de ejecución | Puntual, verificable, idempotente, re-corrible | Automático, pero oculto (escrituras "mágicas") |
| Riesgo de error | Bajo: script echo/dry-run antes de escribir | Medio: fallbacks silenciosos, error de bug = divergencia silenciosa |
| Sincronización continua | No (la cubre la doble escritura del front) | Sí, pero redundante con la doble escritura del front → 2 mecanismos compitiendo |

No se elige `onUserWrite` porque la doble escritura del front (D6) YA es el mecanismo de sincronización en runtime; una function agregaría un segundo mecanismo concurrente (fuente de divergencia en sí misma) sin aportar cobertura.

**Qué copia**: por cada doc `usuarios` con `rol == 'asesor'` → crea `perfiles_publicos/{uid}` con los campos `nombreCompleto` y `whatsappNumber` **tal cual existen en el doc original** (sin transformación). No crea clientes (no tienen doc en `usuarios`).

**Qué pasa con asesores sin `whatsappNumber`**: se crea el doc igual, con `nombreCompleto` (y `whatsappNumber` ausente si no estaba en origen). El front ya maneja el caso sin whatsapp con fallback al default → comportamiento idéntico al actual. El backfill NO inventa datos.

**Precondición de deploy**: el script DEBE correr y verificarse ANTES de publicar las rules (si no, los asesores existentes pierden la atribución hasta que se migre).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `firestore.rules` | Modified | `usuarios` (read get/list, update por campos), `producto_stats` (write validado), nueva regla `perfiles_publicos` |
| `src/contexts/WhatsappNumberContext.tsx` | Modified | Migra lectura de `usuarios/{uid}` a `perfiles_publicos/{uid}`, mantiene fallback |
| `src/components/AdminAsesoresTab.tsx` | Modified | Doble escritura create/delete en `perfiles_publicos` |
| `src/components/AsesorPanel.tsx` | Modified | Doble escritura update whatsapp en `perfiles_publicos` |
| `src/components/AdminPanel.tsx` | Modified (SHOULD) | Query con `where('rol', 'in', ['admin','asesor'])` |
| `openspec/changes/secure-firestore-usuarios/` | New | Artefactos SDD (exploration, proposal; luego spec/design/tasks) |
| Script de backfill (one-off, NO se commitea a `functions/`) | New | Migración de `perfiles_publicos` pre-deploy |
| `src/App.tsx`, `src/hooks/useAuth.ts`, `src/components/Login.tsx`, `src/services/productStats.service.ts`, `functions/index.js` | None | No se tocan (siguen funcionando con las reglas nuevas — validado en exploración §3, §7, §8) |

## Alternatives Considered

1. **Opción B — custom claims para el rol** (descartada): exige Cloud Function de gestión de claims + migración de admins + refresco de token en cliente + reescritura de las reglas admin ya existentes de `carrusel`/`productos`/`configuracion` (scope creep); el claim no reemplaza el doc que la UI sigue necesitando. Complejidad alta, beneficio marginal para este tamaño de problema. Revisitarla en un change futuro de authz si el sistema crece.
2. **Opción A sola, sin `perfiles_publicos`** (descartada): rompe el botón de WhatsApp anónimo (punto 7 del mapa de accesos) — la atribución por asesor cae al default y se pierde captación. Inaceptable funcionalmente.
3. **Opción C sola, sin endurecer `usuarios`** (descartada): no cierra la fuga de PII (email/rol públicos siguen expuestos), que es el problema principal del change.
4. **Backfill vía función `onUserWrite`** (descartada): redundante con la doble escritura en front; agrega superficie en producción y un segundo mecanismo de sincronización competidor (detalle en D7).
5. **Rate-limit de vistas en rules** (descartado por inviabilidad técnica): no existe mecanismo confiable de throttling en rules; queda como riesgo residual.

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Romper la atribución del botón de WhatsApp (`?asesor=`) si el backfill no corre antes que las rules | Med | Fase 0 del plan: script de backfill + verificación MANUAL previa al deploy de rules; script idempotente re-corrible |
| Tab "Asesores" (AdminPanel) vacía con permission-denied si la regla `list` no autoriza | Low | Regla `list` con condición invariante por request (isAdmin) — verificable sin leer cada doc; prueba manual post-deploy (REQ-008) |
| Regresión de la escalación de rol si `affectedKeys` se implementa mal | Low | Regla `hasOnly(['whatsappNumber','nombreCompleto'])` + verificación en Rules Playground con escenario asesor→admin (REQ-002) |
| Query `orderBy('vistas','desc')` denegada | Eliminado por diseño | Se mantiene `read: if true` en `producto_stats` — única condición compatible con la query; validación en verify |
| Divergencia `usuarios` vs `perfiles_publicos` (doble escritura) | Med | Solo 2 campos públicos no sensibles; script idempotente como remediación; cobertura de prueba del AsesorPanel |
| Inflado de `vistas` (spam sin rate-limit) | Med | Validación estructural (solo incremento +1, solo 3 campos); el riesgo de volumen queda aceptado (no hay rate-limit en rules) |
| Costo extra de `get()` por regla admin | Low | 1 doc-read por operación admin; frecuencia baja |
| AdminPanel sigue trayendo TODA la colección (clientes incluidos) | Med | Regla list admin lo permite; el filtro `where` de REQ-009 (SHOULD) reduce el tráfico |

## Rollback Plan

1. **Rules**: `git revert` del commit de `firestore.rules` + `firebase deploy --only firestore:rules` (deploy atómico; la versión anterior restaura el read público y la escalación de rol — estado pre-cambio).
2. **Front**: revert del commit del front + `firebase deploy --only hosting`; `WhatsappNumberContext` vuelve a leer `usuarios/{uid}` (depende del revert de rules para no quedar denegado — por eso order 1 → 2).
3. **Backfill**: aditivo e inofensivo — eliminar `perfiles_publicos` no rompe nada si el front fue revertido; el script no borra datos de `usuarios`.
4. **Regla de oro**: nunca deployar rules sin el backfill verificado (mitiga el único riesgo de pérdida funcional real).

## Dependencies

- Acceso a la service account de Firebase (credencial) para el script de backfill; `firebase-admin` ya disponible en `functions/`.
- `firebase` CLI para deploy de rules/hosting.
- Sin dependencias de terceros nuevas en el front.

## Success Criteria

- [ ] Un visitante sin auth NO puede leer `usuarios` (ni `get` ni `list`) — verificado en Rules Playground y test de reglas
- [ ] Un asesor NO puede cambiar su propio `rol` ni `email` (update bloqueado con permission-denied)
- [ ] El admin puede listar TODA la colección `usuarios` (query sin `where` de AdminPanel:122) y administrar carrusel/productos/configuración sin cambios (reglas admin por `get` intactas)
- [ ] El enlace público `?asesor=uid` muestra el nombre/whatsapp del asesor SIN autenticación (vía `perfiles_publicos`) — verificación manual en landing
- [ ] `getPopularProductsStats` (orderBy vistas desc, limit 4) sigue devolviendo resultados sin permission-denied
- [ ] Writes de `producto_stats` con estructura inválida son rechazados; el incremento legítimo de `vistas` funciona
- [ ] Backfill ejecutado y verificado ANTES del deploy: 100% de asesores existentes con doc en `perfiles_publicos`
- [ ] `npm test` y `npm run lint` verdes; `npm run build` OK

## Implementation Plan (fases)

| Fase | Paso | Entregable | Gate |
|---|---|---|---|
| 0 | Backfill pre-deploy | Script local Admin SDK (dry-run → run → verificación conteo) | 100% asesores con perfil público; script idempotente |
| 1 | Rules | `firestore.rules`: reglas `usuarios` (get/list/update), `producto_stats` (write validado), `perfiles_publicos`; `firebase deploy --only firestore:rules` | Rules Playground: escenarios visitante/asesor/admin/query orderBy; tab Asesores OK; link `?asesor=` OK |
| 2 | Front | `WhatsappNumberContext` → `perfiles_publicos`; doble escritura en `AdminAsesoresTab` y `AsesorPanel`; (REQ-009 SHOULD) `where` en AdminPanel | `npm test` + lint + build; verificación manual landing |
| 3 | Verificación final | Pruebas manuales post-deploy (tab asesores, `?asesor=`, ranking populares, escalación bloqueada) | Todos los Success Criteria |

4 fases, 3 pasos de cambio + verificación. Dependencia estricta: Fase 0 antes de Fase 1; Fase 1 antes de Fase 2 (el front nuevo depende de la colección nueva; el front viejo depende del read público viejo).

## Spec Deltas (requisitos preliminares — detalle completo en sdd-spec)

- **REQ-001** (MUST): `usuarios` — `get` solo si `request.auth.uid == userId` o rol admin; `list` solo admin. *Given* un visitante anónimo, *when* lee `usuarios/{uid}` ajeno, *then* permission-denied. *Given* un admin, *when* lista la colección completa, *then* OK.
- **REQ-002** (MUST): `usuarios` — update de self restringido a `whatsappNumber`/`nombreCompleto` (string). *Given* un asesor, *when* intenta `updateDoc` con `rol: 'admin'`, *then* denegado; *when* actualiza `whatsappNumber`, *then* permitido.
- **REQ-003** (MUST): `producto_stats` — read público se mantiene; create con `keys().hasOnly(['vistas','productoId','ultimaVista'])`, `vistas == 1`, tipos correctos; update solo `vistas`/`ultimaVista` con `vistas == resource + 1`. *Given* un usuario logueado, *when* escribe un doc fuera de estructura, *then* denegado.
- **REQ-004** (MUST): colección `perfiles_publicos/{uid}` — read público; create self/admin; update self/admin con `hasOnly(['nombreCompleto','whatsappNumber'])`; delete admin. *Given* un visitante anónimo, *when* lee `perfiles_publicos/{uid}`, *then* OK (solo datos públicos).
- **REQ-005** (MUST): `WhatsappNumberContext` lee `perfiles_publicos/{asesorId}` con fallback al default. *Given* un visitante por `?asesor=uid` con perfil público, *when* carga el landing, *then* usa el whatsapp del asesor; *when* sin perfil, *then* número default.
- **REQ-006** (MUST): doble escritura — `AdminAsesoresTab` (create/delete) y `AsesorPanel` (update whatsapp) escriben `usuarios` y `perfiles_publicos` en la misma operación (o secuencia atómica equivalente). *Given* un admin crea un asesor, *when* se verifica Firestore, *then* existen docs en ambas colecciones con mismos `nombreCompleto`/`whatsappNumber`.
- **REQ-007** (MUST): backfill pre-deploy — script Admin SDK crea `perfiles_publicos/{uid}` para todo `usuarios` con `rol == 'asesor'`, copiando `nombreCompleto`/`whatsappNumber` tal cual; asesores sin whatsapp → doc con campos presentes solamente (sin datos inventados). *Given* N asesores existentes, *when* corre el script (dry-run luego run), *then* N docs creados, idempotente.
- **REQ-008** (MUST): rollout ordenado backfill → rules → front, con verificación manual de tab Asesores y link `?asesor=` post-deploy; rollback según plan de la propuesta.
- **REQ-009** (SHOULD): `AdminPanel` filtra con `where('rol', 'in', ['admin','asesor'])` para reducir tráfico (no bloqueante para el deploy).