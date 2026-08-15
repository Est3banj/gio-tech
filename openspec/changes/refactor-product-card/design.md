# Design: refactor-product-card

**Change**: `refactor-product-card`
**Fecha**: 2026-08-15
**Dependencias**: `proposal.md` (Opción C aprobada por el dueño: split por fases con gates) · `exploration.md` (inventario de 12 secciones con líneas verificadas) · `specs/ui/spec.md` (REQ-001..REQ-008)

---

## Technical Approach

Se parte `src/components/ProductCard.tsx` (1165 líneas reales — verificado con `wc -l`; el orquestador reportó 1169) siguiendo el patrón **container/presentational**: `ProductCard.tsx` queda como container orquestador del wizard (estado, handlers, shell del modal y footer), y `src/components/product-card/` recibe los presentacionales puros (props + callbacks, sin contexts — `useCart`/`useWhatsappNumber` se inyectan desde el container), junto con el hook de derivados (`useProductPricing`) y el CSS externo (`product-card.css`). Los 2 constructores de mensajes WhatsApp y la lógica de ventana promocional se extraen como helpers PUROS a `src/utils/` (`whatsapp-messages.ts`, `promo.ts`) ANTES de tocar el componente, con tests golden que congelan los bytes actuales (REQ-001, REQ-006).

Ejecución por fases con gates duros (lint 0/0 + suite verde + `tsc --noEmit`) — Fase 0 es code-freeze del componente: SOLO archivos nuevos. Cero deploy, cero infra (REQ-008).

---

## Architecture Decisions

### D1. Golden tests (caracterización) antes del primer edit al componente

**Choice**: Fase 0 crea `src/utils/whatsapp-messages.ts` como extracción VERBATIM de los template literals de `ProductCard.tsx:113-115` (contado), `:200-216` + `:184-198` (crédito y labels) y el patrón de URL `:124/:219`, con `whatsapp-messages.test.ts` cuyos expected strings se copian EXACTOS y se congelan.

**Alternatives considered**: (a) testear el componente directo renderizando `ProductCard` y capturando `window.open` — requeriría mockear firebase + contexts + bootstrap-modal + timers antes de tener util pura (test frágil, sin granularidad); (b) escribir los tests "después" del refactor — viola la regla del dueño (capturar el comportamiento ANTES).
**Rationale**: la util extraída verbatim ES el comportamiento actual movido de lugar, no reescrito: los goldens corren sobre el código viejo (move-only) en Fase 0 y quedan como red de seguridad de las Fases 1-2. Cualquier byte que cambie en el rewiring rompe un golden con bisect trivial (el diff de Fase 0 es solo archivos nuevos). Es la única forma de garantizar REQ-001 mecánicamente.

### D2. Container/presentational con excepción justificada: submachine de crédito

**Choice**: `ProductCard.tsx` (container) conserva: estado del wizard (`step`, `paymentAction`, `mostrar`), handlers (`abrir/cerrar`, `handleSeleccionTipo`, `handleSelectFinanciera`, `handleEnviarWhatsApp` como orquestador), efecto de vistas y el FOOTER del modal (botones por step — son wiring con rutas de estado). Los presentacionales en `product-card/` reciben props y callbacks.

**Excepción**: `CreditForm` encapsula su propio submachine (`formData`, `linkOpened`, `autovalidacionStatus`, `aceptaTerminos`, `nombreCompletoInvalido`) y `SistecreditoValidation` encapsula el wizard (timers, validPhase/step). Si se mantuviera TODO en el container, este tendría 14+ estados y ~400 líneas de handlers — no resuelve nada. El container les pasa: financiera seleccionada, producto (precios/promos derivados), callbacks de salida (`onValidSubmit(financiera, formData)` para que el container construya el mensaje con la util pura y haga `window.open`/`addToCart`/`cerrar`). El mensaje de crédito NO se construye en el submachine: vive en `whatsapp-messages.ts` (testeable) y el container lo orquesta.
**Rationale**: los contexts (`useCart`, `useWhatsappNumber`) quedan SOLO en el container (REQ-002/003 preservados); los submachines son testeables por separado; los delays de Sistecredito (800/2000/3500ms) y sus reglas no se tocan (move-only).

### D3. Hooks y helpers en archivos separados de los componentes (regla de lint)

**Choice**: `useProductPricing.ts` (hook con derivados puros: `showPromoPrice`, `showPromoBadge`, `showNuevoBadge`, `priceRegularStr`, `pricePromoStr`, `badgeBg`, `highlightColor`, `cuotaInicial`, `financierasDisponibles` — todo lo de `:55-117` menos los strings WhatsApp) en archivo propio; los helpers puros de promo (`getMillis`, `inWindow`, `hasPromoPrice`) en `src/utils/promo.ts`.

