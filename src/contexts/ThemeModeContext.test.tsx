import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, renderHook } from '@testing-library/react';
import React from 'react';
import { ThemeModeProvider, ThemeModeContext } from './ThemeModeContext';
import { useThemeMode } from '../hooks/useThemeMode';

// Componente de prueba para consumir el contexto
const TestConsumer = () => {
  const { mode, isDarkMode, toggleTheme, setThemeMode } = useThemeMode();
  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <span data-testid="isDark">{isDarkMode ? 'true' : 'false'}</span>
      <button onClick={toggleTheme}>Toggle</button>
      <button onClick={() => setThemeMode('dark')}>Set Dark</button>
      <button onClick={() => setThemeMode('light')}>Set Light</button>
    </div>
  );
};

describe('ThemeModeContext & ThemeModeProvider', () => {
  let mediaListeners: Array<(e: MediaQueryListEvent) => void> = [];

  const mockMatchMedia = (matches: boolean) => {
    mediaListeners = [];
    return vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn((fn) => mediaListeners.push(fn)),
      removeListener: vi.fn((fn) => {
        mediaListeners = mediaListeners.filter((l) => l !== fn);
      }),
      addEventListener: vi.fn((_event: string, fn: (e: MediaQueryListEvent) => void) => {
        mediaListeners.push(fn);
      }),
      removeEventListener: vi.fn((_event: string, fn: (e: MediaQueryListEvent) => void) => {
        mediaListeners = mediaListeners.filter((l) => l !== fn);
      }),
      dispatchEvent: vi.fn(),
    }));
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.body.className = '';
    window.matchMedia = mockMatchMedia(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws descriptive error when useThemeMode is called outside Provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useThemeMode())).toThrow(
      'useThemeMode debe ser utilizado dentro de un ThemeModeProvider'
    );
    consoleError.mockRestore();
  });

  it('initializes with "light" mode by default when no localStorage and OS is light', () => {
    window.matchMedia = mockMatchMedia(false);

    render(
      <ThemeModeProvider>
        <TestConsumer />
      </ThemeModeProvider>
    );

    expect(screen.getByTestId('mode').textContent).toBe('light');
    expect(screen.getByTestId('isDark').textContent).toBe('false');
    expect(document.body.classList.contains('dark-mode')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('initializes with "dark" mode when OS preference prefers-color-scheme is dark and no localStorage', () => {
    window.matchMedia = mockMatchMedia(true);

    render(
      <ThemeModeProvider>
        <TestConsumer />
      </ThemeModeProvider>
    );

    expect(screen.getByTestId('mode').textContent).toBe('dark');
    expect(screen.getByTestId('isDark').textContent).toBe('true');
    expect(document.body.classList.contains('dark-mode')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('prioritizes saved preference in localStorage over system preference', () => {
    localStorage.setItem('theme', 'light');
    window.matchMedia = mockMatchMedia(true); // OS is dark, but localStorage is light

    render(
      <ThemeModeProvider>
        <TestConsumer />
      </ThemeModeProvider>
    );

    expect(screen.getByTestId('mode').textContent).toBe('light');
    expect(screen.getByTestId('isDark').textContent).toBe('false');
    expect(document.body.classList.contains('dark-mode')).toBe(false);
  });

  it('toggles theme properly between light and dark updating DOM and localStorage', () => {
    render(
      <ThemeModeProvider>
        <TestConsumer />
      </ThemeModeProvider>
    );

    expect(screen.getByTestId('mode').textContent).toBe('light');
    expect(document.body.classList.contains('dark-mode')).toBe(false);

    // Toggle to Dark
    fireEvent.click(screen.getByText('Toggle'));
    expect(screen.getByTestId('mode').textContent).toBe('dark');
    expect(screen.getByTestId('isDark').textContent).toBe('true');
    expect(document.body.classList.contains('dark-mode')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');

    // Toggle back to Light
    fireEvent.click(screen.getByText('Toggle'));
    expect(screen.getByTestId('mode').textContent).toBe('light');
    expect(screen.getByTestId('isDark').textContent).toBe('false');
    expect(document.body.classList.contains('dark-mode')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('allows setting theme explicitly with setThemeMode', () => {
    render(
      <ThemeModeProvider>
        <TestConsumer />
      </ThemeModeProvider>
    );

    fireEvent.click(screen.getByText('Set Dark'));
    expect(screen.getByTestId('mode').textContent).toBe('dark');
    expect(document.body.classList.contains('dark-mode')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');

    fireEvent.click(screen.getByText('Set Light'));
    expect(screen.getByTestId('mode').textContent).toBe('light');
    expect(document.body.classList.contains('dark-mode')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('synchronizes theme mode across browser tabs via storage events', () => {
    render(
      <ThemeModeProvider>
        <TestConsumer />
      </ThemeModeProvider>
    );

    expect(screen.getByTestId('mode').textContent).toBe('light');

    // Simulate storage event from another tab
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'theme',
          newValue: 'dark',
        })
      );
    });

    expect(screen.getByTestId('mode').textContent).toBe('dark');
    expect(screen.getByTestId('isDark').textContent).toBe('true');
    expect(document.body.classList.contains('dark-mode')).toBe(true);

    // Simulate change back to light from another tab
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'theme',
          newValue: 'light',
        })
      );
    });

    expect(screen.getByTestId('mode').textContent).toBe('light');
    expect(screen.getByTestId('isDark').textContent).toBe('false');
    expect(document.body.classList.contains('dark-mode')).toBe(false);
  });

  it('reacts to OS theme changes when no manual preference is saved in localStorage', () => {
    // Clear localStorage to simulate no manual user preference
    localStorage.clear();

    render(
      <ThemeModeProvider>
        <TestConsumer />
      </ThemeModeProvider>
    );

    // Remove the item that might have been saved on mount to test pure OS changes
    localStorage.removeItem('theme');

    act(() => {
      mediaListeners.forEach((listener) => {
        listener({ matches: true } as MediaQueryListEvent);
      });
    });

    expect(screen.getByTestId('mode').textContent).toBe('dark');
    expect(document.body.classList.contains('dark-mode')).toBe(true);
  });

  it('ignores OS theme changes when user has a manual preference in localStorage', () => {
    localStorage.setItem('theme', 'light');

    render(
      <ThemeModeProvider>
        <TestConsumer />
      </ThemeModeProvider>
    );

    act(() => {
      mediaListeners.forEach((listener) => {
        listener({ matches: true } as MediaQueryListEvent);
      });
    });

    // Should remain light because user explicitly chose light
    expect(screen.getByTestId('mode').textContent).toBe('light');
    expect(document.body.classList.contains('dark-mode')).toBe(false);
  });
});
