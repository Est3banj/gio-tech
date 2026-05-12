# Gio-Tech v2 🛒

E-commerce de venta de celulares y accesorios en Putumayo (Colombia), con presencia física (local) y tienda online.

## 🚀 Tecnologías

| Capa | Tecnología |
|------|------------|
| Frontend | React 19.1.0 |
| Build Tool | Vite 6.3.5 |
| UI Framework | Bootstrap 5.3.6 + React Bootstrap 2.10.10 |
| Animaciones | Framer Motion 12.18.1 |
| Backend/DB | Firebase 11.9.1 (Firestore, Auth, Hosting) |
| Routing | React Router DOM 6.30.1 |
| Carrusel | Swiper 12.0.3 |
| IA | Groq API (Llama 3.1 8B Instant) |
| Scanner | html5-qrcode 2.3.8 |

## 📁 Estructura del Proyecto

```
gio-tech-v2/
├── src/
│   ├── components/          # Componentes React
│   │   ├── inventario/      # Gestión de inventario
│   │   └── vendedor/        # Panel y herramientas del vendedor
│   ├── contexts/            # React Context Providers
│   ├── hooks/               # Custom Hooks
│   ├── services/           # Servicios Firebase
│   ├── utils/               # Utilidades
│   ├── data/                # Datos estáticos
│   ├── styles/              # Estilos CSS adicionales
│   ├── App.jsx             # Componente principal
│   └── main.jsx            # Entry point
├── public/                  # Archivos estáticos públicos
├── scripts/                 # Scripts de migración/backfill
└── package.json
```

## 🗄️ Base de Datos (Firestore)

### Colecciones

#### `productos`
Catálogo de productos/teléfonos para venta.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| nombre | string | Nombre del producto |
| descripcion | string | Descripción |
| imagen | string | URL de imagen |
| cuotas6, cuotas8, cuotas12 | number | Precio en cuotas |
| cuotaInicial | number | Cuota inicial |
| promoActive | boolean | Promoción activa |
| promoPrice | number | Precio promocional |
| promoLabel, promoBadgeBg | string | Etiqueta de promo |
| nuevo | boolean | Producto nuevo |
| badgeMode | string | Modo de badge |

#### `inventario`
Control de stock de equipos físicos.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| ean | string | Código EAN |
| modelo | string | Modelo del equipo |
| imei1, imei2 | string | IMEIs del equipo |
| storage, ram | string | Especificaciones |
| cantidad | number | Stock disponible |
| estado | string | disponible/vendido |
| fechaAgregado, fechaVenta | timestamp | Fechas |

#### `ventas`
Registro de ventas realizadas.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| inventarioId | string | ID del inventario |
| imei1, imei2 | string | IMEI vendido |
| modelo | string | Modelo vendido |
| precioVenta | number | Precio de venta |
| vendedorUid | string | UID del vendedor |
| fecha | timestamp | Fecha de venta |

#### `usuarios`
Usuarios del sistema.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| email | string | Email del usuario |
| rol | string | admin/asesor/vendedor/cliente |
| nombreCompleto | string | Nombre completo |
| whatsappNumber | string | Número de WhatsApp |

#### `configuracion` (documento: `general`)
Configuración global del negocio.

#### `carrusel`
Slides del carrusel en landing page.

#### `producto_stats`
Estadísticas de vistas de productos.

## 🧩 Componentes Principales

| Componente | Ruta | Descripción |
|------------|------|-------------|
| LandingPage | `/` | Página de inicio con hero, servicios, reseñas |
| Catalogo | `/catalogo` | Catálogo con filtros, búsqueda y chat IA |
| ProductCard | - | Tarjeta de producto con modal de detalles |
| Login | `/login` | Autenticación con Firebase Auth |
| AdminPanel | `/panel` | Panel de administración (1652 líneas) |
| AsesorPanel | `/panel` | Panel para asesores |
| VendedorPanel | `/vendedor` | Panel de ventas con MiniPOS |
| GeminiChat | - | Chat interactivo con IA (Groq) |
| HeroCarousel | - | Carrusel dinámico desde Firestore |

## 🧠 Contextos (State Management)

```javascript
CartContext         // Carrito de compras con persistencia localStorage
InventoryContext    // Inventario global en tiempo real
WhatsappNumberContext // Número de WhatsApp dinámico por asesor
```

## 🪝 Custom Hooks

```javascript
useProducts         // Suscripción a productos (usa store externo)
usePopularProducts  // Productos más vistos
useAuth             // Estado de autenticación
useConfig           // Configuración global
```

## 🔌 Servicios

```javascript
product.service.js       // CRUD productos
inventario.service.js   // Gestión inventario (EAN/IMEI)
venta.service.js        // Registro de ventas con transacciones
config.service.js        // Configuración del negocio
productStats.service.js // Estadísticas de vistas
gemini.service.js       // Chat IA (Groq API)
```

## 🎨 UI/UX

- **CSS**: Bootstrap 5 + Custom CSS con CSS Variables
- **Dark Mode**: Soporte completo via `.dark-mode` class
- **Animaciones**: Framer Motion para transiciones
- **Colores Brand**: Gio Red (#C8102E), Brand Green (#22c55e)
- **Iconos**: Bootstrap Icons

## 📝 Rutas

| Path | Componente | Tipo |
|------|------------|------|
| `/` | LandingPage | Público |
| `/catalogo` | Catalogo | Público |
| `/servicio-tecnico` | ServicioTecnicoPage | Público |
| `/login` | Login | Público |
| `/panel` | AdminPanel / AsesorPanel | Protegida |
| `/vendedor` | VendedorPanel | Protegida (rol: vendedor) |

## ⚙️ Scripts

```bash
npm run dev      # Iniciar servidor de desarrollo
npm run build    # Build de producción
npm run lint     # Verificar código
npm run preview  # Preview del build
npm run deploy   # Build + deploy a Firebase
```

## 🔧 Variables de Entorno

```env
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_GROQ_API_KEY
```

## 🐛 Issues Conocidos

| Problema | Severidad | Descripción |
|----------|-----------|-------------|
| AdminPanel monolítico (1652 líneas) | Media | Debe dividirse en sub-componentes |
| Sin tests implementados | Alta | No hay tests unitarios ni de integración |
| Firebase config expuesta | Media | Estructura de reglas debe garantizar seguridad |
| Hardcoded values en Footer | Baja | WhatsApp/dirección deberían estar en Firestore |
| Debug console.logs | Baja | Deben removerse en producción |
| Efecto de nieve deshabilitado | Info | Hardcodeado, debería ser configurable |

## ✅ Features Implementadas

- [x] E-commerce de celulares (contado + crédito)
- [x] Catálogo con filtros y búsqueda
- [x] Carrito persistente (localStorage)
- [x] Chat IA (Gemini/Groq)
- [x] Sistema de roles (admin/asesor/vendedor/cliente)
- [x] Panel de administración
- [x] Panel de vendedor (MiniPOS)
- [x] Panel de asesor
- [x] Dark Mode
- [x] Botón flotante WhatsApp dinámico
- [x] Estadísticas de productos
- [x] Hero Carrusel dinámico
- [x] Scanner de códigos (html5-qrcode)
- [x] Meta Pixel Integration

## 🔗 Enlaces

- **Producción**: https://giotechshop.online
- **Firebase Console**: https://console.firebase.google.com

---

*Documentación generada automáticamente - 2026*