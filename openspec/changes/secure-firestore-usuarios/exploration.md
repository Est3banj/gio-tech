# Exploración: secure-firestore-usuarios

**Change**: `secure-firestore-usuarios`
**Fecha**: 2026-08-14
**Fuente**: auditoría de seguridad del 14/08/2026 (riesgo alto en `usuarios`, riesgo medio en `producto_stats`)
**Modo de exploración**: SOLO lectura — no modifiqué código fuente, solo este artefacto.

---

## 1. Problema

La colección `usuarios` de Firestore es **legible públicamente**: cualquier persona (sin autenticarse, sin URL de admin) puede leer TODOS los documentos de usuarios, incluyendo `email`, `whatsappNumber` y `rol` de cada usuario del sistema (admins, asesores y clientes). Es fuga de PII en masa.

Evidencia — `firestore.rules:30-35`:

```
match /usuarios/{userId} {
  allow read: if true;              // ← PÚBLICO: emails, whatsapps y roles de TODOS
  allow create: if request.auth != null && get(...usuarios/$(request.auth.uid)).data.rol == 'admin';
  allow update: if request.auth != null && (request.auth.uid == userId || get(...usuarios/$(request.auth.uid)).data.rol == 'admin');
  allow delete: if request.auth != null && get(...usuarios/$(request.auth.uid)).data.rol == 'admin';
}
```

Riesgo secundario activo: `allow update` permite que un usuario modifique **su propio documento completo**, incluido el campo `rol` → un asesor puede escalar a `admin` (ver §6).

### Riesgo asociado: `producto_stats` (medio)

`firestore.rules:6-9`:

```
match /producto_stats/{statId} {
  allow read: if true;
  allow write: if request.auth != null;   // ← sin validación de estructura
}
```

Cualquier usuario autenticado puede: crear documentos basura en la colección, escribir `vistas` con valores arbitrarios (inflar el ranking de "populares" que alimenta `usePopularProducts`), o sobreescribir docs de otros productos.

---

## 2. Estado actual de `firestore.rules` (completo)

Archivo `firestore.rules` (38 líneas, `rules_version = '2'`):

| Colección | Línea | Read | Write | Estado |
|---|---|---|---|---|
| `producto_stats/{statId}` | 6-9 | `true` (público) | `request.auth != null` (cualquier logueado) | ⚠️ **A riesgo (write)** |
| `carrusel/{slideId}` | 12-15 | `true` | admin (vía `get` rol) | OK por diseño |
| `productos/{productId}` | 18-21 | `true` | admin (vía `get` rol) | OK por diseño |
| `configuracion/{docId}` | 24-27 | `true` | admin (vía `get` rol) | OK por diseño |
| `usuarios/{userId}` | 30-35 | `true` (público) | create/delete admin; update self-uid o admin | 🔴 **RIESGO ALTO (read)** |

Patrón ya instalado en el proyecto: autorización de admin vía
`get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.rol == 'admin'`.

---

## 3. Mapa de accesos a la colección `usuarios` (código)

| # | Archivo:Línea | Quién | Operación | Path | Impacto si se restringe read |
|---|---|---|---|---|---|
| 1 | `src/App.tsx:46-49` | App (routing) | `onSnapshot` (doc) | `usuarios/{uid}` propio | ✅ Sin cambio: lee su propio doc al autenticarse |
| 2 | `src/hooks/useAuth.ts:31-43` | useAuth (auth global) | `onSnapshot` (doc) | `usuarios/{uid}` propio | ✅ Sin cambio: lee su propio doc |
| 3 | `src/components/Login.tsx:40-49` | Login | `getDoc` (doc) | `usuarios/{uid}` propio | ✅ Sin cambio: lee su propio doc post-signin |
| 4 | `src/components/AsesorPanel.tsx:28-29, 63-65` | AsesorPanel | `getDoc` + `updateDoc` | `usuarios/{uid}` propio (lee perfil, actualiza whatsappNumber) | ✅ Sin cambio para read; ⚠️ requiere restringir campos en update (hoy puede cambiarse el `rol`) |
| 5 | `src/components/AdminPanel.tsx:122-128` | AdminPanel (tab asesores) | `onSnapshot` (**colección completa**, sin `where`) | `collection(db, "usuarios")` | 🔴 **CRÍTICO**: se rompe si la regla de list no contempla admin. Además hoy trae TODOS los docs (clientes incluidos) — el filtro de asesores es en cliente |
| 6 | `src/components/AdminAsesoresTab.tsx:70-75, 111-114, 137` | AdminAsesoresTab | `setDoc` (create asesor), `updateDoc`, `deleteDoc` | `usuarios/{nuevoUid}` (create), `usuarios/{idAsesor}` | ✅ Sin cambio: operaciones de admin ya cubiertas por reglas admin vía `get` |
| 7 | `src/contexts/WhatsappNumberContext.tsx:48-51` | WhatsappNumberContext (landing, catalog) | `onSnapshot` (doc) | `usuarios/{asesorId}` — **lectura ANÓNIMA** (visitante sin login, con `?asesor=uid`) | 🔴 **CRÍTICO**: se rompe con read restringido → el botón de WhatsApp cae al número default y se pierde la atribución de asesor |

