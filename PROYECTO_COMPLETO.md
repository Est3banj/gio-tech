# Gio-Tech v2 — Documentación Completa del Proyecto

## 📋 Información General del Proyecto

| Campo | Valor |
|-------|-------|
| **Nombre** | Gio-Tech (gio-tech-v2) |
| **Tipo** | E-commerce SPA (Single Page Application) |
| **Ubicación** | `/Users/esteban/Documents/gio-tech-v2` |
| **Plataforma** | Firebase Hosting (`giotechshop.online`) |
| **Estado** | En producción |

---

## 🛠 Stack Tecnológico

### Frontend
- **Framework**: React 19.1.0
- **Build Tool**: Vite 6.3.5
- **Lenguaje**: JavaScript (ES6+)

### UI/UX
- **Framework CSS**: Bootstrap 5.3.6 + React Bootstrap 2.10.10
- **Animaciones**: Framer Motion 12.18.1
- **Carrusel**: Swiper 12.0.3
- **Iconos**: Bootstrap Icons
- **Custom CSS**: CSS Variables (Dark Mode integrado)

### Backend
- **Auth**: Firebase Authentication
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Hosting**: Firebase Hosting

### Routing
- **Librería**: React Router DOM 6.30.1

### IA
- **Servicio**: Groq API (Llama 3.1 8B Instant)
- **Uso**: Asistente virtual de ventas (GeminiChat)

### Scanner
- **Librería**: html5-qrcode 2.3.8

### Otras dependencias
- PropTypes 15.8.1 (Validación de props)

---

## 🏢 Información del Negocio

Esta información se usa en el prompt del asistente IA (`src/data/business-info.js`):

```javascript
{
  nombre: "GIO TECH",
  eslogan: "Tu tienda de tecnología de confianza",
  ubicacion: "Colombia",

  // Políticas de crédito:
  // - 16 cuotas quincenales
  // - 12 cuotas mensuales
  // - 8 cuotas mensuales
  // - 6 meses mensuales
  // - Plan especial de 12 meses
  // - sistcredito de 1 a 6 meses
  // Requisitos: mayor de edad, documento, referencias, capacidad de pago
  // iPhone a crédito solo por sistecredito (cupo > $1,000,000)

  // Garantías:
  // - Nuevos: garantía fabricante (12 meses)
  // - Seminuevos: garantía 3 meses
  // - No cubre agua ni golpes

  // Envíos:
  // - Putumayo y fuera del departamento
  // - 2-5 días hábiles
  // - Envío gratis > $500,000

  // Métodos de pago:
  // Efectivo, transferencia, PSE, tarjetas, contra entrega, financiación

  // Servicio técnico:
  // Cambio de pantallas, baterías, puertos, limpieza, desbloqueo
  // Garantía de 15 días en reparaciones
}
```

---

## 📂 Estructura de Carpetas

```
gio-tech-v2/
├── src/
│   ├── components/              # Componentes React principales
│   │   ├── inventario/           # Gestión de inventario
│   │   │   ├── InventoryForm.jsx      # Formulario con scanner
│   │   │   ├── InventoryList.jsx       # Lista visual del inventario
│   │   │   └── BarcodeScanner.jsx     # Escaneo de códigos
│   │   ├── vendedor/            # Panel del vendedor
│   │   │   ├── VendedorPanel.jsx      # Panel principal
│   │   │   ├── MiniPOS.jsx            # Sistema de ventas rápidas
│   │   │   └── ProductSearch.jsx      # Búsqueda por EAN/IMEI
│   │   ├── LandingPage.jsx      # Página de inicio
│   │   ├── Catalogo.jsx         # Catálogo con filtros
│   │   ├── ProductCard.jsx      # Tarjeta de producto
│   │   ├── Header.jsx           # Navegación
│   │   ├── Footer.jsx           # Pie de página
│   │   ├── Login.jsx            # Autenticación
│   │   ├── AdminPanel.jsx       # Panel admin (1652 líneas)
│   │   ├── AsesorPanel.jsx      # Panel asesor
│   │   ├── GeminiChat.jsx       # Chat IA
│   │   ├── HeroCarousel.jsx    # Carrusel dinámico
│   │   └── ... (otros componentes)
│   ├── contexts/                # React Context Providers
│   │   ├── CartContext.jsx     # Carrito de compras
│   │   ├── InventoryContext.jsx # Inventario global
│   │   └── WhatsappNumberContext.jsx # WhatsApp dinámico
│   ├── hooks/                   # Custom Hooks
│   │   ├── useProducts.js      # Suscripción productos
│   │   ├── usePopularProducts.js # Productos populares
│   │   ├── useAuth.js          # Autenticación
│   │   └── useConfig.js        # Configuración
│   ├── services/               # Servicios Firebase
│   │   ├── product.service.js       # CRUD productos
│   │   ├── inventario.service.js   # Gestión inventario
│   │   ├── venta.service.js        # Registro ventas
│   │   ├── config.service.js       # Configuración
│   │   ├── productStats.service.js # Estadísticas
│   │   └── gemini.service.js       # Chat IA (Groq)
│   ├── utils/                   # Utilidades
│   ├── data/                    # Datos estáticos
│   │   └── business-info.js    # Info del negocio (para IA)
│   ├── styles/                  # Estilos CSS adicionales
│   ├── App.jsx                 # Componente principal (275 líneas)
│   └── main.jsx                # Entry point
├── public/                      # Archivos estáticos públicos
├── scripts/                     # Scripts de migración
├── package.json
├── vite.config.js
└── firestore.rules
```

