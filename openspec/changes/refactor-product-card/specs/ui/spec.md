---
id: refactor-product-card/spec
status: active
title: "Spec: refactor-product-card"
change_date: 2026-08-15
---

# UI / ProductCard Specification

## Purpose

Primer spec del dominio `ui` (componentes de interfaz). Este change refactoriza `src/components/ProductCard.tsx` (1165 líneas, el componente más grande del repo) en piezas con responsabilidades claras: helpers PUROS de construcción de mensajes WhatsApp (extraídos a `src/utils/whatsapp-messages.ts`, testeables unitariamente), sub-componentes presentacionales en `src/components/product-card/`, hook de derivados de pricing y CSS externo. Objetivo: **mantenibilidad y testabilidad**, prioridad explícita del dueño; NO optimización de render. **Cero cambio de comportamiento observable.**

**Invariantes del contexto de negocio (innegociables, verificado en exploración §4)**: los mensajes de WhatsApp generados (contado directo `ProductCard.tsx:113-115` y solicitud de crédito `:200-216`) tienen formato EXACTO que la gente usa para cotizar — el refactor NO puede alterar NI UN CARÁCTER de sus outputs (escapados incluidos: emojis, `\n`, `▸`, `*negritas*`, `formatPrice` es-CO). El flujo del modal de crédito es funcional-idéntico: wizard de 4 pasos (`product → payment → credito-financieras → credito-form`), selección de financieras con disponibilidad y logos, autovalidación (enlace externo + estado aprobado/denegado), formulario por financiera con términos, y wizard progresivo de Sistecredito (timers 800/2000/3500ms con sus reglas). El comportamiento visual de precio/cuotas/badges es idéntico.

**Mecanismo de garantía (REQ-006)**: tests de caracterización (golden) escritos en Fase 0 sobre código puro extraído VERBATIM del comportamiento actual, ANTES de cualquier `edit` a `ProductCard.tsx`. Los expected strings de los goldens se copian de los template literals vigentes y se congelan.

Fuera de scope (NO requisito de este change): deploy de cualquier tipo; cambios en `firebase.json`, `firestore.rules`, `storage.rules`, `functions/`; cambios de comportamiento, tiempos de timers o reglas de validación; optimización de render (memo/useMemo); refactor de otros componentes (`CreditModal`, `CompareModal`, etc.).

## Requirements

### REQ-001: Mensajes de WhatsApp byte-idénticos

El sistema DEBE generar los mensajes de WhatsApp con exactamente los mismos bytes que hoy produce `ProductCard.tsx`:

- **Contado directo** (`:113-115`): con promo activa — `Hola, estoy interesado en comprar el {nombre}.\nPrecio promocional: {pricePromoStr} (antes {priceRegularStr}).\n¿Está disponible para entrega inmediata?`; sin promo — `Hola, estoy interesado en comprar al contado el {nombre}.\nPrecio: {priceRegularStr}.\n¿Está disponible para entrega inmediata?` (notar "comprar el" vs "comprar al contado el", los `\n` y los signos de apertura/cierre de pregunta).
- **Solicitud de crédito** (`:200-216`): header `🧾 *Solicitud de crédito - {financiera.nombre}*\n\n`; `📱 *Producto:* {nombre}\n`; `💰 *Precio:* {promo ? pricePromoStr : priceRegularStr}\n`; SOLO para Krediya — `💵 *Cuota inicial:* {formatPrice(cuotaInicial)}\n` si `cuotaInicial > 0`, y o bien `📆 *12 cuotas mensuales:* {formatPrice(cuotas12)}\n` si `solo12Meses && cuotas12`, o bien `📆 *16 cuotas quincenales:* {formatPrice(cuotas6)}\n` + `📆 *8 cuotas mensuales:* {formatPrice(cuotas8)}\n`; luego `\n👤 *Datos del cliente:*\n` y, por cada campo del formulario en orden de inserción, `▸ {label(key)}: {valor}\n` con el mapa `lineLabel` (`:184-198`: nombres → "Nombres y apellidos", cedula → "Cédula", fechaNacimiento → "Fecha y lugar de nacimiento", fechaExpedicion → "Fecha y lugar de expedición", celular → "Celular", email → "Correo electrónico", compradoAntes → "¿Ha comprado antes?", reportesNegativos → "¿Reportes negativos?", cupo → "Cupo disponible", primeraCompra → "Primera compra"; cualquier otra key se usa cruda).
- **URL `wa.me`** (`:124`, `:219`): `https://wa.me/{phoneNumber}?text={encodeURIComponent(mensaje)}` — `encodeURIComponent` sobre el mensaje completo.
- **Formateo de precios**: siempre vía `formatPrice` (`src/utils/formatters.ts`, es-CO, sin decimales; `null/undefined/''` → `'—'`); el `'—'` SE PROPAGA al mensaje (p. ej. cuotas con valor nulo).

