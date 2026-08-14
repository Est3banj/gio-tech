# Design: secure-firestore-usuarios

**Change**: `secure-firestore-usuarios`
**Fecha**: 2026-08-14
**Dependencias**: `proposal.md` (Opción D: A + C) · `exploration.md` (§2 mapa de rules, §3 mapa de accesos)

---

## Technical Approach

Se cierra la fuga de PII de `usuarios` (read público, `firestore.rules:31`) con reglas granulares por documento + rol, sin migrar a custom claims; se separa una vista pública mínima (`perfiles_publicos/{uid}`) para que el enlace `?asesor=uid` siga funcionando ANÓNIMAMENTE (`WhatsappNumberContext.tsx:48-51`); se valida la estructura de `producto_stats` manteniendo el read público (requisito de la query `orderBy('vistas','desc')`, `productStats.service.ts:57`); y se introduce un backfill idempotente pre-deploy que sigue el patrón ya instalado en `scripts/` (package.json propio, `firebase-admin` local, service account en `scripts/service-account.json`, artefactos `backfill-*-<timestamp>.json`).

Rol de administración: **sigue viviendo en el doc** `usuarios/{uid}` (campo `rol`), con el string exacto `'admin'` — evidencia: `src/types/index.ts:58` (`UserRole = 'admin' | 'asesor' | 'cliente'`), `src/App.tsx:178` (`usuario.rol === "admin"`), `src/components/AdminAsesoresList.tsx:59`. No hay custom claims en el proyecto (exploración §5).

---

## Architecture Decisions

### D1. Helper `isAdmin()` en rules (get al doc propio)

**Choice**: función reutilizable al nivel del servicio de rules:

```
function isAdmin() {
  return get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.rol == 'admin';
}
```

**Alternatives**: inline de la expresión en cada regla; custom claims.
**Rationale**: patrón YA instalado en `carrusel` (:14), `productos` (:20) y `configuracion` (:26). El `get()` apunta al doc del PROPIO `request.auth.uid`, que con la nueva regla de `get` se lee a sí mismo (`request.auth.uid == userId`) → **sin recursión**, autoconsistente (exploración §5, proposal D1). Es segura invocarla solo detrás de guards `request.auth != null` (estilo del proyecto, evita evaluación con `request.auth` null). Costo: 1 doc-read por evaluación — ver Riesgos R2.

### D2. `usuarios`: separación explícita `get` / `list` (clave para AdminPanel:122)

**Choice**:

```
allow get:  if request.auth != null && (request.auth.uid == userId || isAdmin());
allow list: if request.auth != null && isAdmin();
```

**Rationale**: el tab Asesores (`AdminPanel.tsx:122-128`) hace `onSnapshot(collection(db, "usuarios"))` **sin `where`** y filtra en cliente. Firestore exige que la query sea consistente con la regla para TODOS los docs de la colección; si `list` dependiera del doc objetivo (`uid == userId`), la query entera se deniega. `list` con `isAdmin()` depende SOLO del auth uid y del doc propio → invariante por request → la suscripción de colección completa queda habilitada. Los lectores de doc propio (`App.tsx:46-49`, `useAuth.ts:31-43`, `Login.tsx:40-49`, `AsesorPanel.tsx:28-29`) caen en `get`, sin cambio.

### D3. `usuarios`: update de self anti-escalación (reemplaza `firestore.rules:33`)

**Choice**:

```
allow update: if (request.auth != null && request.auth.uid == userId && !isAdmin() &&
    request.resource.data.diff(resource.data).affectedKeys().hasOnly(['whatsappNumber', 'nombreCompleto']) &&
    request.resource.data.whatsappNumber is string &&
    request.resource.data.nombreCompleto is string)
  || (request.auth != null && isAdmin());
```

**Rationale**: cierra la escalación asesor→admin (`exploration.md` §6): `rol` y `email` quedan inmutables para el self. `AsesorPanel.tsx:63-65` solo envía `{ whatsappNumber }` → `affectedKeys() == ['whatsappNumber']` → pasa. El admin conserva update completo (crear/asignar roles sigue siendo tarea de admin vía `AdminAsesoresTab.tsx:111-114`). Advertencia de implementación: `request.resource.data` es el doc COMPLETO resultante — los checks `is string` se aplican sobre campos puntuales, nunca `keys().hasOnly` en update self (el doc trae `email`/`rol` existentes). Commit actual de la línea 33: `allow update: if request.auth != null && (request.auth.uid == userId || get(...usuarios/$(request.auth.uid)).data.rol == 'admin');`