`AdminAsesoresList.tsx` NO consulta Firestore: recibe `asesores` por props desde AdminPanel (render puro).

### Detalle de la query crítica (AdminPanel)

`src/components/AdminPanel.tsx:122-128` — `onSnapshot(collection(db, "usuarios"))` **sin `where`**: la lista completa se filtra en cliente. Esto es doble problema:
1. Expone en la UI del admin también clientes/roles (menor — es admin).
2. Con rules restringidas, una query de colección requiere que **todos** los docs devueltos pasen la regla de lectura → si la regla no autoriza al admin (p. ej. solo `uid == userId`), la suscripción entera falla con permission-denied y el tab de asesores queda vacío.

---

## 4. Modelo de datos del documento usuario

Documento `usuarios/{uid}` — **el document ID ES el auth uid** (no hay campo `uid` interno).

Campos escritos en creación (`src/components/AdminAsesoresTab.tsx:70-75`):

| Campo | Tipo | Autorizado a escribir |
|---|---|---|
| `email` | string | create (admin) |
| `nombreCompleto` | string | create (admin); update (admin o self) |
| `rol` | string: `admin` \| `asesor` \| `cliente` (`src/types/index.ts:58`) | create (admin); **hoy también self via update → escalación** |
| `whatsappNumber` | string | create (admin); update (self: AsesorPanel; admin) |

`fechaCreacion` existe en el tipo `User` (`src/types/index.ts:66`) pero **nunca se setea** en código. No existe campo `activo`. Los clientes que se registran por email/password **no tienen documento** en `usuarios` (Login solo hace `getDoc`; si no existe → `rol: 'cliente'` por default en `src/components/Login.tsx:43` y `src/hooks/useAuth.ts:42`).

---

## 5. Autenticación y determinación de rol

- **Solo email/password**: `src/firebase.ts` usa `getAuth` únicamente; NO hay `GoogleAuthProvider` ni `signInWithPopup` en el código.
- **NO existen custom claims**: grep de `customClaims|getCustomClaims|setCustomUserClaims` → cero resultados en `src/` y `functions/`.
- **El rol vive en el documento** `usuarios/{uid}`, y las rules YA autorizan con `get(...).data.rol == 'admin'` en `carrusel`, `productos`, `configuracion` (y en usuarios para create/update/delete).
- El gate de la UI (`src/App.tsx:177-187`) es client-side sobre `usuario.rol` hidratado desde el doc → el server-side (rules) es la única frontera real.

**Implicancia para rules**: cualquier regla de `usuarios` que haga `get(usuarios/self).data.rol` es autoconsistente SI el self puede leer su propio doc (corto-circuito `request.auth.uid == userId || get(...)` — patrón oficial de Firebase, sin recursión).

---

## 6. Escalación de privilegios (riesgo latente)

`firestore.rules:33` permite `update` de un usuario sobre su propio doc sin restricción de campos → **un asesor puede `updateDoc(usuarios/{suUid}, { rol: 'admin' })` y pasar a ser admin** (usuario con cuenta email/password). No hay validación de `affectedKeys` ni de valores. Debe cerrarse en este change (las reglas de update por campos se resuelven con `request.resource.data.diff(resource.data).affectedKeys().hasOnly([...])`).

---

## 7. `producto_stats` (quién escribe/lee, estructura)

Consumidores (`src/services/productStats.service.ts`):

| Operación | Línea | Detalle |
|---|---|---|
| `recordProductView` (write) | 25-40 | `getDoc` → `updateDoc { vistas: increment(1), ultimaVista }` o `setDoc { vistas: 1, ultimaVista, productoId }` — doc id = `productId` |
| `getPopularProductsStats` (read) | 52-71 | query `orderBy('vistas','desc') limit(4)` — **requiere read público** con orderBy → la query necesita reglas que permitan ordenar por `vistas` (con `allow read: if true` hoy pasa; reglas por doc con condiciones de `get` **pueden romper queries con orderBy** si la condición no es "siempre true" — hay que validarlo en spec/verify) |

Estructura del doc (`src/types/index.ts:210-214` + service):

```
{ vistas: number, ultimaVista: Timestamp, productoId: string }
```

