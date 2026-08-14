---
id: resolve-admin-redesign-branch/spec
status: active
title: "Spec: resolve-admin-redesign-branch"
change_date: 2026-08-14
---

# Repo Specification — gestión de branches (borrado de zombies)

## Purpose

Spec del dominio `repo` (gestión del repositorio): cubre la eliminación de las branches zombie `refactor/admin-panel-redesign` y `chore/security-updates-may-2026` (local + remota `origin/`) sin tocar `origin/main` ni el código de producto. No existen specs previas en este dominio — esta es la primera.

Este change NO modifica comportamiento de producto: los únicos efectos son sobre refs de git (`refs/heads/*` y `refs/remotes/origin/*`) y sobre la documentación del change (proposal/spec/tasks → archive). No requiere `design.md`: no hay diseño técnico — el plan operativo literal vive en `proposal.md` §Implementation Plan.

Contexto operativo (decisión del dueño 2026-08-14, registrada): Camino A aprobado — borrado de ambas branches; descartado el respaldo del wizard de `src/components/AssistantChat.tsx` como gist/note (código muerto, no importado); sin cherry-picks.

## Requirements

### Requirement: REQ-001 — Branches inexistentes en local y remota

Después de completar el change, las branches `refactor/admin-panel-redesign` y `chore/security-updates-may-2026` NO DEBEN existir como refs locales (`refs/heads/*`) ni como refs remotas (`refs/remotes/origin/*`). El repositorio DEBE eliminar ambas refs en los dos planos, y el clon local NO DEBE conservar remote-tracking refs fantasma de las branches borradas en `origin`.

#### Scenario: Borrado completo verificable con `git branch -a`

- GIVEN ambas branches existen local y remotamente (`refactor/admin-panel-redesign`, `chore/security-updates-may-2026`) y se ejecutó el borrado (local + remota)
- WHEN se ejecuta `git branch -a`
- THEN no aparece ninguna de las dos branches ni local ni remotamente
- AND `git branch -a | grep -E 'admin-panel-redesign|security-updates-may-2026'` devuelve vacío

#### Scenario: Ref remota fantasma tras el borrado local

- GIVEN el borrado local corrió pero la remote-tracking ref `origin/chore/security-updates-may-2026` sigue en el clon local
- WHEN se ejecuta `git fetch --prune origin`
- THEN las remote-tracking refs de las branches borradas desaparecen del clon
- AND una nueva ejecución de `git branch -a | grep -E 'admin-panel-redesign|security-updates-may-2026'` sigue devolviendo vacío

### Requirement: REQ-002 — Decisión de descarte del respaldo documentada (sin artefacto)

El sistema NO DEBE crear ningún artefacto de respaldo (gist/note) para `src/components/AssistantChat.tsx`. La decisión del dueño (2026-08-14) de descartar el respaldo DEBE quedar documentada en el archive del change, incluyendo la evidencia de que la idea del wizard es código muerto (archivo no importado en ningún lado del proyecto).

#### Scenario: Sin artefacto de respaldo tras el borrado

- GIVEN la decisión del dueño 2026-08-14 de NO respaldar el wizard de `AssistantChat.tsx`
- WHEN se ejecuta el borrado de las branches y se archiva el change
- THEN no existe ningún gist/note con la idea del wizard
- AND la decisión de descarte queda registrada en el archive del change (REQ-002)

#### Scenario: Evidencia de descarte verificable en el archive

- GIVEN un lector revisa el archive del change `resolve-admin-redesign-branch`
- WHEN busca la decisión respecto al respaldo del wizard
- THEN encuentra la decisión del dueño (2026-08-14: descartado, sin cherry-picks)
- AND la decisión está respaldada por la evidencia de código muerto de `AssistantChat.tsx`

### Requirement: REQ-003 — `origin/main` intacta tras el borrado

`origin/main` NO DEBE sufrir ninguna modificación derivada de este change: cero pushes de contenido a main. Los ÚNICOS push remotos permitidos DEBEN ser `git push origin --delete` de las dos branches señaladas. El tip de `origin/main` DEBE permanecer idéntico (mismo commit) antes y después del borrado.

#### Scenario: Tip de `origin/main` inalterado

- GIVEN el tip de `main` local y de `origin/main` registrado antes del borrado (mismo commit)
- WHEN se borran ambas branches (local `-D` + remota `--delete`) y se ejecuta `git log origin/main -1`
- THEN `git log origin/main -1` devuelve el MISMO commit que antes del borrado
- AND `git log origin/main -1` coincide con `git log main -1` (sin commits nuevos ni en origen ni en local)

#### Scenario: Push accidental de contenido a main no ocurre

- GIVEN un executor con `git push` disponible contra `origin`
- WHEN se ejecutan SOLO los pasos del plan de borrado
- THEN ningún push de contenido alcanza `origin/main`
- AND los únicos push ejecutados contra `origin` son `--delete` de las branches zombie (REQ-001)