#### Scenario: Contado con promo activa

- GIVEN un producto con `promo=true`, `promoPrice` válido menor a `contado`, ventana promocional vigente y `nombre` "iPhone 15"
- WHEN se construye el mensaje de contado
- THEN el resultado es exactamente `Hola, estoy interesado en comprar el iPhone 15.\nPrecio promocional: $3.850.000 (antes $4.200.000).\n¿Está disponible para entrega inmediata?` (con el formato COP real de `formatPrice`)

#### Scenario: Contado sin promo

- GIVEN un producto sin promo (o promoPrice inválido) con `contado` $2.000.000 y `nombre` "Samsung Galaxy A54"
- WHEN se construye el mensaje de contado
- THEN el resultado es exactamente `Hola, estoy interesado en comprar al contado el Samsung Galaxy A54.\nPrecio: $2.000.000.\n¿Está disponible para entrega inmediata?`

#### Scenario: Crédito genérico (financiera distinta de Krediya)

- GIVEN una financiera `esmiopcion` seleccionada, producto sin promo, formulario con campos `nombres` y `cedula` completados y orden de inserción conocido
- WHEN se construye el mensaje de crédito
- THEN el mensaje contiene `🧾 *Solicitud de crédito - Esmiopcion*\n\n📱 *Producto:* {nombre}\n💰 *Precio:* {precio}\n\n👤 *Datos del cliente:*\n▸ Nombres y apellidos: {valor}\n▸ Cédula: {valor}\n` — sin bloques de cuotas (NO es Krediya)

#### Scenario: Crédito Krediya con plan de 12 meses

- GIVEN la financiera `krediya`, `solo12Meses=true`, `cuotas12` $350.000 y `cuotaInicial` $500.000
- WHEN se construye el mensaje de crédito
- THEN incluye `💵 *Cuota inicial:* $500.000\n📆 *12 cuotas mensuales:* $350.000\n` y NO incluye las líneas de 16/8 cuotas

#### Scenario: Crédito Krediya sin plan especial, con cuota inicial en cero

- GIVEN la financiera `krediya`, `solo12Meses=false`, `cuotaInicial=0`, `cuotas6` y `cuotas8` definidos
- WHEN se construye el mensaje de crédito
- THEN NO incluye la línea de cuota inicial (cuotaInicial 0 no pasa el `> 0`) e incluye `📆 *16 cuotas quincenales:* {cuotas6}\n📆 *8 cuotas mensuales:* {cuotas8}\n`

#### Scenario: Byte-identidad del escape y formato URL

- GIVEN un mensaje cualquiera y el número `573248022632`
- WHEN se construye la URL de WhatsApp
- THEN es `https://wa.me/573248022632?text={encodeURIComponent(mensaje)}` — exactamente el escape que hoy produce `encodeURIComponent` en el componente

#### Scenario: Labels desconocidas usadas crudas

- GIVEN un formulario con una key fuera del mapa `lineLabel` (p. ej. `otroCampo`)
- WHEN se construye el mensaje de crédito
- THEN la línea es `▸ otroCampo: {valor}\n` (fallback a la key cruda, comportamiento actual)

### REQ-002: Flujo del modal de crédito funcional-idéntico

