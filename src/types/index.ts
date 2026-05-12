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
export interface CartItem {
  product: Product;
  cantidad: number;
}

export interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, cantidad?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, cantidad: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
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
