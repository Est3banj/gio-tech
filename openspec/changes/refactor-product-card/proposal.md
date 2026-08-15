---
id: refactor-product-card/proposal
status: approved
title: "Proposal: refactor-product-card"
change_date: 2026-08-15
---

# Proposal: refactor-product-card

## Intent

`src/components/ProductCard.tsx` es el componente más grande del repo: **1165 líneas** (verificado con `wc -l`), con 14 `useState`, 1 `useRef`, 2 contexts, ~325 líneas de CSS inline y 2 constructores de mensajes de WhatsApp embebidos SIN tests. El objetivo aprobado por el dueño: partir el componente en piezas con responsabilidades claras (helpers PUROS de mensajes WhatsApp testeables + sub-componentes presentacionales en `src/components/product-card/`), priorizando **mantenibilidad y testabilidad** — NO optimización de render. SIN cambio de UI visible.

**Contexto de negocio INNEGOCIABLE** (verificado en exploración §4): los mensajes de WhatsApp generados (contado directo y solicitud de crédito) tienen formato EXACTO que la gente usa para cotizar. El refactor NO puede alterar NI UN CARÁCTER de los outputs de WhatsApp, NI el flujo del modal de crédito (wizard `product → payment → credito-financieras → credito-form`, autovalidación, wizard de Sistecredito con timers), NI el comportamiento visual de precio/cuotas/badges.

**Mecanismo de garantía**: tests de caracterización (golden) sobre los mensajes WhatsApp creados en Fase 0, corriendo sobre código puro extraído VERBATIM del comportamiento actual (antes de tocar la implementación del componente). Regla del change: los golden tests deben estar verdes ANTES del primer `edit` a `ProductCard.tsx`.

## Scope

### In Scope

1. **Fase 0 — Golden tests + utils puras (código viejo intacto)**: `src/utils/whatsapp-messages.ts` (constructores verbatim: contado `ProductCard.tsx:113-115`, crédito `:200-216` + builder de URL `:124/:219` + mapa `lineLabel` `:184-198`), `src/utils/promo.ts` (lógica pura de ventana promocional: `getMillis`, `inWindow`, `hasPromoPrice`, show-boolians, `:80-111`), con sus `.test.ts` golden.
2. **Fase 1 — Rewiring de WhatsApp**: `ProductCard.tsx` consume los builders; comportamiento byte-idéntico probado por los golden tests de Fase 0.
3. **Fase 2 — Sub-componentes presentacionales** en `src/components/product-card/`: `ProductCardView` (card), `ProductBadges`, `PriceDisplay` (variante card/modal), `PlanCuotas`, `FinancieraGrid`, `CreditForm`, `SistecreditoValidation` (wizard con timers), hook `useProductPricing` (derivados puros de precio/badges), `product-card.css` (estilo movido desde el bloque `<style>` inline `:277-601`), y `ProductCard.test.tsx` (smoke tests de componente con mocks de firebase).
4. **Fase 3 — Limpieza + verificación completa**: lint 0/0 (sin warnings NUEVOS — hoy es 0/0), `npm test` verde (28 actuales + nuevos), typecheck `tsc --noEmit` sin errores. NO se corre `vite build` (regla del orquestador: nunca build).
5. **Fase 4 — Commit + archive**: conventional commits + `sdd-archive` (sync de spec a `openspec/specs/ui/spec.md`).

### Out of Scope

- **Deploy**: NADA de deploy (ni hosting, ni functions, ni firestore). El change termina con commit + archive. El dueño decide el deploy por separado.
- **`firebase.json`, `firestore.rules`, `storage.rules`, `functions/`**: NO se tocan (0 líneas de diff — verificable).
- **Cambio de comportamiento**: cero. No se re-escribe lógica de negocio del wizard de crédito, ni los timers de Sistecredito (800/2000/3500ms), ni las reglas de validación. Move-only.
- **Refactor de `AdminAsesoresList`, `CompareModal`, `CreditModal`, `CreditFormModal`**: NO — solo `ProductCard.tsx` y sus dependencias directas.
- **Optimización de render** (React.memo, useMemo): explícitamente FUERA — el objetivo es mantenibilidad/testabilidad.
- **Test de servicios de stats, data de financieras**: ya cubiertos o fuera de scope (solo mocking en tests de componente).
- **Cambios de estilo visual**: el CSS se mueve SIN modificar selectores ni valores (puede quedar en un solo archivo `product-card.css` aunque hoy esté en un solo `<style>`).

