import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import ThemeProvider from './components/ThemeProvider';
import { ThemeModeProvider } from './contexts/ThemeModeContext';
import { onAuthStateChanged } from 'firebase/auth';
import { onSnapshot } from 'firebase/firestore';
import { subscribeToConfig } from './services/config.service';
import type { StoreConfig, Product, UserRole } from './types';

// jsdom no trae ResizeObserver (lo usa CookieConsentBanner) — stub local para
// que este archivo no herede los failures preexistentes de src/App.test.tsx.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  signOut: vi.fn(() => Promise.resolve()),
  setPersistence: vi.fn(() => Promise.resolve()),
  browserLocalPersistence: 'LOCAL',
  browserSessionPersistence: 'SESSION',
  signInWithEmailAndPassword: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  onAuthStateChanged: vi.fn((_auth, callback) => {
    callback(null);
    return vi.fn();
  }),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn((_db, collection, id) => ({ collection, id })),
  collection: vi.fn((_db, name) => ({ name })),
  query: vi.fn((c) => c),
  where: vi.fn(),
  onSnapshot: vi.fn((_ref, callback) => {
    callback({
      exists: () => false,
      data: () => ({}),
      docs: [],
    });
    return vi.fn();
  }),
  setDoc: vi.fn(),
}));

const mockProductsList: Product[] = [
  {
    id: 'prod-1',
    nombre: 'Samsung Galaxy A55',
    marca: 'Samsung',
    categoria: 'Celulares',
    descripcion: 'Smartphone 5G 128GB',
    contado: 1500000,
    imagen: 'https://img.test/a55.jpg',
  },
];

const HALLOWEEN_CONFIG: StoreConfig = {
  nombre: 'GIO TECH',
  telefono: '3223652569',
  whatsappNumber: '3223652569',
  direccion: 'Cra. 32 #13 36, Puerto Asís, Putumayo',
  theme: {
    enabled: true,
    start: null,
    end: null,
    vars: {
      '--theme-name': 'halloween',
      '--promo-badge-bg': '#ff6d00',
      '--promo-badge-text': '#1b1b1b',
      '--promo-highlight': 'rgba(255,109,0,.18)',
    },
  },
};

vi.mock('./services/config.service', () => ({
  DEFAULT_CONFIG: {
    nombre: 'GIO TECH',
    telefono: '3223652569',
    whatsappNumber: '3223652569',
    direccion: 'Cra. 32 #13 36, Puerto Asís, Putumayo',
    theme: { enabled: false, start: null, end: null, vars: { '--theme-name': 'standard' } },
  },
  subscribeToConfig: vi.fn(),
  updateConfig: vi.fn(),
}));

vi.mock('./services/product.service', () => ({
  subscribeToProducts: vi.fn((callback: (products: Product[]) => void) => {
    callback(mockProductsList);
    return vi.fn();
  }),
  deleteProduct: vi.fn(() => Promise.resolve()),
}));

vi.mock('./services/productStats.service', () => ({
  recordProductView: vi.fn(),
}));

const mockSession = (rol: UserRole) => {
  vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
    (callback as (user: unknown) => void)({
      uid: 'user-1',
      email: 'admin@giotech.com',
    });
    return vi.fn();
  });
  vi.mocked(onSnapshot).mockImplementation((_ref, callback) => {
    (callback as (snap: unknown) => void)({
      exists: () => true,
      data: () => ({ rol, nombreCompleto: 'Usuario Test' }),
      docs: [],
    });
    return vi.fn();
  });
};

const renderApp = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <ThemeProvider>
        <ThemeModeProvider>
          <App />
        </ThemeModeProvider>
      </ThemeProvider>
    </MemoryRouter>
  );

const countLogoutLabels = () => screen.queryAllByText(/cerrar sesión/i).length;

describe('Chrome de sesión fuera de la web pública (regresión tema de temporada)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(subscribeToConfig).mockImplementation((callback) => {
      callback(HALLOWEEN_CONFIG);
      return vi.fn();
    });
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-theme-name');
  });

  it('mantiene el tema halloween activo durante la verificación', async () => {
    renderApp('/catalogo');
    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme-name')).toBe('halloween');
    });
  });

  it.each([
    ['/'],
    ['/catalogo'],
    ['/tienda'],
    ['/producto/prod-1'],
    ['/terminos'],
    ['/cookies'],
  ])('no renderiza "Cerrar sesión" autenticado en %s', async (path) => {
    mockSession('admin');
    renderApp(path);

    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme-name')).toBe('halloween');
    });

    expect(countLogoutLabels()).toBe(0);
  });

  it.each(['asesor', 'cliente'] as UserRole[])(
    'no renderiza chrome de sesión para %s navegando la tienda',
    async (rol) => {
      mockSession(rol);
      renderApp('/tienda');

      await waitFor(() => {
        expect(document.documentElement.getAttribute('data-theme-name')).toBe('halloween');
      });

      expect(countLogoutLabels()).toBe(0);
    }
  );

  it('conserva el logout del asesor en /panel (superficie de app, no pública)', async () => {
    mockSession('asesor');
    renderApp('/panel');

    await waitFor(() => {
      expect(countLogoutLabels()).toBe(1);
    });
    expect(screen.getByRole('button', { name: /cerrar sesión/i })).toBeInTheDocument();
  });
});