---

## 🗄️ Firestore Schema (Base de Datos)

### Colección: `productos`
Catálogo de productos/teléfonos para venta.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| nombre | string | Nombre del producto |
| descripcion | string | Descripción del producto |
| imagen | string | URL de imagen |
| cuotas6 | number | Precio en 6 cuotas |
| cuotas8 | number | Precio en 8 cuotas |
| cuotas12 | number | Precio en 12 cuotas |
| cuotaInicial | number | Cuota inicial |
| promoActive | boolean | Promoción activa |
| promoPrice | number | Precio promocional |
| promoLabel | string | Etiqueta de promoción |
| promoBadgeBg | string | Color del badge |
| promoStart | timestamp | Inicio promoción |
| promoEnd | timestamp | Fin promoción |
| promoHighlight | string | Destacado |
| nuevo | boolean | Producto nuevo |
| nuevoBadgeText | string | Texto badge nuevo |
| nuevoBadgeBg | string | Color badge nuevo |
| badgeMode | string | Modo de badge |
| solo12Meses | boolean | Solo 12 cuotas |

### Colección: `inventario`
Control de stock de equipos físicos (EAN + IMEI).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| ean | string | Código de barras EAN |
| modelo | string | Modelo del equipo |
| imei1 | string | IMEI 1 |
| imei2 | string | IMEI 2 |
| storage | string | Almacenamiento |
| ram | string | RAM |
| cantidad | number | Stock disponible |
| estado | string | disponible/vendido |
| fechaAgregado | timestamp | Fecha de ingreso |
| fechaVenta | timestamp | Fecha de venta |

### Colección: `ventas`
Registro de ventas realizadas.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| inventarioId | string | ID del inventario |
| imei1 | string | IMEI vendido |
| imei2 | string | IMEI 2 |
| modelo | string | Modelo vendido |
| ean | string | EAN |
| storage | string | Storage |
| ram | string | RAM |
| precioVenta | number | Precio de venta |
| cantidad | number | Cantidad |
| vendedorUid | string | UID del vendedor |
| vendedorEmail | string | Email del vendedor |
| fecha | timestamp | Fecha de venta |

### Colección: `usuarios`
Usuarios del sistema.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| email | string | Email del usuario |
| rol | string | admin/asesor/vendedor/cliente |
| nombreCompleto | string | Nombre completo |
| whatsappNumber | string | Número de WhatsApp |
| fechaCreacion | timestamp | Fecha de registro |

### Colección: `configuracion` (documento: `general`)
Configuración global del negocio.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| nombre | string | Nombre del negocio |
| logo | string | URL del logo |
| descripcion | string | Descripción |
| telefono | string | Teléfono |
| direccion | string | Dirección |

### Colección: `carrusel`
Slides del carrusel en landing page.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| imagenUrl | string | URL de imagen |
| titulo | string | Título |
| descripcion | string | Descripción |
| activo | boolean | Slide activo |
| orden | number | Orden |
| enlace | string | Enlace |