### D4. `producto_stats`: read público MANTENIDO, write validado (reemplaza `firestore.rules:6-9`)

**Choice**:

```
allow read: if true;   // POR DISEÑO: consistencia con orderBy('vistas','desc') de productStats.service.ts:57
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

**Rationale**: la query del ranking (`getPopularProductsStats`, `productStats.service.ts:52-71`) exige que la condición de read sea "siempre true" (si dependiera del doc, Firestore no puede probar consistencia con `orderBy` y la deniega — riesgo eliminado por diseño, proposal D4 y exploración §7). El write valida estructura exacta contra el flujo real del service: `recordProductView` crea `{ vistas: 1, ultimaVista: new Date(), productoId }` (`:36-40`) o actualiza `{ vistas: increment(1), ultimaVista: new Date() }` (`:30-33`). `request.resource.data.vistas == resource.data.vistas + 1` se cumple SIEMPRE con `increment(1)` (el valor ya es el resultado server-side de la operación) y bloquea escrituras absolutas arbitrarias. Sin `allow delete` → deny implícito.

### D5. `perfiles_publicos/{uid}` — vista pública mínima

**Choice**:

```
match /perfiles_publicos/{uid} {
  allow read: if true;   // público POR DISEÑO: SOLO nombreCompleto + whatsappNumber
  allow create: if request.auth != null && (request.auth.uid == uid || isAdmin());
  allow update: if request.auth != null && (request.auth.uid == uid || isAdmin()) &&
    request.resource.data.diff(resource.data).affectedKeys().hasOnly(['nombreCompleto', 'whatsappNumber']);
  allow delete: if request.auth != null && isAdmin();
}
```

**Rationale**: patrón estándar (datos mínimos públicos separados de PII). Soporta el enlace `?asesor=uid` del landing sin exponer `email`/`rol`. El doc id ES el auth uid (mismo convenio que `usuarios`). Solo se publican los 2 campos que el negocio ya exponía (exploración §7 del mapa de accesos).

### D6. Doble escritura en front (sincronización de largo plazo) + salvaguarda

**Choice**: los 3 sitios que escriben `usuarios` escriben también `perfiles_publicos`, en la misma operación secuencial (`usuarios` primero, luego `perfiles_publicos`; ante fallo del segundo, log + el script de backfill sirve de remediación idempotente):

| Sitio | Línea actual | Escritura nueva |
|---|---|---|
| `AdminAsesoresTab.tsx` handleAddAsesor (create) | `setDoc(usuarios/{user.uid}, { email, nombreCompleto, rol, whatsappNumber })` (:70-75) | + `setDoc(doc(db, "perfiles_publicos", user.uid), { nombreCompleto: nombreCompletoAsesor, whatsappNumber: whatsappAsesor })` |
| `AdminAsesoresTab.tsx` handleUpdateAsesor | `updateDoc(usuarios/{editandoAsesor.id}, { nombreCompleto, whatsappNumber })` (:111-114) | + `updateDoc(doc(db, "perfiles_publicos", editandoAsesor.id), { nombreCompleto, whatsappNumber })` |
| `AdminAsesoresTab.tsx` handleDeleteAsesor | `deleteDoc(usuarios/{id})` (:137) | + `deleteDoc(doc(db, "perfiles_publicos", id))` |
| `AsesorPanel.tsx` handleUpdateWhatsapp | `updateDoc(usuarios/{currentUser.uid}, { whatsappNumber })` (:63-65) | + `updateDoc(doc(db, "perfiles_publicos", currentUser.uid), { whatsappNumber })` |

**SALVAGUARDA (regla de oro)**: en `perfiles_publicos` NUNCA se copian `email` ni `rol` — solo `nombreCompleto` y `whatsappNumber`. Si no, la fuga de PII se traslada a la colección "pública por diseño". El backend (`functions/index.js`) NO toca estas colecciones: sin cambios (exploración §8).

### D7. Backfill: script local idempotente, siguiendo el patrón existente de `scripts/`

**Choice**: script Node CommonJS en `scripts/backfillPerfilesPublicos.js` con `firebase-admin` de `scripts/node_modules` (`scripts/package.json` ya declara `firebase-admin ^12.5.0`), credencial desde `scripts/service-account.json` (convención del proyecto — el backfill de specs previo del 2025-09-18 usa exactamente este layout: `backfillSpecs.js` + `service-account.json` + artefactos `backfill-preview-*.json` / `backfill-applied-*.json`). NO se toca `functions/` (proposal D7: "NO se commitea a functions/").

**Alternatives**: función `onUserWrite` (descartada — redundante con la doble escritura, agrega superficie en prod); custom claims (descartada — scope creep).
**Rationale**: control puntual, verificable, idempotente y re-corrible como remediación de divergencia (proposal D7, tabla de tradeoffs). El front ya cubre la sincronización en runtime; una function sería un segundo mecanismo competidor.

### D8. `WhatsappNumberContext` migra a `perfiles_publicos` conservando fallback

**Choice**: `src/contexts/WhatsappNumberContext.tsx:48` cambia `doc(db, "usuarios", asesorIdFromUrl)` → `doc(db, "perfiles_publicos", asesorIdFromUrl)`. El resto del efecto (:46-62) NO cambia: si el doc existe y tiene `whatsappNumber` → usa ese valor; si no existe, no tiene el campo, o el snapshot falla (permission-denied / error) → `DEFAULT_WHATSAPP_NUMBER = '573223652569'` (:6, :53, :56, :60). La lógica de `?asesor=`/`localStorage` (:27-43) no se toca. Comportamiento observable idéntico al actual.

**Alternatives**: leer `usuarios` con regla especial (rechazado: expone PII); número default fijo (rechazado: pierde atribución de captación).
**Rationale**: REQ-005 (fallback idéntico); cero riesgo de regresión de conversión.

---

## Reglas Firestore — bloque EXACTO final

Reemplaza `firestore.rules:6-9` (producto_stats) y `firestore.rules:30-35` (usuarios); agrega la función `isAdmin()` y el bloque `perfiles_publicos`. Archivo propuesto completo (`rules_version = '2'`, 62 líneas):

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      return get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.rol == 'admin';
    }

    // --- PRODUCTO_STATS ---
    match /producto_stats/{statId} {
      allow read: if true;  // Público POR DISEÑO: consistencia con orderBy('vistas','desc')
      allow create: if request.auth != null &&
        request.resource.data.keys().hasOnly(['vistas', 'productoId', 'ultimaVista']) &&
        request.resource.data.vistas == 1 &&
        request.resource.data.productoId is string &&
        request.resource.data.ultimaVista is timestamp;
      allow update: if request.auth != null &&
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['vistas', 'ultimaVista']) &&
        request.resource.data.vistas == resource.data.vistas + 1 &&
        request.resource.data.ultimaVista is timestamp;
    }

    // --- NUEVA REGLA PARA EL CARRUSEL --- (SIN CAMBIOS)
    match /carrusel/{slideId} {
      allow read: if true;
      allow create, update, delete: if request.auth != null && get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.rol == 'admin';
    }

    // Reglas para la colección 'productos' (Catálogo público) (SIN CAMBIOS)
    match /productos/{productId} {
      allow read: if true;
      allow create, update, delete: if request.auth != null && get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.rol == 'admin';
    }

    // Reglas para la colección 'configuracion' (SIN CAMBIOS)
    match /configuracion/{docId} {
      allow read: if true;
      allow write: if request.auth != null && get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.rol == 'admin';
    }

    // Reglas para la colección 'usuarios'
    match /usuarios/{userId} {
      allow get: if request.auth != null && (request.auth.uid == userId || isAdmin());
      allow list: if request.auth != null && isAdmin();
      allow create: if request.auth != null && isAdmin();
      allow update: if (request.auth != null && request.auth.uid == userId && !isAdmin() &&
          request.resource.data.diff(resource.data).affectedKeys().hasOnly(['whatsappNumber', 'nombreCompleto']) &&
          request.resource.data.whatsappNumber is string &&
          request.resource.data.nombreCompleto is string)
        || (request.auth != null && isAdmin());
      allow delete: if request.auth != null && isAdmin();
    }

    // Vista pública mínima para el enlace ?asesor= (SOLO nombreCompleto + whatsappNumber)
    match /perfiles_publicos/{uid} {
      allow read: if true;   // público POR DISEÑO: datos mínimos no sensibles
      allow create: if request.auth != null && (request.auth.uid == uid || isAdmin());
      allow update: if request.auth != null && (request.auth.uid == uid || isAdmin()) &&
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['nombreCompleto', 'whatsappNumber']);
      allow delete: if request.auth != null && isAdmin();
    }

  }
}
```

