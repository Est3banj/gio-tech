# Exploración — `secure-chat-logs`

**Change**: `secure-chat-logs`
**Fecha**: 2026-08-14
**Modo**: Investigación SOLO LECTURA (no se modificó código ni reglas)
**Contexto**: Write de `chat_logs` denegado por default-deny (sin match rule en `firestore.rules`). Misma familia que el bug preexistente de `producto_stats` (403 silencioso, ver REQ-013 / observación #746).

---

## 1. ¿Quién escribe `chat_logs`?

**UN solo escritor, UN solo call site, fire-and-forget:**

- `src/services/ai-assistant.service.ts:29` — `addDoc(collection(db, 'chat_logs'), {...})` dentro de `logChatInteraction()` (líneas 22-37), con `try/catch` + `console.warn` (líneas 33-36).

**Payload real transcripto** (`ai-assistant.service.ts:29-32`):

```ts
await addDoc(collection(db, 'chat_logs'), {
  ...params,                      // { pregunta, respuesta, productosRelevantes }
  timestamp: serverTimestamp(),
});
```

Donde `params` (líneas 22-27) = `{ pregunta: string; respuesta: string; productosRelevantes: number; financierasRecomendadas?: string }`.

**Dato clave**: `financierasRecomendadas` está declarado como opcional pero **JAMÁS se pasa**. Los únicos call sites de `logChatInteraction` son `ai-assistant.service.ts:381-385` (respuesta exitosa) y `:406-410` (respuesta de error), ambos con solo `{ pregunta, respuesta, productosRelevantes }`. → **Los docs reales tienen exactamente 4 campos: `pregunta`, `respuesta`, `productosRelevantes` (int), `timestamp`. Nada más.**

**Desde dónde se llama**: `GeminiChat.tsx:70` → `askAssistant(...)` (o sea el chat flotante del landing). `Catalogo.tsx:281-286` monta `GeminiChat` — el FAB flotante público de `/catalogo` (`Catalogo.tsx:205-240`). Ruta pública SIN guardia de auth (`App.tsx:127`: `<Route path="/catalogo" element={<Catalogo />} />`, sin guard).

→ **El writer es un VISITANTE ANÓNIMO** (nunca se loguea, no existe `signInAnonymously` en `src/`). Igual que `producto_stats`.

**Historial**: el write nació en `efac3d7` ("feat: improve AI assistant..."). `git log -S 'chat_logs' -- firestore.rules` → **vacío: `chat_logs` NUNCA tuvo regla**. Denegado desde el día uno.

## 2. ¿Quién LEE `chat_logs`?

**NADIE.** Verificado:

- `src/`: cero `getDocs`/`onSnapshot` de `chat_logs` (grep completo de lecturas en servicios, hooks, contexts y componentes).
- `functions/`: solo toca `productos` (triggers de specs, `functions/index.js:139-170`); sin `chat_logs`.
- `scripts/`: sin referencias.
- Admin: no existe ninguna tab de historiales de chat (`AdminPanel`, `AdminAsesoresTab`, `AdminProductsList`, `AdminCarouselManager` — ninguna lee `chat_logs`).

**Finalidad real de la colección**: la declarada en el comentario del código (`ai-assistant.service.ts:19`): *"Registra la interacción del chat en Firestore para análisis posterior"* → **analytics del dueño, sin consumidor hoy**. Es data 100% muerta desde su creación: nunca se escribió ni un doc (deny) ni existe código que la lea.

## 3. ¿La falla es silenciosa? ¿El chat funciona sin el log?

- **SÍ, totalmente silenciosa**: `try/catch` que solo hace `console.warn('No se pudo guardar el log del chat')` (`ai-assistant.service.ts:33-36`). Fire-and-forget; `askAssistant` NO espera el log para responder (lo dispara sin `await` bloqueante al final del flujo, líneas 380-387).
- **El chat funciona PERFECTO sin el log**: la única consecuencia observable es un `warn` en consola del browser (invisible para el usuario). El side-effect es 100% prescindible.

## 4. Contenido sensible (PII)

**SÍ contiene PII de clientes:**

- `pregunta`: pregunta del cliente VERBATIM → puede incluir nombre, WhatsApp, situación crediticia ("estoy reportado"), datos personales.
- `respuesta`: respuesta del asistente → incluye recomendaciones de financieras según perfil crediticio y el WhatsApp del asesor (`ai-assistant.service.ts:281-282`).

→ **Conclusión: `chat_logs` es PII. Si se regla con read público o write abierto sin validación, se expone información crediticia/de contacto de clientes.** La colección debe quedar PRIVADA (solo admin) en lectura, con write restringido estructuralmente.

## 5. Barrido de writes huérfanos (bombas de tiempo)

**TODAS las colecciones que escribe el front tienen regla EXCEPTO `chat_logs`** — es la ÚNICA bomba de tiempo en Firestore:

| Colección | Write (archivo:línea) | Regla en `firestore.rules` | Estado |
|---|---|---|---|
| `chat_logs` | `ai-assistant.service.ts:29` (addDoc) | **SIN match rule → default-deny** | 🔸 **BUG: falla en silencio desde `efac3d7`** |
| `productos` | `product.service.ts:50,65,75` | `:28-31` read público + write admin | ✅ OK |
| `configuracion` | `config.service.ts:37` (setDoc merge) | `:34-37` read público + write admin | ✅ OK |
| `producto_stats` | `productStats.service.ts:30,36` (update/setDoc) | `:10-19` create/update validado estructural | ✅ OK (REQ-013, arreglado 14/08) |
| `carrusel` | `AdminCarouselManager.tsx:94,97,123,135` | `:22-25` read público + write admin | ✅ OK |
| `usuarios` | `AsesorPanel.tsx:63`; `AdminAsesoresTab.tsx:70,123,160` | `:40-50` owner/admin granular | ✅ OK |
| `perfiles_publicos` | `AsesorPanel.tsx:67`; `AdminAsesoresTab.tsx:78,128,162` | `:53-59` read público (mínimo) + self/admin | ✅ OK |

**Observaciones fuera de Firestore** (no bloquean, vale registrar):
- **Storage SIN reglas en el repo**: `AdminBusinessConfig.tsx:54-56` (líneas 52-56) sube el logo a `config/logo_${Date.now()}` y `ls storage.rules` → **no existe el archivo en el repo**. Las reglas de Storage viven en la consola (no versionadas). Vale verificar si el upload de logo funciona en prod — posible segundo bug silencioso de la misma familia, fuera del scope de este change.
- Colecciones `pedidos`, `inventario`, `carrito`, `financieras` no existen en Firestore (carrito = localStorage, financieras = hardcoded en `data/financieras.ts`) — descartadas (confirmado también en el barrido del change anterior, `exploration.md` archivado línea 212).

## 6. Patrón de referencia (consistencia con la base ya instalada)

- **`producto_stats`** (`firestore.rules:10-19`, REQ-013): write ANÓNIMO por diseño con validación estructural estricta (`hasOnly` + tipos + invariantes). El precedente directo: los writes del landing público NO pueden exigir `request.auth != null` porque el front escribe sin sesión.
- **`perfiles_publicos`** (`:53-59`): read público limitado a datos mínimos no sensibles + write self/admin.
- **`usuarios`** (`:40-50`): `isAdmin()` = `get(usuarios/{uid}).data.rol == 'admin'` (líneas 5-7) — helper ya disponible y reutilizable.
- Lección del change anterior (observación #746): los bugs de rules mueren en silencio sin suite de verificación → quedó `scripts/verify-rules-prod.js` (15 casos) como suite permanente; la verificación REST distingue `404` = ALLOW + doc inexistente vs `403` = DENY.

---

## Opciones de acceso para `chat_logs`

| | Opción A — create anónimo validado + read/delete admin (**RECOMENDADA**) | Opción B — `signInAnonymously` + `request.auth != null` | Opción C — eliminar la feature |
|---|---|---|---|
| Descripción | `allow create` con hasOnly de los 4 campos reales y tipos; `allow read, list, delete: if isAdmin()`. Sin cambios de front | El chat inicia sesión anónima antes del primer log; `allow create: if request.auth != null` (con validación) | Borrar `logChatInteraction` + colección (nadie la lee) |
| Pros | Consistente con `producto_stats`; fix inmediato solo con deploy de rules; el write empieza a funcionar solo | Bloquea spam vía REST sin sesión | Cero mantenimiento; data muerta desde el día 1; sin superficie de ataque |
| Contras | Cualquiera puede crear docs basura dentro del esquema permitido (spam de storage) — mismo tradeoff aceptado en `producto_stats` | La sesión anónima NO da más protección real (cualquiera se auto-anoniza); refactor de front + latencia + manejo de estados; 2-3 archivos | Se pierde la intención "para análisis posterior"; requiere que el dueño confirme que nadie va a leerlos |
| Esfuerzo | **Bajo (solo `firestore.rules` + verificación)** | Medio (rules + `GeminiChat` + servicio) | Bajo (borrar 20 líneas + doc de regla innecesario) |

**Recomendación: Opción A.** Misma filosofía que `producto_stats`: el write público del landing es por diseño (visitante anónimo), la salvaguarda es la validación estructural, y el acceso al dato queda reservado al admin porque es PII. Es el fix mínimo, consistente con la base, y no toca front.

**Pregunta al dueño (decisión de negocio antes de proponer)**: ¿para qué querés los logs del chat? Si la respuesta es "eventualmente analizarlos" → Opción A. Si es "ni idea / no los voy a leer" → Opción C es la honesta (borrar reduce superficie y deuda). El `sdd-propose` debe reflejar esta pregunta.

## Validación estructural propuesta (Opción A)

```js
// --- CHAT_LOGS: log del asistente IA (PII) ---
match /chat_logs/{logId} {
  allow read, list: if request.auth != null && isAdmin();
  allow delete: if request.auth != null && isAdmin();
  allow create: if
    request.resource.data.keys().hasOnly(['pregunta', 'respuesta', 'productosRelevantes', 'timestamp'])
    && request.resource.data.pregunta is string
    && request.resource.data.respuesta is string
    && request.resource.data.productosRelevantes is int
    && request.resource.data.timestamp is timestamp;
}
```

- **Campos exactos**: los 4 reales del payload (`ai-assistant.service.ts:29-32`). NO incluir `financierasRecomendadas` (nunca se envía; si un día se agrega, se actualiza la regla a la par).
- **Tipos**: `pregunta`/`respuesta` strings, `productosRelevantes` int (contra de `number` en TS), `timestamp` timestamp (lo produce `serverTimestamp()`).
- **Tamaño máx**: las reglas Firestore **NO tienen `size()` para strings** (solo listas/maps) → no se puede limitar longitud en rules. Si se quiere tope (ej. pregunta ≤ 2000 chars, respuesta ≤ 4000), se capa en el front (`logChatInteraction`) — OPCIONAL, no crítico.
- **Sin `update`**: el flujo solo crea. No habilitar update para no duplicar superficie.

## ¿El front necesita cambios?

- **NO es requisito**: el log es prescindible y ya traga errores; con Opción A el write empieza a funcionar automáticamente post-deploy (deja de salir el warn).
- OPCIONAL (higiene): (1) quitar el `console.warn` o convertirlo en métrica; (2) agregar 2-3 casos al `verify-rules-prod.js` (patrón: write anónimo OK / read anónimo 403 / read admin OK) — es la lección instalada: sin suite, este bug se repetirá.

## Riesgos de reglarla mal

1. **Exigir auth en create sin implementar sesión anónima** → el log sigue muerto en silencio (reproduce el bug actual disfrazado de fix). Verificar contra el call site real: writer anónimo.
2. **`hasOnly`/tipos desalineados con el payload** → el write empieza a fallar (ahora por regla, no por deny): los 4 campos y sus tipos deben ser EXACTOS (incluido `timestamp` como `is timestamp`).
3. **Read público** → se expone PII de clientes (preguntas con situación crediticia, respuesta con WhatsApp del asesor). Inaceptable: read/delete SOLO `isAdmin()`.
4. **No verificar con la suite** → el fix se deploya "a ciegas"; el 403 silencioso de los últimos meses demuestra que sin caso de verificación los errores pasan desapercibidos.
5. **Queries futuras del admin**: un tab de historiales con `orderBy('timestamp','desc')` no requiere índice (single-field), pero un filtro compuesto (ej. por asesor/fecha) sí — crear índice en consola cuando se haga, no anticipar.

## Verificación realizada

- `git status --short` → **vacío**: cero cambios en el repo al terminar esta exploración.
- Evidencia recogida: `ai-assistant.service.ts:22-37,381-385,406-410`; `GeminiChat.tsx:70`; `Catalogo.tsx:205-286`; `App.tsx:127`; `firestore.rules:1-62` (sin regla `chat_logs`); `git log -S` (nunca existió regla); barrido completo de writes (`src/`, `functions/`).

### Ready for Proposal

Sí. El orchestrator debe informar al dueño: (1) `chat_logs` es la ÚNICA colección sin regla — única bomba de tiempo; (2) nadie la lee hoy (data muerta); (3) decidir entre Opción A (reglarla: fix mínimo, consistente con `producto_stats`) y Opción C (borrarla: cero valor actual); (4) si A → deploy solo de `firestore.rules` + casos en `verify-rules-prod.js`.