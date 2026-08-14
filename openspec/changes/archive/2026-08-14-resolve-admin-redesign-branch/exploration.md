# Exploration: resolución de refactor/admin-panel-redesign

Fecha: 2026-08-14 · Modo: openspec · Solo lectura (cero modificaciones al repo)

## Contexto

La branch `refactor/admin-panel-redesign` (25 ahead / 22 behind, ±config auditada 14/08) es la evolución paralela de un gran refactor (migración TS + admin redesign + AI assistant) que en su mayor parte YA fue absorbido por main por otra vía (commits PR #7/#8/#9 y 7ecb27c del 12-jun). Esta exploración determina qué queda realmente único en la branch para decidir entre borrar / merge completo / cherry-pick selectivo.

**Hecho clave del merge-base:** `main` y la branch comparten el merge-base `036a9bd`. Todo lo que la branch construyó DESPUÉS de `036a9bd` fue reinventado en main con commits distintos (PRs #7/#8/#9 en la semana del 12-may y cleanup 7ecb27c del 12-jun), produciendo árboles finales idénticos o superiores.

## Inventario de la branch (25 commits, local tip 2e11b38)

| Rango | Fecha | Contenido | Estado en main |
|---|---|---|---|
| 5bd15c1 → 364d3bf | 12–15 may | Migración TS (#7), deps seguridad (#8), README (×3) | **ABSORBIDO** vía ecf0045/ed0b7a8/44ffa1d (git cherry: `-` todos) |
| 053e403 → 8eedbff (14 commits) | 15 may | Admin redesign: AdminLayout, AdminPanel.tsx, AdminProductsList, AdminCarouselManager, modales confirmación | **ABSORBIDO byte-idéntico** vía 7ecb27c (12-jun). Verificado: `git show` de AdminLayout/AdminProductsList/AdminCarouselManager/AdminAddProductTab/AdminBusinessConfig = IDENTICOS en main y branch |
| 9600135 | 14 abr | metaPixel.js tracking | **SUPERADO**: main lo borró (1e892a6, 12-jun) y tiene metaPixel.ts (79 líneas) |
| bcda695 | 07 abr | "improve AI chatbot": gemini.service.ts + AssistantChat | **SUPERADO**: main lo evolucionó en efac3d7 (22-jul) con product cards, validación estricta, créditos y logging |
| 2e11b38 | 12 jun | Cleanup final (tests, CI, vitest) | **GEMELO** de 7ecb27c en main (mismo contenido, distinto SHA) |

`git cherry main refactor/admin-panel-redesign` → los 5 commits base son `-` (ya en main); los 20 restantes son `+` por SHA/contexto distinto, pero el árbol del admin es byte-idéntico → el contenido YA está en main.

## Lo ÚNICO que la branch tiene y main NO

| Archivo (branch) | Líneas | Valor real |
|---|---|---|
| `src/components/AssistantChat.tsx` | 270 | Wizard por pasos (presupuesto→marca→cámara→memoria) con compare. **CÓDIGO MUERTO: no se importa en ningún lado de la branch** (local ni remota). Nunca montado |
| `src/components/HeroCarousel.tsx` | 280 | Carrusel con Swiper leyendo colección `carrusel`. Main lo descartó como deprecated (1e892a6) y usa BannerSlider (mejorado: aspect-ratio, polish ejstore) + AdminCarouselManager para la gestión |
| `src/utils/metaPixel.js` | 63 | Duplicado viejo de `metaPixel.ts` de main |
| `src/services/gemini.service.ts` | 316 | Rename de `ai-assistant.service.ts` con la versión ANTERIOR: sin retries 429 (MAX_RETRIES), sin logging a Firestore (`logChatInteraction`), sin integración de financieras, sin validación estricta de productos |

El `GeminiChat.tsx` de la branch (202 líneas) es el chat libre viejo: sin product cards, sin matcher, sin créditos. MAIN tiene el asistente moderno (efac3d7): product cards con `product-matcher.ts` (84 líneas, solo main), retries, logging, créditos.

## Qué hay EN main que la branch ELIMINÓ o no tiene

| Archivo | Uso en main | Archivo | Uso en main |
|---|---|---|---|
| `TerminosPage.tsx` (225) | Linkeada en footer (db3a58f) | `CreditFormModal.tsx` (189) | Flujo crédito |
| `CreditModal.tsx` (76) | Flujo crédito | `financieras.ts` (132) | Financieras (importada por ai-assistant.service) |
| `BannerSlider.tsx` (180) | Catalogo + LandingPage | `product-matcher.ts` (84) | Product cards del asistente |
| 5 logos `public/logoscredito/*.webp` | Flujo crédito | `fuse.js` en package.json | Búsqueda (main lo usa, branch lo QUITA) |
| `firestore.rules` seguras | isAdmin, perfiles_publicos, validación estructural | `scripts/verify-rules-prod.js`, `backfillPerfilesPublicos.js` | Seguridad firestore (secure-firestore-usuarios) |

**CRÍTICO:** la branch trae las `firestore.rules` VIEJAS (`allow read: if true` en usuarios, sin isAdmin, sin perfiles_publicos, `allow write` sin validación estructural en producto_stats). Un merge completo REVERTIRÍA las reglas de seguridad del change `secure-firestore-usuarios`. Además `WhatsappNumberContext.tsx` de la branch lee de `usuarios` directo (en vez de `perfiles_publicos`) → rompe con el modelo actual.

## Caminos

### A — Borrar/archivar la branch (recomendado)

- Pierde: AssistantChat.tsx (muerto), HeroCarousel.tsx (deprecated), metaPixel.js (duplicado), gemini.service.ts (versión vieja del servicio, su lógica de búsqueda YA está en main casi idéntica).
- Nada funcional se pierde. Todo lo valioso ya vive en main con mejoras.
- Consideración: la branch tiene versión REMOTA (`origin/refactor/admin-panel-redesign`, tip 5f6fd86, desincronizada del local 2e11b38). Borrar local ≠ borrar remota.

### B — Merge completo

- ~13+ archivos en conflicto según `git merge-tree` (entradas 1+2+3): firestore.rules, index.html, package.json, package-lock.json, App.css, App.tsx, Catalogo.tsx, GeminiChat.tsx, LandingPage.tsx, ProductCard.tsx, WhatsappNumberContext.tsx, AdminPanel.tsx + modify/delete en HeroCarousel.tsx y AssistantChat.tsx.
- Pisaría: rules seguras de Firestore (SEVERO, regresión de seguridad), TerminosPage, todo el flujo de crédito (modales + logos + financieras), BannerSlider, fuse.js, product cards del asistente, tests y scripts de seguridad.
- Alto riesgo, beneficio CERO (todo el contenido ya está en main, más viejo).

### C — Cherry-pick selectivo

- Candidato natural: bcda695 (AI chatbot). PERO su contenido ya fue superado por efac3d7 en main. El único aporte sería `AssistantChat.tsx` (wizard por pasos), que además está muerto en la propia branch. No es candidato a producción sin desarrollo adicional.
- Resultado: nada vale la pena traer. El costo (conflictos con el GeminiChat moderno) supera el beneficio.

## Recomendación

**Camino A: borrar la branch (local + remota).** Con evidencia:

1. Los 5 primeros commits ya están en main (git cherry `-`).
2. Los 14 commits del admin redesign están byte-idénticos en main (verificado archivo por archivo).
3. El AI assistant de la branch es una versión ANTERIOR a la de main (sin cards, sin retries, sin logging, sin créditos), y su único archivo nuevo (AssistantChat) está sin montar.
4. La branch elimina funcionalidad viva de main (Terminos, crédito, BannerSlider) y degrada las firestore.rules a un estado inseguro.
5. Ningún commit aporta código que main no tenga en mejor estado.

Alternativa de propiedad: si se quiere conservar el wizard de AssistantChat como idea para el futuro, guardarlo como referencia en un note/gist ANTES de borrar — no como branch activa.

## Evaluación de chore/security-updates-may-2026

- 5 ahead / 5 behind del mismo merge-base 036a9bd. Contiene EXACTAMENTE los commits 5bd15c1, 09a8d77, d7fb137, aa6f9a3, 364d3bf (git cherry: todos `-` = ya en main).
- Sus firestore.rules también son las viejas (diff con main muestra las mismas regresiones que la branch admin).
- **Irrelevante hoy**: sin parches de seguridad pendientes (los deps security ya entraron por #8; las rules seguras ya entraron por secure-firestore-usuarios). Candidata a borrar también (local + remota; remota `origin/chore/security-updates-may-2026` existe).

## Riesgos

- **Regresión de seguridad** si alguien hace merge completo con las branch vieja (rules inseguras + lecturas directas a usuarios).
- **Confusión futura**: 3 branches remotas viejas (admin-redesign, security-updates, feat/catalog-filters, feat/performance-seo-optimization, fix/hooks-violations) propagan el modelo viejo de AI assistant; documentar el borrado.
- **Borrado parcial**: si solo se borra el local, la remota sigue viva y alguien la puede re-mergear mañana.

## Ready for Proposal

**Sí.** Propuesta: borrar `refactor/admin-panel-redesign` y `chore/security-updates-may-2026` (local + remota), previa decisión explícita del owner. Cero cherry-picks. Backfill: ninguno requerido.

## Estado del repo (verificación de no-modificación)

- `git status`: limpio, en main, actualizada con origin/main. Único archivo creado: `openspec/changes/resolve-admin-redesign-branch/exploration.md`.
- No se ejecutó ningún comando de escritura (sin merge, cherry-pick, push, branch -D).