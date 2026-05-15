# ⚡ GIO-TECH v2.0

**E-commerce de celulares y accesorios** — Putumayo, Colombia

🌐 **Producción**: [giotechshop.online](https://giotechshop.online)

---

## 🚀 Stack Tecnológico

| Capa | Tecnología | Versión |
|------|------------|---------|
| ⚛️ Frontend | React | 19.1.0 |
| ⚡ Build | Vite | 8.0.13 |
| 🎨 UI | Bootstrap + React Bootstrap | 5.3.6 / 2.10.10 |
| ✨ Animaciones | Framer Motion | 12.18.1 |
| 🔥 Backend | Firebase (Firestore, Auth, Hosting) | 11.9.1 |
| 🛣️ Routing | React Router DOM | 7.15.1 |
| 🎠 Carrusel | Swiper | 12.1.4 |
| 🤖 IA | Groq API (Llama 3.1 8B) | - |
| 📷 Scanner | html5-qrcode | 2.3.8 |
| 🟢 Lenguaje | TypeScript + JavaScript | Hybrid |

---

## 📂 Estructura del Proyecto

```
gio-tech-v2/
├── src/
│   ├── components/          # Componentes React (22 archivos)
│   │   ├── AdminPanel.tsx          # Panel de administración
│   │   ├── AsesorPanel.tsx         # Panel de asesores
│   │   ├── Catalogo.tsx            # Catálogo con filtros
│   │   ├── LandingPage.tsx         # Landing principal
│   │   ├── HomePage.tsx            # Página de inicio
│   │   ├── HeroCarousel.tsx        # Carrusel dinámico
│   │   ├── ProductCard.tsx         # Tarjeta de producto
│   │   ├── GeminiChat.tsx          # Chat con IA
│   │   ├── CompareModal.tsx        # Modal comparador
│   │   ├── Login.tsx               # Autenticación
│   │   ├── Header.tsx              # Navegación
│   │   ├── Footer.tsx              # Pie de página
│   │   ├── ServicioTecnicoPage.tsx # Servicio técnico
│   │   ├── WelcomeModal.tsx        # Modal de bienvenida
│   │   ├── CartFloatingButton.tsx  # Botón flotante carrito
│   │   ├── WhatsappFloatingButton.tsx # Botón WhatsApp
│   │   ├── OptimizedImage.tsx      # Imagen optimizada
│   │   ├── ThemeProvider.tsx      # Provider de tema
│   │   └── SnowfallEffect.tsx      # Efecto de nieve
│   ├── contexts/            # React Contexts
│   │   ├── CartContext.tsx         # Carrito de compras
│   │   └── WhatsappNumberContext.tsx # Número dinámico
│   ├── hooks/               # Custom Hooks (TypeScript)
│   │   ├── useProducts.ts          # Productos desde Firestore
│   │   ├── usePopularProducts.ts   # Productos populares
│   │   ├── useAuth.ts              # Autenticación
│   │   └── useConfig.ts            # Configuración global
│   ├── services/           # Servicios Firebase (TypeScript)
│   │   ├── product.service.ts      # CRUD productos
│   │   ├── productStats.service.ts # Estadísticas
│   │   ├── config.service.ts       # Configuración
│   │   └── gemini.service.ts       # Chat IA (Groq)
│   ├── utils/              # Utilidades
│   │   ├── specsParser.js          # Parser de specs
│   │   ├── metaPixel.ts           # Meta Pixel
│   │   └── formatters.js          # Formateadores
│   ├── data/               # Datos estáticos
│   │   ├── productos.js           # Catálogo local
│   │   └── business-info.js       # Info del negocio
│   ├── types/              # TypeScript types
│   │   └── index.ts              # Definiciones de tipos
│   ├── styles/            # Estilos CSS
│   ├── App.jsx           # Componente principal
│   ├── main.jsx          # Entry point
│   └── firebase.js       # Config Firebase
├── public/                # Archivos públicos
│   ├── robots.txt        # SEO
│   └── sitemap.xml       # Mapa del sitio
├── vite.config.js        # Config Vite
├── tsconfig.json         # Config TypeScript
└── package.json          # Dependencias
```

---

## 🗄️ Firestore - Colecciones

| Colección | Descripción |
|-----------|-------------|
| `productos` | Catálogo de celulares/accesorios |
| `usuarios` | Usuarios (admin, asesor, cliente) |
| `configuracion` | Config global (general) |
| `carrusel` | Slides del carrusel |
| `producto_stats` | Vistas de productos |

---

## 🎯 Features

- [x] Catálogo de productos con filtros y búsqueda
- [x] Chat interactivo con IA (Groq/Llama)
- [x] Sistema de comparación de productos
- [x] Carrito persistente (localStorage)
- [x] Autenticación Firebase (roles: admin/asesor/cliente)
- [x] Panel de administración
- [x] Panel de asesores
- [x] Botón flotante WhatsApp dinámico
- [x] Dark Mode
- [x] Hero carrusel dinámico desde Firestore
- [x] Scanner de códigos QR
- [x] Meta Pixel integration
- [x] SEO (robots.txt, sitemap.xml)
- [x] Optimización de imágenes

---

## 🛠️ Scripts

```bash
npm run dev      # Servidor desarrollo
npm run build    # Build producción
npm run preview # Preview build
npm run deploy  # Build + Firebase deploy
npm run lint    # Linter
```

---

## 🌐 Producción

- **URL**: https://giotechshop.online
- **Firebase Hosting**: gio-tech.web.app
- **Firebase Console**: https://console.firebase.google.com

---

## 📝 Notas

- Proyecto migrado parcialmente a TypeScript (servicios y hooks)
- Sistema MiniPOS e Inventario eliminados del core (desarrollar en proyecto separado)
- Efecto de nieve季节al (controlado por config)
- Debug logs removidos en producción

---

*Última actualización: Mayo 2026*
*Built with 🔥 and ⚛️*