Uso en UI: `usePopularProducts` (`src/hooks/usePopularProducts.ts:22`) → LandingPage/Catalogo.

---

## 8. Functions (no se rompen)

`functions/index.js` (170 líneas): únicamente `onProductCreate` y `onProductUpdate` sobre `productos/{id}` (parseo de specs desde nombre/descripción). **NO consulta ni escribe `usuarios` ni `producto_stats`**. Corre con Admin SDK (bypass de rules). → Las rules nuevas NO afectan el backend; el único punto de contacto indirecto es la escritura de productos, cuyo flujo de creación depende de reglas admin (ya existentes, no se tocan).

---

## 9. Opciones de solución

### Opción A — Rules granulares con rol en doc (get self) + restricción de update por campos

Mantener el rol en el doc y endurecer `usuarios`:

```
match /usuarios/{userId} {
  allow read: if request.auth != null &&
    (request.auth.uid == userId || get(.../usuarios/$(request.auth.uid)).data.rol == 'admin');
  allow create/delete: admin (como hoy);
  allow update: if (request.auth.uid == userId &&
      request.resource.data.diff(resource.data).affectedKeys().hasOnly(['whatsappNumber','nombreCompleto']))
    || (get(.../usuarios/$(request.auth.uid)).data.rol == 'admin');
}
```

Y `producto_stats` con validación de estructura (`create`: `vistas == 1`, `productoId` string, `ultimaVista` timestamp; `update`: solo `vistas`/`ultimaVista` con `vistas == resource.data.vistas + 1`).

- **Pros**: Todo en rules, sin refactor del front para los puntos 1-4 y 6 del mapa; patrón ya usado en el proyecto; cierra la escalación de rol.
- **Contras**: El punto 7 (WhatsappNumberContext, lectura anónima del whatsapp del asesor) **se rompe** → exige resolver el whatsapp público por otra vía (ver Opción C); las queries de colección (AdminPanel) requieren `get()` por doc (costo/limite de evaluación); no hay rate-limit real contra inflar vistas.
- **Esfuerzo**: Bajo (rules + ajustes mínimos).

### Opción B — Mover el rol a custom claims (`request.auth.token.rol`)

Nueva function para setear/migrar claims + rules por claims.

- **Pros**: Authz desacoplada del doc; sin `get()` en reglas para autorizar; más limpio a largo plazo.
- **Contras**: Requiere crear y deployar una Cloud Function de admin + migrar claims de admins actuales + refresco de token del cliente (`onIdTokenChanged`/`getTokenResult`) + **reescribir las reglas admin ya existentes** de `carrusel`/`productos`/`configuracion` (scope creep); la UI sigue necesitando leer el doc para nombre/rol (el claim no reemplaza el doc); el flujo de creación de asesores debe llamar a la function. Complejidad alta para el tamaño del problema.
- **Esfuerzo**: Alto.

### Opción C — Vista pública separada `perfiles_publicos/{uid}` para el whatsapp del asesor

Colección nueva `perfiles_publicos` con `{ whatsappNumber, nombreCompleto }`, `allow read: if true` (solo ese doc), write admin/self. Migrar `WhatsappNumberContext` a leer de ahí; `AdminAsesoresTab`/`AsesorPanel` escriben ambos docs; backfill de asesores existentes.

- **Pros**: Es la ÚNICA forma de mantener el enlace `?asesor=uid` público (funcionalidad de captación) sin exponer email/rol; dato mínimo expuesto (whatsapp + nombre, público por diseño del negocio).
- **Contras**: Refactor de 3 archivos + doble escritura (fuente de verdad duplicada que puede divergir) + backfill de datos existentes (script one-off).
- **Esfuerzo**: Medio.

### Opción D (recomendada) — Combinación: A + C

1. `usuarios` con reglas granulares de la Opción A (read self/admin, update por campos, create/delete admin), `producto_stats` con validación de estructura. **Sin refactor** de App/useAuth/Login/AsesorPanel/AdminPanel/AdminAsesoresTab.
2. `perfiles_publicos/{uid}` para el whatsapp/nombre de asesores (patrón estándar: datos mínimos públicos separados de PII), migrando SOLO `WhatsappNumberContext`, con doble escritura en `AdminAsesoresTab` y `AsesorPanel` + backfill.
3. Los clientes siguen sin doc propio → el default `rol: 'cliente'` no cambia.

- **Pros**: Cierra la fuga de PII completa, conserva la atribución de asesor pública, minimiza refactor, reutiliza el patrón de `get` ya instalado.
- **Contras**: Duplicación mínima de datos públicos (aceptable); requiere backfill.
- **Esfuerzo**: Medio.

---

