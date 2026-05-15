# GIO-TECH v2

E-commerce de celulares y accesorios - Putumayo, Colombia

**Produccion**: https://giotechshop.online

---

## Stack

- React 19 + Vite 8
- Bootstrap 5 + React Bootstrap
- Firebase (Firestore, Auth, Hosting)
- React Router DOM 7
- Framer Motion
- Groq API (IA)

---

## Estructura

```
src/
├── components/     # 22 componentes React
├── contexts/       # CartContext, WhatsappNumberContext
├── hooks/          # useProducts, useAuth, useConfig
├── services/       # Firebase services (TypeScript)
├── utils/          # specsParser, formatters
├── data/           # Datos estaticos
├── types/          # TypeScript definitions
├── App.jsx
└── main.jsx
```

---

## Colecciones Firestore

- productos
- usuarios
- configuracion
- carrusel
- producto_stats

---

## Features

- Catalogo con filtros y busqueda
- Chat con IA (Groq/Llama)
- Comparador de productos
- Carrito persistente (localStorage)
- Autenticacion Firebase (roles: admin, asesor, cliente)
- Panel de administracion
- Boton flotante WhatsApp
- Dark Mode
- SEO (robots.txt, sitemap.xml)

---

## Scripts

```bash
npm run dev      # Desarrollo
npm run build    # Produccion
npm run deploy   # Firebase deploy
```

---

*Mayo 2026*