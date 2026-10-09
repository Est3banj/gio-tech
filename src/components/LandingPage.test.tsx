import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import { WhatsappNumberProvider } from '../contexts/WhatsappNumberContext';
import { CartProvider } from '../contexts/CartContext';
import { DEFAULT_MAPS_URL } from './Footer';
import type { Product } from '../types';

// Mock dependencies
const mockProductsList: Product[] = [
  {
    id: 'prod-1',
    nombre: 'iPhone 15 Pro Max',
    marca: 'Apple',
    categoria: 'Celulares',
    descripcion: 'Smartphone de titanio con chip A17 Pro',
    contado: 5400000,
    cuotas6: 950000,
    imagen: 'https://img.test/iphone15.jpg',
    esDestacado: true,
  },
  {
    id: 'prod-2',
    nombre: 'Samsung Galaxy S24 Ultra',
    marca: 'Samsung',
    categoria: 'Celulares',
    descripcion: 'Galaxy AI y cámara de 200MP',
    contado: 4800000,
    cuotas6: 850000,
    imagen: 'https://img.test/s24.jpg',
    esDestacado: true,
  },
  {
    id: 'prod-3',
    nombre: 'Xiaomi Redmi Note 13 Pro',
    marca: 'Xiaomi',
    categoria: 'Celulares',
    descripcion: 'Cámara de 200MP y carga de 67W',
    contado: 1250000,
    cuotas6: 230000,
    imagen: 'https://img.test/redmi13.jpg',
  },
  {
    id: 'prod-4',
    nombre: 'Tecno Spark 20 Pro',
    marca: 'Tecno',
    categoria: 'Celulares',
    descripcion: '256GB de memoria y 8GB RAM',
    contado: 720000,
    cuotas6: 140000,
    imagen: 'https://img.test/spark20.jpg',
  },
];

const mockUseProducts = vi.fn();
const mockUseConfig = vi.fn();

vi.mock('../hooks/useProducts', () => ({
  useProducts: () => mockUseProducts(),
}));

vi.mock('../hooks/useConfig', () => ({
  useConfig: () => mockUseConfig(),
}));

vi.mock('./BannerSlider', () => ({
  default: () => <div data-testid="mock-banner-slider">Hero Banner Slider</div>,
}));

function renderLandingPage(initialEntries = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <WhatsappNumberProvider>
        <CartProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/catalogo" element={<div data-testid="catalogo-page">Página de Catálogo</div>} />
            <Route path="/producto/:productId" element={<div data-testid="producto-page">Página de Producto</div>} />
          </Routes>
        </CartProvider>
      </WhatsappNumberProvider>
    </MemoryRouter>
  );
}

