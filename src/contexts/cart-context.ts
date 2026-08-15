// src/contexts/cart-context.ts
import { createContext, useContext } from 'react';
import type { CartContextType } from '../types';

export const CartContext = createContext<CartContextType | null>(null);

// Hook personalizado para usar el carrito
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
