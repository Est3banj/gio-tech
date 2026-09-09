import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';
import { getFirebaseAuthErrorMessage, getPasswordResetErrorMessage } from '../utils/auth-errors';
import * as authHook from '../hooks/useAuth';
import { sendPasswordResetEmail } from 'firebase/auth';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  sendPasswordResetEmail: vi.fn(),
}));

vi.mock('../firebase', () => ({
  auth: {},
  db: {},
}));

describe('Login Component & Error Mapping', () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      user: null,
      role: null,
      loading: false,
      isLoading: false,
      error: null,
      login: mockLogin,
      logout: vi.fn(),
    });
  });

  it('correctly maps Firebase Auth error codes to Spanish messages', () => {
    expect(getFirebaseAuthErrorMessage('auth/invalid-credential')).toContain(
      'Correo electrónico o contraseña incorrectos'
    );
    expect(getFirebaseAuthErrorMessage('auth/wrong-password')).toContain(
      'Contraseña incorrecta'
    );
    expect(getFirebaseAuthErrorMessage('auth/user-not-found')).toContain(
      'Correo electrónico no registrado'
    );
    expect(getFirebaseAuthErrorMessage('auth/invalid-email')).toContain(
      'formato del correo electrónico es inválido'
    );
    expect(getFirebaseAuthErrorMessage('auth/too-many-requests')).toContain(
      'Demasiados intentos fallidos'
    );
    expect(getFirebaseAuthErrorMessage('auth/user-disabled')).toContain(
      'cuenta de usuario ha sido deshabilitada'
    );
    expect(getFirebaseAuthErrorMessage('auth/network-request-failed')).toContain(
      'Error de conexión a internet'
    );
    expect(getFirebaseAuthErrorMessage('auth/unknown-error')).toContain(
      'Error al iniciar sesión'
    );
  });

  it('correctly maps Password Reset error codes to Spanish messages', () => {
    expect(getPasswordResetErrorMessage('auth/user-not-found')).toContain(
      'No hay ninguna cuenta registrada'
    );
    expect(getPasswordResetErrorMessage('auth/invalid-email')).toContain(
      'formato del correo electrónico es inválido'
    );
    expect(getPasswordResetErrorMessage('auth/too-many-requests')).toContain(
      'Demasiados intentos'
    );
    expect(getPasswordResetErrorMessage('auth/network-request-failed')).toContain(
      'Error de conexión a internet'
    );
  });

  it('renders login form properly', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Iniciar sesión/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/ejemplo@giotech.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Tu contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ingresar/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Recordarme/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /¿Olvidaste tu contraseña\?/i })).toBeInTheDocument();
  });

  it('toggles password visibility when clicking eye button', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const passwordInput = screen.getByPlaceholderText(/Tu contraseña/i);
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByRole('button', { name: /Ver contraseña/i });
    fireEvent.click(toggleBtn);

    expect(passwordInput).toHaveAttribute('type', 'text');

    const hideBtn = screen.getByRole('button', { name: /Ocultar contraseña/i });
    fireEvent.click(hideBtn);

    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('submits form and navigates to /panel on successful login', async () => {
    mockLogin.mockResolvedValueOnce(undefined);

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText(/ejemplo@giotech.com/i);
    const passwordInput = screen.getByPlaceholderText(/Tu contraseña/i);
    const submitBtn = screen.getByRole('button', { name: /Ingresar/i });

    fireEvent.change(emailInput, { target: { value: 'admin@giotech.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Secret123!' } });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin@giotech.com', 'Secret123!', true);
      expect(mockNavigate).toHaveBeenCalledWith('/panel');
    });
  });

  it('displays Spanish error alert when login fails with invalid credentials', async () => {
    const error: Error & { code?: string } = new Error('Invalid credentials');
    error.code = 'auth/invalid-credential';
    mockLogin.mockRejectedValueOnce(error);

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText(/ejemplo@giotech.com/i);
    const passwordInput = screen.getByPlaceholderText(/Tu contraseña/i);
    const submitBtn = screen.getByRole('button', { name: /Ingresar/i });

    fireEvent.change(emailInput, { target: { value: 'admin@giotech.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Correo electrónico o contraseña incorrectos/i)
      ).toBeInTheDocument();
    });
  });

  it('displays Spanish error alert when login fails due to network error', async () => {
    const error: Error & { code?: string } = new Error('Network error');
    error.code = 'auth/network-request-failed';
    mockLogin.mockRejectedValueOnce(error);

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText(/ejemplo@giotech.com/i);
    const passwordInput = screen.getByPlaceholderText(/Tu contraseña/i);
    const submitBtn = screen.getByRole('button', { name: /Ingresar/i });

    fireEvent.change(emailInput, { target: { value: 'admin@giotech.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Error de conexión a internet. Verifica tu red e intenta nuevamente./i)
      ).toBeInTheDocument();
    });
  });

  it('handles password reset request with success message', async () => {
    vi.mocked(sendPasswordResetEmail).mockResolvedValueOnce(undefined as never);

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText(/ejemplo@giotech.com/i);
    fireEvent.change(emailInput, { target: { value: 'usuario@giotech.com' } });

    const forgotBtn = screen.getByRole('button', { name: /¿Olvidaste tu contraseña\?/i });
    fireEvent.click(forgotBtn);

    await waitFor(() => {
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(expect.anything(), 'usuario@giotech.com');
      expect(
        screen.getByText(/Se ha enviado un correo electrónico a tu dirección/i)
      ).toBeInTheDocument();
    });
  });

  it('shows error if password reset is clicked without email', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const forgotBtn = screen.getByRole('button', { name: /¿Olvidaste tu contraseña\?/i });
    fireEvent.click(forgotBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Por favor, ingresa tu correo electrónico para restablecer la contraseña/i)
      ).toBeInTheDocument();
    });
  });
});