Notas de implementación:
- `carrusel`/`productos`/`configuracion` NO se tocan (siguen autorizando con su `get(...)` inline — refactor a `isAdmin()` opcional, no bloqueante).
- El `!isAdmin()` en el update self es deliberado: sin él, un admin también pasaría la primera rama; la segunda rama cubre al admin.
- Los guards `request.auth != null` en todas las ramas preservan el estilo defensivo del archivo actual.

---

## Data Flow

```
[Visitante con ?asesor=uid]
  └─ WhatsappNumberContext.tsx:48 ── onSnapshot(doc(db,"perfiles_publicos",uid)) ─▶ whatsapp | default '573223652569'

[Admin: tab Asesores]
  └─ AdminPanel.tsx:122 ── onSnapshot(collection(db,"usuarios")) ── regla list (isAdmin) ─▶ lista completa (filtro cliente)

[Admin crea asesor]                    [Admin edita asesor]            [Admin borra asesor]
  └─ AdminAsesoresTab:70-75              └─ :111-114                     └─ :137
      setDoc usuarios/{uid}  +              updateDoc ambos docs            deleteDoc ambos docs
      setDoc perfiles_publicos/{uid}

[Asesor actualiza whatsapp]
  └─ AsesorPanel.tsx:63-65 ── updateDoc(usuarios/{self}) + updateDoc(perfiles_publicos/{self})

[Visita a producto]
  └─ productStats.service.ts:25-45 ── setDoc/updateDoc producto_stats/{productId} (reglas D4)
      └─ :52-71 getPopularProductsStats ── query orderBy('vistas','desc') limit(4) (read: if true)

[Pre-deploy Fase 0]
  └─ scripts/backfillPerfilesPublicos.js ── usuarios where rol=='asesor' ─▶ perfiles_publicos/{uid} (set merge)
```