describe('LandingPage Component - Reestructuración CRO de Alto Impacto', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseProducts.mockReturnValue({
      products: mockProductsList,
      isLoading: false,
      error: null,
    });
    mockUseConfig.mockReturnValue({
      config: {
        theme: {
          enabled: true,
          vars: {
            '--theme-name': 'valentine',
          },
        },
      },
      isLoading: false,
      error: null,
    });
  });

  it('1. Hero: debe renderizar el BannerSlider al inicio de la página', () => {
    renderLandingPage();
    expect(screen.getByTestId('mock-banner-slider')).toBeInTheDocument();
  });

  it('2. 4 Pilares de Confianza: debe renderizar Sede Física, Financiación, Envíos y Garantía por escrito', () => {
    renderLandingPage();

    // Pilar 1: Sede Física
    expect(screen.getByRole('heading', { level: 2, name: /Sede Física en Puerto Asís/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Cra\. 32 #13 36/i).length).toBeGreaterThanOrEqual(1);

    // Pilar 2: Financiación
    expect(screen.getByRole('heading', { level: 2, name: /Financiación Inmediata/i })).toBeInTheDocument();
    expect(screen.getByText(/Sistecrédito, Krediya, PayJoy, Esmiopción/i)).toBeInTheDocument();

    // Pilar 3: Envíos
    expect(screen.getByRole('heading', { level: 2, name: /Envíos a todo Putumayo/i })).toBeInTheDocument();
    expect(screen.getByText(/100% asegurados/i)).toBeInTheDocument();

    // Pilar 4: Garantía Real
    expect(screen.getByRole('heading', { level: 2, name: /Garantía Real por Escrito/i })).toBeInTheDocument();
  });

  it('3. Equipos Destacados: debe renderizar la grilla de smartphones y el botón CTA hacia /catalogo', () => {
    renderLandingPage();

    expect(screen.getByRole('heading', { level: 2, name: /Equipos Destacados/i })).toBeInTheDocument();
    expect(screen.getByText('iPhone 15 Pro Max')).toBeInTheDocument();
    expect(screen.getByText('Samsung Galaxy S24 Ultra')).toBeInTheDocument();

    const ctaButton = screen.getByRole('link', { name: /Explorar todo el catálogo de celulares/i });
    expect(ctaButton).toBeInTheDocument();
    expect(ctaButton).toHaveAttribute('href', '/catalogo');
  });

  it('4. Atajos Rápidos por Marca: debe renderizar marcas líderes con logos oficiales (img)', () => {
    renderLandingPage();

    expect(screen.getByRole('heading', { level: 2, name: /Atajos Rápidos por Marca/i })).toBeInTheDocument();

    const appleLink = screen.getByRole('link', { name: /Ver celulares de la marca Apple/i });
    const samsungLink = screen.getByRole('link', { name: /Ver celulares de la marca Samsung/i });
    const xiaomiLink = screen.getByRole('link', { name: /Ver celulares de la marca Xiaomi/i });
    const motorolaLink = screen.getByRole('link', { name: /Ver celulares de la marca Motorola/i });
    const tecnoLink = screen.getByRole('link', { name: /Ver celulares de la marca Tecno/i });
    const infinixLink = screen.getByRole('link', { name: /Ver celulares de la marca Infinix/i });
    const honorLink = screen.getByRole('link', { name: /Ver celulares de la marca Honor/i });

    expect(appleLink).toHaveAttribute('href', '/catalogo?marca=Apple');
    expect(samsungLink).toHaveAttribute('href', '/catalogo?marca=Samsung');
    expect(xiaomiLink).toHaveAttribute('href', '/catalogo?marca=Xiaomi');
    expect(motorolaLink).toHaveAttribute('href', '/catalogo?marca=Motorola');
    expect(tecnoLink).toHaveAttribute('href', '/catalogo?marca=Tecno');
    expect(infinixLink).toHaveAttribute('href', '/catalogo?marca=Infinix');
    expect(honorLink).toHaveAttribute('href', '/catalogo?marca=Honor');

    expect(screen.queryByRole('link', { name: /Ver celulares de la marca Huawei/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Ver celulares de la marca Realme/i })).not.toBeInTheDocument();

    // Verificar logos cargados vía <img> con sus paths oficiales y alt descriptivo
    const appleImg = screen.getByAltText('Logo oficial Apple');
    expect(appleImg).toHaveAttribute('src', '/logos marcas/apple.svg');

    const samsungImg = screen.getByAltText('Logo oficial Samsung');
    expect(samsungImg).toHaveAttribute('src', '/logos marcas/samsung.svg');

    const xiaomiImg = screen.getByAltText('Logo oficial Xiaomi');
    expect(xiaomiImg).toHaveAttribute('src', '/logos marcas/xiaomi.svg');

    const motorolaImg = screen.getByAltText('Logo oficial Motorola');
    expect(motorolaImg).toHaveAttribute('src', '/logos marcas/motorola.svg');

    const tecnoImg = screen.getByAltText('Logo oficial Tecno');
    expect(tecnoImg).toHaveAttribute('src', '/logos marcas/logotecno.svg');

    const infinixImg = screen.getByAltText('Logo oficial Infinix');
    expect(infinixImg).toHaveAttribute('src', '/logos marcas/logoinifinix.jpg');

    const honorImg = screen.getByAltText('Logo oficial Honor');
    expect(honorImg).toHaveAttribute('src', '/logos marcas/honor.svg');
  });

  it('5. Servicio Técnico Express: debe renderizar la card de laboratorio con tiempos, garantías y enlaces', () => {
    renderLandingPage();

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /¿Pantalla rota o batería degradada\? Reparaciones en 45 min en Puerto Asís con garantía/i,
      })
    ).toBeInTheDocument();

    expect(screen.getByText(/Reparación express en 45 minutos/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Garantía real por escrito/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Diagnóstico inicial sin costo/i)).toBeInTheDocument();
    expect(screen.getByText(/Técnicos certificados iPhone & Android/i)).toBeInTheDocument();

    const techCta = screen.getByRole('link', { name: /Ir a cotizar servicio técnico/i });
    expect(techCta).toHaveAttribute('href', '/servicio-tecnico');

    const waTechBtn = screen.getByRole('link', { name: /Contactar al laboratorio técnico por WhatsApp/i });
    expect(waTechBtn.getAttribute('href')).toContain('wa.me');
  });

  it('6. Sede Física & Reseñas: debe renderizar dirección oficial, horarios, botón Google Maps y testimonios', () => {
    renderLandingPage();

    expect(screen.getByText('Cra. 32 #13 36, Puerto Asís, Putumayo')).toBeInTheDocument();
    expect(screen.getByText('Lunes a Sábado: 8:00 AM - 7:00 PM')).toBeInTheDocument();

    const mapsBtn = screen.getByRole('link', { name: /Abrir dirección de GIO TECH en Google Maps/i });
    expect(mapsBtn).toHaveAttribute('href', DEFAULT_MAPS_URL);

    expect(screen.getByRole('heading', { level: 2, name: /Lo que dicen nuestros clientes/i })).toBeInTheDocument();

    const reviewGoogleBtn = screen.getByRole('link', { name: /Dejar reseña en Google Maps/i });
    expect(reviewGoogleBtn).toHaveAttribute('href', 'https://g.page/r/CUMXzI9Acx9nEAE/review');
  });

  it('debe redirigir a /producto/:id si se recibe un query param de producto (?producto=ID o ?id=ID)', () => {
    renderLandingPage(['/?producto=prod-1']);
    // Deep links legacy van DIRECTO al detalle (ya no al catálogo)
    expect(screen.getByTestId('producto-page')).toBeInTheDocument();
    expect(screen.queryByTestId('catalogo-page')).not.toBeInTheDocument();
  });

  it('7. Elementos de Temporada en Landing: no debe renderizar badge flotante lateral (.seasonal-side-badge) ni ribbons en bloque', () => {
    const { container } = renderLandingPage();

    // 1. NO debe existir la sección pesada de hero ribbon en bloque
    expect(container.querySelector('.seasonal-hero-ribbon-section')).not.toBeInTheDocument();
    expect(screen.queryByText(/Aprobación en 5 minutos/i)).not.toBeInTheDocument();

    // 2. NO debe existir el badge flotante lateral ni el aside de promoción
    expect(container.querySelector('.seasonal-side-badge')).not.toBeInTheDocument();
    expect(container.querySelector('aside[aria-label="Promoción especial de temporada"]')).not.toBeInTheDocument();
  });

  it('debe utilizar 100% Bootstrap Icons vectoriales y CERO emojis genéricos en la UI renderizada', () => {
    const { container } = renderLandingPage();

    // Verificar que no haya emojis genéricos (celulares, herramientas, tarjetas, etc.) en los textos
    const textContent = container.textContent || '';
    expect(textContent).not.toMatch(/(?:📱|📍|💳|🚚|🛡️|⭐|🔧|🔥)/u);

    // Verificar que los iconos vectoriales de Bootstrap existan en el DOM
    const bootstrapIcons = container.querySelectorAll('i.bi');
    expect(bootstrapIcons.length).toBeGreaterThan(10);
  });
});
