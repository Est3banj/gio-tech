---
id: secure-chat-logs/spec
status: active
title: "Spec: secure-chat-logs"
change_date: 2026-08-14
---

# Assistant Specification — borrado de la feature de log muerto de `chat_logs`

## Purpose

Primer spec del dominio `assistant` (servicios del asistente IA del catálogo). Este change elimina la feature de log de chat muerta: el write `addDoc(collection(db, 'chat_logs'), ...)` en `src/services/ai-assistant.service.ts:29` (`logChatInteraction()`, líneas 22-37) falla en silencio desde su creación (`efac3d7`) porque `chat_logs` NUNCA tuvo regla en `firestore.rules` (default-deny) y **nadie la lee** (data 100% muerta, verificado en exploración §2). El payload acumularía PII (preguntas verbatim del cliente + respuestas con WhatsApp del asesor, exploración §4).

Decisión del dueño (14-08-2026): **Opción C** — borrar la feature completa con el mandato "borrar con cuidado, SIN afectar funcionalidades". El chat flotante del catálogo (FAB de `/catalogo`, `Catalogo.tsx:205-286` → `GeminiChat.tsx` → `askAssistant`) queda 100% funcional.

Comportamiento preservado que este change NO debe alterar: `askAssistant` y `generateWhatsAppMessage` (exports que usa `GeminiChat.tsx:4`), el flujo de preguntas/respuestas del chat flotante, y la ausencia total de regla para `chat_logs` (default-deny permanente — estado de Firestore idéntico antes y después).

## Requirements

### Requirement: REQ-001 — Ninguna escritura a `chat_logs` desde `src/`

El sistema NO DEBE contener ninguna referencia a `chat_logs` en `src/` (ni escrituras, ni lecturas, ni strings). La función `logChatInteraction` DEBE ser eliminada de `src/services/ai-assistant.service.ts` junto con sus call sites internos (respuesta exitosa y respuesta de error), y los imports que quedan huérfanos (`collection`, `addDoc`, `serverTimestamp` de `firebase/firestore` y `db` de `../firebase` — solo usados por la función borrada) DEBEN ser removidos.

#### Scenario: Grep de `chat_logs` sobre `src/` sin matches

- GIVEN el borrado de `logChatInteraction` aplicado en `src/services/ai-assistant.service.ts`
- WHEN se ejecuta `grep -r 'chat_logs' src/`
- THEN devuelve **0 matches**
- AND no existe ningún otro archivo en `src/` con la cadena `chat_logs`

#### Scenario: Imports huérfanos removidos

- GIVEN que los únicos usos de `collection`, `addDoc`, `serverTimestamp` (import de `firebase/firestore` en línea 7) y `db` (import de `../firebase` en línea 8) estaban dentro de `logChatInteraction`
- WHEN se ejecuta `npm run lint` tras el borrado
- THEN no hay errores de variables/imports sin uso (unused vars) en `ai-assistant.service.ts`

#### Scenario: Reflotamiento accidental detectado por grep

- GIVEN un commit futuro que reintroduce el log (write a `chat_logs` o a cualquier otra colección sin regla)
- WHEN se ejecuta `grep -r 'chat_logs' src/`
- THEN devuelve >= 1 match (el grep es la señal de regresión del default-deny de la feature)

### Requirement: REQ-002 — Chat flotante del catálogo 100% funcional

El sistema DEBE conservar el chat flotante del catálogo completamente funcional tras el borrado: `askAssistant` (respuesta exitosa y de error tras reintentos) y `generateWhatsAppMessage` DEBEN seguir exportados desde `src/services/ai-assistant.service.ts` con la misma firma, y el flujo de `GeminiChat.tsx` (→ `askAssistant` en línea 70) NO DEBE modificarse. La suite de tests DEBE quedar en verde y el build DEBE compilar sin cambios de comportamiento.

#### Scenario: Suite de tests en verde

- GIVEN el borrado aplicado en `ai-assistant.service.ts`
- WHEN se ejecuta `npm test` (vitest run)
- THEN toda la suite pasa en verde (sin regresiones)

#### Scenario: Chat flotante responde y no pierde el flujo de error

- GIVEN el bundle deployado con el borrado y un visitante en `/catalogo`
- WHEN abre el FAB del chat flotante, escribe una pregunta y espera la respuesta
- THEN recibe la respuesta del asistente (flujo exitoso de `askAssistant` intacto)
- AND si la API falla tras los reintentos, recibe el mensaje de error por WhatsApp existente (flujo de error intacto)

