# Tasks: refactor-product-card

**Change**: `refactor-product-card`
**Fecha**: 2026-08-15
**Dependencias**: `proposal.md` (Opción C aprobada por el dueño) · `specs/ui/spec.md` (REQ-001..REQ-008) · `design.md` (D1..D8)
**Formato commits**: conventional commits en inglés (openspec/config.yaml)

**GATE GLOBAL**: NUNCA editar `src/components/ProductCard.tsx` hasta que la Fase 0 esté verde (golden tests corriendo sobre código puro extraído verbatim — REQ-006). Los mensajes WhatsApp son INNEGOCIABLES byte a byte (REQ-001): cualquier golden rojo post-rewiring = el rewiring es el culpable (bisect trivial por fases). Cero deploy en el change (REQ-008): el cierre es commit + archive. Orden estricto: **Fase 0 → Fase 1 → Fase 2 → Fase 3 → Fase 4**. Verificación por fase: `npm run lint` (0/0), `npm test`, `npx tsc --noEmit`. NO `vite build` (regla del orquestador).

---

## Fase 0 — Golden tests + utils puras (SIEMPRE ANTES de tocar el componente)

- [x] **0.1** Crear `src/utils/whatsapp-messages.ts` (extracción VERBATIM)
  - REQ: REQ-001 (base), REQ-006
  - Archivo: `src/utils/whatsapp-messages.ts` (NUEVO)
  - Done: exporta `buildContadoWhatsAppMessage` (template literals COPIADOS byte a byte de `ProductCard.tsx:113-115`: rama promo "comprar el ... (antes ...)" y rama no-promo "comprar al contado el ...", con `\n` y signos exactos), `buildCreditoWhatsAppMessage` (estructura de `:200-216`: header `🧾 *Solicitud de crédito - {financiera.nombre}*\n\n`, `📱 *Producto:*`, `💰 *Precio:*`, bloque Krediya con `💵 *Cuota inicial:*` si > 0 y 12 cuotas si `solo12Meses && cuotas12` o 16/8, `\n👤 *Datos del cliente:*\n`, `▸ {label}: {valor}\n` por campo con `Object.entries` preservando orden), `buildWhatsAppUrl` (`https://wa.me/{phone}?text=${encodeURIComponent(mensaje)}`), `CAMPO_LABELS` + `labelDeCampo(key)` (mapa EXACTO de `:184-198`: nombres→"Nombres y apellidos", cedula→"Cédula", fechaNacimiento→"Fecha y lugar de nacimiento", fechaExpedicion→"Fecha y lugar de expedición", celular→"Celular", email→"Correo electrónico", compradoAntes→"¿Ha comprado antes?", reportesNegativos→"¿Reportes negativos?", cupo→"Cupo disponible", primeraCompra→"Primera compra"; fallback = key cruda). Contrato de tipos según design.md Interfaces/Contracts.
  - Estimación: M
  - Dependencias: ninguna

- [x] **0.2** Crear `src/utils/whatsapp-messages.test.ts` (golden tests)
  - REQ: REQ-001, REQ-006
  - Archivo: `src/utils/whatsapp-messages.test.ts` (NUEVO)
  - Done: expected strings COPIADOS literalmente del comportamiento actual (reverificados contra `ProductCard.tsx` en el momento de escribirlos) y marcados como golden (comentario "golden — byte-identidad REQ-001, no cambiar"). Casos: (1) contado con promo (promoStr/regularStr dados); (2) contado sin promo; (3) crédito genérico (financiera no-Krediya, 2 campos, orden de inserción); (4) crédito Krediya con solo12Meses+cuotas12 y cuotaInicial>0 (con líneas de cuota inicial y 12 cuotas, SIN 16/8); (5) crédito Krediya con cuotaInicial=0 sin plan especial (SIN línea cuota inicial, CON 16 y 8); (6) label desconocida → key cruda; (7) `buildWhatsAppUrl` con encodeURIComponent byte-exacto. Usar strings de ejemplo representativos (nombres/prices es-CO sin depender de firebase).
  - Estimación: M
  - Dependencias: 0.1

