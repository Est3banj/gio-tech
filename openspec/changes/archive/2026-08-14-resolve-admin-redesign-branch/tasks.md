# Tasks: resolve-admin-redesign-branch — Eliminar branches zombie (local + remota)

**Change**: `resolve-admin-redesign-branch`
**Fecha**: 2026-08-14
**Dependencias**: `proposal.md` (Camino A aprobado por el dueño 2026-08-14: borrado de ambas branches, sin respaldo del wizard, sin cherry-picks) · `specs/repo/spec.md` (REQ-001..REQ-003) · **`design.md`: NO APLICA (skip justificado)** — sin diseño técnico: es gestión de repo (borrado de refs); el plan operativo literal está en `proposal.md` §Implementation Plan
**Formato commits**: conventional commits en inglés (openspec/config.yaml)

**GATE GLOBAL (crítico, aplica a TODO el flujo)**: NUNCA hacer push de contenido; los ÚNICOS push remotos permitidos son `git push origin --delete` de las dos branches zombie (REQ-003). `origin/main` NO se toca en ningún momento. Orden estricto: **Fase 1 → Fase 2 → Fase 3 → Fase 4**.

---

## Fase 1 — Borrado LOCAL de las branches zombie

- [ ] **1.1** Posicionarse en `main` antes de borrar (nunca borrar la branch actual)
  - REQ: REQ-001
  - Archivo: sin cambios de archivos — operación git
  - Done: `git checkout main` exitoso; `git branch --show-current` devuelve `main`; `git status` limpio. Registrar el tip pre-borrado: `git log main -1 --oneline` y `git log origin/main -1 --oneline` (evidencia para 3.3, escenarios REQ-003).
  - Estimación: S
  - Dependencias: ninguna

- [ ] **1.2** Borrar local `refactor/admin-panel-redesign` (fuerza: 25 ahead / 22 behind)
  - REQ: REQ-001
  - Archivo: sin cambios de archivos — operación git
  - Done: `git branch -D refactor/admin-panel-redesign` → la ref deja de existir (`git branch` sin la branch). SHAs de reconstrucción ya documentadas en `proposal.md` §Rollback (tip local 2e11b38; remoto 5f6fd86).
  - Estimación: S
  - Dependencias: 1.1

- [ ] **1.3** Borrar local `chore/security-updates-may-2026` (fuerza: 5 ahead / 5 behind)
  - REQ: REQ-001
  - Archivo: sin cambios de archivos — operación git
  - Done: `git branch -D chore/security-updates-may-2026` → la ref deja de existir (`git branch` sin la branch).
  - Estimación: S
  - Dependencias: 1.1

## Fase 2 — Borrado REMOTO de las branches zombie (origin)

- [ ] **2.1** Borrar remota `refactor/admin-panel-redesign`
  - REQ: REQ-001
  - Archivo: sin cambios de archivos — operación git
  - Done: `git push origin --delete refactor/admin-panel-redesign` → el remote confirma el borrado de la ref (`- [deleted] refs/heads/refactor/admin-panel-redesign`).
  - Estimación: S
  - Dependencias: 1.2

- [ ] **2.2** Borrar remota `chore/security-updates-may-2026`
  - REQ: REQ-001
  - Archivo: sin cambios de archivos — operación git
  - Done: `git push origin --delete chore/security-updates-may-2026` → el remote confirma el borrado de la ref (`- [deleted] refs/heads/chore/security-updates-may-2026`).
  - Estimación: S
  - Dependencias: 2.1 (mismo patrón)

## Fase 3 — Verificación post-borrado (anti-regresión)

- [ ] **3.1** Verificar ausencia total de las branches (local + remota)
  - REQ: REQ-001
  - Archivo: sin cambios de archivos — verificación
  - Done: `git branch -a | grep -E 'admin-panel-redesign|security-updates-may-2026'` devuelve VACÍO (sin output). Comando de verificación EXACTO del escenario REQ-001 "borrado completo verificable".
  - Estimación: S
  - Dependencias: 1.2, 1.3, 2.1, 2.2

- [ ] **3.2** Podar remote-tracking refs fantasma del clon
  - REQ: REQ-001
  - Archivo: sin cambios de archivos — verificación
  - Done: `git fetch --prune origin` corre sin errores; re-correr el grep de 3.1 → sigue vacío (cierra el escenario REQ-001 "ref remota fantasma").
  - Estimación: S
  - Dependencias: 3.1

- [ ] **3.3** Confirmar `origin/main` intacta
  - REQ: REQ-003
  - Archivo: sin cambios de archivos — verificación
  - Done: `git log origin/main -1` == `git log main -1` y AMBOS == el tip registrado en 1.1 (escenario REQ-003 "tip de origin/main inalterado"). Sin commits nuevos, sin pushes de contenido.
  - Estimación: S
  - Dependencias: 3.2

## Fase 4 — Documentación y cierre

- [ ] **4.1** Verificar que el descarte del respaldo del wizard quedó registrado
  - REQ: REQ-002
  - Archivo: `openspec/changes/resolve-admin-redesign-branch/proposal.md` (§Solution, REQ-002, §Implementation Plan paso 0) · `openspec/changes/resolve-admin-redesign-branch/specs/repo/spec.md` (REQ-002)
  - Done: la decisión del dueño 2026-08-14 (NO respaldar `AssistantChat.tsx` como gist/note, sin cherry-picks) está explícita en proposal + spec; NO se creó ningún artefacto de respaldo (escenario REQ-002 "sin artefacto").
  - Estimación: S
  - Dependencias: 3.3

- [ ] **4.2** Commit del archive/openspec (conventional commit en inglés)
  - REQ: REQ-002, REQ-003
  - Archivo: `openspec/changes/resolve-admin-redesign-branch/` (change completo) → commit único
  - Done: `git add openspec/ && git commit -m "docs(openspec): archive resolve-admin-redesign-branch branch cleanup"` — el diff contiene SOLO archivos de `openspec/` (`git status` sin archivos de `src/` ni `firestore.rules`). El archive es el audit trail del borrado: decisión REQ-002 + reporte.
  - Estimación: S
  - Dependencias: 4.1