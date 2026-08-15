# Exploración: refactor-product-card

**Change**: `refactor-product-card`
**Fecha**: 2026-08-15
**Fuente**: lectura COMPLETA de `src/components/ProductCard.tsx` (1165 líneas reales — el orquestador reportó 1169; `wc -l` da 1165), call sites verificados por grep, contexts y dependencias leídas
**Modo de exploración**: SOLO lectura — no modifiqué código fuente, ni configs, ni tests; solo este artefacto.

---

## 1. Estado actual del componente

`src/components/ProductCard.tsx` = **1165 líneas**, el archivo más grande del repo. Un solo componente React con: card presentacional, modal wizard de compra de 4 pasos (`product → payment → credito-financieras → credito-form`), construcción de 2 tipos de mensajes WhatsApp, validación progresiva de Sistecredito con timers animados, y un bloque `<style>` inline de ~325 líneas.

### 1.1 Contrato de props (INNEGOCIABLE, REQ-003)

```ts
interface ProductCardProps {
  producto: Product;
  isPopular?: boolean;
}
```

- Default export. Únicos call sites verificados por grep:
  - `src/components/LandingPage.tsx:180` → `<ProductCard producto={producto} isPopular={producto.esDestacado} />`
  - `src/components/Catalogo.tsx:199` → `<ProductCard producto={producto} />`
- El refactor NO puede romper este contrato ni los call sites.

### 1.2 Estado local, hooks, contexts

- **14 useState** + **1 useRef**:
  - `mostrar`, `step` ('product' | 'payment' | 'credito-financieras' | 'credito-form'), `paymentAction` ('comprar' | 'carrito')
  - `selectedFinanciera`, `formData` (Record<string,string>), `linkOpened`, `autovalidacionStatus` ('pendiente'|'aprobado'|'denegado'), `aceptaTerminos`
  - Wizard Sistecredito: `validPhase` ('idle'|'running'|'done'), `validStep` (0..3), `validCupoText`, `validAdvertencia`, `validResultType`, `validResultMsg`
  - `validTimers` (ref de timers para limpiar en cerrar/reset)
- **Contexts**: `useCart().addToCart` (`cart-context.ts:8-13`) y `useWhatsappNumber()` (`whatsapp-number-context.ts:8-13`) con fallback local `rawPhoneNumber || '573248022632'` (`:35`).
- **Efecto**: `recordProductView(producto.id)` al montar (`:38-42`), servicio que importa `firebase/firestore` (`productStats.service.ts:13`) → cualquier test de componente DEBE mockear `firebase/firestore` (patrón ya usado en `product.service.test.ts` y `WhatsappNumberContext.test.tsx`).
- **NO acoplado** a `product-matcher` ni a `ai-assistant` (verificado: los imports son solo react, react-bootstrap, cart-context, whatsapp-number-context, formatters, productStats.service, data/financieras, types).

## 2. Inventario de secciones (líneas exactas verificadas)