- [x] **0.3** Crear `src/utils/promo.ts` + `promo.test.ts` (lógica pura de ventana promocional)
  - REQ: REQ-001 (gate `showPromoPrice`), REQ-006
  - Archivo: `src/utils/promo.ts` + `src/utils/promo.test.ts` (NUEVOS)
  - Done: puras move-only de `ProductCard.tsx:80-103`: `getMillis(ts)` (number / string parseable / objeto con `toMillis` / `+new Date` / null si no finito — comportamiento EXACTO de `:80-88`), `esVentanaPromo(promoStart, promoEnd, nowMs)` (semántica de `inWindow` `:90-93`), `hasValidPromoPrice(promoPrice, contado)` (misma semántica de `countedPromoPrice/countedContado` `:95-97`). Tests: ts nulo/number/string/Timestamp-like/inválido; boundaries de la ventana (sin start/sin end/start futuro/end pasado); precios NaN/0/negativo/promo>=contado.
  - Estimación: M
  - Dependencias: ninguna (puede paralelizarse con 0.1)

- [x] **0.4** GATE de Fase 0: goldens verdes sobre código viejo INTACTO
  - REQ: REQ-006, REQ-005
  - Archivo: ninguno (verificación)
  - Done: `npm test` → nuevos tests verdes 100% + 28 existentes verdes; `npm run lint` → 0/0; `git status` → SOLO `src/utils/whatsapp-messages.ts`, `whatsapp-messages.test.ts`, `promo.ts`, `promo.test.ts` + artifacts openspec; `git diff src/components/ProductCard.tsx` VACÍO (el componente NO se tocó). Si el diff muestra ProductCard.tsx → PARAR (REQ-006 violada).
  - Estimación: S
  - Dependencias: 0.2, 0.3

## Fase 1 — Rewiring de WhatsApp en ProductCard.tsx (primer edit permitido)

- [x] **1.1** Reemplazar contado directo por la util pura
  - REQ: REQ-001
  - Archivo: `src/components/ProductCard.tsx` (`:113-115`, `:124`)
  - Done: el template literal inline `mensajeWhatsAppContadoDirecto` se reemplaza por `buildContadoWhatsAppMessage({ nombre, showPromoPrice, pricePromoStr, priceRegularStr })` y `window.open(buildWhatsAppUrl(phoneNumber, mensaje), '_blank')` en `handleSeleccionTipo` (`:124`). Los strings de entrada usan los mismos `priceRegularStr/pricePromoStr` ya derivados (sin re-formatear).
  - Estimación: S
  - Dependencias: 0.4 (gate)

- [x] **1.2** Reemplazar solicitud de crédito por la util pura
  - REQ: REQ-001
  - Archivo: `src/components/ProductCard.tsx` (`:180-225`)
  - Done: `handleEnviarWhatsApp` construye el mensaje con `buildCreditoWhatsAppMessage` (financiera, precioStr = promo o regular, cuotaInicialStr/cuotasStr ya formateados o formateados una vez con `formatPrice` según la decisión de diseño), mantiene el `if (phoneNumber) window.open(buildWhatsAppUrl(...))`, el `addToCart(producto, 'credito')` si `paymentAction === 'carrito'` y `cerrar()`. Se ELIMINA el mapa inline `lineLabel` (ahora `labelDeCampo` de la util). NO cambiar ningún otro comportamiento del handler.
  - Estimación: S
  - Dependencias: 1.1

- [x] **1.3** GATE de Fase 1: byte-identidad probada
  - REQ: REQ-001, REQ-005
  - Archivo: ninguno (verificación)
  - Done: `npm test` → golden tests de 0.2 VERDES (byte-idénticos) + suite completa verde; `npm run lint` → 0/0 (sin unused imports); `npx tsc --noEmit` OK. Si un golden falla → REVERTIR 1.1/1.2 y revisar (REQ-001 rota).
  - Estimación: S
  - Dependencias: 1.2

## Fase 2 — Sub-componentes presentacionales + css + hook

- [x] **2.1** Migrar el bloque `<style>` a `product-card.css`
  - REQ: REQ-004
  - Archivo: `src/components/product-card/product-card.css` (NUEVO) + `ProductCard.tsx`
  - Done: todo el contenido de `:277-601` (selectores, valores, keyframes, media query) copiado SIN modificar; `<style>` eliminado del JSX; CSS importado desde `ProductCard.tsx`. Verificar con diff que selectores/valores quedan idénticos al bloque original (move-only).
  - Estimación: S
  - Dependencias: 1.3 (gate)