**Rationale**: la regla `react-refresh/only-export-components` del eslint config (warn) penaliza archivos de componentes que exportan no-componentes. Si el hook viviera en un `.tsx` de componentes, sumaría un warning → rompe el gate lint 0/0 (REQ-005, hoy 0/0). Separación de archivos = lint limpio sostenible + reutilización de `promo.ts` futura.

### D4. Estilos: bloque `<style>` → `product-card.css` (move-only)

**Choice**: eliminar el `<style>` inline (`:277-601`, ~325 líneas — 28% del archivo) y crear `src/components/product-card/product-card.css` importado desde `ProductCard.tsx`.

**Alternatives considered**: CSS modules (cambia selectores a `_xxx` → riesgo visual, más scope); inyectar el `<style>` desde otro módulo (mantiene el anti-patrón del style-tag).
**Rationale**: el `<style>` inline ya es global al montar (los selectores son globales: `.financiera-card`, `.gio-badge`, etc.) — un archivo CSS importado tiene el MISMO scope efectivo con cero cambio de selectores/valores (REQ-004). Move-only verificable por diff.

### D5. `PriceDisplay` con variante (mata la duplicación del ternary promo)

**Choice**: `PriceDisplay` con prop `variant: 'card' | 'modal'` reproduce exactamente los dos markups actuales (card: `del` + precio rojo; modal: textos "Precio regular/Precio promocional" + span rojo + badge opcional), recibiendo `priceRegularStr`, `pricePromoStr`, `promoBadgeText`, `promoBadgeBg`, `badgeBg` ya resueltos por `useProductPricing`.

**Rationale**: hoy la decisión `showPromoPrice` se materializa dos veces (`:674-685` y `:726-733`) con markup distinto pero misma semántica (exploración §3.1). Una variante evita la tercer duplicación, mantiene los DOMs byte-iguales a los actuales y deja un solo lugar para el branch. El container sigue recibiendo los strings puros del hook.

### D6. `ProductCardView` como presentacional del card cerrado

**Choice**: el `Card` (`:603-714`) migra a `ProductCardView.tsx` como presentacional puro: recibe `producto` para imagen/título, derivados del hook, `isPopular`, `onVerDetalles` (card click y botón), y compone `ProductBadges` + `PriceDisplay` internamente.

**Rationale**: el card es 100% derivado del producto (sin estado); extraerlo deja el container con SOLO el modal + wizard. `ProductBadges` (nuevo/promo/HOT con `visibility` y `aria-hidden` actuales) separado para testear el badge-mode (`'promo'|'nuevo'|'ambos'|'none'`) sin renderizar el card completo.

### D7. `FinancieraGrid` y `PlanCuotas` — presentacionales sin estado

**Choice**: `FinancieraGrid` (grid `:759-788`, recibe `financierasDisponibles` + `onSelect`) y `PlanCuotas` (cuota inicial + plan especial/estándar `:735-755`, recibe strings formateados y flags) como componentes puros.

**Rationale**: ambos son pura proyección de datos — cero estado, cero contexts. Los logos (REQ spec: "muestran logos de financieras") fluyen desde `FINANCIERAS` (data) que el container entrega vía `getFinancierasForProduct`.

### D8. Footer del modal queda en el container (wiring de estado)

**Choice**: el bloque `:1029-1157` (botones por step) NO se extrae como componente: es dispatcher de `setStep`/`setPaymentAction`/`cerrar`/`handleEnviarWhatsApp`/`handleSistecreditoValidar` entre los pasos.

**Rationale**: extraer un footer "presentacional" con 6 callbacks distintos no reduce complejidad — traslada el wiring. El container con el footer pesa ~350-400 líneas finales, objetivo cumplido. (Alternativa futura si crece: `StepFooter` con `onAction` tipado — anotada, no bloquea.)

---

## Data Flow

