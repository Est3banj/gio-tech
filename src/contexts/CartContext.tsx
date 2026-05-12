// src/contexts/CartContext.tsx
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { CartContextType, CartItem, CotizacionType } from '../types';
import type { Product } from '../types';
import { trackAddToCart } from '../utils/metaPixel';

const CartContext = createContext<CartContextType | null>(null);

// Hook personalizado para usar el carrito
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

// Props para el Provider
interface CartProviderProps {
  children: ReactNode;
}

// Proveedor del Contexto del Carrito
export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  // Estado del carrito, inicializado desde localStorage (si hay datos guardados)
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const localData = localStorage.getItem('gio-tech-cart');
      return localData ? JSON.parse(localData) : [];
    } catch {
      return [];
    }
  });

  // Efecto para guardar el carrito en localStorage cada vez que cambie
  useEffect(() => {
    try {
      localStorage.setItem('gio-tech-cart', JSON.stringify(cartItems));
    } catch {
      // Silent fail for localStorage errors
    }
  }, [cartItems]);

  // Función para añadir un producto al carrito
  const addToCart = (product: Product, type: CotizacionType) => {
    setCartItems(prevItems => {
      // Crear un ID único para el ítem en el carrito (producto ID + tipo de cotización)
      const itemId = `${product.id}-${type}`;
      
      // Verificar si el producto (con el mismo tipo de cotización) ya está en el carrito
      const exists = prevItems.find(item => item.itemId === itemId);

      if (exists) {
        // Si ya existe, no lo añadimos de nuevo
        return prevItems;
      } else {
        // Añadir el nuevo ítem al carrito con su tipo de cotización
        const newItem: CartItem = { 
          itemId,
          productId: product.id,
          nombre: product.nombre,
          imagen: product.imagen,
          contado: product.contado,
          cuotas6: product.cuotas6,
          cuotas8: product.cuotas8,
          cotizacionType: type
        };
        
        // Track del evento AddToCart a Meta Pixel
        trackAddToCart(product, type);
        
        return [...prevItems, newItem];
      }
    });
  };

  // Función para eliminar un ítem del carrito por su itemId
  const removeFromCart = (itemId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.itemId !== itemId));
  };

  // Función para vaciar completamente el carrito
  const clearCart = () => {
    setCartItems([]);
  };

  // Conteo de ítems en el carrito
  const cartCount = cartItems.length;

  // El proveedor del contexto que expone los valores y funciones
  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart, cartCount }}>
      {children}
    </CartContext.Provider>
  );
};