- [x] **2.2** Crear `src/utils/promo.ts`-consuming hook `useProductPricing`
  - REQ: REQ-004 (derivados idénticos)
  - Archivo: `src/components/product-card/useProductPricing.ts` (NUEVO) + `ProductCard.tsx`
  - Done: hook puro (sin JSX ni contexts) que centraliza `:55-117`: destructuring de producto con defaults (`nombre = "Producto sin nombre"` etc.), `getMillis/esVentanaPromo/hasValidPromoPrice` de `utils/promo`, `formatPrice` de formatters, `getFinancierasForProduct`, badge modes (`badgeMode || 'promo'`), `badgeBg/highlightColor` con los fallbacks de variables CSS EXACTOS. Retorna `DerivadosPricing` (design.md Interfaces). `ProductCard.tsx` consume el hook y elimina el bloque inline.
  - Estimación: M
  - Dependencias: 2.1

- [x] **2.3** Crear presentacionales del card: `ProductBadges`, `PriceDisplay`, `ProductCardView`
  - REQ: REQ-003, REQ-004
  - Archivo: `src/components/product-card/ProductBadges.tsx`, `PriceDisplay.tsx`, `ProductCardView.tsx` (NUEVOS) + `ProductCard.tsx`
  - Done: `ProductBadges` = markup move-only de `:619-657` (wrappers con visibility, nuevo `#28a745`, promo, HOT `#ff6b35`, aria-hidden). `PriceDisplay` con `variant: 'card' | 'modal'` = markup move-only de `:674-685` (card: del + rojo / azul) y `:726-733` (modal: textos + span rojo + badge promo opcional). `ProductCardView` = presentacional del Card completo `:603-714` (clases `product-card`, `product-card-img/title/price`, click → `onVerDetalles` con `stopPropagation` en el botón, imagen con placeholder exacto). `ProductCard.tsx` compone `ProductCardView` y queda sin el JSX del card.
  - Estimación: M
  - Dependencias: 2.2

- [x] **2.4** Crear `PlanCuotas` y `FinancieraGrid`
  - REQ: REQ-002, REQ-004
  - Archivo: `src/components/product-card/PlanCuotas.tsx`, `FinancieraGrid.tsx` (NUEVOS) + `ProductCard.tsx`
  - Done: `PlanCuotas` = markup move-only de `:735-755` (cuota inicial si > 0, `plan-special-box` con Badge PLAN ESPECIAL y 12 cuotas, o `plan-standard-box` con 16 quincenales + 8 mensuales; clase `plan-special-box`/`plan-standard-box` con estilos de variables ya en css). `FinancieraGrid` = markup move-only de `:759-788` (FINANCIERAS.map con `financiera-card` + disabled + "No disponible para este producto", logos, badge autovalidación/asesor, `onClick` → `onSelect(f)` si disponible). `ProductCard.tsx` los compone en el body del modal.
  - Estimación: M
  - Dependencias: 2.3

- [x] **2.5** Crear submachine `CreditForm` (formulario + autovalidación + términos)
  - REQ: REQ-002
  - Archivo: `src/components/product-card/CreditForm.tsx` (NUEVO) + `ProductCard.tsx`
  - Done: encapsula el estado del formulario (`formData`, `linkOpened`, `autovalidacionStatus`, `aceptaTerminos`, `nombreCompletoInvalido` con la regla de 2 palabras SOLO para sistecredito) y el markup move-only de `:790-939`: header con logo/nombre de la financiera, pasos de autovalidación (abrir `urlAutovalidacion` con `window.open` en otra pestaña, botones Aprobado/Denegado, volver a abrir), campos (radio con options / input, hint sistecredito "Ingresá tu nombre y apellido completo"/"Ej: Juan Pérez"), términos y condiciones (checkbox + link `/terminos`). Recibe `{ financiera, onValidSubmit }`; expone `isFormValid()` internamente. Validación del botón de Sistecredito: el container decide mostrar según `selectedFinanciera.id === 'sistecredito'`. Estado de reset: decision de diseño 2.5b (remount `key` vs `onReset`) — el RESULTADO observable es reset total al cerrar (smoke test).
  - Estimación: M
  - Dependencias: 2.4