### Colección: `producto_stats`
Estadísticas de vistas de productos.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| vistas | number | Cantidad de vistas |
| ultimaVista | timestamp | Última vista |
| productoId | string | ID del producto |

---

## 🧩 Componentes Principales

### Páginas

| Componente | Archivo | Líneas | Descripción |
|------------|---------|--------|-------------|
| App | App.jsx | 275 | Componente principal con routing y providers |
| LandingPage | LandingPage.jsx | 174 | Página de inicio con hero, servicios, reseñas |
| Catalogo | Catalogo.jsx | 286 | Catálogo completo con filtros, búsqueda y chat IA |
| Login | Login.jsx | 161 | Autenticación de usuarios |
| AdminPanel | AdminPanel.jsx | 1652 | Panel de administración (MONOLÍTICO) |
| AsesorPanel | AsesorPanel.jsx | 139 | Panel para asesores |
| ServicioTecnicoPage | ServicioTecnicoPage.jsx | - | Información servicio técnico |

### Componentes de Inventario

| Componente | Archivo | Líneas | Descripción |
|------------|---------|--------|-------------|
| InventoryForm | inventario/InventoryForm.jsx | 235 | Formulario con scanner de códigos |
| InventoryList | inventario/InventoryList.jsx | - | Lista visual del inventario |
| BarcodeScanner | inventario/BarcodeScanner.jsx | - | Escaneo de códigos (html5-qrcode) |

### Componentes del Vendedor

| Componente | Archivo | Líneas | Descripción |
|------------|---------|--------|-------------|
| VendedorPanel | vendedor/VendedorPanel.jsx | 105 | Panel principal del vendedor |
| MiniPOS | vendedor/MiniPOS.jsx | 226 | Sistema de ventas rápidas |
| ProductSearch | vendedor/ProductSearch.jsx | - | Búsqueda por EAN/IMEI/modelo |

### Componentes de UI

| Componente | Archivo | Líneas | Descripción |
|------------|---------|--------|-------------|
| ProductCard | ProductCard.jsx | 444 | Tarjeta de producto con modal |
| Header | Header.jsx | 154 | Navegación con tema oscuro/claro |
| Footer | Footer.jsx | 71 | Pie de página |
| GeminiChat | GeminiChat.jsx | 206 | Chat interactivo con IA |
| HeroCarousel | HeroCarousel.jsx | 305 | Carrusel dinámico desde Firestore |
| CartFloatingButton | CartFloatingButton.jsx | - | Botón flotante del carrito |
| WhatsappFloatingButton | WhatsappFloatingButton.jsx | - | Botón flotante WhatsApp |
| SnowfallEffect | SnowfallEffect.jsx | - | Efecto de nieve (navidad) |
| OptimizedImage | OptimizedImage.jsx | - | Imagen con lazy loading |
| ThemeProvider | ThemeProvider.jsx | - | Provider de tema oscuro/claro |
| WelcomeModal | WelcomeModal.jsx | - | Modal de bienvenida |
| CompareModal | CompareModal.jsx | - | Modal comparar productos |
| AssistantChat | AssistantChat.jsx | - | Chat de asistencia alternativo |

---

## 🧠 State Management

### Contextos (React Context API)

```javascript
// src/contexts/CartContext.jsx
CartContext + CartProvider
├── addToCart(product, tipoCotizacion)
├── removeFromCart(productId)
├── clearCart()
├── cartCount
└── persistencia: localStorage

// src/contexts/InventoryContext.jsx
InventoryContext + InventoryProvider
├── getById(id)
├── getDisponibleById(id)
├── buscarPorEAN(ean)
├── buscarPorIMEI(imei)
└── datos: inventario completo + inventario disponible

// src/contexts/WhatsappNumberContext.jsx
WhatsappNumberContext + WhatsappNumberProvider
├── useWhatsappNumber()
└── datos: Número de WhatsApp activo (default o de asesor)
```

### Custom Hooks

