---
id: secure-chat-logs/proposal
status: approved
title: "Proposal: secure-chat-logs"
change_date: 2026-08-14
---

# Proposal: secure-chat-logs

## Intent

`src/services/ai-assistant.service.ts:29` intenta escribir en la colección `chat_logs` (addDoc dentro de `logChatInteraction()`, líneas 22-37) pero la colección **NUNCA tuvo regla** en `firestore.rules` (`git log -S 'chat_logs' -- firestore.rules` → vacío) → **default-deny desde el día uno** (el write nació en `efac3d7` y falla en silencio: try/catch + `console.warn`, líneas 33-36).

Tres problemas en uno:

1. **Write muerto**: código muerto que ejecuta una escritura que el backend siempre rechaza (403 silencioso por visita, invisible para el usuario — el chat funciona perfecto sin el log, verificado en exploración §3).
2. **Riesgo de default-deny mal interpretado**: la colección es la ÚNICA sin regla del proyecto (barrido completo de writes en exploración §5) — queda como "bomba de tiempo" latente: si un día alguien la regla mal, escribe PII.
3. **PII latente**: el payload real contiene `pregunta` del cliente verbatim (nombre, WhatsApp, situación crediticia) y `respuesta` con datos del asesor (exploración §4). Acumularla sin lectores no tiene valor y agrega riesgo.

**Cero lectores**: verificado en exploración §2 — nadie lee `chat_logs` (ni src/, ni functions/, ni scripts/, ni admin). Es data 100% muerta desde su creación, con finalidad declarada "análisis posterior" que jamás se materializó.

**Decisión del dueño (14-08-2026)**: **Opción C — eliminar la feature**. Mandato explícito: *"borrar con cuidado, SIN afectar funcionalidades"* — el chat flotante del catálogo debe quedar 100% funcional.

## Scope

### In Scope

1. Eliminar `logChatInteraction()` de `src/services/ai-assistant.service.ts` (función privada, líneas 22-37 + comentario de sección línea 16) y sus **2 call sites internos** (`:381-385` respuesta exitosa, `:406-410` respuesta de error). NOTA verificada: **la llamada NO está en `GeminiChat.tsx:70`** — esa línea invoca `askAssistant`, que se conserva; `GeminiChat.tsx` NO se modifica.
2. Limpiar imports huérfanos del service: `collection, addDoc, serverTimestamp` de `firebase/firestore` (línea 7) y `db` de `../firebase` (línea 8) — verificado que solo se usan en `logChatInteraction`.
3. Verificación del estado de la colección `chat_logs` en producción: conteo con Admin SDK (service-account existente). Si hay docs → borrado idempotente documentado (evidencia con conteo). Si está vacía/inexistente → documentar "cero docs" como evidencia.
4. Deploy de hosting con el bundle nuevo (deja de intentar el log) + verificación técnica.
5. Verificación final (tests + build + grep + checklist manual del dueño).

### Out of Scope

- **firestore.rules**: NO se agrega ni se quita ninguna regla. `chat_logs` permanece **sin regla = default-deny permanente** (estado deseado). Si la feature se reflota en el futuro, requiere un change nuevo.
- **GeminiChat.tsx**: no se toca (sin cambios de UI ni de lógica del chat).
- **Catalogo.tsx, App.tsx**: no se tocan (el FAB flotante y la ruta `/catalogo` siguen igual).
- La observación de Storage sin reglas (upload de logo, exploración §5): fuera de scope, no bloquea — queda como hallazgo para otro change.
- `producto_stats`, `usuarios`, `perfiles_publicos`, `carrusel`, `productos`, `configuracion`: no se tocan.
- Opciones A (reglas para revivir el log) y B (`signInAnonymously`): descartadas — ver Alternatives.

## Approach

**Opción C — borrado quirúrgico de código muerto + default-deny permanente:**