| # | Sección | Líneas | Tamaño aprox | Contenido | Extraíble |
|---|---|---|---|---|---|
| 1 | Imports, props, estado, contexts, efecto vista | 1-42 | ~40 | Todo el estado del wizard + `addToCart` + `useWhatsappNumber` | (queda en container) |
| 2 | Lógica de promo/badges/precios derivada (PURA) | 55-117 | ~60 | `getMillis`, `inWindow`, `hasPromoPrice`, `showPromoBadge/showNuevoBadge/showPromoPrice`, `priceRegularStr/pricePromoStr`, `badgeBg/highlightColor`, `cuotaInicial`, `financierasDisponibles` | SÍ → `useProductPricing` + `utils/promo.ts` |
| 3 | Mensaje WhatsApp CONTADO (string CRUDO) | 113-115 | 3 | `mensajeWhatsAppContadoDirecto` — rama promo / no-promo, template literal EXACTO | SÍ → `utils/whatsapp-messages.ts` |
| 4 | Handlers wizard | 44-53, 119-178 | ~55 | `abrir/cerrar`, `handleSeleccionTipo` (contado → `window.open(wa.me)` o `addToCart`; crédito → step), `resetValid`, `handleSelectFinanciera`, `handleFieldChange`, `isFormValid` (incluye regla de 2 palabras de Sistecredito), `nombreCompletoInvalido` | (container) |
| 5 | Mensaje WhatsApp CRÉDITO (string CRUDO) | 180-225 | ~46 | `handleEnviarWhatsApp`: header `🧾 *Solicitud de crédito - {nombre}*`, producto, precio, cuotas Krediya (12 o 16/8 + cuota inicial), datos del cliente con mapa `lineLabel` (184-198), `window.open(wa.me)`, `addToCart('credito')` si carrito, `cerrar()` | SÍ → `utils/whatsapp-messages.ts` (+ URL builder) |
| 6 | Validación Sistecredito (timers 800/2000/3500ms) | 227-273 | ~47 | Secuencia animada de pasos, parseo de cupo, advertencia producto>cupo, resultado final (`primeraCompra === 'Sí'` → no-aplica), auto-envío de WhatsApp | SÍ → `SistecreditoValidation` (sub-componente con estado) |
| 7 | **Bloque `<style>` inline** | 277-601 | **~325** | CSS de badges, financiera-card, form-fields, terminos, valid-steps, modales, keyframes shimmer, media query | SÍ → `product-card.css` |
| 8 | Card presentacional (fuera del modal) | 603-714 | ~110 | Badges (nuevo/promo/HOT con `isPopular`), imagen (placeholder si falta), título, precio (promo `del`+rojo / regular azul), botón "Ver detalles" | SÍ → `ProductCardView` + `ProductBadges` + `PriceDisplay` |
| 9 | Modal body — step product/payment | 716-757 | ~42 | Descripción, precios (reg/promo), cuota inicial, plan especial (12 cuotas) vs estándar (16 quincenales + 8 mensuales) | SÍ → `PriceDisplay` (variante modal) + `PlanCuotas` |
| 10 | Modal body — step credito-financieras | 759-788 | ~30 | Grid "Elige una financiera" con logos de las 5 financieras (`FINANCIERAS.map`), disabled + "No disponible para este producto" | SÍ → `FinancieraGrid` |
| 11 | Modal body — step credito-form | 790-1027 | ~240 | Logo+nombre financiera, autovalidación (ir al sitio externo → resultado aprobado/denegado), campos del formulario (radio/text, hint sistecredito), términos y condiciones, botón Validar + pasos progresivos + resultado | SÍ → `CreditForm` + `SistecreditoValidation` |
| 12 | Modal footer por step | 1029-1157 | ~128 | product (Comprar Ahora/Añadir al Carrito/Cerrar), payment (Contado/Crédito/Volver), credito-financieras (Volver), credito-form (otra financiera/Volver/Enviar solicitud) | (container — son wiring de botones con estado) |

## 3. Duplicaciones internas detectadas

1. **Rama promo/no-promo de precios duplicada**: el mismo ternary `showPromoPrice ? (del + precio promo) : (precio regular)` existe en el card (`:674-685`) y en el modal (`:726-733`), con markup distinto pero misma decisión de negocio. Candidata a un solo componente con variante.
2. **URL de WhatsApp duplicada**: el patrón `https://wa.me/${phoneNumber}?text=${encodeURIComponent(mensaje)}` aparece 2 veces (`:124` contado, `:219` crédito). Candidata a `buildWhatsAppUrl(phone, mensaje)`.
3. **Mensajes WhatsApp crudos inline**: 2 constructores (contado `:113-115`, crédito `:200-216`) embebidos en el componente con lógica de negocio de negocio (cuotas Krediya, labels) — la parte de MAYOR riesgo del refactor y la ÚNICA sin tests.
4. **Lógica de promo repetida conceptualmente**: `getMillis`/`inWindow`/`hasPromoPrice`/`showPromoPrice` son funciones PURAS sin estado que hoy viven dentro del render del componente.

## 4. Riesgo del contexto de negocio (INNEGOCIABLE)

Los outputs de WhatsApp (contado directo y solicitud de crédito) se usan para cotizar en producción: la gente copia el mensaje EXACTO. Un cambio de un carácter (espacio, salto de línea, emoji, formato de precio con `formatPrice` es-CO) altera la cotización. Regla del change: **byte-idénticos** — se capturan con tests de caracterización (Fase 0) ANTES de tocar la implementación.

