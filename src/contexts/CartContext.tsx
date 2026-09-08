// src/contexts/CartContext.tsx
import React, { useState, useEffect, type ReactNode } from 'react';
import type { CartItem, CotizacionType } from '../types';
import type { Product } from '../types';
import { trackAddToCart } from '../utils/metaPixel';
import { CartContext } from './cart-context';

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
      if (!localData) return [];
      const parsed = JSON.parse(localData);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((item: Partial<CartItem>) => ({
        ...item,
        cantidad: typeof item.cantidad === 'number' && item.cantidad > 0 ? item.cantidad : 1,
        contado: item.contado ?? 0,
        cuotas6: item.cuotas6 ?? 0,
        cuotas8: item.cuotas8 ?? 0,
        cuotas12: item.cuotas12 ?? 0,
        solo12Meses: Boolean(item.solo12Meses),
        cuotaInicial: item.cuotaInicial ?? 0,
      })) as CartItem[];
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
  const addToCart = (product: Product, type: CotizacionType, cantidad: number = 1) => {
    const qtyToAdd = Math.max(1, Math.floor(cantidad || 1));
    setCartItems(prevItems => {
      // Crear un ID único para el ítem en el carrito (producto ID + tipo de cotización)
      const itemId = `${product.id}-${type}`;
      
      // Verificar si el producto (con el mismo tipo de cotización) ya está en el carrito
      const exists = prevItems.find(item => item.itemId === itemId);

      if (exists) {
        // Si ya existe, incrementamos su cantidad
        return prevItems.map(item =>
          item.itemId === itemId
            ? { ...item, cantidad: item.cantidad + qtyToAdd }
            : item
        );
      } else {
        // Añadir el nuevo ítem al carrito con su tipo de cotización y soporte de 12 meses
        const newItem: CartItem = { 
          itemId,
          productId: product.id,
          nombre: product.nombre,
          imagen: product.imagen,
          contado: product.contado ?? 0,
          cuotas6: product.cuotas6 ?? 0,
          cuotas8: product.cuotas8 ?? 0,
          solo12Meses: Boolean(product.solo12Meses),
          cuotas12: product.cuotas12 ?? 0,
          cuotaInicial: product.cuotaInicial ?? 0,
          cotizacionType: type,
          cantidad: qtyToAdd
        };
        
        // Track del evento AddToCart a Meta Pixel
        trackAddToCart(product, type);
        
        return [...prevItems, newItem];
      }
    });
  };

  // Función para modificar la cantidad directa de un ítem
  const updateQuantity = (itemId: string, cantidad: number) => {
    const validQty = Math.floor(cantidad);
    if (validQty <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.itemId === itemId ? { ...item, cantidad: validQty } : item
      )
    );
  };

  // Incrementar en 1 la cantidad
  const incrementQuantity = (itemId: string) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.itemId === itemId ? { ...item, cantidad: (item.cantidad || 1) + 1 } : item
      )
    );
  };

  // Decrementar en 1 la cantidad (si llega a 0, se elimina)
  const decrementQuantity = (itemId: string) => {
    setCartItems(prevItems => {
      const target = prevItems.find(item => item.itemId === itemId);
      if (!target) return prevItems;
      if (target.cantidad <= 1) {
        return prevItems.filter(item => item.itemId !== itemId);
      }
      return prevItems.map(item =>
        item.itemId === itemId ? { ...item, cantidad: item.cantidad - 1 } : item
      );
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

  // Conteo total de unidades en el carrito
  const cartCount = cartItems.reduce((sum, item) => sum + (item.cantidad || 1), 0);

  // El proveedor del contexto que expone los valores y funciones
  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        incrementQuantity,
        decrementQuantity,
        clearCart,
        cartCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
