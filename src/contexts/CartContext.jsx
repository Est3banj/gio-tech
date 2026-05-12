// src/contexts/CartContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { trackAddToCart } from '../utils/metaPixel';

const CartContext = createContext();

// Hook personalizado para usar el carrito
export const useCart = () => {
  return useContext(CartContext);
};

// Proveedor del Contexto del Carrito
export const CartProvider = ({ children }) => {
  // Estado del carrito, inicializado desde localStorage (si hay datos guardados)
  const [cartItems, setCartItems] = useState(() => {
    try {
      const localData = localStorage.getItem('gio-tech-cart');
      return localData ? JSON.parse(localData) : [];
    } catch (error) {
      console.error("Error al cargar el carrito de localStorage:", error);
      return [];
    }
  });

  // Efecto para guardar el carrito en localStorage cada vez que cambie
  useEffect(() => {
    try {
      localStorage.setItem('gio-tech-cart', JSON.stringify(cartItems));
    } catch (error) {
      console.error("Error al guardar el carrito en localStorage:", error);
    }
  }, [cartItems]); // Se ejecuta cada vez que cartItems cambia

  // Función para añadir un producto al carrito
  const addToCart = (product, type) => { // 'type' será 'contado' o 'credito'
    setCartItems(prevItems => {
      // Crear un ID único para el ítem en el carrito (producto ID + tipo de cotización)
      const itemId = `${product.id}-${type}`;
      
      // Verificar si el producto (con el mismo tipo de cotización) ya está en el carrito
      const exists = prevItems.find(item => item.itemId === itemId);

      if (exists) {
        // Si ya existe, no lo añadimos de nuevo (puedes añadir lógica para incrementar cantidad si lo prefieres)
        return prevItems;
      } else {
        // Añadir el nuevo ítem al carrito con su tipo de cotización
        const newItem = { 
          itemId, // ID único del ítem en el carrito
          productId: product.id, // ID del producto de Firebase
          nombre: product.nombre,
          imagen: product.imagen,
          contado: product.contado, // Almacenamos ambos precios para el mensaje final
          cuotas6: product.cuotas6,
          cuotas8: product.cuotas8,
          cotizacionType: type // 'contado' o 'credito'
        };
        
        // Track del evento AddToCart a Meta Pixel
        trackAddToCart(product, type);
        
        return [...prevItems, newItem];
      }
    });
  };

  // Función para eliminar un ítem del carrito por su itemId
  const removeFromCart = (itemId) => {
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