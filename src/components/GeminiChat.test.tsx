import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import GeminiChat from './GeminiChat';
import { CartProvider } from '../contexts/CartContext';
import { WhatsappNumberProvider } from '../contexts/WhatsappNumberContext';
import { trackLead } from '../utils/metaPixel';
import type { Product } from '../types';

vi.mock('../utils/metaPixel', () => ({
  trackAddToCart: vi.fn(),
  trackLead: vi.fn(),
}));

const mockProducts: Product[] = [
  {
    id: 'prod-s24',
    nombre: 'Samsung Galaxy S24 Ultra',
    imagen: 'https://img.test/s24.jpg',
    contado: 4500000,
    marca: 'Samsung',
  },
];

describe('GeminiChat Component - Smart Handoff', () => {
  let openSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  it('renders chat interface and initial greeting', () => {
    render(
      <MemoryRouter>
        <WhatsappNumberProvider>
          <CartProvider>
            <GeminiChat productos={mockProducts} onClose={vi.fn()} />
          </CartProvider>
        </WhatsappNumberProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/¡Hola! 👋 Soy el asistente de GIO TECH/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Pregunta por tu celular ideal...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Hablar con un asesor/i })).toBeInTheDocument();
  });

  it('triggers smart handoff on clicking Hablar con un asesor and tracks lead event', () => {
    render(
      <MemoryRouter>
        <WhatsappNumberProvider>
          <CartProvider>
            <GeminiChat productos={mockProducts} onClose={vi.fn()} />
          </CartProvider>
        </WhatsappNumberProvider>
      </MemoryRouter>
    );

    const handoffBtn = screen.getByRole('button', { name: /Hablar con un asesor/i });
    fireEvent.click(handoffBtn);

    expect(openSpy).toHaveBeenCalledTimes(1);
    const url = openSpy.mock.calls[0][0] as string;
    expect(url).toContain('wa.me/');
    expect(url).toContain('Asistencia%20Virtual%20GIO%20TECH');

    expect(trackLead).toHaveBeenCalledWith(
      expect.objectContaining({
        content_type: 'chat_handoff',
        currency: 'COP',
      })
    );
  });
});
