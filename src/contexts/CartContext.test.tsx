import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React, { type ReactNode } from 'react';
import { CartProvider } from './CartContext';
import { useCart } from './cart-context';
import type { Product } from '../types';

vi.mock('../utils/metaPixel', () => ({
  trackAddToCart: vi.fn(),
  trackLead: vi.fn(),
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

const sampleProduct1: Product = {
  id: 'prod-1',
  nombre: 'Xiaomi Redmi Note 13',
  imagen: 'https://img.test/redmi.jpg',
  contado: 1200000,
  cuotas6: 120000,
  cuotas8: 95000,
  solo12Meses: false,
};

const sampleProduct12Meses: Product = {
  id: 'prod-2',
  nombre: 'Samsung Galaxy S24 Ultra Plan Especial',
  imagen: 'https://img.test/s24.jpg',
  contado: 4500000,
  cuotas6: null,
  cuotas8: null,
  solo12Meses: true,
  cuotas12: 350000,
  cuotaInicial: 500000,
};

describe('CartContext & CartProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('initializes with empty cart and cartCount 0', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.cartItems).toEqual([]);
    expect(result.current.cartCount).toBe(0);
  });

  it('adds a new product to cart with cantidad = 1 and calculates cartCount correctly', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(sampleProduct1, 'contado');
    });

    expect(result.current.cartItems).toHaveLength(1);
    expect(result.current.cartItems[0]).toMatchObject({
      itemId: 'prod-1-contado',
      productId: 'prod-1',
      nombre: 'Xiaomi Redmi Note 13',
      contado: 1200000,
      cotizacionType: 'contado',
      cantidad: 1,
      solo12Meses: false,
    });
    expect(result.current.cartCount).toBe(1);
  });

  it('increments quantity when adding the same product and cotizacionType again', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(sampleProduct1, 'contado');
    });
    act(() => {
      result.current.addToCart(sampleProduct1, 'contado', 2);
    });

    expect(result.current.cartItems).toHaveLength(1);
    expect(result.current.cartItems[0].cantidad).toBe(3);
    expect(result.current.cartCount).toBe(3);
  });

  it('stores 12 meses special plan properties (solo12Meses, cuotas12, cuotaInicial)', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(sampleProduct12Meses, 'credito');
    });

    expect(result.current.cartItems).toHaveLength(1);
    const item = result.current.cartItems[0];
    expect(item.solo12Meses).toBe(true);
    expect(item.cuotas12).toBe(350000);
    expect(item.cuotaInicial).toBe(500000);
    expect(item.cotizacionType).toBe('credito');
  });

  it('supports incrementQuantity, decrementQuantity and removes item when quantity reaches 0', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(sampleProduct1, 'contado', 2);
    });
    expect(result.current.cartItems[0].cantidad).toBe(2);

    act(() => {
      result.current.incrementQuantity('prod-1-contado');
    });
    expect(result.current.cartItems[0].cantidad).toBe(3);
    expect(result.current.cartCount).toBe(3);

    act(() => {
      result.current.decrementQuantity('prod-1-contado');
    });
    expect(result.current.cartItems[0].cantidad).toBe(2);

    act(() => {
      result.current.decrementQuantity('prod-1-contado');
    });
    expect(result.current.cartItems[0].cantidad).toBe(1);

    // Decrementing when quantity is 1 removes the item
    act(() => {
      result.current.decrementQuantity('prod-1-contado');
    });
    expect(result.current.cartItems).toHaveLength(0);
    expect(result.current.cartCount).toBe(0);
  });

  it('supports updateQuantity directly and removes item if quantity <= 0', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(sampleProduct1, 'contado');
    });
    act(() => {
      result.current.updateQuantity('prod-1-contado', 5);
    });
    expect(result.current.cartItems[0].cantidad).toBe(5);
    expect(result.current.cartCount).toBe(5);

    act(() => {
      result.current.updateQuantity('prod-1-contado', 0);
    });
    expect(result.current.cartItems).toHaveLength(0);
    expect(result.current.cartCount).toBe(0);
  });

  it('supports removeFromCart and clearCart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart(sampleProduct1, 'contado');
      result.current.addToCart(sampleProduct12Meses, 'credito');
    });
    expect(result.current.cartItems).toHaveLength(2);

    act(() => {
      result.current.removeFromCart('prod-1-contado');
    });
    expect(result.current.cartItems).toHaveLength(1);
    expect(result.current.cartItems[0].itemId).toBe('prod-2-credito');

    act(() => {
      result.current.clearCart();
    });
    expect(result.current.cartItems).toHaveLength(0);
    expect(result.current.cartCount).toBe(0);
  });

  it('loads and normalizes items from localStorage with missing cantidad', () => {
    const saved = [
      {
        itemId: 'prod-legacy-1',
        productId: 'prod-legacy',
        nombre: 'Legacy Phone',
        imagen: '',
        contado: 800000,
        cuotas6: 0,
        cuotas8: 0,
        cotizacionType: 'contado',
      }
    ];
    localStorage.setItem('gio-tech-cart', JSON.stringify(saved));

    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.cartItems).toHaveLength(1);
    expect(result.current.cartItems[0].cantidad).toBe(1);
    expect(result.current.cartCount).toBe(1);
  });
});