---

## File Changes

| File | Acción | Descripción |
|---|---|---|
| `firestore.rules` | Modify | Reemplaza bloque `producto_stats` (:6-9) y `usuarios` (:30-35); agrega función `isAdmin()` (tras :3) y bloque `perfiles_publicos` (tras :35) |
| `src/contexts/WhatsappNumberContext.tsx` | Modify | :48 → `doc(db, "perfiles_publicos", asesorIdFromUrl)`; resto del efecto intacto (fallback :6/:53/:56/:60) |
| `src/components/AdminAsesoresTab.tsx` | Modify | +`setDoc` perfiles (:70-75), +`updateDoc` perfiles (:111-114), +`deleteDoc` perfiles (:137) |
| `src/components/AsesorPanel.tsx` | Modify | +`updateDoc` perfiles (:63-65) |
| `src/components/AdminPanel.tsx` | Modify (SHOULD, REQ-009) | :122 query con `where('rol', 'in', ['admin','asesor'])`; requiere importar `query` y `where` de `firebase/firestore` (hoy importa :3-8) |
| `scripts/backfillPerfilesPublicos.js` | Create | Script backfill idempotente (abajo) |
| `scripts/package.json` | Modify | +`"backfill:perfiles:preview"` y `"backfill:perfiles:apply"` |
| `src/contexts/WhatsappNumberContext.test.tsx` | Create | Prueba unitaria nueva (patrón mock de `product.service.test.ts:3-23`) |
| `src/services/productStats.service.test.ts` | Create (SHOULD) | Prueba de `recordProductView` (create vs increment) |

---

## Interfaces / Contracts

### Backfill — `scripts/backfillPerfilesPublicos.js` (CommonJS)