```javascript
// src/hooks/useProducts.js
useProducts()
├── retorna: { products, isLoading, error }
└── usa store externo (singleton) para evitar suscripciones duplicadas

// src/hooks/usePopularProducts.js
usePopularProducts()
├── retorna: { popularIds, isLoading }
└── obtiene productos más vistos según estadísticas

// src/hooks/useAuth.js
useAuth()
├── retorna: { user, isLoading }
└── gestión del estado de autenticación

// src/hooks/useConfig.js
useConfig()
├── retorna: { config, isLoading, error }
└── suscripción a configuración global (usa store externo)
```

---

## 🔌 Servicios (Firebase)

### product.service.js
```javascript
├── subscribeToProducts(callback, onError)  // Suscripción en tiempo real
├── createProduct(productData)              // Crear producto
├── updateProduct(productId, productData)   // Actualizar producto
├── deleteProduct(productId)                 // Eliminar producto
└── searchProducts(filters, limitCount)      // Búsqueda con filtros
colección: "productos"
```

### inventario.service.js
```javascript
├── subscribeToInventario(callback, onError)      // Todo el inventario
├── subscribeToInventarioDisponible(callback)      // Solo disponibles
├── agregarInventario(data)                       // Agregar equipo
├── actualizarInventario(id, data)                // Actualizar equipo
├── eliminarInventario(id)                        // Eliminar equipo
├── buscarPorEAN(ean)                              // Buscar por EAN
├── buscarPorIMEI(imei)                            // Buscar por IMEI
└── verificarIMEIExiste(imei)                     // Verificar duplicado
colección: "inventario"
```

### venta.service.js
```javascript
├── registrarVenta(ventaData)            // Registrar venta (transacción)
├── getVentas()                           // Obtener todas las ventas
├── getVentasPorFecha(fechaInicio, fin)  // Ventas por rango
├── getVentasPorVendedor(vendedorUid)    // Ventas por vendedor
├── getTotalVentas()                     // Total acumulado
└── cancelarVenta(ventaId)               // Cancelar y restaurar inventario
colección: "ventas" (usa transacciones Firestore)
```

### config.service.js
```javascript
├── subscribeToConfig(callback, onError)  // Suscripción a configuración
└── updateConfig(configData)               // Actualizar configuración
colección: "configuracion", documento: "general"
```

### productStats.service.js
```javascript
├── recordProductView(productId)            // Registrar vista
└── getPopularProductsStats(limitCount)    // Obtener más vistos
colección: "producto_stats"
```

### gemini.service.js (Groq API)
```javascript
├── askGeminiAssistant(pregunta, productos, historial)
│   ├── Modelo: Llama-3.1-8b-instant
│   ├── Mantiene contexto (últimos 6 mensajes)
│   ├── Busca TODOS los productos de la marca (no solo 5)
│   ├── Detector de preguntas de seguimiento
│   └── Prompt estricto para no inventar productos
│
└── generateWhatsAppMessage(productos)  // Generar mensaje para WhatsApp
```

---

## 🚏 Rutas (React Router)

| Path | Componente | Tipo | Descripción |
|------|------------|------|-------------|
| `/` | LandingPage | Público | Página de inicio/home |
| `/catalogo` | Catalogo | Público | Catálogo completo de productos |
| `/servicio-tecnico` | ServicioTecnicoPage | Público | Información del servicio técnico |
| `/login` | Login | Público | Autenticación de usuarios |
| `/panel` | AdminPanel / AsesorPanel | Protegida | Panel según rol (admin/asesor) |
| `/vendedor` | VendedorPanel | Protegida | Panel de ventas (rol: vendedor) |

---

## 🎨 UI/UX

### Diseño
- **Framework CSS**: Bootstrap 5.3.6 con React Bootstrap
- **Estilos personalizados**: CSS Variables en App.css (Design System)
- **Modo oscuro**: Soporte completo via CSS variables con clase `.dark-mode`
- **Animaciones**: Framer Motion para transiciones
- **Carrusel**: Swiper para carrusel del hero
- **Iconos**: Bootstrap Icons (`bi bi-*`)
- **Fuente**: Inter (system-ui fallback)

### Colores Brand
```css
--gio-red: #C8102E;
--brand-green: #22c55e;
--brand-blue: #0ea5e9;
--dark-bg: #1a1a1a;
--light-bg: #ffffff;
```

### Google Analytics
- **ID**: G-1KGCQBPN75
- **Integrado en**: index.html

---

## ✅ Features Implementadas