El sistema DEBE preservar el flujo completo del modal: al abrir, step `product` (descripción, precios, cuota inicial, plan especial/estándar); botones "Comprar Ahora"/"Añadir al Carrito" → step `payment` (Contado/Crédito); Contado con `paymentAction='comprar'` DEBE abrir la URL de WhatsApp (REQ-001) y con `'carrito'` DEBE llamar `addToCart(producto, 'contado')` y cerrar; "Crédito" → step `credito-financieras` (grid con las 5 financieras de `FINANCIERAS`, disponibles según `getFinancierasForProduct(marca, categoria, nombre)`, no-disponibles deshabilitadas con "No disponible para este producto"); selección → step `credito-form` con: autovalidación si `tipo === 'autovalidacion'` (debe poder abrir `urlAutovalidacion` en otra pestaña, luego marcar aprobado/denegado, y volver a abrir el enlace); formulario de campos por financiera (radios/textos, hint de nombre completo de Sistecredito, términos y condiciones obligatorios); para Sistecredito, botón "Validar" que ejecuta la secuencia animada con timers (paso 1 @800ms, paso 2 @2000ms con cupo parseado `[^0-9]` y advertencia si `contado > cupo`, paso 3 @3500ms con regla `primeraCompra === 'Sí'` → no-aplica, auto-envío de WhatsApp a los 2000ms si aplica); resultado denegado ofrece volver a `credito-financieras` ("Intentar con otra financiera"); para el resto, botón "Enviar solicitud por WhatsApp" habilitado solo si `isFormValid()` (campos requeridos completos + 2 palabras en nombres para Sistecredito + términos aceptados) y "Volver". El cierre (`cerrar`) DEBE resetear TODO el estado (formulario, financiera, linkOpened, autovalidación, wizard de validación, timers) — comportamiento actual `:44-53`.

#### Scenario: Wizard completo sin autovalidación (Krediya)

- GIVEN un producto Krediya-disponible en el componente renderizado
- WHEN se abre el modal, se pulsa "Comprar Ahora", luego "Crédito", se elige Krediya, se completan los campos requeridos y los términos, y se pulsa "Enviar solicitud por WhatsApp"
- THEN los steps recorridos son exactamente `product → payment → credito-financieras → credito-form` y `window.open` recibe la URL de REQ-001 con el mensaje de crédito Krediya

#### Scenario: Reset total al cerrar

- GIVEN un formulario de crédito con datos ingresados y estado de autovalidación aprobado
- WHEN se cierra el modal (`cerrar`)
- THEN al reabrir, el modal vuelve a step `product` sin datos previos, sin financiera seleccionada y con el wizard de Sistecredito en `idle`

#### Scenario: Financiera no disponible deshabilitada

- GIVEN un producto tipo `iphone` (PayJoy y Krediya no aplican) visible en el grid `credito-financieras`
- WHEN se intenta seleccionar PayJoy o Krediya
- THEN el click no tiene efecto (la card está deshabilitada y muestra "No disponible para este producto")

### REQ-003: Contrato de props de `ProductCard` intacto

El sistema DEBE mantener el contrato público del componente: default export `ProductCard`, props `{ producto: Product; isPopular?: boolean }` (isPopular opcional, default `false`). `src/components/LandingPage.tsx:180` y `src/components/Catalogo.tsx:199` NO DEBEN cambiar.

#### Scenario: Rendering con y sin isPopular

- GIVEN `Catalogo.tsx` renderizando `<ProductCard producto={producto} />` y `LandingPage.tsx` con `isPopular={producto.esDestacado}`
- WHEN se renderiza la app post-refactor
- THEN ambos sitios renderizan igual que pre-refactor y el badge "🔥 HOT" solo aparece con `isPopular=true`

### REQ-004: Sin cambio de UI visible

El sistema DEBE preservar el DOM/CSS actual del card y del modal: precios (ternary promo/regular, colores `--gio-red`/`--brand-blue`, `del`), cuotas iniciales, plan especial (caja `plan-special-box` con badge PLAN ESPECIAL) vs estándar (`plan-standard-box` con 16/8), badges (nuevo `#28a745`/promo/`🔥 HOT #ff6b35`) con su contenedor `gio-badge-container`, estilos de financiera-card, form-fields, valid-steps, advertencias y resultado. Los estilos inline del bloque `<style>` se mueven SIN modificar selectores ni valores; el `<style>` puede desaparecer en favor de un import CSS equivalente (mismo scope global efectivo).

#### Scenario: Markup de precios preservado

- GIVEN un producto con promo activa
- WHEN se renderiza el card y el modal
- THEN el card muestra `<del>{priceRegularStr}</del>` + precio promo en rojo y el modal muestra "Precio regular:" con `<del>` + "Precio promocional:" en rojo con su badge si existe `promoBadgeText`

#### Scenario: Estilos equivalentes tras mover el CSS

- GIVEN el refactor aplicado con `product-card.css` importado
- WHEN se renderiza el modal de crédito
- THEN los selectores (`.financiera-card`, `.valid-steps`, `.btn-validar`, `.plan-special-box`, etc.) aplican los mismos estilos que con el `<style>` inline

### REQ-005: Gates continuos — lint 0/0 y suite verde