## 10. Riesgos de romper funcionalidad existente (top 3)

1. **Botón de WhatsApp del landing (`WhatsappNumberContext`)** — con read restringido sin resolver el whatsapp público, todo visitante que llegue por `?asesor=uid` ve el número default: se pierde la atribución por asesor y cae la conversión de contacto. Mitigación: Opción C/D (perfiles_publicos + backfill previo al deploy de rules).
2. **Tab "Asesores" del admin (`AdminPanel:122`)** — la suscripción a toda la colección falla con permission-denied si la regla de list no autoriza al admin (las rules no filtran: si un doc no matchea, la query entera es denegada). Mitigación: regla de list con `get(usuarios/self).rol == 'admin'` + prueba manual POST-deploy.
3. **Escalación de rol hoy / queries con orderBy en `producto_stats`** — (a) si el update restrictivo por `affectedKeys` se implementa mal, se puede dejar a asesores editando su rol (regresión); (b) la query `orderBy('vistas','desc')` de `getPopularProductsStats` puede denegarse si la regla de read de `producto_stats` deja de ser "siempre true" (Firestore exige que las queries sean consistentes con las reglas). Mitigación: mantener `allow read: if true` en `producto_stats` (es público por diseño) y solo blindar el write.

### Otros riesgos a tener en cuenta en spec/design
- `AdminPanel` lista TODA la colección (incluye clientes, no solo asesores): filtrar con `where('rol', 'in', ['admin','asesor'])` es OPCIONAL y mejora (no impide el deploy, pero la query con `where` + reglas con `get` por doc funciona igual).
- La regla `deleteDoc` del admin no elimina la cuenta de Auth del asesor (el asesor pierde el doc pero sigue pudiendo loguearse como "cliente") — observación de diseño, fuera del scope.
- Migración necesaria: asesores existentes NO tienen doc en `perfiles_publicos` → el backfill debe correr ANTES de deployar las rules (si no, el botón de WhatsApp de esos asesores cae al default hasta migrar).

---

## 11. Observaciones de otras colecciones (fuera de scope, para futuro)

| Colección | Uso en código | Regla actual | Observación |
|---|---|---|---|
| `productos/{id}` | `product.service.ts:29,50,97` (read público catálogo, write admin) | read público, write admin | OK por diseño |
| `carrusel/{slideId}` | `BannerSlider.tsx:35`, `AdminPanel.tsx:130`, `AdminCarouselManager.tsx:97` | read público, write admin | OK por diseño |
| `configuracion/{docId}` | `config.service.ts:16,37` (doc `general`) | read público, write admin | OK (contiene whatsapp/email del negocio — públicos por diseño) |
| `chat_logs` | `ai-assistant.service.ts:29` (`addDoc`, log del chat Gemini) | **SIN regla → deny implícito** | 🔸 Bug latente: los logs fallan silenciosamente (catch). No es parte de este change. |
| `pedidos`, `inventario`, `carrito`, `financieras` | No existen en Firestore (carrito = localStorage; financieras = hardcoded `data/financieras.ts`) | — | N/A |

Nota: al restringir el read de `usuarios`, las reglas de `carrusel`/`productos`/`configuracion` que hacen `get(usuarios/self).data.rol` siguen funcionando (el `get()` apunta al doc del propio auth uid, que puede leerse a sí mismo). **No requieren cambios.**

---

## 12. Resumen ejecutivo

- **Problema**: `usuarios` leíble públicamente (email + whatsapp + rol de TODOS) + `producto_stats` con write autenticado sin validación + escalación de asesor→admin vía `update` sin restricción de campos.
- **7 consumidores** de `usuarios` en `src/`; 5 siguen funcionando con reglas por uid; 2 críticos: AdminPanel (listado admin, requiere regla de list) y WhatsappNumberContext (lectura anónima del whatsapp del asesor, require vista pública).
- **Functions intactas**: solo tocan `productos`, corren con Admin SDK.
- **Recomendación**: Opción D (rules granulares por doc/rol con `get` self + validación por campos + `perfiles_publicos` para whatsapp + validación de estructura en `producto_stats`).
- **Precondición de deploy**: backfill de `perfiles_publicos` ANTES de publicar las rules; prueba manual del tab asesores y del enlace `?asesor=`.

### Ready for Proposal
Sí. El orchestrator puede lanzar `sdd-propose` con this exploration como contexto. La propuesta debe incluir: (1) delta de `firestore.rules` (usuarios + producto_stats), (2) colección `perfiles_publicos` + migración de `WhatsappNumberContext` + doble escritura en `AdminAsesoresTab`/`AsesorPanel`, (3) backfill script, (4) plan de rollout (backfill → rules → front) y rollback.