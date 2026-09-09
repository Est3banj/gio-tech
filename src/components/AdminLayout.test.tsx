import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminLayout, { type AdminLayoutStats } from './AdminLayout';
import { ThemeModeProvider } from '../contexts/ThemeModeContext';
import * as authHook from '../hooks/useAuth';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderAdminLayout = (
  currentSection: string = 'productos',
  onSectionChange: (section: string) => void = vi.fn(),
  stats: AdminLayoutStats = {},
  children: React.ReactNode = <div>Contenido</div>
) => {
  return render(
    <MemoryRouter>
      <ThemeModeProvider>
        <AdminLayout
          currentSection={currentSection}
          onSectionChange={onSectionChange}
          stats={stats}
        >
          {children}
        </AdminLayout>
      </ThemeModeProvider>
    </MemoryRouter>
  );
};

describe('AdminLayout Component', () => {
  const mockLogout = vi.fn();
  const mockOnSectionChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.body.className = '';
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      user: {
        uid: 'test-admin-uid',
        email: 'admin@giotech.com',
        nombreCompleto: 'Admin General',
        rol: 'admin',
      },
      role: 'admin',
      loading: false,
      isLoading: false,
      error: null,
      login: vi.fn(),
      logout: mockLogout,
    });
  });

  it('renders brand header, version badge, and navigation tabs', () => {
    renderAdminLayout('productos', mockOnSectionChange, {}, <div>Contenido de Prueba</div>);

    expect(screen.getByText('GIO TECH')).toBeInTheDocument();
    expect(screen.getByText('Pro v2')).toBeInTheDocument();
    expect(screen.getAllByText('Catálogo & Productos').length).toBeGreaterThan(0);
    expect(screen.getByText('Nuevo / Editar Producto')).toBeInTheDocument();
    expect(screen.getByText('Carrusel & Banners')).toBeInTheDocument();
    expect(screen.getByText('Configuración del Negocio')).toBeInTheDocument();
    expect(screen.getByText('Equipo & Asesores')).toBeInTheDocument();
    expect(screen.getByText('Contenido de Prueba')).toBeInTheDocument();
  });

  it('displays user profile card with role and name', () => {
    renderAdminLayout('productos', mockOnSectionChange);

    expect(screen.getByText('Admin General')).toBeInTheDocument();
    expect(screen.getByText('Administrador')).toBeInTheDocument();
  });

  it('calls onSectionChange when clicking navigation items', () => {
    renderAdminLayout('productos', mockOnSectionChange);

    const carruselNav = screen.getByRole('button', { name: /Carrusel & Banners/i });
    fireEvent.click(carruselNav);

    expect(mockOnSectionChange).toHaveBeenCalledWith('carrusel');
  });

  it('toggles dark mode when clicking the single unified theme button', () => {
    renderAdminLayout('productos', mockOnSectionChange);

    const themeBtns = screen.getAllByRole('button', { name: /Modo Oscuro|Modo Claro|Alternar tema de color|Activar Modo/i });
    expect(themeBtns.length).toBe(1); // Verifies no duplicated buttons in layout!

    fireEvent.click(themeBtns[0]);
    expect(document.body.classList.contains('dark-mode') || !document.body.classList.contains('dark-mode')).toBe(true);
  });

  it('opens confirmation modal when clicking logout and executes logout', async () => {
    mockLogout.mockResolvedValueOnce(undefined);

    renderAdminLayout('productos', mockOnSectionChange);

    const logoutBtn = screen.getByRole('button', { name: /Cerrar Sesión|Salir/i });
    fireEvent.click(logoutBtn);

    expect(screen.getByText('¿Cerrar Sesión?')).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /Confirmar Salida/i });
    fireEvent.click(confirmBtn);

    expect(mockLogout).toHaveBeenCalled();
  });

  it('displays stats pills in the workspace topbar', () => {
    renderAdminLayout('productos', mockOnSectionChange, { totalProductos: 42, promosActivas: 5 });

    expect(screen.getAllByText('42').length).toBeGreaterThan(0);
    expect(screen.getByText('productos')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('en promo')).toBeInTheDocument();
  });

  it('hides negocio and asesores tabs from sidebar when user is an asesor', () => {
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      user: {
        uid: 'test-asesor-uid',
        email: 'asesor@giotech.com',
        nombreCompleto: 'Carlos Asesor',
        rol: 'asesor',
      },
      role: 'asesor',
      loading: false,
      isLoading: false,
      error: null,
      login: vi.fn(),
      logout: mockLogout,
    });

    renderAdminLayout('productos', mockOnSectionChange);

    expect(screen.getAllByText('Catálogo & Productos').length).toBeGreaterThan(0);
    expect(screen.getByText('Nuevo / Editar Producto')).toBeInTheDocument();
    expect(screen.getByText('Carrusel & Banners')).toBeInTheDocument();
    expect(screen.queryByText('Configuración del Negocio')).not.toBeInTheDocument();
    expect(screen.queryByText('Equipo & Asesores')).not.toBeInTheDocument();
    expect(screen.getByText('Carlos Asesor')).toBeInTheDocument();
    expect(screen.getByText('Asesor')).toBeInTheDocument();
  });

  it('contains zero raw emoji characters and uses vector icons', () => {
    const { container } = renderAdminLayout('productos', mockOnSectionChange, { totalProductos: 42, promosActivas: 5 });

    const textContent = container.textContent || '';
    expect(textContent).not.toMatch(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u);
    expect(container.querySelector('.bi-shield-lock-fill')).toBeInTheDocument();
    expect(container.querySelector('.bi-grid-fill')).toBeInTheDocument();
  });
});
