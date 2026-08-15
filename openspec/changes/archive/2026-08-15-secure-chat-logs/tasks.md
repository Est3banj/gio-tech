# Tasks: secure-chat-logs

**Change**: `secure-chat-logs`
**Fecha**: 2026-08-14
**Dependencias**: `proposal.md` (Opción C aprobada, dueño 14-08-2026) · `specs/assistant/spec.md` (REQ-001..REQ-005)
**Formato commits**: conventional commits en inglés

**DECISIÓN DEL DUEÑO (14-08-2026)**: Opción C — borrar la feature de log muerta de `chat_logs`. Mandato: "borrar con cuidado, SIN afectar funcionalidades". El chat flotante del catálogo debe quedar 100% funcional.

> **DESIGN — SKIP JUSTIFICADO**: este change NO genera `design.md`. Es borrado de código muerto sin diseño técnico: se eliminan una función privada y sus call sites internos (verificados en exploración, cero decisiones arquitectónicas nuevas, cero estructuras nuevas, compatibilidad de imports verificada por grep). Precedente del proyecto: `resolve-admin-redesign-branch` también skip de design por ser borrado/gestión sin diseño técnico (repo spec archivado). El plan operativo literal vive en `tasks.md` (fases 1-4) y en `proposal.md` §Implementation Plan. Si en apply surge una decisión de diseño (p. ej. el script de borrado necesita batch paging o retries), se documenta inline en la tarea afectada — no amerita design.md.

---

## Fase 1 — Código: borrado del log muerto (REQ-001, REQ-002, REQ-005)

- [x] **1.1** Eliminar `logChatInteraction()` completa de `src/services/ai-assistant.service.ts`
  - REQ: REQ-001
  - Archivo: `src/services/ai-assistant.service.ts` (líneas 16-37: comentario de sección "── Logging a Firestore ──" + JSDoc + función privada)
  - Done: función privada borrada completa (no es export — sin export que romper); el `try/catch` + `console.warn('No se pudo guardar el log del chat')` desaparecen con ella (elimina también el warn de consola del browser, REQ-002 escenario 3).
  - Estimación: S
  - Dependencias: ninguna

- [x] **1.2** Eliminar los 2 call sites internos de `logChatInteraction`
  - REQ: REQ-001, REQ-002
  - Archivo: `src/services/ai-assistant.service.ts` — call site 1 en el flujo exitoso (líneas 380-385: comentario "// Logging no bloqueante" + llamada con `{ pregunta, respuesta, productosRelevantes }`) y call site 2 en el flujo de error (líneas 405-409/410: comentario "// Logging del error" + llamada)
  - Done: `grep -n 'logChatInteraction' src/` → 0 matches. El flujo de `askAssistant` (return de respuesta exitosa en :387, mensaje de error por WhatsApp en :390, `console.error` en :403) queda INTACTO — el chat flotante no cambia su comportamiento.
  - Estimación: S
  - Dependencias: 1.1

- [x] **1.3** Limpiar imports huérfanos de `firebase/firestore` y `../firebase`
  - REQ: REQ-001, REQ-005
  - Archivo: `src/services/ai-assistant.service.ts` línea 7 (`import { collection, addDoc, serverTimestamp } from 'firebase/firestore'` — verificado: solo se usaban en `logChatInteraction`) y línea 8 (`import { db } from '../firebase'`)
  - Done: si tras el borrado quedan sin uso → eliminar; si algún otro uso existe (verificar con grep antes de tocar), dejar solo lo usado. Criterio de verificación: `npm run lint` sin errores de unused imports en el archivo.
  - Estimación: S
  - Dependencias: 1.1

- [x] **1.4** Verificar exports/imports de consumidores externos
  - REQ: REQ-005
  - Archivo: `src/components/GeminiChat.tsx:4` (único importador: `askAssistant`, `generateWhatsAppMessage`) — NO se modifica este archivo
  - Done: `grep -rn "ai-assistant.service" src/` → solo `GeminiChat.tsx`; ambos exports conservados con misma firma; `GeminiChat.tsx:70` (call de `askAssistant`) intacto.
  - Estimación: S
  - Dependencias: 1.2

- [x] **1.5** Verificación de código tras el borrado (sin deploy)
  - REQ: REQ-001, REQ-002, REQ-005
  - Comandos (raíz): `grep -r 'chat_logs' src/` (0 matches) · `npm test` (suite completa en verde) · `npm run lint` (sin errores nuevos) · `npm run build` (bundle OK)
  - Done: los 4 gates en verde. Commit conventional en inglés (p. ej. `refactor(assistant): remove dead chat_logs logging feature`).
  - Estimación: S
  - Dependencias: 1.3, 1.4

## Fase 2 — Verificación/limpieza de la colección en producción (REQ-004)

- [x] **2.1** Crear script de conteo/borrado de `chat_logs` con Admin SDK
  - REQ: REQ-004
  - Archivo: `scripts/` — script one-off (patrón existente: `scripts/backfillPerfilesPublicos.js`, credencial `scripts/service-account.json` ya existente, `firebase-admin` ya instalado en `scripts/package.json`)
  - Done: script que (a) en modo preview lista docs de `chat_logs` (conteo + sample de ids, sin borrar) y (b) en modo `--apply` borra por lotes (batch delete idempotente, re-corrible) si hay docs, con salida documentada en artefacto JSON (`scripts/chat-logs-cleanup-<timestamp>.json`) con conteo pre/post y timestamps. Si conteo = 0 → registra "cero docs" y no borra nada.
  - Estimación: S
  - Dependencias: ninguna

