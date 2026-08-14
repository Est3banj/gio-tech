---
id: resolve-admin-redesign-branch
status: approved
title: "Eliminar branches zombie refactor/admin-panel-redesign y chore/security-updates-may-2026 (local + remota)"
change_date: 2026-08-14
---

# Proposal: resolve-admin-redesign-branch

## Problem

Dos branches zombie divergidas (`refactor/admin-panel-redesign`, 25 ahead / 22 behind; `chore/security-updates-may-2026`, 5 ahead / 5 behind) invitan a merges catastróficos. Un merge completo de cualquiera de las dos implicaría 13+ archivos en conflicto y REVERTIRÍA las reglas de seguridad del change archivado `secure-firestore-usuarios`: traen `firestore.rules` viejas con `allow read: if true` en usuarios, sin `isAdmin`, sin `perfiles_publicos`, y sin validación estructural en `producto_stats`. Además eliminarían funcionalidad viva de main (TerminosPage, flujo de crédito completo: modales + logos + financieras, BannerSlider, fuse.js, product cards del asistente).

No es código roto: es riesgo operativo latente. Todo el contenido valioso de ambas branches ya vive en main en estado igual o superior (verificado byte-idéntico en el admin redesign vía 7ecb27c; el AI assistant de main supera al de la branch con retries 429, logging a Firestore, financieras y validación estricta).

## Scope

### In Scope

- Borrar `refactor/admin-panel-redesign` local (`git branch -D`) y remota (`git push origin --delete`).
- Borrar `chore/security-updates-may-2026` local y remota.
- Sin respaldo del wizard: decisión del dueño 2026-08-14 — NO se respalda `src/components/AssistantChat.tsx` (270 líneas, código muerto) como gist/note; el descarte queda documentado en el archive (REQ-002).
- Verificación post-borrado: ausencia de ambas branches (local y remota) y `origin/main` intacta.
- Documentar el borrado (este change quedará en `openspec/archive`).

### Out of Scope

- NO se hace merge ni cherry-pick de ninguna branch.
- NO se rescata `HeroCarousel.tsx` (deprecated en main desde 1e892a6), `metaPixel.js` (duplicado de `metaPixel.ts`), ni `gemini.service.ts` (versión anterior del servicio).
- NO se tocan las otras branches remotas viejas (`feat/catalog-filters`, `feat/performance-seo-optimization`, `fix/hooks-violations`).
- NO hay cambios de código de producto.

## Solution (Camino A — borrado, elegido)

Borrar ambas branches local y remotamente, con evidencia de que todo su contenido ya está absorbido en main:

1. Los 5 commits base de `refactor/admin-panel-redesign` ya están en main (`git cherry` los marca `-`).
2. Los 14 commits del admin redesign están byte-idénticos en main (verificado archivo por archivo: AdminLayout, AdminProductsList, AdminCarouselManager, AdminAddProductTab, AdminBusinessConfig).
3. El AI assistant de la branch es una versión ANTERIOR (sin product cards, sin retries, sin logging, sin créditos) y su único archivo exclusivo (`AssistantChat.tsx`) es código muerto — no se importa en ningún lado.
4. `chore/security-updates-may-2026` contiene EXACTAMENTE los commits que ya entraron a main por otros caminos (git cherry: todos `-`); no tiene parches de seguridad pendientes.
5. Ambas branches degradan las `firestore.rules` a un estado inseguro — conservarlas es mantener una trampa activa.

Decisión del dueño (2026-08-14, registrada): NO respaldar la IDEA del wizard de `AssistantChat.tsx` como gist/note — descartado explícitamente. Sin artefacto de respaldo y sin cherry-picks. El descarte queda documentado en el archive de este change (REQ-002).

### Spec Deltas

Este change NO modifica comportamiento de producto — es gestión de repo. No hay requirements funcionales del sistema; se declaran los siguientes requirements de gestión (RFC 2119) que gobernarán la fase spec:

- **REQ-001**: Las branches `refactor/admin-panel-redesign` y `chore/security-updates-may-2026` NO DEBEN existir ni local ni remotamente (`origin/`) al finalizar el cambio.
- **REQ-002**: El sistema NO DEBE crear ningún artefacto de respaldo (gist/note) para `src/components/AssistantChat.tsx`. La decisión del dueño (2026-08-14) de descartar el respaldo DEBE quedar documentada en el archive del change, con la evidencia de que la idea del wizard es código muerto (archivo no importado en ningún lado). `AssistantChat.tsx` SE ELIMINA con el borrado de la branch, sin artefacto de respaldo.
- **REQ-003**: `origin/main` NO DEBE sufrir ninguna modificación derivada de este cambio (cero pushes a main; los únicos push remotos son `--delete` de las branches señaladas).

## Alternatives (descartadas)

### B — Merge completo (descartado)

