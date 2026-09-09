// src/components/ThemeProvider.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import ThemeProvider from './ThemeProvider';
import type { UseConfigReturn } from '../hooks/useConfig';
import { DEFAULT_CONFIG } from '../services/config.service';

const mockUseConfig = vi.fn<() => UseConfigReturn>();

vi.mock('../hooks/useConfig', () => ({
  useConfig: () => mockUseConfig(),
}));

describe('ThemeProvider Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.removeAttribute('data-theme-name');
    document.documentElement.style.cssText = '';
    document.body.style.cssText = '';
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-theme-name');
    document.documentElement.style.cssText = '';
    document.body.style.cssText = '';
  });

  it('renders children correctly', () => {
    mockUseConfig.mockReturnValue({
      config: DEFAULT_CONFIG,
      isLoading: false,
      error: null,
    });

    const { getByText } = render(
      <ThemeProvider>
        <div>Contenido de prueba</div>
      </ThemeProvider>
    );

    expect(getByText('Contenido de prueba')).toBeInTheDocument();
  });

  it('renders standard mode without seasonal attributes with DEFAULT_CONFIG', () => {
    mockUseConfig.mockReturnValue({
      config: DEFAULT_CONFIG,
      isLoading: false,
      error: null,
    });

    render(
      <ThemeProvider>
        <div>App</div>
      </ThemeProvider>
    );

    const root = document.documentElement;
    expect(root.getAttribute('data-theme-name')).toBeNull();
    expect(root.style.getPropertyValue('--theme-name')).toBe('');
    expect(root.style.getPropertyValue('--promo-badge-bg')).toBe('');
  });

  it('injects data-theme-name="valentine" and official CSS variables when valentine theme is active in config', () => {
    mockUseConfig.mockReturnValue({
      config: {
        theme: {
          enabled: true,
          vars: {
            '--theme-name': 'valentine',
            '--promo-badge-bg': '#d81b60',
            '--promo-badge-text': '#ffffff',
            '--promo-highlight': 'rgba(216,27,96,.18)',
          },
        },
      },
      isLoading: false,
      error: null,
    });

    render(
      <ThemeProvider>
        <div>App Active Valentine</div>
      </ThemeProvider>
    );

    const root = document.documentElement;
    expect(root.getAttribute('data-theme-name')).toBe('valentine');
    expect(root.style.getPropertyValue('--theme-name')).toBe('valentine');
    expect(root.style.getPropertyValue('--promo-badge-bg')).toBe('#d81b60');
    expect(root.style.getPropertyValue('--promo-badge-text')).toBe('#ffffff');
    expect(root.style.getPropertyValue('--promo-highlight')).toBe('rgba(216,27,96,.18)');
  });

  it('falls back immediately to DEFAULT_CONFIG (disabled) when config is empty or in fallback mode', () => {
    mockUseConfig.mockReturnValue({
      config: {},
      isLoading: false,
      error: null,
    });

    render(
      <ThemeProvider>
        <div>App Fallback</div>
      </ThemeProvider>
    );

    const root = document.documentElement;
    expect(root.getAttribute('data-theme-name')).toBeNull();
    expect(root.style.getPropertyValue('--theme-name')).toBe('');
  });

  it('removes data-theme-name when theme is explicitly disabled in config', () => {
    mockUseConfig.mockReturnValue({
      config: {
        theme: {
          enabled: false,
          vars: {
            '--theme-name': 'valentine',
          },
        },
      },
      isLoading: false,
      error: null,
    });

    render(
      <ThemeProvider>
        <div>App Disabled</div>
      </ThemeProvider>
    );

    const root = document.documentElement;
    expect(root.getAttribute('data-theme-name')).toBeNull();
  });

  it('does not activate theme if current date is before theme start window', () => {
    const futureDate = new Date(Date.now() + 86400000); // Mañana
    mockUseConfig.mockReturnValue({
      config: {
        theme: {
          enabled: true,
          start: futureDate,
          vars: {
            '--theme-name': 'valentine',
          },
        },
      },
      isLoading: false,
      error: null,
    });

    render(
      <ThemeProvider>
        <div>App Future</div>
      </ThemeProvider>
    );

    const root = document.documentElement;
    expect(root.getAttribute('data-theme-name')).toBeNull();
  });

  it('does not activate theme if current date is after theme end window', () => {
    const pastDate = new Date(Date.now() - 86400000); // Ayer
    mockUseConfig.mockReturnValue({
      config: {
        theme: {
          enabled: true,
          end: pastDate,
          vars: {
            '--theme-name': 'christmas',
          },
        },
      },
      isLoading: false,
      error: null,
    });

    render(
      <ThemeProvider>
        <div>App Past Christmas</div>
      </ThemeProvider>
    );

    const root = document.documentElement;
    expect(root.getAttribute('data-theme-name')).toBeNull();
  });

  it('sets custom vars and theme name when active seasonal theme is provided', () => {
    mockUseConfig.mockReturnValue({
      config: {
        theme: {
          enabled: true,
          vars: {
            '--theme-name': 'valentine',
            '--promo-badge-bg': '#ff4081',
            '--promo-badge-text': '#ffffff',
          },
        },
      },
      isLoading: false,
      error: null,
    });

    render(
      <ThemeProvider>
        <div>App Active Vars</div>
      </ThemeProvider>
    );

    const root = document.documentElement;
    expect(root.getAttribute('data-theme-name')).toBe('valentine');
    expect(root.style.getPropertyValue('--theme-name')).toBe('valentine');
    expect(root.style.getPropertyValue('--promo-badge-bg')).toBe('#ff4081');
    expect(root.style.getPropertyValue('--promo-badge-text')).toBe('#ffffff');
  });

  it('cleans up attributes and CSS variables when unmounted', () => {
    mockUseConfig.mockReturnValue({
      config: {
        theme: {
          enabled: true,
          vars: {
            '--theme-name': 'valentine',
            '--promo-badge-bg': '#d81b60',
          },
        },
      },
      isLoading: false,
      error: null,
    });

    const { unmount } = render(
      <ThemeProvider>
        <div>App to Unmount</div>
      </ThemeProvider>
    );

    const root = document.documentElement;
    expect(root.getAttribute('data-theme-name')).toBe('valentine');

    unmount();

    expect(root.getAttribute('data-theme-name')).toBeNull();
    expect(root.style.getPropertyValue('--theme-name')).toBe('');
    expect(root.style.getPropertyValue('--promo-badge-bg')).toBe('');
  });

  it('keeps data-theme-name="valentine" and CSS variables intact when useConfig emits a new object reference for active theme', () => {
    mockUseConfig.mockReturnValue({
      config: {
        theme: {
          enabled: true,
          vars: {
            '--theme-name': 'valentine',
            '--promo-badge-bg': '#d81b60',
            '--promo-badge-text': '#ffffff',
            '--promo-highlight': 'rgba(216,27,96,.18)',
          },
        },
      },
      isLoading: true,
      error: null,
    });

    const { rerender } = render(
      <ThemeProvider>
        <div>App Live Re-render</div>
      </ThemeProvider>
    );

    const root = document.documentElement;
    expect(root.getAttribute('data-theme-name')).toBe('valentine');
    expect(root.style.getPropertyValue('--theme-name')).toBe('valentine');
    expect(root.style.getPropertyValue('--promo-badge-bg')).toBe('#d81b60');

    // Simular emisión de Firestore segundos después con nueva referencia de objeto
    mockUseConfig.mockReturnValue({
      config: {
        nombre: 'GIO TECH Updated',
        theme: {
          enabled: true,
          vars: {
            '--theme-name': 'valentine',
            '--promo-badge-bg': '#d81b60',
            '--promo-badge-text': '#ffffff',
            '--promo-highlight': 'rgba(216,27,96,.18)',
          },
        },
      },
      isLoading: false,
      error: null,
    });

    rerender(
      <ThemeProvider>
        <div>App Live Re-render</div>
      </ThemeProvider>
    );

    // data-theme-name y variables NUNCA deben borrarse ni resetearse
    expect(root.getAttribute('data-theme-name')).toBe('valentine');
    expect(root.style.getPropertyValue('--theme-name')).toBe('valentine');
    expect(root.style.getPropertyValue('--promo-badge-bg')).toBe('#d81b60');
    expect(root.style.getPropertyValue('--promo-badge-text')).toBe('#ffffff');
    expect(root.style.getPropertyValue('--promo-highlight')).toBe('rgba(216,27,96,.18)');
  });

  it('atomically removes data-theme-name and clears all CSS variables when switching to standard theme or disabling', () => {
    mockUseConfig.mockReturnValue({
      config: {
        theme: {
          enabled: true,
          vars: {
            '--theme-name': 'christmas',
            '--promo-badge-bg': '#2e7d32',
            '--promo-badge-text': '#ffffff',
            '--promo-highlight': 'rgba(46,125,50,.18)',
          },
        },
      },
      isLoading: false,
      error: null,
    });

    const { rerender } = render(
      <ThemeProvider>
        <div>App Live Toggle</div>
      </ThemeProvider>
    );

    const root = document.documentElement;
    expect(root.getAttribute('data-theme-name')).toBe('christmas');
    expect(root.style.getPropertyValue('--promo-badge-bg')).toBe('#2e7d32');

    // Desactivar dinámicamente el tema
    mockUseConfig.mockReturnValue({
      config: {
        theme: {
          enabled: false,
          vars: {
            '--theme-name': 'standard',
          },
        },
      },
      isLoading: false,
      error: null,
    });

    rerender(
      <ThemeProvider>
        <div>App Live Toggle</div>
      </ThemeProvider>
    );

    expect(root.getAttribute('data-theme-name')).toBeNull();
    expect(root.style.getPropertyValue('--theme-name')).toBe('');
    expect(root.style.getPropertyValue('--promo-badge-bg')).toBe('');
    expect(root.style.getPropertyValue('--promo-highlight')).toBe('');

    // Reactivar con Black Friday
    mockUseConfig.mockReturnValue({
      config: {
        theme: {
          enabled: true,
          vars: {
            '--theme-name': 'blackfriday',
            '--promo-badge-bg': '#111827',
            '--promo-badge-text': '#ffd700',
            '--promo-highlight': 'rgba(255,215,0,.2)',
          },
        },
      },
      isLoading: false,
      error: null,
    });

    rerender(
      <ThemeProvider>
        <div>App Live Toggle</div>
      </ThemeProvider>
    );

    expect(root.getAttribute('data-theme-name')).toBe('blackfriday');
    expect(root.style.getPropertyValue('--theme-name')).toBe('blackfriday');
    expect(root.style.getPropertyValue('--promo-badge-bg')).toBe('#111827');
    expect(root.style.getPropertyValue('--promo-badge-text')).toBe('#ffd700');
  });

  it('guarantees clean DOM without data-theme-name on page load / F5 when theme is deactivated in Firestore', () => {
    // Simular estado guardado tras desactivar el tema en Firestore
    mockUseConfig.mockReturnValue({
      config: {
        nombre: 'GIO TECH',
        theme: {
          enabled: false,
          start: null,
          end: null,
          vars: {
            '--theme-name': 'standard',
          },
        },
      },
      isLoading: false,
      error: null,
    });

    render(
      <ThemeProvider>
        <div>App Fresh Load after F5</div>
      </ThemeProvider>
    );

    const root = document.documentElement;
    expect(root.getAttribute('data-theme-name')).toBeNull();
    expect(root.style.getPropertyValue('--theme-name')).toBe('');
    expect(root.style.getPropertyValue('--promo-badge-bg')).toBe('');
    expect(root.style.getPropertyValue('--promo-highlight')).toBe('');
  });
});