## Approach

**Opción C — split completo por fases con gates** (recomendación de la exploración §7):

1. Fase 0 (code freeze del componente): utils puras extraídas VERBATIM + golden tests verdes. Gate: solo archivos NUEVOS en el diff.
2. Fase 1: rewiring de los 2 constructores + URL en el componente. Gate: golden tests verdes (byte-idénticos).
3. Fase 2: extracción presentacional por piezas independientes, cada una con su gate de lint+tests.
4. Fase 3: verificación total (lint 0/0, 28+N tests verdes, typecheck).
5. Fase 4: commit + archive (sin deploy).

Arquitectura del resultado: **container/presentational** — `ProductCard.tsx` queda como container orquestador del wizard (estado, handlers, footer del modal), y `src/components/product-card/` contiene los presentacionales puros (reciben props y callbacks; SIN estado de negocio, excepto `CreditForm`/`SistecreditoValidation` que encapsulan su propio submachine de formulario).

## Solution — Decisiones Clave

### D1. Goldens ANTES de tocar la implementación (regla dura del change)

Los tests de caracterización se escriben en Fase 0 contra `src/utils/whatsapp-messages.ts`, que es una extracción VERBATIM de los template literals actuales (`:113-115`, `:200-216`, `:184-198`, `:124`, `:219`). Los expected strings de los tests se copian del código actual y se marcan como "golden — no cambiar". Gate de Fase 1: si el rewiring rompe un golden, el cambio de implementación es el culpable (bisect trivial: el diff de Fase 0 es solo archivos nuevos).

### D2. Patrón container/presentational

`ProductCard.tsx` (container): estado del wizard (14 useState), handlers (`abrir/cerrar`, `handleSeleccionTipo`, `handleSelectFinanciera`, `handleEnviarWhatsApp` orquestador), footer del modal. `product-card/` (presentacionales): reciben props + callbacks y NO consultan contexts (los contexts se inyectan desde el container; `useCart`/`useWhatsappNumber` quedan SOLO en ProductCard.tsx). Excepciones con justificación: `CreditForm` + `SistecreditoValidation` encapsulan su submachine de estado (formData, autovalidación, timers) exponiendo callbacks de salida — si no, el container tendría que poseer 10 estados más.

### D3. Regla `react-refresh/only-export-components`

El lint actual (warn) limita los exports de archivos de componentes → los hooks (`useProductPricing`) y helpers NO se exportan desde archivos de componentes; cada pieza en su archivo (`useProductPricing.ts` separado de `ProductCardView.tsx`). Garantiza lint 0/0 sostenible.

### D4. Estilos movidos, no rediseñados

El bloque `<style>` (`:277-601`) migra a `src/components/product-card/product-card.css` importado desde `ProductCard.tsx`. Mismo selector, mismo valor, mismo scope efectivo (el `<style>` inline ya era global al montar). Cero cambio visual.

### D5. URL de WhatsApp centralizada

El patrón duplicado `https://wa.me/${phone}?text=${encodeURIComponent(msg)}` (`:124`, `:219`) se unifica en `buildWhatsAppUrl(phoneNumber, mensaje)` — mismo resultado byte a byte, eliminando la duplicación (exploración §3.2).

### D6. Sin deploy

