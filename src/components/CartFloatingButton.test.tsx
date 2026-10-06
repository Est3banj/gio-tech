import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import CartFloatingButton from './CartFloatingButton';
import { CartProvider } from '../contexts/CartContext';
import { WhatsappNumberProvider } from '../contexts/WhatsappNumberContext';
import { trackLead } from '../utils/metaPixel';
import { AUTHORIZE_DATA_LABEL } from '../data/legal-copy';
import type { CartItem } from '../types';

vi.mock('../utils/metaPixel', () => ({
  trackAddToCart: vi.fn(),
  trackLead: vi.fn(),
}));

function renderCartWithItems(items: CartItem[] = []) {
  localStorage.setItem('gio-tech-cart', JSON.stringify(items));

  return render(
    <MemoryRouter>
      <WhatsappNumberProvider>
        <CartProvider>
          <CartFloatingButton />
        </CartProvider>
      </WhatsappNumberProvider>
    </MemoryRouter>
  );
}

describe('CartFloatingButton Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders empty cart drawer state when no items exist', () => {
    renderCartWithItems([]);

    const cartBtn = screen.getByRole('button', { name: /Ver carrito/i });
    fireEvent.click(cartBtn);

    expect(screen.getByText('Tu carrito de cotización está vacío.')).toBeInTheDocument();
  });

  it('renders items with quantity controls, displays correct subtotal and supports increment/decrement', () => {
    const items: CartItem[] = [
      {
        itemId: 'prod-1-contado',
        productId: 'prod-1',
        nombre: 'Xiaomi Redmi Note 13',
        imagen: 'https://img.test/redmi.jpg',
        contado: 1000000,
        cuotas6: 0,
        cuotas8: 0,
        cotizacionType: 'contado',
        cantidad: 2,
      },
    ];

    renderCartWithItems(items);

    const cartBtn = screen.getByRole('button', { name: /Ver carrito/i });
    fireEvent.click(cartBtn);

    expect(screen.getByText('Xiaomi Redmi Note 13')).toBeInTheDocument();
    expect(screen.getByText('Subtotal: $ 2.000.000')).toBeInTheDocument();

    const incBtn = screen.getByRole('button', { name: /Aumentar cantidad/i });
    fireEvent.click(incBtn);

    expect(screen.getByText('Subtotal: $ 3.000.000')).toBeInTheDocument();
  });

  it('renders special 12 months plan item correctly without $0 cuotas', () => {
    const items: CartItem[] = [
      {
        itemId: 'prod-2-credito',
        productId: 'prod-2',
        nombre: 'Samsung Galaxy S24 Ultra',
        imagen: 'https://img.test/s24.jpg',
        contado: 4500000,
        cuotas6: 0,
        cuotas8: 0,
        solo12Meses: true,
        cuotas12: 350000,
        cuotaInicial: 500000,
        cotizacionType: 'credito',
        cantidad: 1,
      },
    ];

    renderCartWithItems(items);

    const cartBtn = screen.getByRole('button', { name: /Ver carrito/i });
    fireEvent.click(cartBtn);

    expect(screen.getByText(/Crédito: 12x/)).toBeInTheDocument();
    expect(screen.getByText(/350\.000/)).toBeInTheDocument();
    expect(screen.queryByText(/Crédito: 12x \$0/)).not.toBeInTheDocument();
  });

  it('captures client pre-checkout info (nombre and municipio) and builds WhatsApp url on checkout', () => {
    const items: CartItem[] = [
      {
        itemId: 'prod-1-contado',
        productId: 'prod-1',
        nombre: 'Xiaomi Redmi Note 13',
        imagen: 'https://img.test/redmi.jpg',
        contado: 1000000,
        cuotas6: 0,
        cuotas8: 0,
        cotizacionType: 'contado',
        cantidad: 1,
      },
    ];

    renderCartWithItems(items);

    const cartBtn = screen.getByRole('button', { name: /Ver carrito/i });
    fireEvent.click(cartBtn);

    const nameInput = screen.getByLabelText('Nombre del cliente');
    fireEvent.change(nameInput, { target: { value: 'Carlos Mendoza' } });

    const sendBtn = screen.getByRole('button', { name: /Enviar Pedido a WhatsApp/i });

    // Gating de consentimiento: sin tildar no se envía
    expect(sendBtn).toHaveAttribute('aria-disabled', 'true');
    expect(sendBtn).toHaveClass('disabled');
    fireEvent.click(sendBtn);
    expect(trackLead).not.toHaveBeenCalled();
    expect(localStorage.getItem('gio-legal-consent-v1')).toBeNull();

    const consent = screen.getByRole('checkbox', { name: AUTHORIZE_DATA_LABEL });
    fireEvent.click(consent);

    expect(sendBtn.getAttribute('aria-disabled')).toBeNull();
    expect(sendBtn).not.toHaveClass('disabled');
    expect(sendBtn.getAttribute('href')).toContain('Carlos%20Mendoza');
    expect(sendBtn.getAttribute('href')).toContain('Puerto%20As%C3%ADs');
    expect(sendBtn.getAttribute('href')).toContain('Autorizacion%20de%20datos%20aceptada');

    fireEvent.click(sendBtn);

    // Verify trackLead called with total contado value
    expect(trackLead).toHaveBeenCalledWith(
      expect.objectContaining({
        content_type: 'product',
        value: 1000000,
        num_items: 1,
        currency: 'COP',
      })
    );

    const records = JSON.parse(localStorage.getItem('gio-legal-consent-v1') || '[]');
    expect(records[records.length - 1]).toMatchObject({ form: 'checkout', policyVersion: '2026-10' });
  });

  it('renders resilient thumbnail fallback on onError or empty image in cart list', () => {
    const items: CartItem[] = [
      {
        itemId: 'prod-broken-img',
        productId: 'prod-broken',
        nombre: 'Cargador Rápido 67W',
        imagen: 'https://img.test/invalid-thumb.jpg',
        contado: 120000,
        cuotas6: 0,
        cuotas8: 0,
        cotizacionType: 'contado',
        cantidad: 1,
      },
    ];

    renderCartWithItems(items);

    const cartBtn = screen.getByRole('button', { name: /Ver carrito/i });
    fireEvent.click(cartBtn);

    const img = screen.getByAltText('Cargador Rápido 67W');
    expect(img).toBeInTheDocument();

    // Trigger onError
    fireEvent.error(img);

    // Fallback renders without broken image
    const thumbFallback = screen.getByTestId('product-image-fallback-thumb');
    expect(thumbFallback).toBeInTheDocument();
  });
});