1. **Código**: borrar `logChatInteraction()` completa (22-37) + los 2 call sites internos (381-385 y 406-410, incluyendo los comentarios "// Logging no bloqueante" y "// Logging del error") + los imports que quedan huérfanos (líneas 7-8). `askAssistant` y `generateWhatsAppMessage` (los exports que usa `GeminiChat.tsx:4`) se conservan INTACTOS → el chat flotante no cambia su comportamiento.
2. **Colección**: `chat_logs` queda SIN regla — default-deny **permanente** (es el estado actual; no se toca `firestore.rules`). El resultado es idéntico al presente (deniega todo write/read externo desde el día 1), pero sin código muerto en `src/` intentando escribir.
3. **Estado de la colección**: verificación one-off con Admin SDK (patrón de `scripts/backfillPerfilesPublicos.js` — preview/apply + artefactos JSON con timestamp). Conteo de docs; si > 0 → borrado por lotes idempotente con evidencia; si 0 → registro de "cero docs" como evidencia.
4. **Deploy**: solo hosting (`firebase deploy --only hosting`) con el bundle que ya no llama a `addDoc(chat_logs)`.
5. **Verificación**: suite completa (npm test), lint, build, grep `chat_logs` en src/ → 0 matches, grep del bundle deployado sin 'chat_logs', y checklist manual del dueño (hard refresh, probar chat flotante, consola sin warnings ni errores).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/services/ai-assistant.service.ts` | Modified | Elimina `logChatInteraction` (22-37), 2 call sites (381-385, 406-410) e imports huérfanos (7-8) |
| `src/components/GeminiChat.tsx` | None | NO se toca (importa `askAssistant`/`generateWhatsAppMessage`, ambos se conservan) |
| `firestore.rules` | None | NO se toca — `chat_logs` permanece sin regla (default-deny permanente) |
| `scripts/` | New (if needed) | Script one-off de conteo/borrado de `chat_logs` con Admin SDK (patrón preview/apply + artefactos JSON) |
| Bundle de hosting | Modified | Deja de contener la cadena `chat_logs` / el call a addDoc |
| `openspec/changes/secure-chat-logs/` | New | Artefactos SDD (exploration ya existe; proposal/spec/tasks de este paso) |

## Alternatives Considered

1. **Opción A — create anónimo validado + read/delete admin** (descartada por el dueño): era la recomendación de la exploración ("consistente con `producto_stats`"), requiere 3 reglas en `firestore.rules` y el deploy de rules. Argumento decisivo: **nadie lee la colección** (cero consumidores, verificado). Reglar un log sin lector es mantener deuda viva: escribe PII acumulándose, agrega superficie de ataque (spam de storage dentro del esquema permitido) y exige mantenimiento de validación estructural. Deploy de rules = más riesgo operativo para una data que nadie usa.
2. **Opción B — `signInAnonymously` + `request.auth != null`** (descartada y débil por diseño): la sesión anónima no da protección real — **cualquiera se auto-anoniza vía REST** (patrón documentado del SDK). Refactor de front (2-3 archivos) + latencia + manejo de estados nuevos, para una protección ilusoria. No aporta nada sobre Opción C para el problema real (data muerta).

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Romper el chat flotante del catálogo (única funcionalidad que toca el área) | Low | Borrado quirúrgico: solo se elimina la función privada y sus call sites; `askAssistant`/`generateWhatsAppMessage` intactos. Mitigación: `npm test` verde + `npm run build` OK + deploy + verificación manual post-deploy (REQ-002) |
| Romper otros consumidores de `ai-assistant.service.ts` | Low | Revisar exports/imports: solo `GeminiChat.tsx:4` importa del service y NO importa `logChatInteraction`; los imports son internos al archivo. Verificación con grep + lint + tests |
| Reflotamiento accidental de la feature (alguien regla `chat_logs` o re-agrega el write) | Low | Queda documentado en spec (REQ-003): la colección NO DEBE tener regla; reflotar = change nuevo con decisión explícita |
| Borrado de docs reales de `chat_logs` (si existieran, p. ej. creados por admin SDK) | Low | Script con conteo previo + modo preview primero; borrado por lotes idempotente; evidencia documentada (artefacto JSON con conteos pre/post) |
| Import huérfano olvidado (`db`/`addDoc`/`collection`/`serverTimestamp`) | Low | Lint (`eslint .`) detecta unused vars; eliminación prevista en tasks 1.3 |

## Rollback Plan

1. `git revert` del commit de `src/services/ai-assistant.service.ts` (restaura función + call sites + imports) + `firebase deploy --only hosting` con el bundle anterior.
2. El estado de Firestore es **idéntico antes y después** del change desde el punto de vista del backend: default-deny sin regla (no hubo cambio de rules) — no hay estado de Firestore que revertir.
3. Docs de `chat_logs` borrados (si existían): no son datos de negocio en uso (cero lectores); el rollback no los restaura — se documenta en el change que esos docs son irrelevantes para el sistema. Si el dueño los quisiera de vuelta, se reconstruyen solo si hay fuente (no la hay: el front nunca logró escribirlos).

## Dependencies

- `service-account.json` existente en `scripts/` (patrón Admin SDK ya instalado en `scripts/package.json` — `firebase-admin`).
- `firebase` CLI para `firebase deploy --only hosting`.
- Sin dependencias nuevas de terceros en el front.

## Success Criteria

- [ ] `grep -r 'chat_logs' src/` → **0 matches** (nadie escribe ni lee la colección desde el código)
- [ ] `npm test` completo en verde (sin regresiones); `npm run lint` sin errores nuevos; `npm run build` OK
- [ ] Chat flotante de `/catalogo` funcional post-deploy (pregunta → respuesta, sin errores en consola, sin el `console.warn` de log fallido)
- [ ] `firestore.rules` sin mencionar `chat_logs` (default-deny permanente, archivo intacto)
- [ ] Estado de la colección verificado y documentado: borrado con evidencia si había docs, o registro "cero docs" si estaba vacía/inexistente
- [ ] Bundle deployado sin la cadena `chat_logs` (verificación con grep del bundle servido)

## Implementation Plan (fases)

| Fase | Paso | Entregable | Gate |
|---|---|---|---|
| 1 | Código | `ai-assistant.service.ts` sin `logChatInteraction` ni imports huérfanos | `npm test` + lint + build verdes; grep de exports intactos |
| 2 | Colección | Conteo/borrado de `chat_logs` con Admin SDK (preview → apply) | Evidencia documentada (conteo pre/post o "cero docs") |
| 3 | Deploy | `firebase deploy --only hosting` | Bundle servido sin 'chat_logs' (curl + grep) |
| 4 | Verificación final | Suite completa + checklist manual del dueño | Todos los Success Criteria |

## Spec Deltas (requisitos preliminares — detalle completo en sdd-spec)

- **REQ-001** (MUST): ninguna escritura a `chat_logs` en `src/` — verificable con `grep -r 'chat_logs' src/` → 0 matches.
- **REQ-002** (MUST): el chat flotante del catálogo sigue funcionando — suite de tests en verde + build OK + comportamiento sin errores de consola.
- **REQ-003** (MUST): `chat_logs` NO DEBE tener regla en `firestore.rules` (default-deny permanente); reflotar la feature requiere un change nuevo.
- **REQ-004** (MUST): estado de la colección gestionado — si contiene docs, se eliminan con Admin SDK (idempotente, evidencia con conteo); si está vacía/inexistente, se documenta como evidencia.
- **REQ-005** (MUST): ningún otro consumidor de `ai-assistant.service.ts` se rompe — exports/imports revisados (`GeminiChat.tsx:4` intacto).