El sistema DEBE mantener en CADA fase del change: `npm run lint` con **0 errores y 0 warnings** (hoy 0/0 — no se introducen warnings nuevos, incl. `react-refresh/only-export-components`), `npm test` (vitest run) con la suite completa verde (28 tests actuales + los nuevos de Fase 0/2), y typecheck `tsc --noEmit` sin errores. NO se ejecuta `vite build` (regla del orquestador).

#### Scenario: Fases intermedias con suite verde

- GIVEN el change en ejecución por fases (Fase 0 → Fase 1 → Fase 2 → Fase 3)
- WHEN se ejecuta stack de verificación en cada gate de fase
- THEN lint 0/0, tests verdes (actuales + nuevos) y typecheck OK en todas las fases

### REQ-006: Tests de caracterización ANTES de tocar la implementación

El sistema DEBE tener, ANTES del primer `edit` a `src/components/ProductCard.tsx`, tests de caracterización (golden) de los mensajes de WhatsApp corriendo sobre código puro extraído VERBATIM del comportamiento actual (`src/utils/whatsapp-messages.ts`): casos de Fase 0 que cubren REQ-001 completo (contado promo/no-promo, crédito genérico, Krediya 12 cuotas, Krediya 16/8 con cuota inicial 0, labels desconocidas, URL). Los expected strings DEBEN copiarse de los template literals vigentes (`ProductCard.tsx:113-115`, `:184-216`) y congelarse; el diff de Fase 0 DEBE contener SOLO archivos nuevos (utils + tests) y artefactos openspec.

#### Scenario: Gate de Fase 0

- GIVEN la Fase 0 completada y `ProductCard.tsx` sin modificaciones
- WHEN se ejecuta `npm test` y `git status`
- THEN los nuevos tests golden pasan 100% y el diff contiene solo archivos nuevos de `src/utils/` y `openspec/`

#### Scenario: Regresión detectable post-rewiring

- GIVEN el rewiring de Fase 1 aplicado
- WHEN se ejecutan los golden tests
- THEN pasan byte-idénticos; si un golden falla, el cambio culpable es el rewiring (bisect trivial por fases)

### REQ-007: Registro de vistas preservado

El sistema DEBE conservar la llamada `recordProductView(producto.id)` al montar el componente con las mismas condiciones (`producto?.id` truthy) y sin cambios en `src/services/productStats.service.ts` (que sigue consumiendo la misma función). En los tests de componente DEBE mockearse `firebase/firestore` (patrón instalado) para no ejecutar llamadas reales.

#### Scenario: Vista registrada al montar

- GIVEN el componente renderizado con un producto con `id`
- WHEN el componente se monta post-refactor
- THEN `recordProductView` se invoca una vez con `producto.id` (mismo efecto que hoy, `useEffect` con dep `[producto?.id]`)

### REQ-008: Sin deploy y cero cambios de infraestructura

El sistema DEBE concluir el change sin deploy alguno (ni hosting, ni firestore, ni functions, ni storage) y con `firebase.json`, `firestore.rules`, `storage.rules` y `functions/` en 0 líneas de diff; el cierre es commit (conventional commits) + archive del change (spec sincronizada a `openspec/specs/ui/spec.md`, carpeta movida a `openspec/changes/archive/2026-08-15-refactor-product-card/`). El deploy queda a decisión del dueño, fuera de este change.

#### Scenario: Diff de infraestructura vacío

- GIVEN el change cerrado (commit + archive)
- WHEN se ejecuta `git diff HEAD~1 -- firebase.json firestore.rules storage.rules functions/`
- THEN el diff está vacío

#### Scenario: Cierre sin deploy

- GIVEN la Fase 3 verificada (lint/tests/typecheck verdes)
- WHEN se ejecuta la Fase 4
- THEN se crea el commit del refactor y se archiva el change; NO se ejecuta ningún comando `firebase deploy`

## Futuro (anotado, FUERA de este change)

- **Optimización de render** de `ProductCard` (memo/splitting de re-renders del modal): requeriría medir primero; decidido fuera de scope por el dueño (objetivo = mantenibilidad/testabilidad).
- **Test visual/snapshot del card**: con el split presentacional sería viable un set de snapshots DOM; no se incluye para acotar alcance (los smoke tests + move-only cubren REQ-004 por ahora).
- **Migrar los styles restantes inline** (colores de botones hex en el footer, `:1035-1054` etc.) a variables CSS: limpieza futura opcional, no bloquea.