```
[LandingPage/Catalogo] ──► <ProductCard producto isPopular>        (call sites INTACTOS, REQ-003)
                                  │
                    ProductCard.tsx (CONTAINER: wizard + handlers)
                    │  ├─ useProductPricing(producto) ──► derivados (precios/badges/cuotas)
                    │  ├─ useCart / useWhatsappNumber (SÓLO acá)
                    │  ├─ recordProductView (efecto)
                    │  ├─ ProductCardView (card: badges+imagen+título+precio+botón)
                    │  ├─ Modal (shell reutilizado de react-bootstrap)
                    │  │   ├─ PriceDisplay(variant='modal') + PlanCuotas   [step product/payment]
                    │  │   ├─ FinancieraGrid(onSelect)                     [step credito-financieras]
                    │  │   └─ CreditForm(onValidSubmit)                    [step credito-form]
                    │  │       └─ SistecreditoValidation (timers propios)
                    │  └─ Footer por step (botones: setStep/paymentAction/cerrar)
                    │
        Mensajes:  handleSeleccionTipo/handleEnviarWhatsApp
                    └─► buildContadoWhatsAppMessage | buildCreditoWhatsAppMessage
                    └─► buildWhatsAppUrl(phone, mensaje) ──► window.open(wa.me)
                          (utils PURAS, golden-testeadas, REQ-001/006)
```

## File Changes

| File | Acción | Descripción |
|------|--------|-------------|
| `src/utils/whatsapp-messages.ts` | **Create** | Constructores puros verbatim: `buildContadoWhatsAppMessage({ nombre, pricePromoStr, priceRegularStr, showPromoPrice })`, `buildCreditoWhatsAppMessage({ financiera, nombre, precioStr, cuotaInicialStr?, solo12Meses, cuotas12Str?, cuotas6Str?, cuotas8Str?, formData })`, `buildWhatsAppUrl(phone, mensaje)`, export `LABELS` (mapa ex-lineLabel) + `lineLabel(key)` |
| `src/utils/whatsapp-messages.test.ts` | **Create** | Golden tests (Fase 0): escenarios REQ-001 (contado promo/no, crédito genérico, Krediya 12, Krediya 16/8 con cuotaInicial 0, labels crudas, URL encode) |
| `src/utils/promo.ts` | **Create** | Puras: `getMillis(ts)`, `isPromoWindow(promoStart, promoEnd, nowMs)`, `hasValidPromoPrice(promoPrice, contado)`, tipos de BadgeMode derivados |
| `src/utils/promo.test.ts` | **Create** | Tests de la ventana promocional (boundaries: sin fechas, con servicios Timestamp `.toMillis()`, string/number, precios inválidos) |
| `src/components/product-card/product-card.css` | **Create** | ~325 líneas movidas del `<style>` inline (selectores/valores intactos, REQ-004) |
| `src/components/product-card/useProductPricing.ts` | **Create** | Hook: recibe `producto` + `nowMs`, devuelve showPromoPrice/showPromoBadge/showNuevoBadge, priceRegularStr/PricePromoStr, badgeBg/highlightColor, cuotaInicial, badges modes (usa `utils/promo.ts`) |
| `src/components/product-card/ProductCardView.tsx` | **Create** | Card presentacional (D6): `{ producto, isPopular, der: DerivadosPricing, onVerDetalles }` |
| `src/components/product-card/ProductBadges.tsx` | **Create** | Badges nuevo/promo/HOT con el markup de `:619-657` (aria-hidden/visibility incluidas) |
| `src/components/product-card/PriceDisplay.tsx` | **Create** | Variante `'card' \| 'modal'` (D5), markup move-only de `:674-685` / `:726-733` |
| `src/components/product-card/PlanCuotas.tsx` | **Create** | Cuota inicial + plan especial/estándar, markup de `:735-755` |
| `src/components/product-card/FinancieraGrid.tsx` | **Create** | Grid de `:759-788` (FINANCIERAS map, disabled + "No disponible para este producto") |
| `src/components/product-card/CreditForm.tsx` | **Create** | Submachine de crédito: autovalidación (`:798-870`), campos (`:873-919`), términos (`:921-938`), hint sistecredito; recibe `{ financiera, onValidSubmit }` (el mensaje se construye en el container vía util) |
| `src/components/product-card/SistecreditoValidation.tsx` | **Create** | Wizard de pasos + timers (move-only de `:227-273` + `:941-1025`): `{ validForm, cupoInput, contado, onValidSubmit }` — uso de `vi.useFakeTimers` en tests |
| `src/components/product-card/ProductCard.test.tsx` | **Create** | Smoke tests: renderiza card, abre modal, steps, financieras disabled, window.open mockeado (patrón `vi.mock('firebase/firestore')` + `vi.mock('../firebase')` de `product.service.test.ts:1-15`) |
| `src/components/ProductCard.tsx` | **Modify** | De 1165 → ~350-400 líneas: imports, estado wizard reducido, handlers orquestadores, shell modal + footer (D2/D8) |
| `src/components/LandingPage.tsx`, `Catalogo.tsx` | None | Call sites intactos (REQ-003) |
| `firebase.json`, `*.rules`, `functions/` | None | 0 líneas (REQ-008) |