- [x] **2.6** Crear `SistecreditoValidation` (wizard de pasos + timers, move-only)
  - REQ: REQ-002
  - Archivo: `src/components/product-card/SistecreditoValidation.tsx` (NUEVO) + `ProductCard.tsx`
  - Done: encapsula `:227-273` (timers 800/2000/3500ms + 2000ms auto-envío, parseo de cupo `[^0-9]`, advertencia si `contado > cupo` con mensaje es-CO EXACTO, regla `primeraCompra === 'Sí'` → no-aplica) y el markup `:941-1025` (botón Validar con `isFormValid`, pasos progressivos, advertencia, resultado aplica/no-aplica con textos exactos "¡Aplicas para Sistecredito!"/"Cupo denegado"/"Te redirigimos a WhatsApp..."). Recibe `{ cupoInput, contado, formData, esFormValido, onValidSubmit }`. Los delays NO se tocan (move-only).
  - Estimación: M
  - Dependencias: 2.5

- [x] **2.7** Crear `ProductCard.test.tsx` (smoke tests de componente)
  - REQ: REQ-002, REQ-003, REQ-004, REQ-007
  - Archivo: `src/components/product-card/ProductCard.test.tsx` (NUEVO)
  - Done: 9 tests verdes — (1) render card título/precio (regular y promo con `<del>`); (2) modal step product con precios/plan/PROMO+; (3) contado CON promo y SIN promo: `window.open` spy → URL `wa.me/573223652569?text=` y mensaje decodificado (`Precio promocional: ... (antes ...)` / `Precio: ...`); (4) grid con PayJoy/Krediya disabled para iphone (sin `Primero valida tu crédito:` al clickearlas, Esmiopcion SÍ abre autovalidación); (5) `cerrar()` resetea (reapertura en step product, form vacío); (6) `recordProductView('prod-1')` al montar; (7) wizard Sistecredito con `vi.useFakeTimers` (800/1200/1500/2000ms) → pasos, advertencia de cupo, auto-envío con mensaje `🧾 *Solicitud de crédito - Sistecredito*`. Mocks: `vi.mock('firebase/firestore')` + `vi.mock('../../firebase')` (OJO: ruta correcta desde `product-card/` es `../../firebase`, no `../firebase` — el path del tasks.md era relativo a `src/contexts/`) + `vi.mock('../../services/productStats.service')` + providers Cart/WhatsappNumber. **Surprise**: `Intl` es-CO COP usa NNBSP U+202F entre `$` y el número — `\s` de JS no lo colapsa → `getByText(formatPrice(...))` falla; helper `normalizarTexto()` con `normalize('NFKC')` + collapse en el matcher. `waitFor` cuelga bajo fake timers → asserts directos post-`advanceTimersByTime`.
  - Estimación: M
  - Dependencias: 2.6

- [x] **2.8** GATE de Fase 2: extracción completa verificable
  - REQ: REQ-002, REQ-004, REQ-005
  - Archivo: ninguno (verificación)
  - Done: `npm test` → **72 tests / 7 archivos** ALL GREEN (baseline 63 + 9 smoke); `npm run lint` → 0/0 sin warnings; `npx tsc --noEmit` → 0 errores; CSS move-only verificado byte-por-byte contra `git show a189fe5` (6882 chars idénticos, diff chars 0 — método: des-indent mínimo 8 del body del `<style>` original vs `product-card.css`); `git diff LandingPage.tsx Catalogo.tsx` → 0 líneas; `ProductCard.tsx` = 332 líneas de container (orquestación pura: estado del modal, espejos del wizard, handlers, footer) — sin pricing/badges/grid/form (todo en `product-card/`).
  - Estimación: S
  - Dependencias: 2.7

## Fase 3 — Limpieza + verificación completa

- [x] **3.1** Limpiar imports muertos y código residual
  - REQ: REQ-005
  - Archivo: `src/components/ProductCard.tsx`, `src/components/product-card/*`
  - Done: sin imports sin uso (lint 0/0 lo garantiza — revisar explícito), sin blocks comentados, sin código duplicado remanente (grep de `wa.me`, `formatPrice(` inline en handlers, `mensajeWhatsAppContadoDirecto` fuera de utils...). El container mantiene SOLO lo del design D2/D8.
  - Estimación: S
  - Dependencias: 2.8 (gate)

