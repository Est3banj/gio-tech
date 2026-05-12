// ============================================
// TIPOS BASE DEL PROYECTO GIO-TECH
// ============================================

// ---------------------------------------------------------------------
// 📦 PRODUCTOS (Catálogo)
// ---------------------------------------------------------------------
export interface Product {
  id: string;
  nombre: string;
  marca: string;
  modelo: string;
  precio: number;
  precioAnterior?: number;
  imagen: string;
  imagenes?: string[];
  descripcion?: string;
  stock?: number;
  categoria?: string;
  esDestacado?: boolean;
  fechaAgregado?: Date;
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
}

export interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, type: CotizacionType) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  cartCount: number;
}

// ---------------------------------------------------------------------
// ⚙️ CONFIGURACIÓN
// ---------------------------------------------------------------------
export interface StoreConfig {
  nombre?: string;
  logo?: string;
  descripcion?: string;
  whatsappNumber?: string;
  email?: string;
  redesSociales?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
  };
}

// ---------------------------------------------------------------------
// 🎠 CARRUSEL
// ---------------------------------------------------------------------
export interface CarouselSlide {
  id: string;
  imagen: string;
  titulo?: string;
  descripcion?: string;
  enlace?: string;
  orden?: number;
  activo?: boolean;
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
