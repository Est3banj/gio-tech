import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminAsesoresTab from './AdminAsesoresTab';
import { Asesor } from '../types';
import * as firestore from 'firebase/firestore';

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: vi.fn(() =>
    Promise.resolve({ user: { uid: 'new-asesor-uid' } })
  ),
  getAuth: vi.fn(() => ({})),
}));

vi.mock('firebase/app', () => ({
  getApp: vi.fn(() => ({ options: {} })),
  getApps: vi.fn(() => []),
  initializeApp: vi.fn(() => ({})),
  deleteApp: vi.fn(),
}));

vi.mock('../firebase', () => ({
  db: {},
}));

const mockAsesores: Asesor[] = [
  {
    id: 'asesor-1',
    nombreCompleto: 'Juan Pérez',
    email: 'juan@giotech.com',
    whatsappNumber: '573001234567',
    rol: 'asesor',
  },
  {
    id: 'asesor-2',
    nombreCompleto: 'María López',
    email: 'maria@giotech.com',
    whatsappNumber: '573119876543',
    rol: 'admin',
  },
];

describe('AdminAsesoresTab Component', () => {
  const mockSetEditandoAsesor = vi.fn();
  const mockSetEmailAsesor = vi.fn();
  const mockSetPasswordAsesor = vi.fn();
  const mockSetNombreCompletoAsesor = vi.fn();
  const mockSetWhatsappAsesor = vi.fn();
  const mockSetRolAsesor = vi.fn();
  const mockSetError = vi.fn();
  const mockSetSuccess = vi.fn();
  const mockSetKey = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    asesores: mockAsesores,
    editandoAsesor: null,
    setEditandoAsesor: mockSetEditandoAsesor,
    emailAsesor: 'carlos@giotech.com',
    setEmailAsesor: mockSetEmailAsesor,
    passwordAsesor: 'Secret123!',
    setPasswordAsesor: mockSetPasswordAsesor,
    nombreCompletoAsesor: 'Carlos Gómez',
    setNombreCompletoAsesor: mockSetNombreCompletoAsesor,
    whatsappAsesor: '573223652569',
    setWhatsappAsesor: mockSetWhatsappAsesor,
    rolAsesor: 'asesor',
    setRolAsesor: mockSetRolAsesor,
    setError: mockSetError,
    setSuccess: mockSetSuccess,
    setKey: mockSetKey,
  };

  it('renders registration form and asesores list', () => {
    render(<AdminAsesoresTab {...defaultProps} />);

    expect(screen.getByRole('heading', { name: /Registrar Nuevo Asesor/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Asesores Registrados/i })).toBeInTheDocument();
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('María López')).toBeInTheDocument();
  });

  it('submits form to register a new asesor', async () => {
    vi.mocked(firestore.setDoc).mockResolvedValue(undefined as never);

    render(<AdminAsesoresTab {...defaultProps} />);

    const submitBtn = screen.getByRole('button', { name: /Registrar Asesor/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(firestore.setDoc).toHaveBeenCalled();
      expect(mockSetSuccess).toHaveBeenCalledWith(
        expect.stringContaining('registrado exitosamente')
      );
    });
  });

  it('handles duplicate email error with spanish message', async () => {
    const authModule = await import('firebase/auth');
    vi.mocked(authModule.createUserWithEmailAndPassword).mockRejectedValueOnce({
      code: 'auth/email-already-in-use',
      message: 'The email address is already in use by another account.',
    });

    render(<AdminAsesoresTab {...defaultProps} />);

    const submitBtn = screen.getByRole('button', { name: /Registrar Asesor/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith(
        'El correo electrónico ya se encuentra registrado por otro usuario o asesor.'
      );
    });
  });

  it('handles weak password error with spanish message', async () => {
    const authModule = await import('firebase/auth');
    vi.mocked(authModule.createUserWithEmailAndPassword).mockRejectedValueOnce({
      code: 'auth/weak-password',
      message: 'Password should be at least 6 characters',
    });

    render(<AdminAsesoresTab {...defaultProps} />);

    const submitBtn = screen.getByRole('button', { name: /Registrar Asesor/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith(
        'La contraseña es muy débil. Debe tener al menos 6 caracteres.'
      );
    });
  });

  it('contains zero raw emoji characters and uses vector icons', () => {
    const { container } = render(<AdminAsesoresTab {...defaultProps} />);
    const textContent = container.textContent || '';
    expect(textContent).not.toMatch(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u);
    expect(container.querySelector('.bi-person-badge-fill')).toBeInTheDocument();
  });
});
