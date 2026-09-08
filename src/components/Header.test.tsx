// src/components/Header.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header, { DEFAULT_HEADER_ADDRESS } from './Header';
import type { UseConfigReturn } from '../hooks/useConfig';
import type { StoreConfig } from '../types';

const mockUseConfig = vi.fn<() => UseConfigReturn>();

vi.mock('../hooks/useConfig', () => ({
  useConfig: () => mockUseConfig(),
}));

describe('Header Component & Top Trust Bar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.body.className = '';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders default address fallback when config is empty', () => {
    mockUseConfig.mockReturnValue({
      config: {},
      isLoading: false,
      error: null,
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>
    );

    // Verify default address is rendered in trust bar
    const addressElements = screen.getAllByText(DEFAULT_HEADER_ADDRESS);
    expect(addressElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Envíos seguros a todo el/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Putumayo').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Garantía Directa/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders dynamic address and store name from useConfig when available', () => {
    const customConfig: StoreConfig = {
      nombre: 'Gio Tech Premium Store',
      logo: 'https://example.com/logo.png',
      direccion: 'Carrera 10 # 15-20, Puerto Asís',
    };

    mockUseConfig.mockReturnValue({
      config: customConfig,
      isLoading: false,
      error: null,
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>
    );

    const addressElements = screen.getAllByText('Carrera 10 # 15-20, Puerto Asís');
    expect(addressElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Gio Tech Premium Store')).toBeInTheDocument();
    const logoImg = screen.getByAltText('Gio Tech Premium Store');
    expect(logoImg).toHaveAttribute('src', 'https://example.com/logo.png');
  });

  it('contains proper accessibility attributes and trust bar structure', () => {
    mockUseConfig.mockReturnValue({
      config: {},
      isLoading: false,
      error: null,
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>
    );

    const trustBar = screen.getByRole('region', { name: /Información de confianza/i });
    expect(trustBar).toBeInTheDocument();
    expect(trustBar).toHaveClass('gio-top-trust-bar');
  });

  it('renders the continuous marquee track with trust pillars and separators', () => {
    mockUseConfig.mockReturnValue({
      config: { direccion: 'Cra. 32 #13 36, Puerto Asís, Putumayo' },
      isLoading: false,
      error: null,
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>
    );

    const marqueeTrack = container.querySelector('.trust-marquee-track');
    expect(marqueeTrack).toBeInTheDocument();

    const marqueeGroups = container.querySelectorAll('.trust-marquee-group');
    expect(marqueeGroups.length).toBeGreaterThanOrEqual(2);

    // Verify content inside marquee
    expect(marqueeTrack?.textContent).toContain('Tienda física: Cra. 32 #13 36, Puerto Asís, Putumayo');
    expect(marqueeTrack?.textContent).toContain('Envíos seguros a todo el Putumayo');
    expect(marqueeTrack?.textContent).toContain('Garantía Directa');

    // Verify icons
    expect(container.querySelector('.bi-geo-alt-fill.text-danger')).toBeInTheDocument();
    expect(container.querySelector('.bi-truck.text-primary')).toBeInTheDocument();
    expect(container.querySelector('.bi-shield-check.text-success')).toBeInTheDocument();
  });

  it('toggles dark mode when theme button is clicked', () => {
    mockUseConfig.mockReturnValue({
      config: {},
      isLoading: false,
      error: null,
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>
    );

    const toggleBtn = screen.getByRole('button', { name: /Toggle theme/i });
    expect(toggleBtn).toBeInTheDocument();

    fireEvent.click(toggleBtn);
    expect(document.body.classList.contains('dark-mode')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');

    fireEvent.click(toggleBtn);
    expect(document.body.classList.contains('dark-mode')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('toggles mobile menu overlay when mobile menu button is clicked', () => {
    mockUseConfig.mockReturnValue({
      config: {},
      isLoading: false,
      error: null,
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>
    );

    const menuToggle = screen.getByRole('button', { name: /Toggle mobile menu/i });
    expect(menuToggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(menuToggle);
    expect(menuToggle).toHaveAttribute('aria-expanded', 'true');
    expect(container.querySelector('.mobile-nav-overlay')).toHaveClass('open');

    // Click link inside mobile nav to close
    const mobileLinks = screen.getAllByRole('link', { name: /Inicio/i });
    const mobileNavLink = mobileLinks.find(el => el.classList.contains('mobile-nav-link'));
    if (mobileNavLink) {
      fireEvent.click(mobileNavLink);
      expect(container.querySelector('.mobile-nav-overlay')).not.toHaveClass('open');
    }
  });

  it('renders seasonal trust message when theme is active (e.g. valentine)', () => {
    mockUseConfig.mockReturnValue({
      config: {
        theme: {
          enabled: true,
          vars: {
            '--theme-name': 'valentine',
          },
        },
      },
      isLoading: false,
      error: null,
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getAllByText(/Mes de Amor y Amistad/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Celulares a cuotas sin inicial/i).length).toBeGreaterThanOrEqual(1);
  });
});
