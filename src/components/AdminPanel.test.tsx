import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminPanel from './AdminPanel';
import { ThemeModeProvider } from '../contexts/ThemeModeContext';
import * as authHook from '../hooks/useAuth';
import * as productService from '../services/product.service';

vi.mock('../services/product.service', () => ({
  subscribeToProducts: vi.fn((callback) => {
    callback([
      {
        id: 'prod-test-1',
        nombre: 'Xiaomi 13 Ultra',
        marca: 'Xiaomi',
        categoria: 'Celulares',
        contado: 3800000,
        stock: 5,
      },
    ]);
    return vi.fn();
  }),
  deleteProduct: vi.fn(),
  updateProduct: vi.fn(),
  createProduct: vi.fn(),
}));

vi.mock('../services/config.service', () => ({
  subscribeToConfig: vi.fn((callback) => {
    callback({
      nombre: 'GIO TECH',
      telefono: '3223652569',
      whatsappNumber: '3223652569',
      direccion: 'Cra. 32 #13 36',
    });
    return vi.fn();
  }),
  updateConfig: vi.fn(),
  DEFAULT_CONFIG: {
    nombre: 'GIO TECH',
    telefono: '3223652569',
  },
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  onSnapshot: vi.fn((_q, callback) => {
    callback({
      docs: [],
    });
    return vi.fn();
  }),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  setDoc: vi.fn(),
}));

vi.mock('../firebase', () => ({
  db: {},
}));

const renderAdminPanel = () => {
  return render(
    <MemoryRouter>
      <ThemeModeProvider>
        <AdminPanel />
      </ThemeModeProvider>
    </MemoryRouter>
  );
};

describe('AdminPanel Component Orchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.body.className = '';
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      user: {
        uid: 'admin-123',
        email: 'admin@giotech.com',
        nombreCompleto: 'Admin Supremo',
        rol: 'admin',
      },
      role: 'admin',
      loading: false,
      isLoading: false,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
    });
  });

  it('renders AdminPanel with initial products tab and layout', () => {
    renderAdminPanel();

    expect(screen.getAllByRole('heading', { name: /Lista de Productos/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Xiaomi 13 Ultra').length).toBeGreaterThan(0);
    expect(screen.getByText('Admin Supremo')).toBeInTheDocument();
  });

  it('switches between tabs when navigation buttons are clicked', () => {
    renderAdminPanel();

    // Switch to Add Product
    const addProdNav = screen.getByRole('button', { name: /Nuevo \/ Editar Producto/i });
    fireEvent.click(addProdNav);

    expect(screen.getByText(/1. Información Comercial/i)).toBeInTheDocument();

    // Switch to Business Config
    const configNav = screen.getByRole('button', { name: /Configuración del Negocio/i });
    fireEvent.click(configNav);

    expect(screen.getByText(/1. Identidad de Marca & Contacto/i)).toBeInTheDocument();

    // Switch to Carrusel
    const carruselNav = screen.getByRole('button', { name: /Carrusel & Banners/i });
    fireEvent.click(carruselNav);

    expect(screen.getByRole('heading', { name: /Nuevo Slide \/ Banner Promocional/i })).toBeInTheDocument();

    // Switch to Asesores
    const asesoresNav = screen.getByRole('button', { name: /Equipo & Asesores/i });
    fireEvent.click(asesoresNav);

    expect(screen.getByRole('heading', { name: /Registrar Nuevo Asesor/i })).toBeInTheDocument();
  });

  it('opens safe delete modal and calls deleteProduct', async () => {
    vi.mocked(productService.deleteProduct).mockResolvedValueOnce(undefined);

    renderAdminPanel();

    const deleteBtn = screen.getAllByRole('button', { name: /Eliminar/i })[0];
    fireEvent.click(deleteBtn);

    expect(screen.getByText(/¿Estás seguro de eliminar este producto\?/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /Confirmar Eliminación/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(productService.deleteProduct).toHaveBeenCalledWith('prod-test-1');
    });
  });

  it('restricts non-admin users from accessing negocio and asesores tabs', () => {
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      user: {
        uid: 'asesor-123',
        email: 'asesor@giotech.com',
        nombreCompleto: 'Carlos Asesor',
        rol: 'asesor',
      },
      role: 'asesor',
      loading: false,
      isLoading: false,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
    });

    renderAdminPanel();

    expect(screen.queryByRole('button', { name: /Configuración del Negocio/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Equipo & Asesores/i })).not.toBeInTheDocument();
  });

  it('resets product form completely when onAddNew is clicked', () => {
    renderAdminPanel();

    const addNewBtn = screen.getByRole('button', { name: /Nuevo Producto/i });
    fireEvent.click(addNewBtn);

    expect(screen.getByText(/1. Información Comercial/i)).toBeInTheDocument();
    const nameInput = screen.getByPlaceholderText(/Xiaomi Redmi Note 13/i) as HTMLInputElement;
    expect(nameInput.value).toBe('');
  });

  it('contains zero raw emoji characters in the full admin panel orchestrator', () => {
    const { container } = renderAdminPanel();

    const textContent = container.textContent || '';
    expect(textContent).not.toMatch(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u);
  });
});