Puntos críticos a preservar byte a byte:
- Contado con promo: `Hola, estoy interesado en comprar el {nombre}.\nPrecio promocional: {promo} (antes {regular}).\n¿Está disponible para entrega inmediata?`
- Contado sin promo: `Hola, estoy interesado en comprar al contado el {nombre}.\nPrecio: {regular}.\n¿Está disponible para entrega inmediata?` (notar "comprar el" vs "comprar al contado el")
- Crédito: header `🧾 *Solicitud de crédito - {financiera}*\n\n`, `📱 *Producto:*`, `💰 *Precio:*`, cuotas Krediya (`💵 *Cuota inicial:*`, `📆 *12 cuotas mensuales:*` o `📆 *16 cuotas quincenales:*` + `📆 *8 cuotas mensuales:*`), `\n👤 *Datos del cliente:*\n`, cada campo `▸ {label}: {valor}\n`
- El mapa `lineLabel` (`:184-198`) tiene labels EXACTAS ("Nombres y apellidos", "Cédula", etc.); el fallback es la key cruda.

## 5. Contexto de testing hoy

- **28 tests en 4 archivos** (verificado): `src/utils/formatters.test.ts`, `src/utils/product-matcher.test.ts`, `src/services/product.service.test.ts`, `src/contexts/WhatsappNumberContext.test.tsx`.
- **NO existe ningún test de ProductCard** ni de mensajes WhatsApp (los mensajes hoy son imposibles de testear unitariamente: viven dentro de un componente que monta Firebase).
- Stack: Vitest 4 + jsdom + `@testing-library/react` + jest-dom; setup `src/test/setup.ts` (`@testing-library/jest-dom`). Script `npm test` = `vitest run`.
- Patrón de mock de Firebase ya instalado: `vi.mock('firebase/firestore', ...)` + `vi.mock('../firebase', () => ({ db: {} }))` (ver `product.service.test.ts:1-15`, `WhatsappNumberContext.test.tsx:1-14`) — REUTILIZABLE para el futuro `ProductCard.test.tsx`.
- Lint: ESLint 9 flat config, hoy **0 warnings / 0 errors**. OJO regla `react-refresh/only-export-components` (warn): los archivos de componentes que exporten cosas no-componentes (hooks, helpers) generan warning → hooks y utils DEBEN vivir en archivos separados de los componentes.

## 6. Opciones de solución

| Opción | Descripción | Pros | Contras | Esfuerzo |
|---|---|---|---|---|
| **A — Big-bang** | Extracción en UN solo paso: utils + todos los sub-componentes + css, refactor total en una pasada | Resultado final inmediato | Sin gates intermedios; si algo cambia byte en WhatsApp, el diff gigante complica el bisect del error; alto riesgo de regresión silenciosa en el flujo del modal | Alto |
| **B — Solo utils puras** | Extraer únicamente `whatsapp-messages.ts` (+ promo) y dejar el JSX de 1165 líneas intacto | Riesgo mínimo, testea la parte crítica; cambio chico | NO resuelve la mantenibilidad (el monstruo sigue); los sub-componentes siguen sin poder testearse; el cambio "no se nota" | Bajo |
| **C — Split por fases con gates** | Fase 0: golden tests + utils puras (código viejo intacto). Fase 1: rewiring de WhatsApp. Fase 2: sub-componentes presentacionales + css + hook. Fase 3: limpieza + verificación total. Fase 4: commit + archive | Cada fase reversible, con gates lint+tests verdes; los golden tests preceden a TODO cambio de implementación; el diff queda chico y auditable por fase | Más fases = más pasos; requiere disciplina de gates | Medio |

## 7. Recomendación

**Opción C** — split completo por fases con gates, en la dirección que aprobó el dueño (helpers puros + sub-componentes presentacionales en `src/components/product-card/`). La exploración confirmó que la estructura permite el split exactamente como se había previsto: la sección de precios/cuotas/badges es puramente derivada (hook puro), el modal se divide naturalmente por step, el CSS es 28% del archivo, y los mensajes WhatsApp son 2 constructores puros aislables byte-por-byte con golden tests. El container final quedaría en ~350-400 líneas.

### Ready for Proposal

Sí. El orchestrator debe informar al dueño: (1) el componente tiene 1165 líneas y 12 secciones claramente separables; (2) las invariantes byte-idénticas de WhatsApp se confirman en `:113-115` y `:200-216` (2 constructores + 2 URLs duplicadas); (3) hay 4 duplicaciones internas y ~325 líneas de CSS inline; (4) NO usa product-matcher ni ai-assistant; (5) 28/28 tests actuales, sin test de ProductCard; (6) la recomendación es la Opción C con gates, sin deploy ni firebase.json en scope.