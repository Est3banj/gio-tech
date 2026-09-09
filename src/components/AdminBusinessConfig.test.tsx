import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminBusinessConfig from './AdminBusinessConfig';
import * as configService from '../services/config.service';

vi.mock('../services/config.service', () => ({
  updateConfig: vi.fn(),
  subscribeToConfig: vi.fn(),
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
}));

describe('AdminBusinessConfig Component', () => {
  const mockSetNombreNegocio = vi.fn();
  const mockSetLogoNegocio = vi.fn();
  const mockSetPreviewLogo = vi.fn();
  const mockSetThemeEnabled = vi.fn();
  const mockSetThemeStart = vi.fn();
  const mockSetThemeEnd = vi.fn();
  const mockSetThemeVars = vi.fn();
  const mockSetError = vi.fn();
  const mockSetSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    nombreNegocio: 'GIO TECH',
    setNombreNegocio: mockSetNombreNegocio,
    telefonoNegocio: '3223652569',
    whatsappNegocio: '3223652569',
    emailNegocio: 'contacto@giotech.com',
    direccionNegocio: 'Cra. 32 #13 36, Puerto Asís, Putumayo',
    mapsUrlNegocio: 'https://maps.google.com/?q=Cra.+32',
    horariosNegocio: 'Lunes a Sábado: 8:00 AM - 7:00 PM',
    logoNegocio: null,
    setLogoNegocio: mockSetLogoNegocio,
    previewLogo: 'https://example.com/logo.png',
    setPreviewLogo: mockSetPreviewLogo,
    themeEnabled: true,
    setThemeEnabled: mockSetThemeEnabled,
    themeStart: '',
    setThemeStart: mockSetThemeStart,
    themeEnd: '',
    setThemeEnd: mockSetThemeEnd,
    themeVars: {
      '--theme-name': 'valentine',
      '--promo-badge-bg': '#d81b60',
      '--promo-badge-text': '#ffffff',
      '--promo-highlight': 'rgba(216,27,96,.18)',
    },
    setThemeVars: mockSetThemeVars,
    setError: mockSetError,
    setSuccess: mockSetSuccess,
  };

  it('renders all 3 configuration sections and presets', () => {
    render(<AdminBusinessConfig {...defaultProps} />);

    expect(screen.getByText(/1. Identidad de Marca & Contacto/i)).toBeInTheDocument();
    expect(screen.getByText(/2. Sede Física & Horarios de Atención/i)).toBeInTheDocument();
    expect(screen.getByText(/3. Temporadas & Festividades/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Amor y Amistad/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Navidad/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Halloween/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Black Friday/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Actualizar Configuración/i })).toBeInTheDocument();
  });

  it('allows clicking theme presets to apply theme variables', () => {
    render(<AdminBusinessConfig {...defaultProps} />);

    const christmasBtn = screen.getByRole('button', { name: /Navidad/i });
    fireEvent.click(christmasBtn);

    expect(mockSetThemeEnabled).toHaveBeenCalledWith(true);
    expect(mockSetThemeVars).toHaveBeenCalled();
  });

  it('allows clicking "Desactivar Tema / Modo Estándar" to disable theme and reset to standard', () => {
    render(<AdminBusinessConfig {...defaultProps} />);

    const deactivateBtn = screen.getByRole('button', { name: /Desactivar Tema/i });
    fireEvent.click(deactivateBtn);

    expect(mockSetThemeEnabled).toHaveBeenCalledWith(false);
    expect(mockSetThemeStart).toHaveBeenCalledWith('');
    expect(mockSetThemeEnd).toHaveBeenCalledWith('');
    expect(mockSetThemeVars).toHaveBeenCalledWith({
      '--theme-name': 'standard',
      '--promo-badge-bg': '#C8102E',
      '--promo-badge-text': '#ffffff',
      '--promo-highlight': 'rgba(200,16,46,.18)',
    });
  });

  it('submits form and calls updateConfig service with theme enabled', async () => {
    vi.mocked(configService.updateConfig).mockResolvedValueOnce(undefined);

    render(<AdminBusinessConfig {...defaultProps} />);

    const submitBtn = screen.getByRole('button', { name: /Actualizar Configuración/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(configService.updateConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'GIO TECH',
          telefono: '3223652569',
          whatsappNumber: '3223652569',
          direccion: 'Cra. 32 #13 36, Puerto Asís, Putumayo',
          theme: expect.objectContaining({
            enabled: true,
          }),
        })
      );
      expect(mockSetSuccess).toHaveBeenCalledWith(
        expect.stringContaining('actualizada exitosamente')
      );
    });
  });

  it('submits form and calls updateConfig service with theme disabled when themeEnabled is false', async () => {
    vi.mocked(configService.updateConfig).mockResolvedValueOnce(undefined);

    render(<AdminBusinessConfig {...defaultProps} themeEnabled={false} />);

    const submitBtn = screen.getByRole('button', { name: /Actualizar Configuración/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(configService.updateConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          theme: expect.objectContaining({
            enabled: false,
          }),
        })
      );
    });
  });

  it('contains zero raw emoji characters and uses vector icons in presets', () => {
    const { container } = render(<AdminBusinessConfig {...defaultProps} />);
    const textContent = container.textContent || '';
    expect(textContent).not.toMatch(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u);
    expect(container.querySelector('.bi-heart-fill')).toBeInTheDocument();
    expect(container.querySelector('.bi-tree-fill')).toBeInTheDocument();
    expect(container.querySelector('.bi-moon-stars-fill')).toBeInTheDocument();
    expect(container.querySelector('.bi-tag-fill')).toBeInTheDocument();
    expect(container.querySelector('.bi-x-circle')).toBeInTheDocument();
  });
});