## Interfaces / Contracts

### Utils puras (Fase 0, contrato de tipos)

```ts
// src/utils/whatsapp-messages.ts
export interface ContadoMsgInput {
  nombre: string;
  showPromoPrice: boolean;
  pricePromoStr: string;
  priceRegularStr: string;
}
export function buildContadoWhatsAppMessage(input: ContadoMsgInput): string;

export interface CreditoMsgInput {
  financiera: Pick<Financiera, 'id' | 'nombre'>;
  nombre: string;
  precioStr: string;            // showPromoPrice ? pricePromoStr : priceRegularStr (resuelto por el caller)
  cuotaInicialStr: string;      // formatPrice(cuotaInicial) — '' si cuotaInicial <= 0
  solo12Meses: boolean;
  cuotas12Str: string;          // formatPrice(cuotas12) — '' si no aplica (solo12Meses && cuotas12 inicial)
  cuotas6Str: string;           // formatPrice(cuotas6)
  cuotas8Str: string;           // formatPrice(cuotas8)
  formData: Record<string, string>; // orden de inserción preservado (Object.entries)
}
export function buildCreditoWhatsAppMessage(input: CreditoMsgInput): string;
export function buildWhatsAppUrl(phoneNumber: string, mensaje: string): string; // wa.me + encodeURIComponent
export const CAMPO_LABELS: Record<string, string>; // exlineLabel map (10 entradas)
export function labelDeCampo(key: string): string; // map[key] ?? key

// src/utils/promo.ts
export function getMillis(ts: unknown): number | null;
export function esVentanaPromo(promoStart: unknown, promoEnd: unknown, nowMs: number): boolean;
export function hasValidPromoPrice(promoPrice: unknown, contado: unknown): boolean;
```

⚠️ Los parámetros deben pasar los strings YA formateados (el caller usa `formatPrice`) — la util depende de `formatPrice` (output exacto, probado en `formatters.test.ts`) pero NO lo importa salvo donde sea necesario para byte-identidad; el diseño evalúa en Fase 0 si `buildCreditoWhatsAppMessage` recibe strings (recomendado) o formatea internamente.

### Contrato de sub-componentes

```ts
// useProductPricing.ts
interface DerivadosPricing {
  showPromoPrice: boolean; showPromoBadge: boolean; showNuevoBadge: boolean;
  priceRegularStr: string; pricePromoStr: string;
  badgeBg: string; highlightColor: string;
  cuotaInicialStr: string; cuotaInicial: number;
  solo12Meses: boolean; cuotas12Str: string; cuotas6Str: string; cuotas8Str: string;
  financierasDisponibles: Financiera[]; // vía getFinancierasForProduct (move-only)
}

// product-card/ProductCardView.tsx
interface Props { producto: Product; isPopular: boolean; der: DerivadosPricing; onVerDetalles: () => void; }

// product-card/PriceDisplay.tsx
interface Props { variant: 'card' | 'modal'; der: DerivadosPricing; }

// product-card/FinancieraGrid.tsx
interface Props { financierasDisponibles: Financiera[]; onSelect: (f: Financiera) => void; }

// product-card/CreditForm.tsx
interface Props {
  financiera: Financiera;
  onValidSubmit: (formData: Record<string, string>) => void; // container construye mensaje + window.open + addToCart + cerrar
}

// product-card/SistecreditoValidation.tsx
interface Props {
  cupoInput: string; contado: number; formData: Record<string, string>;
  esFormValido: boolean; onValidSubmit: () => void; // dispara el auto-envío (timers internos move-only)
}
```

## Testing Strategy

| Capa | Qué | Cómo |
|------|-----|------|
| Golden (Fase 0) | Mensajes WhatsApp byte-idénticos (REQ-001) | `whatsapp-messages.test.ts`: expected strings COPIADOS de `ProductCard.tsx:113-115,184-216` y congelados; casos: contado promo/no-promo, crédito genérico, Krediya 12 cuotas, Krediya 16/8 con cuotaInicial 0/ausente, label desconocida cruda, URL con `encodeURIComponent` |
| Unit puro (Fase 0) | Ventana promocional (REQ-001 gate: `showPromoPrice`) | `promo.test.ts`: `getMillis` (number, string, object `toMillis`, inválido), boundaries `inWindow` (start pasado/end futuro), `hasValidPromoPrice` (NaN, 0, negativo, promo>contado) |
| Smoke componente (Fase 2) | Flujo del modal (REQ-002/003/004) | `ProductCard.test.tsx` con `vi.mock('firebase/firestore')` + `vi.mock('../firebase')` + providers de contexts (patrón `WhatsappNumberContext.test.tsx`); `window.open` spy; casos: render del card, apertura del modal (step product con precios/promos), navegación a credito-financieras con financieras disabled según tipo, `window.open` con URL correcta al comprar contado, reset de `cerrar()` |
| Wizard timers (Fase 2) | Sistecredito (REQ-002) | `vi.useFakeTimers()`: avance de pasos 800/2000/3500ms, regla `primeraCompra === 'Sí'` → no-aplica, auto-envío a los 2000ms post-resultado |
| Gates continuos (todas las fases) | Lint/tests/typecheck (REQ-005) | `npm run lint` 0/0, `npm test` verde (28 + nuevos), `npx tsc --noEmit` OK. NO `vite build` |