- **Credencial**: `require('./service-account.json')` + `admin.credential.cert(...)` — mismo directorio, sin env var (convención del proyecto; el `backfillSpecs.js` previo la usa igual). No tocar `functions/`.
- **Modo preview (default)**: NO escribe. Lista `usuarios` con `where('rol', '==', 'asesor')`, por cada doc computa `{ uid, nombreCompleto, whatsappNumber, willCreate, willUpdate, write }` y escribe artefacto `scripts/backfill-perfiles-preview-<timestamp>.json` (mismo formato que `backfill-preview-*.json` existente). Salida: conteo antes + pendientes.
- **Modo apply** (`--apply`): por cada asesor → `db.collection('perfiles_publicos').doc(uid).set(perfil, { merge: true })`; escribe `scripts/backfill-perfiles-applied-<timestamp>.json` y re-verifica conteo.
- **Regla de construcción del `write`** (no inventa datos): solo campos presentes en el doc origen — `nombreCompleto` si `!= null`, `whatsappNumber` si `!= null`. Asesor sin `whatsappNumber` → perfil sin ese campo; el front ya cae al default (REQ-007, D8).
- **Idempotencia**: `set(merge: true)` converge en re-ejecución; re-correr `preview` tras `apply` debe reportar `willCreate: false` para todos y "pendientes: 0".
- **Filtro**: SOLO `rol == 'asesor'` (los clientes no tienen doc; los admins no se atribuyen por `?asesor=`) — proposal D7.

### npm scripts nuevos (`scripts/package.json`)

```json
"backfill:perfiles:preview": "node backfillPerfilesPublicos.js",
"backfill:perfiles:apply": "node backfillPerfilesPublicos.js --apply"
```

### Checklist de ejecución (Fase 0 — gate obligatorio pre-deploy de rules)

1. `npm run backfill:perfiles:preview` (workdir `scripts/`) → revisar que los `uid` listados son asesores y los datos coinciden con `usuarios`; anotar conteo N.
2. `npm run backfill:perfiles:apply` → re-correr preview → **"pendientes: 0"** y `N` perfiles = `N` asesores.
3. **NO `firebase deploy --only firestore:rules`** (desde la raíz del repo, `firebase.json` ya apunta a `firestore.rules`) hasta que el paso 2 esté verde.
4. Post-deploy: verificar landing con `?asesor=uid` de un asesor existente (Debe mostrar su whatsapp sin login).

---

## Testing Strategy

| Capa | Qué | Cómo |
|---|---|---|
| Unit | `WhatsappNumberContext` migrado (NUEVO test) | Patrón `vi.mock('firebase/firestore')` + `vi.mock('../firebase')` de `product.service.test.ts:3-23`, con `@testing-library/react` (ya en devDeps). Casos: (a) snapshot con `{ whatsappNumber }` → provider expone ese valor; (b) snapshot inexistente/sin campo → default `'573223652569'`; (c) error de snapshot → default |
| Unit | `productStats.service.ts` (SHOULD) | Mock de `getDoc`: doc existente → `updateDoc` con `increment(1)`; inexistente → `setDoc { vistas: 1, productoId, ultimaVista }` |
| Unit | Suite existente | `npm test` (vitest) sin regresiones: `product.service.test.ts`, `product-matcher.test.ts`, `formatters.test.ts` — ningún archivo tocado |
| Rules | Rules Playground — 4 escenarios | Ver abajo |
| Manual (post-deploy) | Tab Asesores, `?asesor=`, ranking | Checklist Fase 3 (REQ-008) |

### Escenarios Rules Playground

| # | Usuario simulado (doc propio) | Operación | Resultado esperado |
|---|---|---|---|
| 1 | **Visitante** (`auth: null`) | `get usuarios/{UID_ADMIN}` · `list usuarios` | **DENIED** (REQ-001) |
| 1b | Visitante | `get perfiles_publicos/{UID_ASESOR}` · `read producto_stats` | **ALLOW** (REQ-004, REQ-003) |
| 2 | **Asesor** (doc `rol == 'asesor'`) | `get usuarios/{self}` | ALLOW |
| 2b | Asesor | `get usuarios/{UID_ADMIN}` · `list usuarios` | **DENIED** |
| 2c | Asesor | `update usuarios/{self} {whatsappNumber}` | ALLOW (REQ-002) |
| 2d | Asesor | `update usuarios/{self} {rol: 'admin'}` | **DENIED** (REQ-002 — regresión de escalación) |
| 2e | Asesor | `delete perfiles_publicos/{self}` | **DENIED** (delete solo admin) |
| 3 | **Admin** (doc `rol == 'admin'`) | `get usuarios/{otro}` · `list usuarios` (query colección completa) · `create usuarios/{nuevo}` · `delete perfiles_publicos/{x}` | ALLOW (REQ-001) |
| 4 | Visitante | Query `producto_stats` `orderBy('vistas','desc') limit(4)` | **ALLOW** (query orderBy — REQ-003) |
| 4b | Asesor | `create producto_stats/{x} {vistas: 5, ...}` | **DENIED** (vistas != 1) |
| 4c | Asesor | `update producto_stats/{x} {vistas: 999}` (absoluto) | **DENIED** (vistas != resource+1) |
| 4d | Asesor | `update producto_stats/{x} {vistas: increment(1), ultimaVista}` | ALLOW |

