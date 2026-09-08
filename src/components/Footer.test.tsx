import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Footer, { DEFAULT_FOOTER_ADDRESS, DEFAULT_MAPS_URL, DEFAULT_FACEBOOK_URL, DEFAULT_WHATSAPP_NUMBER } from './Footer';
import { WhatsappNumberContext } from '../contexts/whatsapp-number-context';
import type { UseConfigReturn } from '../hooks/useConfig';
import type { StoreConfig } from '../types';

// Mock del hook useConfig
const mockUseConfig = vi.fn<() => UseConfigReturn>();

vi.mock('../hooks/useConfig', () => ({
  useConfig: () => mockUseConfig(),
}));

describe('Footer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderFooter = (asesorWhatsapp: string | null = null) => {
    return render(
      <MemoryRouter>
        <WhatsappNumberContext.Provider value={asesorWhatsapp}>
          <Footer />
        </WhatsappNumberContext.Provider>
      </MemoryRouter>
    );
  };

  it('renders default hardcoded fallbacks when config is empty and no asesor context exists', () => {
    mockUseConfig.mockReturnValue({
      config: {},
      isLoading: false,
      error: null,
    });

    renderFooter();

    // Default address
    expect(screen.getByText(DEFAULT_FOOTER_ADDRESS)).toBeInTheDocument();

    // Default phone / whatsapp
    const phoneLinks = screen.getAllByRole('link', { name: DEFAULT_WHATSAPP_NUMBER });
    expect(phoneLinks.length).toBeGreaterThan(0);
    expect(phoneLinks[0]).toHaveAttribute('href', `tel:${DEFAULT_WHATSAPP_NUMBER}`);

    const whatsappLink = screen.getByLabelText('WhatsApp');
    expect(whatsappLink).toHaveAttribute('href', `https://wa.me/${DEFAULT_WHATSAPP_NUMBER}`);

    // Default facebook
    const facebookLink = screen.getByLabelText('Facebook');
    expect(facebookLink).toHaveAttribute('href', DEFAULT_FACEBOOK_URL);

    // Default copyright name and brand
    expect(screen.getByText(new RegExp(`© ${new Date().getFullYear()}`))).toBeInTheDocument();
    expect(screen.getAllByText(/Puerto Asís, Putumayo/i).length).toBeGreaterThan(0);
  });

  it('renders dynamic contact info and social media from useConfig when available', () => {
    const customConfig: StoreConfig = {
      nombre: 'Gio Tech Premium',
      logo: 'https://example.com/custom-logo.png',
      direccion: 'Av. Siempre Viva 742, Bogotá',
      telefono: '573001234567',
      whatsappNumber: '573119876543',
      redesSociales: {
        facebook: 'https://facebook.com/giotechcustom',
        instagram: 'https://instagram.com/giotechcustom',
        tiktok: 'https://tiktok.com/@giotechcustom',
      },
    };

    mockUseConfig.mockReturnValue({
      config: customConfig,
      isLoading: false,
      error: null,
    });

    renderFooter();

    // Custom logo and address
    const logoImg = screen.getByAltText('Gio Tech Premium');
    expect(logoImg).toHaveAttribute('src', 'https://example.com/custom-logo.png');
    expect(screen.getByText('Av. Siempre Viva 742, Bogotá')).toBeInTheDocument();

    // Custom phone and whatsapp
    const phoneLink = screen.getByRole('link', { name: '573001234567' });
    expect(phoneLink).toHaveAttribute('href', 'tel:573001234567');

    const whatsappLink = screen.getByLabelText('WhatsApp');
    expect(whatsappLink).toHaveAttribute('href', 'https://wa.me/573119876543');

    // Social icons
    expect(screen.getByLabelText('Facebook')).toHaveAttribute('href', 'https://facebook.com/giotechcustom');
    expect(screen.getByLabelText('Instagram')).toHaveAttribute('href', 'https://instagram.com/giotechcustom');
    expect(screen.getByLabelText('TikTok')).toHaveAttribute('href', 'https://tiktok.com/@giotechcustom');

    // Custom business name in copyright
    expect(screen.getByText(new RegExp(`© ${new Date().getFullYear()}`))).toBeInTheDocument();
    expect(screen.getAllByText('Gio Tech Premium').length).toBeGreaterThan(0);
  });

  it('prioritizes asesor whatsapp number from WhatsappNumberContext if present', () => {
    mockUseConfig.mockReturnValue({
      config: {
        whatsappNumber: '573111111111',
      },
      isLoading: false,
      error: null,
    });

    renderFooter('573229998877');

    const whatsappLink = screen.getByLabelText('WhatsApp');
    expect(whatsappLink).toHaveAttribute('href', 'https://wa.me/573229998877');
  });

  it('renders column headings and minimalist navigation links with react-router-dom', () => {
    mockUseConfig.mockReturnValue({
      config: {},
      isLoading: false,
      error: null,
    });

    renderFooter();

    // Column headings
    expect(screen.getByRole('heading', { name: /Navegación & Legal/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Sede Puerto Asís/i })).toBeInTheDocument();

    // Internal navigation links
    const catalogoLink = screen.getByRole('link', { name: /Catálogo de Equipos/i });
    expect(catalogoLink).toHaveAttribute('href', '/catalogo');

    const servicioTecnicoLink = screen.getByRole('link', { name: /Servicio Técnico/i });
    expect(servicioTecnicoLink).toHaveAttribute('href', '/servicio-tecnico');

    const terminosLink = screen.getByRole('link', { name: /Términos y Garantías/i });
    expect(terminosLink).toHaveAttribute('href', '/terminos');

    const pqrsLink = screen.getByRole('link', { name: /Canal de PQRS \/ Soporte/i });
    expect(pqrsLink).toHaveAttribute('href', 'mailto:giotech.telefonia@gmail.com?subject=PQRS%20GIO%20TECH');
  });

  it('renders physical store information with opening hours and discreet Google Maps link', () => {
    mockUseConfig.mockReturnValue({
      config: {},
      isLoading: false,
      error: null,
    });

    renderFooter();

    // Commercial schedule
    expect(screen.getByText(/Lunes a Sábado: 8:00 AM - 7:00 PM/i)).toBeInTheDocument();

    // Google Maps link
    const mapsLink = screen.getByTitle('Ver en Google Maps');
    expect(mapsLink).toHaveAttribute('href', DEFAULT_MAPS_URL);
    expect(mapsLink).toHaveAttribute('target', '_blank');
    expect(mapsLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders financing partner logos and payment method chips in compact ribbon', () => {
    mockUseConfig.mockReturnValue({
      config: {},
      isLoading: false,
      error: null,
    });

    renderFooter();

    // Financing partner logos
    const sistecreditoLogo = screen.getByAltText('Sistecrédito');
    expect(sistecreditoLogo).toHaveAttribute('src', '/logoscredito/sistecredito.webp');

    const esmiopcionLogo = screen.getByAltText('Esmiopción');
    expect(esmiopcionLogo).toHaveAttribute('src', '/logoscredito/esmiopcion.webp');

    const payjoyLogo = screen.getByAltText('PayJoy');
    expect(payjoyLogo).toHaveAttribute('src', '/logoscredito/pajoy.webp');

    const krediyaLogo = screen.getByAltText('Krediya');
    expect(krediyaLogo).toHaveAttribute('src', '/logoscredito/krediya.webp');

    const celyaLogo = screen.getByAltText('Celya');
    expect(celyaLogo).toHaveAttribute('src', '/logoscredito/celya.webp');

    // Payment chips
    expect(screen.getByText(/Nequi/i)).toBeInTheDocument();
    expect(screen.getByText(/Bancolombia/i)).toBeInTheDocument();
    expect(screen.getByText(/Efectivo en Tienda/i)).toBeInTheDocument();
  });

  it('renders minimalist copyright and rights reserved note', () => {
    mockUseConfig.mockReturnValue({
      config: {},
      isLoading: false,
      error: null,
    });

    renderFooter();

    expect(screen.getByText(/Todos los derechos reservados/i)).toBeInTheDocument();
    expect(screen.queryByText(/Ley 1480 de 2011/i)).not.toBeInTheDocument();
  });
});
