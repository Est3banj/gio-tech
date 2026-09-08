import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import ThemeProvider from './components/ThemeProvider';
import type { StoreConfig, Product } from './types';

// Mock Firebase auth & firestore
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  signOut: vi.fn(() => Promise.resolve()),
  onAuthStateChanged: vi.fn((_auth, callback) => {
    callback(null);
    return vi.fn();
  }),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn(),
  collection: vi.fn(),
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

vi.mock('./services/config.service', () => ({
  DEFAULT_CONFIG: {
    nombre: 'GIO TECH',
    telefono: '3223652569',
    whatsappNumber: '3223652569',
    direccion: 'Cra. 32 #13 36, Puerto Asís, Putumayo',
    theme: {
      enabled: true,
      start: null,
      end: null,
      vars: {
        '--theme-name': 'valentine',
        '--promo-badge-bg': '#d81b60',
        '--promo-badge-text': '#ffffff',
        '--promo-highlight': 'rgba(216,27,96,.18)',
      },
    },
  },
  subscribeToConfig: vi.fn((callback: (config: StoreConfig) => void) => {
    callback({
      nombre: 'GIO TECH',
      telefono: '3223652569',
      whatsappNumber: '3223652569',
      direccion: 'Cra. 32 #13 36, Puerto Asís, Putumayo',
    });
    return vi.fn();
  }),
  updateConfig: vi.fn(),
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

vi.mock('./services/product.service', () => ({
  subscribeToProducts: vi.fn((callback: (products: Product[]) => void) => {
    callback(mockProductsList);
    return vi.fn();
  }),
}));

vi.mock('./services/productStats.service', () => ({
  getPopularProductsStats: vi.fn(() => Promise.resolve([])),
  recordProductView: vi.fn(),
}));

describe('App Root Component and Provider Hierarchy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders <App /> with ThemeProvider and MemoryRouter without throwing runtime exceptions', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </MemoryRouter>
    );

    expect(container).toBeInTheDocument();

    // Verify floating WhatsApp button is present
    expect(screen.getByRole('button', { name: /Contactar por WhatsApp/i })).toBeInTheDocument();

    // Verify Landing page content is loaded
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Sede Física en Puerto Asís/i })).toBeInTheDocument();
    });
  });

  it('renders Catalogo route correctly within the provider tree', async () => {
    render(
      <MemoryRouter initialEntries={['/catalogo']}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </MemoryRouter>
    );

    // Verify Catalogo route mounts
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Buscar por nombre o descripción/i)).toBeInTheDocument();
    });
  });

  it('renders Servicio Técnico page without crashing', async () => {
    render(
      <MemoryRouter initialEntries={['/servicio-tecnico']}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Servicio Técnico/i })).toBeInTheDocument();
    });
  });

  it('renders Terminos page without crashing and hides Header/Footer', async () => {
    render(
      <MemoryRouter initialEntries={['/terminos']}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Términos/i);
    });

    // In /terminos, floating WhatsApp button is hidden
    expect(screen.queryByRole('button', { name: /Contactar por WhatsApp/i })).not.toBeInTheDocument();
  });

  it('renders Login page without crashing', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Iniciar sesión/i })).toBeInTheDocument();
    });
  });

  it('redirects /?producto=ID to /catalogo?producto=ID and loads Catalogo', async () => {
    render(
      <MemoryRouter initialEntries={['/?producto=prod-1']}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </MemoryRouter>
    );

    // Verify it redirects to Catalogo and renders the catalog search input
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Buscar por nombre o descripción/i)).toBeInTheDocument();
    });
  });

  it('redirects /?id=ID to /catalogo?id=ID and loads Catalogo', async () => {
    render(
      <MemoryRouter initialEntries={['/?id=prod-1']}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </MemoryRouter>
    );

    // Verify it redirects to Catalogo and renders the catalog search input
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Buscar por nombre o descripción/i)).toBeInTheDocument();
    });
  });
});