El change termina en commit + archive. El dueño decide deploy aparte. Esto elimina el riesgo operativo de la fase de deploy del SDD estándar; los gates son SOLO lint + tests + typecheck.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/components/ProductCard.tsx` | **Modify** | De 1165 → ~350-400 líneas: container orquestador (estado wizard + handlers + shell modal + footer) |
| `src/utils/whatsapp-messages.ts` | **Create** | Constructores puros verbatim: `buildContadoWhatsAppMessage`, `buildCreditoWhatsAppMessage`, `buildWhatsAppUrl`, mapa `labels` (ex-lineLabel) |
| `src/utils/whatsapp-messages.test.ts` | **Create** | Golden tests byte-idénticos (Fase 0) |
| `src/utils/promo.ts` + `.test.ts` | **Create** | Lógica pura de ventana promocional + tests |
| `src/components/product-card/product-card.css` | **Create** | ~325 líneas movidas del `<style>` inline |
| `src/components/product-card/useProductPricing.ts` | **Create** | Hook con los derivados puros (precios, badges, show-bools) |
| `src/components/product-card/ProductCardView.tsx` | **Create** | Card presentacional (badges, imagen, título, precio, botón) |
| `src/components/product-card/ProductBadges.tsx` | **Create** | Contenedor de badges (nuevo/promo/HOT) |
| `src/components/product-card/PriceDisplay.tsx` | **Create** | Precio promo/regular con variante `'card' \| 'modal'` (matando duplicación §3.1) |
| `src/components/product-card/PlanCuotas.tsx` | **Create** | Cuota inicial + plan especial (12) vs estándar (16/8) |
| `src/components/product-card/FinancieraGrid.tsx` | **Create** | Grid de financieras con disponibilidad + logos |
| `src/components/product-card/CreditForm.tsx` | **Create** | Formulario por financiera + términos + hint sistecredito + autovalidación |
| `src/components/product-card/SistecreditoValidation.tsx` | **Create** | Wizard de pasos animados (timers) + resultado |
| `src/components/product-card/ProductCard.test.tsx` | **Create** | Smoke tests de componente (mocks de firebase, patrón existente) |
| `src/components/LandingPage.tsx`, `src/components/Catalogo.tsx` | **None** | Call sites intactos (contrato de props preservado) |
| `firebase.json`, `*.rules`, `functions/` | **None** | 0 líneas tocadas |
| `openspec/changes/refactor-product-card/` | **New** | Artefactos SDD de este change |

## Alternatives Considered

1. **Opción A — big-bang** (un solo paso, todo el refactor): diff gigante sin gates; si un golden falla post-refactor, el bisect del error es manual sobre >1000 líneas de diff. Riesgo alto de regresión silenciosa en el flujo del modal. Descartada.
2. **Opción B — solo utils puras** (WhatsApp testable, JSX intacto): riesgo mínimo pero NO resuelve el problema de mantenibilidad (el monstruo de 1165 líneas sigue); los presentacionales siguen sin testearse. Descartada como objetivo, ajustada como Fase 1 del plan (se obtiene su beneficio con el riesgo de toda la Opción C).
3. **Sin tests de componente (`ProductCard.test.tsx`)**: cubrir solo utils. Con el split presentacional, el smoke test de componente es barato (patrón de mock ya instalado) y protege el flujo del wizard (REQ-002). Se incluye con alcance acotado.

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Cambio accidental en mensajes WhatsApp (byte-diff) | Med | Golden tests Fase 0 ANTES de tocar el componente (D1); gate de Fase 1 = goldens verdes; extracción verbatim |
| Regresión en el flujo del modal (steps, autovalidación, timers) | Med | Move-only (D2); smoke tests de componente; gates por fase; footer y handlers quedan en el container |
| Warning nuevo de lint (`react-refresh/only-export-components`, no-unused-vars) | Med | D3: hooks/helpers en archivos separados; gate de lint 0/0 en CADA fase (hoy 0/0) |
| Tests que dependen de Firebase en el smoke test | Low | Patrón ya instalado (`vi.mock('firebase/firestore')` + `vi.mock('../firebase')`, ver `product.service.test.ts:1-15`) |
| Duplicación de comportamiento entre `PriceDisplay` (variantes) y el markup actual | Low | Move-only del markup; el diff de la fase 2 es inspeccionable selector por selector |
| Timers de Sistecredito en tests (800/2000/3500ms) | Med | `vi.useFakeTimers` en los tests del wizard; en la app NO se tocan los delays |
| El ambiente del orquestador reportó 1169 líneas pero el archivo tiene 1165 | Info | Verificado con `wc -l`; las referencias de líneas del plan usan los números REALES verificados |

## Rollback Plan

1. **Por fase**: cada fase es un commit separable (conventional commits). `git revert` del commit de fase revierte SOLO esa fase; los golden tests de Fase 0 son la red de seguridad (si Fase 2 rompe algo, Fase 1 sigue verde).
2. **Sin estado de datos**: refactor puro de front — no hay datos, reglas ni deploys que revertir.
3. **Cero riesgo de producción**: sin deploy en el change (D6); nada del refactor llega a producción hasta que el dueño lo decida.

## Dependencies

- Vitest 4 + Testing Library + jsdom ya instalados (`package.json` devDependencies).
- Patrón de mock de Firebase ya existente en `product.service.test.ts` / `WhatsappNumberContext.test.tsx` (reutilizable).
- `formatPrice` de `src/utils/formatters.ts` (probado en `formatters.test.ts`) — los mensajes dependen de su output; NO se toca.
- `FINANCIERAS`/`getFinancierasForProduct` de `src/data/financieras.ts` — NO se tocan.
- Contexts `cart-context` / `whatsapp-number-context` — NO se tocan; se consumen desde el container.
- Sin dependencias nuevas de terceros.

## Success Criteria

- [ ] `ProductCard.tsx` reducido a ~350-400 líneas (container orquestador)
- [ ] Golden tests de mensajes WhatsApp verdes en Fase 0, ANTES de cualquier edit al componente
- [ ] Mensajes WhatsApp byte-idénticos post-refactor (goldens verdes en Fase 1+)
- [ ] Flujo del modal funcional-idéntico (smoke tests + revisión move-only del diff)
- [ ] Lint 0/0 en TODAS las fases (sin warnings nuevos — hoy 0/0)
- [ ] `npm test` verde: 28 actuales + nuevos (goldens + promo + smoke) — sin fallos
- [ ] Typecheck `tsc --noEmit` sin errores (sin `vite build` — regla del orquestador)
- [ ] `LandingPage.tsx` y `Catalogo.tsx` sin cambios (contrato de props intacto)
- [ ] `firebase.json` / `*.rules` / `functions/` con 0 líneas de diff
- [ ] Sin deploy; cierre = commit + archive
- [ ] Estructura final = árbol del design.md (§File Changes)

## Implementation Plan (fases)

| Fase | Paso | Entregable | Gate |
|---|---|---|---|
| 0 | Golden tests + utils puras | `whatsapp-messages.ts/.test.ts`, `promo.ts/.test.ts` — SOLO archivos nuevos | Goldens verdes; lint 0/0; `git status` solo con archivos nuevos de utils + artifacts openspec; `ProductCard.tsx` SIN tocar |
| 1 | Rewiring WhatsApp | `ProductCard.tsx` consume builders (`:113-115`, `:184-225`) + `buildWhatsAppUrl` | Goldens verdes (byte-idénticos); suite completa verde; lint 0/0 |
| 2 | Sub-componentes presentacionales | `product-card/` (css, hook, 7 componentes) + `ProductCard.test.tsx` | Lint 0/0; suite verde; typecheck OK; diff move-only verificable |
| 3 | Limpieza + verificación total | Eliminar imports muertos, revisar duplicaciones | `npm test` 100% verde; `npm run lint` 0/0; `tsc --noEmit` OK; `git diff firebase.json *.rules` vacío |
| 4 | Cierre | Commits conventional + archive (spec → `openspec/specs/ui/spec.md`) | Todo lo anterior; trazabilidad REQ→tasks |

## Spec Deltas (requisitos preliminares — detalle completo en sdd-spec)

- **REQ-001** (MUST): mensajes WhatsApp byte-idénticos — contado y crédito, incluyendo URL `wa.me`, mapa de labels y formateo `formatPrice`.
- **REQ-002** (MUST): flujo del modal de crédito funcional-idéntico — pasos, financieras, autovalidación, wizard Sistecredito (timers y reglas).
- **REQ-003** (MUST): contrato de props de `ProductCard` intacto (call sites sin cambios).
- **REQ-004** (MUST): sin cambio de UI visible — precios, cuotas, badges y estilos idénticos.
- **REQ-005** (MUST): gates continuos — lint 0/0 y suite completa verde en cada fase.
- **REQ-006** (MUST): golden tests de caracterización en Fase 0, ANTES de editar la implementación.
- **REQ-007** (MUST): comportamiento de registro de vistas (`recordProductView`) preservado.
- **REQ-008** (MUST): sin deploy, sin cambios en `firebase.json`/rules/functions; cierre = commit + archive.