1. **E-commerce de celulares** — Tienda online para venta de celulares con precios de contado y crédito
2. **Catálogo con filtros** — Búsqueda por nombre, filtro por marca y rango de precios, ordenamiento
3. **Carrito de compras** — Carrito persistente en localStorage con selección de tipo de cotización (contado/crédito)
4. **Chat IA (Gemini/Groq)** — Asistente virtual que recomienda productos usando IA conversacional (mantiene contexto)
5. **Sistema de roles** — Autenticación con roles: admin, asesor, vendedor, cliente
6. **Panel de administración** — Gestión completa: productos, inventario, usuarios, configuración, carrusel
7. **Panel de vendedor (MiniPOS)** — Sistema de búsqueda por EAN/IMEI y registro rápido de ventas
8. **Panel de asesor** — Gestión de número WhatsApp y link de referido personalizado
9. **Dark Mode** — Tema oscuro/claro con persistencia en localStorage
10. **Efectos estacionales** — Efecto de nieve navideño (configurable, actualmente deshabilitado)
11. **WhatsApp flotante** — Botón flotante de contacto WhatsApp dinámico por asesor
12. **Estadísticas de productos** — Tracking de vistas de productos para identificar populares (badge "🔥 HOT")
13. **Hero Carrusel dinámico** — Carrusel gestionable desde el panel de admin
14. **Scanner de códigos** — Escaneo de códigos de barras para agregar al inventario (html5-qrcode)
15. **Meta Pixel Integration** — Tracking de eventos AddToCart para Facebook Ads
16. **SEO** — Meta tags, Open Graph, Schema.org, JSON-LD
17. **Performance** — Code splitting, OptimizedImage, Vite config optimizado

---

## 🐛 Problemas y Bugs Conocidos

### Críticos
| Problema | Ubicación | Descripción |
|----------|------------|-------------|
| Sin tests | Proyecto completo | No hay tests unitarios ni de integración |

### Altos
| Problema | Ubicación | Descripción |
|----------|------------|-------------|
| AdminPanel monolítico | AdminPanel.jsx (1652 líneas) | Viola SRP, debe dividirse en sub-componentes |
| Firebase config | src/firebase.js | Config expuesta, reglas deben garantizar seguridad |
| Hooks violations | AssistantChat, Catalogo | Violaciones de reglas de hooks (FIXED en rama fix/hooks-violations) |

### Medios
| Problema | Ubicación | Descripción |
|----------|------------|-------------|
| Sin validación formularios | InventoryForm, AdminPanel | No hay validación de formatos (IMEI, EAN, email) |
| Race condition potencial | useProducts.js | Store externo podría tener problemas concurrentes |

### Bajos
| Problema | Ubicación | Descripción |
|----------|------------|-------------|
| Hardcoded values | Footer.jsx | WhatsApp y dirección hardcodeados, deberían estar en Firestore |
| Debug console.logs | Múltiples archivos | Deben removerse en producción |
| Loading states | VendedorPanel, AdminPanel | Algunas operaciones no muestran feedback |
| Navegación duplicada | App.jsx | Lógica redundante para mostrar/ocultar header/footer |

### Info
| Problema | Ubicación | Descripción |
|----------|------------|-------------|
| Efecto de nieve | App.jsx | `ACTIVAR_NIEVE = false` hardcodeado, debería ser configurable |
| Firestore rules nunca deployadas | firebase.json | Faltaba config (FIXED en sesión SEO) |

---

## 📝 Historial de Trabajo Realizado

### Sesión: Optimización (2026-03-31)
**Goal**: Optimizar y mejorar gio-tech-v2 con SEO, performance, analytics y productos populares automáticos

**Instrucciones**:
- Funcionalidad completa funcionando antes de seguir
- Mantener comunicación en español
- Evitar código que rompa runtime

**Descubrimientos**:
- Botón flotante IA needed style fix (era cuadrado)
- Carrusel tiene problemas de renderizado en mobile
- Reglas Firebase needed para colección producto_stats
- Productos populares se muestran con badge "🔥 HOT"
- Google Analytics integrado con ID G-1KGCQBPN75

