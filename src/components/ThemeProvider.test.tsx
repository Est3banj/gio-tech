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

  it('injects data-theme-name="valentine" and official CSS variables from DEFAULT_CONFIG', () => {
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
    expect(root.getAttribute('data-theme-name')).toBe('valentine');
    expect(root.style.getPropertyValue('--theme-name')).toBe('valentine');
    expect(root.style.getPropertyValue('--promo-badge-bg')).toBe('#d81b60');
    expect(root.style.getPropertyValue('--promo-badge-text')).toBe('#ffffff');
    expect(root.style.getPropertyValue('--promo-highlight')).toBe('rgba(216,27,96,.18)');
  });

  it('falls back immediately to DEFAULT_CONFIG when config is empty or in fallback mode', () => {
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
    expect(root.getAttribute('data-theme-name')).toBe('valentine');
    expect(root.style.getPropertyValue('--theme-name')).toBe('valentine');
    expect(root.style.getPropertyValue('--promo-badge-bg')).toBe('#d81b60');
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

  it('does not activate theme if current date is after theme end window for non-default seasonal theme', () => {
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

  it('keeps valentine theme active even if legacy expired dates are present in config', () => {
    const pastDate = new Date(Date.now() - 86400000); // Ayer
    mockUseConfig.mockReturnValue({
      config: {
        theme: {
          enabled: true,
          end: pastDate,
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
        <div>App Past Valentine</div>
      </ThemeProvider>
    );

    const root = document.documentElement;
    expect(root.getAttribute('data-theme-name')).toBe('valentine');
  });

  it('falls back to default valentine vars and theme name when partial vars are provided', () => {
    mockUseConfig.mockReturnValue({
      config: {
        theme: {
          enabled: true,
          vars: {
            '--promo-badge-bg': '#ff4081',
          },
        },
      },
      isLoading: false,
      error: null,
    });

    render(
      <ThemeProvider>
        <div>App Partial Vars</div>
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
      config: DEFAULT_CONFIG,
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

  it('keeps data-theme-name="valentine" and CSS variables intact when useConfig emits a new object reference', () => {
    mockUseConfig.mockReturnValue({
      config: { ...DEFAULT_CONFIG },
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
        ...DEFAULT_CONFIG,
        nombre: 'GIO TECH Updated',
        theme: {
          ...DEFAULT_CONFIG.theme,
          enabled: true,
          vars: {
            ...DEFAULT_CONFIG.theme?.vars,
            '--theme-name': 'valentine',
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
});