---

## Migration / Rollout

Fases (dependencia estricta): **0 backfill → 1 rules → 2 front → 3 verify**.

| Fase | Paso | Gate |
|---|---|---|
| 0 | Crear `scripts/backfillPerfilesPublicos.js` + npm scripts; correr preview → apply → preview (pendientes 0) | 100% asesores con perfil público |
| 1 | `firestore.rules` nuevo; `firebase deploy --only firestore:rules`; Rules Playground (tabla arriba); tab Asesores y `?asesor=` en prod | Playground verde + tab OK + link OK |
| 2 | `WhatsappNumberContext.tsx:48` → `perfiles_publicos`; doble escritura en `AdminAsesoresTab` (:70-75, :111-114, :137) y `AsesorPanel` (:63-65); (SHOULD) `where` en `AdminPanel.tsx:122`; `npm test` + `npm run lint` + `npm run build` | Suite verde + build OK |
| 3 | Verificación manual post-deploy + `firebase deploy --only hosting` | Todos los Success Criteria |

Rollback (invertido): 1) revert de rules + `deploy --only firestore:rules`; 2) revert del front + `deploy --only hosting`; 3) backfill aditivo inofensivo (no borra datos de `usuarios`). Regla de oro: nunca deployar rules sin backfill verificado.

---

## Riesgos y mitigaciones

| # | Riesgo | Mitigación |
|---|---|---|
| R1 | Divergencia `usuarios` vs `perfiles_publicos` (doble fuente) | Acotada a 2 campos públicos no sensibles; script idempotente re-corrible como remediación (`set merge: true`); prueba unitaria de `AsesorPanel`/context (D6) |
| R2 | Costo extra del `get()` por evaluación (isAdmin) | 1 doc-read por operación, frecuencia baja (operaciones admin); el update self corto-circuita el `get()` solo cuando aplica |
| R3 | Denegación del tab Asesores (permission-denied → tab vacío) | Regla `list` invariante por request (`isAdmin`) — verificable sin leer cada doc; escenario 3 del Playground + prueba manual post-deploy (REQ-008) |
| R4 | Regresión de escalación si `affectedKeys` se implementa mal | `hasOnly(['whatsappNumber','nombreCompleto'])` + escenario 2d del Playground (REQ-002) |
| R5 | Query `orderBy('vistas','desc')` denegada | Eliminado por diseño: `read: if true` en `producto_stats` (D4); escenario 4 del Playground |
| R6 | Inflado de `vistas` / spam (sin rate-limit) | Validación estructural (solo incremento +1, solo 3 campos, tipos); volumen restante aceptado (riesgo residual declarado en proposal) |
| R7 | PII en `perfiles_publicos` (fuga trasladada) | Salvaguarda D6: SOLO `nombreCompleto`/`whatsappNumber`; `email`/`rol` NUNCA; `affectedKeys().hasOnly` en update |
| R8 | `service-account.json` commiteado en `scripts/` | PREEXISTENTE (backfill 2025-09-18 usó el mismo layout); este change no lo agrava ni lo rota — decisión de seguridad independiente |

---

## Open Questions

- [ ] ¿Rotar/excluir `scripts/service-account.json` del repo? Preexistente (R8), fuera del scope de este change — requiere decisión de seguridad aparte.
- [ ] `deleteDoc` de asesor no borra la cuenta de Auth (proposal §Scope) — fuera de scope, decisión separada.
- [ ] ¿`--prune` para `perfiles_publicos` sin doc de usuario (stale)? No incluido: el backfill es aditivo por diseño; puede sumarse como flag futuro si se necesita.