- ~13+ archivos en conflicto (firestore.rules, index.html, package.json, App.css, App.tsx, Catalogo.tsx, GeminiChat.tsx, LandingPage.tsx, ProductCard.tsx, WhatsappNumberContext.tsx, AdminPanel.tsx + modify/delete en HeroCarousel/AssistantChat).
- Pisaría: reglas de seguridad de Firestore (regresión SEVERA), TerminosPage, flujo de crédito (CreditFormModal, CreditModal, financieras.ts, 5 logos), BannerSlider, fuse.js, product cards, tests y scripts de seguridad.
- Beneficio CERO: todo el contenido ya está en main en mejor estado. Riesgo alto, valor nulo.

### C — Merge selectivo / cherry-pick (descartado)

- El candidato natural (bcda695, AI chatbot) ya fue superado por efac3d7 en main. Su único aporte exclusivo sería `AssistantChat.tsx`, código muerto en la propia branch y no apto para producción sin desarrollo adicional.
- Lo exclusivo de la branch es o código muerto o versiones viejas: `gemini.service.ts` sin retries/logging/financieras, `HeroCarousel` deprecated, `metaPixel.js` duplicado.
- Costo (conflictos con el GeminiChat moderno) supera ampliamente el beneficio (nulo).

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Borrado irreversible (se pierde código que no está en main) | Low | Los commits viven en main (absorbidos); el único exclusivo es `AssistantChat.tsx` (código muerto) — descarte del respaldo decidido por el dueño (2026-08-14) y documentado en el archive. Las SHAs (2e11b38, 5f6fd86) quedan documentadas en este change para reconstrucción vía reflog. |
| Alguien hace merge de las branches ANTES del borrado (regresión de seguridad) | Med | Ejecutar el borrado apenas se apruebe la proposal; el borrado remoto previo al local cierra la puerta del merge desde cualquier clon. |
| Borrado parcial (solo local, la remota sigue viva y re-mergeable mañana) | Med | Ambos borrados (local `-D` + remoto `--delete`) son pasos separados del plan con verificación al final (`git branch -a` + `git fetch --prune`). |

## Rollback Plan

- **Local**: hasta que corra el GC, los commits se pueden recuperar vía `git reflog` o re-creando la branch desde las SHAs documentadas (`git branch refactor/admin-panel-redesign 2e11b38`).
- **Remota**: reconstruible con `git push origin <sha>:refs/heads/refactor/admin-panel-redesign` (commit tip local 2e11b38; remoto era 5f6fd86). Misma lógica para `chore/security-updates-may-2026`.
- En la práctica el rollback no es necesario: el contenido valioso ya vive en main.

## Implementation Plan

Plan de implementación (NÚMERO 5 del task breakdown; la numeración de fases se define en sdd-tasks):

0. **Decisión del dueño (tomada 2026-08-14, registrada)**: NO respaldar `AssistantChat.tsx` como gist/note — descartado. Sin cherry-picks. No queda operación condicional pendiente.
1. **Borrar local**:
   ```bash
   git checkout main
   git branch -D refactor/admin-panel-redesign
   git branch -D chore/security-updates-may-2026
   ```
2. **Borrar remoto**:
   ```bash
   git push origin --delete refactor/admin-panel-redesign
   git push origin --delete chore/security-updates-may-2026
   ```
3. **Verificación**:
   ```bash
   git branch -a | grep -E 'admin-panel-redesign|security-updates-may-2026'   # debe devolver NADA
   git fetch --prune origin
   git log origin/main -1 --oneline    # main intacta, inalterada
   ```
4. **Documentación**: commit del archive/openspec con la decisión del dueño y el reporte de borrado (conventional commit en inglés).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `refs/heads/refactor/admin-panel-redesign` (local + `origin/`) | Removed | Branch zombie borrada |
| `refs/heads/chore/security-updates-may-2026` (local + `origin/`) | Removed | Branch zombie borrada |
| `src/components/AssistantChat.tsx` | Removed | Código muerto; sin respaldo (decisión del dueño 2026-08-14) — descarte documentado en el archive |
| `origin/main` | Untouched | Protegida: cero pushes de contenido |
| `openspec/changes/resolve-admin-redesign-branch/` | Modified | exploration.md (previo) + proposal.md (este artefacto) |

## Dependencies

- Aprobación del dueño: TOMADA (2026-08-14) — Camino A aprobado, descarte del respaldo del wizard (gist/note NO), sin cherry-picks.
- Acceso con permisos de borrado a `origin` (push delete).

## Success Criteria

- [ ] `git branch -a` no muestra ni local ni remotamente `refactor/admin-panel-redesign` ni `chore/security-updates-may-2026`.
- [ ] `origin/main` sin cambios (mismo tip que antes del borrado).
- [ ] Sin artefacto de respaldo: no existe ningún gist/note de `AssistantChat.tsx` (decisión del dueño 2026-08-14) y el descarte queda documentado en el archive.
- [ ] Change archivado en openspec con el reporte de borrado.