## Migration / Rollout

**Fase 0 → 1 → 2 → 3 → 4** (dependencia estricta):

| Fase | Paso | Gate |
|---|---|---|
| 0 | Utils + goldens (`whatsapp-messages`, `promo`) — SOLO archivos nuevos | Goldens verdes; lint 0/0; `git status`: solo `src/utils/*` nuevos + openspec; `ProductCard.tsx` INTACTO (REQ-006) |
| 1 | Rewiring WhatsApp: `:113-115` → `buildContadoWhatsAppMessage`, `:180-225` → `buildCreditoWhatsAppMessage` + `buildWhatsAppUrl` | Goldens verdes (byte-idénticos); suite completa verde; lint 0/0 |
| 2 | Extracción presentacional: css, hook, 7 componentes, `ProductCard.test.tsx` | Lint 0/0; suite verde; typecheck OK; diff move-only (markup copiado, no reescrito) |
| 3 | Limpieza: imports muertos, `ProductCard.tsx` solo container; verificación total | `npm test` 100% verde; `npm run lint` 0/0; `tsc --noEmit` OK; `git diff firebase.json *.rules functions/` VACÍO (REQ-008) |
| 4 | Commit conventional + archive (`sdd-archive`): spec → `openspec/specs/ui/spec.md`; carpeta → `archive/2026-08-15-refactor-product-card/`; `state.yaml` → ARCHIVED | Trazabilidad REQ→tasks completa; SIN deploy |

Rollback: cada fase = commit separable (`git revert <fase>` devuelve esa fase); Fase 0 no toca código de app (risk-free); sin estado de datos ni deploys (REQ-008) → riesgo de producción CERO.

---

## Riesgos y mitigaciones

| # | Riesgo | Mitigación |
|---|---|---|
| R1 | Byte-diff en mensajes WhatsApp (espacio/emoji/\n/formato COP) | Golden tests Fase 0 verbatim (D1); rewiring de Fase 1 probado contra goldens; `formatPrice` NO se toca |
| R2 | Regresión en flujo del modal (steps, autovalidación, timers Sistecredito) | Move-only (D2/D8); smoke tests de componente; timers con `vi.useFakeTimers` en tests; delays de la app intactos |
| R3 | Warning de lint nuevo por `react-refresh/only-export-components` o unused imports | D3 (hooks/helpers en archivos separados); gate lint 0/0 por fase; limpieza Fase 3 |
| R4 | `CreditForm` como submachine cambia el contrato de reset (`cerrar`) | El container llama al reset vía `key` remount o callback `onReset` — decisión de Fase 2 documentada; el resultado observable (cerrar = reset total, REQ-002) se cubre con smoke test |
| R5 | El smoke test con timers reales ralentiza la suite | `vi.useFakeTimers` solo en tests del wizard; resto con timers reales cortos |
| R6 | Estilos: selector movido con typo → cambio visual | Move-only: diff del css contra el `<style>` original revisado selector a selector; smoke test de clases clave (`.plan-special-box`, `.btn-validar`) |
| R7 | Diferencia de líneas reportadas (1169 vs 1165) genera confusión en referencias | Evidencia: `wc -l` → 1165; TODAS las referencias de líneas del plan son las reales verificadas |

## Open Questions

- [ ] ¿`CreditForm` se reinicia por remount (`key`) o por callback (`onReset`)? A decidir en Fase 2; ambas cumplen REQ-002 (reset observable). No bloquea.
- [ ] ¿`buildCreditoWhatsAppMessage` recibe los strings ya formateados (recomendado) o formatea internamente? Preferencia del diseño: strings (utilidad pura de composición); se congela en Fase 0 con los goldens. No bloquea.
- [ ] ¿Se incluye snapshot DOM del card? Decidido NO por ahora (alcance; los smoke tests + move-only cubren REQ-004). Re-evaluable post-change.