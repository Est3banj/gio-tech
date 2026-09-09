import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import ThemeProvider from './components/ThemeProvider';
import { ThemeModeProvider } from './contexts/ThemeModeContext';
import type { StoreConfig, Product } from './types';
import { onAuthStateChanged } from 'firebase/auth';
import { onSnapshot } from 'firebase/firestore';

// Mock Firebase auth & firestore
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

vi.mock('./services/config.service', () => ({
  DEFAULT_CONFIG: {
    nombre: 'GIO TECH',
    telefono: '3223652569',
    whatsappNumber: '3223652569',
    direccion: 'Cra. 32 #13 36, Puerto Asís, Putumayo',
    theme: {
      enabled: false,
      start: null,
      end: null,
      vars: {
        '--theme-name': 'standard',
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
  deleteProduct: vi.fn(() => Promise.resolve()),
}));

vi.mock('./services/productStats.service', () => ({
  getPopularProductsStats: vi.fn(() => Promise.resolve([])),
  recordProductView: vi.fn(),
}));

const renderAppWithProviders = (initialEntries = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ThemeProvider>
        <ThemeModeProvider>
          <App />
        </ThemeModeProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
};

describe('App Root Component and Provider Hierarchy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders <App /> with ThemeProvider and MemoryRouter without throwing runtime exceptions', async () => {
    const { container } = renderAppWithProviders(['/']);

    expect(container).toBeInTheDocument();

    // Verify floating WhatsApp button is present
    expect(screen.getByRole('button', { name: /Contactar por WhatsApp/i })).toBeInTheDocument();

    // Verify Landing page content is loaded
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Sede Física en Puerto Asís/i })).toBeInTheDocument();
    });
  });

  it('renders Catalogo route correctly within the provider tree', async () => {
    renderAppWithProviders(['/catalogo']);

    // Verify Catalogo route mounts
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Buscar por nombre o descripción/i)).toBeInTheDocument();
    });
  });

  it('renders Servicio Técnico page without crashing', async () => {
    renderAppWithProviders(['/servicio-tecnico']);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Servicio Técnico/i })).toBeInTheDocument();
    });
  });

  it('renders Terminos page without crashing and hides Header/Footer', async () => {
    renderAppWithProviders(['/terminos']);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Términos/i);
    });

    // In /terminos, floating WhatsApp button is hidden
    expect(screen.queryByRole('button', { name: /Contactar por WhatsApp/i })).not.toBeInTheDocument();
  });

  it('renders Login page without crashing', async () => {
    renderAppWithProviders(['/login']);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Iniciar sesión/i })).toBeInTheDocument();
    });
  });

  it('redirects /?producto=ID to /catalogo?producto=ID and loads Catalogo', async () => {
    renderAppWithProviders(['/?producto=prod-1']);

    // Verify it redirects to Catalogo and renders the catalog search input
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Buscar por nombre o descripción/i)).toBeInTheDocument();
    });
  });

  it('redirects /?id=ID to /catalogo?id=ID and loads Catalogo', async () => {
    renderAppWithProviders(['/?id=prod-1']);

    // Verify it redirects to Catalogo and renders the catalog search input
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Buscar por nombre o descripción/i)).toBeInTheDocument();
    });
  });

  it('redirects /admin to /panel and then to /login for unauthenticated users', async () => {
    renderAppWithProviders(['/admin']);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Iniciar sesión/i })).toBeInTheDocument();
    });
  });

  it('renders AdminPanel for authenticated admin user on /panel', async () => {
    vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
      (callback as (user: unknown) => void)({
        uid: 'admin-uid',
        email: 'admin@giotech.com',
      });
      return vi.fn();
    });

    vi.mocked(onSnapshot).mockImplementation((_ref, callback) => {
      (callback as (snap: unknown) => void)({
        exists: () => true,
        data: () => ({
          rol: 'admin',
          nombreCompleto: 'Admin Master',
        }),
        docs: [],
      });
      return vi.fn();
    });

    renderAppWithProviders(['/panel']);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Lista de Productos/i })).toBeInTheDocument();
    });
  });
});