#### Scenario: Consola del browser sin errores ni warnings del log

- GIVEN el bundle deployado con el borrado
- WHEN el visitante usa el chat flotante (éxito y error)
- THEN la consola del browser NO muestra el warning `'No se pudo guardar el log del chat'` ni errores de permisos de Firestore (el side-effect de logging desapareció por completo)

### Requirement: REQ-003 — `chat_logs` sin regla: default-deny permanente

El sistema DEBE mantener `firestore.rules` SIN ninguna regla para `chat_logs` (el archivo NO DEBE mencionar la colección; permanece default-deny, estado vigente desde la creación de la colección). La feature NO DEBE reflotarse con reglas ni con código sin un change nuevo explícito.

#### Scenario: firestore.rules intacto y sin mención a chat_logs

- GIVEN el change aplicado (solo se toca código y hosting)
- WHEN se ejecuta `grep -n 'chat_logs' firestore.rules`
- THEN devuelve **0 matches**
- AND `git diff firestore.rules` está vacío (el archivo NO se modificó en el change)

#### Scenario: Write externo a chat_logs sigue denegado

- GIVEN default-deny vigente (sin regla)
- WHEN cualquier cliente (o REST) intenta `addDoc`/`getDoc` sobre `chat_logs`
- THEN la operación es denegada (permission-denied / 403)

#### Scenario: Reflotamiento requiere change nuevo

- GIVEN la decisión del dueño de eliminar la feature (14-08-2026)
- WHEN en el futuro alguien quiere volver a loggear interacciones de chat
- THEN requiere un change nuevo (spec + proposal + decisión de reglas con validación anti-PII), NO un cambio silencioso sobre este change

### Requirement: REQ-004 — Estado de la colección `chat_logs` gestionado con evidencia

El sistema DEBE verificar el estado real de la colección `chat_logs` en producción con Admin SDK (service-account existente en `scripts/`, patrón preview/apply de `backfillPerfilesPublicos.js`):

- Si la colección contiene docs → DEBEN eliminarse con un borrado por lotes idempotente (re-corrible sin efectos), con evidencia documentada del conteo pre/post.
- Si está vacía o no existe → DEBE registrarse "cero docs" como evidencia en el artefacto de verificación.

#### Scenario: Colección con docs existentes

- GIVEN que `chat_logs` contiene N docs en producción (nunca escritos por el front por el deny; solo posibles vía Admin SDK)
- WHEN se ejecuta el script de verificación/borrado (preview primero, apply después)
- THEN reporta conteo pre = N, borra los N docs por lotes, y reporta conteo post = 0
- AND deja un artefacto JSON con la evidencia (conteos y timestamps)

#### Scenario: Colección vacía o inexistente

- GIVEN que `chat_logs` no contiene docs o la consulta no arroja resultados
- WHEN se ejecuta el script de verificación
- THEN reporta **"cero docs"** y NO ejecuta ningún borrado
- AND deja el artefacto JSON con la evidencia del conteo = 0

#### Scenario: Re-ejecución del borrado (idempotencia)

- GIVEN que el borrado ya corrió (conteo post = 0)
- WHEN se re-ejecuta el script
- THEN reporta cero docs y no produce errores ni efectos secundarios

### Requirement: REQ-005 — Ningún otro consumidor de `ai-assistant.service.ts` roto

El sistema DEBE garantizar que los únicos exports consumidos externamente de `ai-assistant.service.ts` (`askAssistant`, `generateWhatsAppMessage`, usados por `GeminiChat.tsx:4`) permanezcan con la misma firma y comportamiento. `logChatInteraction` es PRIVADA (no exportada) — su borrado NO DEBE romper imports ni compilación de otros módulos.

#### Scenario: Imports externos intactos

- GIVEN que el único importador de `ai-assistant.service.ts` es `GeminiChat.tsx:4`
- WHEN se inspecciona el import tras el borrado
- THEN sigue importando solo `askAssistant` y `generateWhatsAppMessage`
- AND `npm run build` compila sin errores de módulo/import

#### Scenario: Build y lint sin regresiones de módulos

- GIVEN el borrado aplicado
- WHEN se ejecuta `npm run lint` y `npm run build`
- THEN no hay errores de imports rotos, exports faltantes ni tipos incompatibles

#### Scenario: Tests existentes sin referencia al log

- GIVEN que ningún test referencía `ai-assistant` ni `logChatInteraction` (verificado en exploración y tareas)
- WHEN se ejecuta la suite completa `npm test`
- THEN no hay fallos por referencias a la función borrada