- [x] **2.2** Ejecutar preview y auditar salida
  - REQ: REQ-004
  - Comando (workdir `scripts/`): `node <script>.js` (modo preview)
  - Done: salida registra conteo de `chat_logs` en producción. Si N > 0 → auditar muestra de ids antes de borrar; si 0 o colección inexistente → se documenta "cero docs" como evidencia (artefacto JSON) y se salta 2.3.
  - Estimación: S
  - Dependencias: 2.1

- [x] **2.3** Ejecutar apply de borrado (solo si conteo > 0) y re-verificar
  - REQ: REQ-004
  - Comando (workdir `scripts/`): `node <script>.js --apply`; re-correr preview → conteo post = 0
  - Done: borrado por lotes corrido; evidencia en artefacto JSON (pre/post); re-ejecución del script reporta cero docs sin errores (idempotencia verificada, escenario REQ-004).
  - Estimación: S
  - Dependencias: 2.2

## Fase 3 — Deploy de hosting + verificación técnica (REQ-002, REQ-003)

- [x] **3.1** Deploy del bundle nuevo a hosting
  - REQ: REQ-002, REQ-003
  - Comando (raíz): `firebase deploy --only hosting` (el bundle deja de contener el call a `addDoc(chat_logs)` y el warn)
  - Done: deploy exitoso. NOTA: NO se deploya `firestore.rules` (archivo sin cambios, default-deny intacto — REQ-003; verificar con `git status` que `firestore.rules` está limpio).
  - Estimación: S
  - Dependencias: 1.5 (pre-deploy), 2.3 (opcional)

- [x] **3.2** Verificación técnica del bundle servido
  - REQ: REQ-001, REQ-003
  - Comando: fetch del asset JS del hosting (curl a la URL del bundle apuntado por el HTML) + `grep -c 'chat_logs'` sobre el contenido
  - Done: `curl -s <url-bundle> | grep -c 'chat_logs'` → 0 (el bundle deployado no contiene la colección). Sin dependencia de auth: el bundle JS es público en hosting.
  - Estimación: S
  - Dependencias: 3.1

## Fase 4 — Verificación final y checklist del dueño (REQ-002, REQ-004)

- [x] **4.1** Gates automatizados finales
  - REQ: REQ-001, REQ-002, REQ-005
  - Comandos (raíz): `npm test` (completo, en verde), `grep -r 'chat_logs' src/` (0 matches), `grep -n 'chat_logs' firestore.rules` (0 matches, archivo intacto en git)
  - Done: los 3 gates en verde; `git status` muestra solo `src/services/ai-assistant.service.ts` (+ artefactos del change/scripts si aplica).
  - Estimación: S
  - Dependencias: 3.2

- [ ] **4.2** Checklist manual para el dueño (verificación post-deploy)
  - NOTA (apply 15-08-2026): checklist listo en el reporte de apply — lo completa el dueño/orquestador (requiere browser)
  - REQ: REQ-002, REQ-004
  - Pasos: (1) hard refresh (Cmd+Shift+R) en `/catalogo`; (2) abrir el chat flotante (FAB) y hacer una pregunta real → respuesta del asistente; (3) forzar error de API (si se puede) → mensaje de error por WhatsApp intacto; (4) consola del browser SIN el warning 'No se pudo guardar el log del chat' ni errores de permisos; (5) confirmar evidencia de `chat_logs` (artefacto de Fase 2)
  - Done: checklist completado por el dueño/orquestador (el agente no puede correr el browser). Confirmar que el chat flotante queda 100% funcional.
  - Estimación: S
  - Dependencias: 4.1

---

## Resumen de trazabilidad

| REQ | Tareas | Verificación |
|-----|--------|--------------|
| REQ-001 (0 escrituras a `chat_logs` en src/) | 1.1, 1.2, 1.3, 1.5, 3.2, 4.1 | `grep -r 'chat_logs' src/` → 0; `grep logChatInteraction` → 0; bundle sin 'chat_logs' |
| REQ-002 (chat flotante funcional) | 1.2, 1.5, 3.1, 4.1, 4.2 | `npm test` verde; `npm run build` OK; checklist manual (hard refresh + pregunta real + consola limpia) |
| REQ-003 (default-deny permanente) | 3.1, 3.2, 4.1 | `firestore.rules` sin 'chat_logs' y sin diff en git |
| REQ-004 (estado de la colección) | 2.1, 2.2, 2.3, 4.2 | Artefacto JSON con conteo pre/post o "cero docs"; idempotencia verificada |
| REQ-005 (consumidores intactos) | 1.3, 1.4, 1.5, 4.1 | `GeminiChat.tsx` sin cambios; exports intactos; build OK |

Estimaciones: todas las tareas en **S** (borrado quirúrgico de ~30 líneas + script one-off + verificación). Total: 12 tareas en 4 fases. Orden de ejecución estricto: Fase 1 → Fase 2 → Fase 3 → Fase 4 (el deploy nunca antes de la verificación de código; la verificación final nunca antes del deploy).