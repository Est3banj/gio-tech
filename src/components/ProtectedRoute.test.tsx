import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import * as authHook from '../hooks/useAuth';
import type { User } from '../types';

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading spinner when loading is true', () => {
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      user: null,
      role: null,
      loading: true,
      isLoading: true,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('protected-route-loading')).toBeInTheDocument();
    expect(screen.getByText('Verificando sesión...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated users to /login by default', () => {
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      user: null,
      role: null,
      loading: false,
      isLoading: false,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/panel']}>
        <Routes>
          <Route
            path="/panel"
            element={
              <ProtectedRoute>
                <div>Panel Privado</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Página de Login</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText('Panel Privado')).not.toBeInTheDocument();
    expect(screen.getByText('Página de Login')).toBeInTheDocument();
  });

  it('redirects unauthenticated users to custom redirectPath', () => {
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      user: null,
      role: null,
      loading: false,
      isLoading: false,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin-area']}>
        <Routes>
          <Route
            path="/admin-area"
            element={
              <ProtectedRoute redirectPath="/custom-login">
                <div>Admin Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/custom-login" element={<div>Custom Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    expect(screen.getByText('Custom Login Page')).toBeInTheDocument();
  });

  it('redirects unauthorized role to /', () => {
    const mockUser: User = {
      uid: 'user-client',
      email: 'client@giotech.com',
      rol: 'cliente',
    };

    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      user: mockUser,
      role: 'cliente',
      loading: false,
      isLoading: false,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/panel']}>
        <Routes>
          <Route
            path="/panel"
            element={
              <ProtectedRoute allowedRoles={['admin', 'asesor']}>
                <div>Panel Administrativo</div>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<div>Home Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText('Panel Administrativo')).not.toBeInTheDocument();
    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });

  it('renders children when user role is allowed', () => {
    const mockUser: User = {
      uid: 'user-admin',
      email: 'admin@giotech.com',
      rol: 'admin',
    };

    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      user: mockUser,
      role: 'admin',
      loading: false,
      isLoading: false,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/panel']}>
        <Routes>
          <Route
            path="/panel"
            element={
              <ProtectedRoute allowedRoles={['admin', 'asesor']}>
                <div>Panel Administrativo Secreto</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Panel Administrativo Secreto')).toBeInTheDocument();
  });
});