- [x] **3.2** Verificación total post-limpieza
  - REQ: REQ-001, REQ-002, REQ-005, REQ-008
  - Comandos (raíz): `npm test` · `npm run lint` · `npx tsc --noEmit`
  - Done: suite 100% verde (28 + todos los nuevos); lint 0 errores 0 warnings; typecheck sin errores; `git diff HEAD -- firebase.json firestore.rules storage.rules functions/` VACÍO; `git diff src/components/LandingPage.tsx src/components/Catalogo.tsx` VACÍO (REQ-003). NO `vite build` (regla del orquestador).
  - Estimación: S
  - Dependencias: 3.1

## Fase 4 — Commits + archive (SIN deploy — REQ-008)

- [x] **4.1** Commit por fase (historia limpia)
  - REQ: REQ-005 (trazabilidad)
  - Comando (raíz): commits conventional en inglés por etapa — p. ej. `test(utils): add golden tests for whatsapp messages` (F1: utils+goldens), `refactor(product-card): use pure whatsapp message builders` (rewiring), `refactor(product-card): split presentational components and styles`, `test(product-card): add component smoke tests`. La historia debe permitir revertir fase por fase (rollback del design).
  - Done: 3-4 commits con la FUENTE de cada fase; ninguno mezcla fases.
  - Estimación: S
  - Dependencias: 3.2 (gate)

- [x] **4.2** Archive del change (sdd-archive)
  - REQ: REQ-008
  - Pasos: (1) sincronizar el spec a main specs (`openspec/specs/ui/spec.md`, primer spec del dominio `ui`); (2) mover `openspec/changes/refactor-product-card/` a `openspec/changes/archive/2026-08-15-refactor-product-card/`; (3) actualizar `state.yaml` a ARCHIVED con notas y evidencia (tests verdes, byte-identidad confirmada).
  - Done: carpeta archivada con prefijo ISO 2026-08-15; spec del dominio ui sincronizada; estado documentado. SIN push (lo realiza el orquestador si corresponde). SIN deploy — el dueño decide deploy por separado (REQ-008).
  - Estimación: S
  - Dependencias: 4.1

---

## Resumen de trazabilidad

| REQ | Tareas | Verificación |
|-----|--------|--------------|
| REQ-001 (mensajes WhatsApp byte-idénticos) | 0.1, 0.2, 1.1, 1.2, 1.3, 3.2 | Golden tests con expected strings copiados del código viejo; gates 0.4/1.3/3.2 verdes |
| REQ-002 (modal de crédito funcional-idéntico) | 2.4, 2.5, 2.6, 2.7, 2.8, 3.2 | Smoke tests: pasos, financieras disabled, reset de cerrar, timers con fake timers; move-only en diff |
| REQ-003 (contrato de props intacto) | 2.3, 2.7, 3.2 | Smoke test render; `git diff` de LandingPage/Catalogo VACÍO |
| REQ-004 (sin cambio de UI visible) | 2.1, 2.2, 2.3, 2.4, 2.8 | CSS move-only (diff vs `<style>` original); markup copiado no reescrito |
| REQ-005 (gates continuos lint/tests/typecheck) | 0.4, 1.3, 2.8, 3.1, 3.2, 4.1 | lint 0/0 + suite verde + `tsc --noEmit` en CADA gate de fase |
| REQ-006 (goldens ANTES de tocar implementación) | 0.1, 0.2, 0.3, 0.4, 1.1 | Gate 0.4: `git diff ProductCard.tsx` VACÍO; primer edit recién en Fase 1 |
| REQ-007 (registro de vistas preservado) | 2.7, 3.2 | Smoke test: `recordProductView(id)` al montar; service intacto |
| REQ-008 (sin deploy, cero infra) | 3.2, 4.1, 4.2 | `git diff firebase.json *.rules functions/` VACÍO; archive sin deploy |

Estimaciones: Fase 0 M (utils + 2 suites nuevas), Fase 1 S (rewiring acotado), Fase 2 M (7 archivos nuevos + smoke tests), Fase 3 S, Fase 4 S. Total: ~18 tareas / 21 checkbox en 5 fases. Orden de ejecución estricto: Fase 0 → 1 → 2 → 3 → 4 (el primer edit a ProductCard.tsx NUNCA antes del gate 0.4; el archive NUNCA antes de 3.2).