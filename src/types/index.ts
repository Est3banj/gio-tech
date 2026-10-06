// ============================================
// TIPOS BASE DEL PROYECTO GIO-TECH
// ============================================

// ---------------------------------------------------------------------
// 📦 PRODUCTOS (Catálogo)
// ---------------------------------------------------------------------
export interface ProductSpecs {
  almacenamiento: number | null;
  ram: number | null;
  camara: number | null;
  pantalla: number | null;
  bateria: number | null;
}

export interface Product {
  id: string;
  nombre: string;
  marca?: string;
  modelo?: string;
  precio?: number;
  precioAnterior?: number;
  imagen: string;
  imagenes?: string[];
  descripcion?: string;
  stock?: number;
  enStock?: boolean;
  categoria?: string;
  esDestacado?: boolean;
  fechaAgregado?: Date;
  // Campos de AdminPanel
  contado?: number | null;
  cuotas6?: number | null;
  cuotas8?: number | null;
  cuotaInicial?: number | null;
  specs?: ProductSpecs;
  // Promo
  promo?: boolean;
  promoPrice?: number | null;
  promoBadgeText?: string | null;
  promoBadgeBg?: string | null;
  promoHighlight?: string | null;
  // Nuevo badge
  nuevo?: boolean;
  nuevoBadgeText?: string | null;
  nuevoBadgeBg?: string | null;
  // Badge mode: 'none' | 'promo' | 'nuevo' | 'ambos'
  badgeMode?: 'none' | 'promo' | 'nuevo' | 'ambos';
  // Financiación 12 meses
  solo12Meses?: boolean;
  cuotas12?: number | null;
  // Firestore
  createdAt?: Date;
}

// ---------------------------------------------------------------------
// 👤 USUARIOS
// ---------------------------------------------------------------------
export type UserRole = 'admin' | 'asesor' | 'cliente';

export interface User {
  uid: string;
  email: string;
  rol: UserRole;
  nombreCompleto?: string;
  whatsappNumber?: string;
  fechaCreacion?: Date;
}

// ---------------------------------------------------------------------
// 💳 FINANCIERAS (Crédito)
// ---------------------------------------------------------------------
export interface CampoFormulario {
  name: string;
  label: string;
  type: 'text' | 'email' | 'radio';
  required?: boolean;
  options?: string[];
}

export interface Financiera {
  id: string;
  nombre: string;
  logo: string;
  tipo: 'autovalidacion' | 'asesor';
  urlAutovalidacion?: string;
  aplicaEn: {
    iphone: boolean;
    android: boolean;
    electrodomestico: boolean;
    accesorio: boolean;
  };
  campos: CampoFormulario[];
}

// ---------------------------------------------------------------------
// 🛒 CARRITO
// ---------------------------------------------------------------------
export type CotizacionType = 'contado' | 'credito';

export interface CartItem {
  itemId: string;           // ID único: productId-cotizacionType
  productId: string;        // ID del producto en Firebase
  nombre: string;
  imagen: string;
  contado: number;
  cuotas6: number;
  cuotas8: number;
  cotizacionType: CotizacionType;
  cantidad: number;
  solo12Meses?: boolean;
  cuotas12?: number | null;
  cuotaInicial?: number | null;
}

export interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, type: CotizacionType, cantidad?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, cantidad: number) => void;
  incrementQuantity: (itemId: string) => void;
  decrementQuantity: (itemId: string) => void;
  clearCart: () => void;
  cartCount: number;
}

// ---------------------------------------------------------------------
// ⚙️ CONFIGURACIÓN
// ---------------------------------------------------------------------
export interface ThemeVars {
  "--promo-badge-bg"?: string;
  "--promo-badge-text"?: string;
  "--promo-highlight"?: string;
  "--theme-name"?: string;
  [key: string]: string | undefined;
}

export interface ThemeConfig {
  enabled: boolean;
  start?: Date | null;
  end?: Date | null;
  vars: ThemeVars;
}

export interface StoreConfig {
  nombre?: string;
  logo?: string;
  descripcion?: string;
  whatsappNumber?: string;
  telefono?: string;
  direccion?: string;
  email?: string;
  mapsUrl?: string;
  horarios?: string;
  redesSociales?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
  };
  theme?: ThemeConfig | null;
}

// ---------------------------------------------------------------------
// 🎠 BANNER (para BannerSlider)
// ---------------------------------------------------------------------
export interface Banner {
  id: string;
  title?: string;
  description?: string;
  imageUrl: string;
  image?: string;
  link?: string;
  order: number;
  isActive: boolean;
}

// 🎠 CARRUSEL (Admin legacy)
// ---------------------------------------------------------------------
export interface CarouselSlide {
  id: string;
  url_imagen: string;
  titulo?: string;
  descripcion?: string;
  enlace?: string;
  orden?: number;
  activo?: boolean;
}

// Slide format used in AdminPanel (Firestore)
export interface CarouselSlideAdmin {
  id: string;
  url_imagen: string;
  titulo?: string;
  orden?: number;
  activo?: boolean;
  createdAt?: Date;
}

// ---------------------------------------------------------------------
// 👥 ASESORES
// ---------------------------------------------------------------------
export interface Asesor {
  id: string;
  email: string;
  nombreCompleto: string;
  rol: string;
  whatsappNumber: string;
}

// ---------------------------------------------------------------------
// OPINIONES DE GOOGLE (reseñas reales curadas desde el panel admin)
// ---------------------------------------------------------------------
export interface Opinion {
  id: string;
  autor: string;
  estrellas: number;
  texto: string;
  ubicacion?: string;
  perfilUrl?: string;
  activo: boolean;
  createdAt?: Date;
}

// ---------------------------------------------------------------------
// 💬 CHAT / MENSAJES
// ---------------------------------------------------------------------
export interface ChatMessage {
  id?: string;
  rol: 'usuario' | 'asistente';
  texto: string;
  timestamp?: Date;
}

// ---------------------------------------------------------------------
// 📊 ANALYTICS
// ---------------------------------------------------------------------
export interface ProductStats {
  id?: string;
  productoId: string;
  vistas: number;
  ultimaVista?: Date;
}