**Completado**:
- ✅ Fase 1: Fix hooks violations, clean lint errors
- ✅ Fase 2: Custom hooks (useProducts, useConfig, useAuth), formatters centralizados
- ✅ SEO: Meta tags, Open Graph, Schema.org, JSON-LD
- ✅ Performance: Code splitting, OptimizedImage, Vite config
- ✅ Botón IA: Color azul tech (#1e3a8a), redondeado
- ✅ Carrusel: Ajustado para mobile sin cortes
- ✅ Google Analytics: ID G-1KGCQBPN75 integrado
- ✅ Productos populares: Registro de vistas en Firebase, muestra badge HOT

---

### Sesión: Chatbot IA (2026-04-07)
**Goal**: Optimizar el chatbot IA (Groq) de gio-tech-v2 para que dé mejores respuestas y mantenga el contexto

**Instrucciones**:
- Usuario quiere respuestas precisas y que el bot no "inventé" productos
- Lenguaje intermedio (ni técnico ni coloquial)
- Si el producto no existe, ser honesto y sugerir alternativas reales

**Descubrimientos**:
- El modelo Llama-3.1-8b-instant de Groq tiende a inventar productos
- El modelo perdía el hilo en preguntas de seguimiento ("cual es el mejor?", "entre esos")
- Solo se pasaban 10 productos al modelo, no todos los relevantes

**Completado**:
- ✅ Mejoró búsqueda de productos por marca (busca TODOS, no solo 5)
- ✅ Añadió historial de conversación (últimos 6 mensajes) para contexto
- ✅ Hizo el prompt más estricto con ejemplos claros
- ✅ Agregó detector de preguntas de seguimiento

---

### Sesión: Inventario + POS (2026-04-17)
**Goal**: Sistema inventario + mini POS para local de celulares con escaneo EAN/IMEI

**Instrucciones**:
- Para vendedor: rol "vendedor" separado de "asesor", redirige a /vendedor
- No mostrar Header/Footer público en /vendedor

**Descubrimientos**:
- html5-qrcode funciona para escaneo de códigos de barras
- Firestore requiere transacciones para decrementar stock
- El edit tool a veces no persiste - siempre verificar con grep después

**Completado**:
- ✅ Build pasa
- ✅ Formulario inventario con escaneo (BarcodeScanner + InventoryForm)
- ✅ Lista inventario (InventoryList)
- ✅ Panel vendedor con búsqueda + mini POS
- ✅ Selector rol en AdminPanel (asesor/vendedor)
- ✅ Ruta /vendedor protected
- ✅ Reglas Firestore para inventario y ventas
- ✅ Fix redirect vendedor → /vendedor
- ✅ Fix showHeaderAndFooter oculta Header/Footer en /vendedor

---

### Sesión: SEO Audit (2026-04-25)
**Goal**: SEO audit + fix productos destacados de gio-tech-v2

**Instrucciones**:
- Canonical debe apuntar a giotechshop.online (dominio actual)
- No deployar tests a producción sin limpiar debug logs

**Descubrimientos**:
- Auditor automático de SEO NO ejecuta React, reportaba contenido inexistente
- Firestore rules nunca se habían deployado (faltaba config en firebase.json)
- Productos populares no funcionaban por timing issue + need matching de IDs

**Completado**:
- ✅ Corregido canonical + OG URLs
- ✅ Deployado Firestore rules
- ✅ Fix timing issue productos populares

---

## 🔧 Scripts NPM

```bash
npm run dev      # Iniciar servidor de desarrollo
npm run build    # Build de producción
npm run lint     # Verificar código (ESLint)
npm run preview # Preview del build
npm run deploy   # Build + deploy a Firebase
```

---

## 🔐 Variables de Entorno

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_GROQ_API_KEY=...
```

---

## 🔗 Enlaces

| Recurso | URL |
|---------|-----|
| **Producción** | https://giotechshop.online |
| **Firebase Console** | https://console.firebase.google.com |
| **Groq Console** | https://console.groq.com |

---

## 📊 Resumen

| Métrica | Valor |
|---------|-------|
| Componentes | ~27 |
| Contextos | 3 |
| Hooks | 4 |
| Servicios | 6 |
| Colecciones Firestore | 7 |
| Rutas | 6 |
| Features | 17 |
| Líneas (App.jsx) | 275 |
| Líneas (AdminPanel.jsx) | 1652 ⚠️ |

---

*Documentación generada automáticamente - Mayo 2026*