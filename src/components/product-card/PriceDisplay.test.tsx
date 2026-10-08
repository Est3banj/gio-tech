import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PriceDisplay from './PriceDisplay';
import type { DerivadosPricing } from './useProductPricing';

describe('PriceDisplay', () => {
  const baseDer: DerivadosPricing = {
    nombre: 'Test Product',
    descripcion: 'Test Description',
    imagen: 'https://img.test/pic.jpg',
    contado: 2000000,
    showPromoPrice: false,
    showPromoBadge: false,
    showNuevoBadge: false,
    priceRegularStr: '$2.000.000',
    pricePromoStr: '',
    badgeBg: '#c8102e',
    highlightColor: '#c8102e',
    cuotaInicialStr: '',
    cuotaInicial: 0,
    solo12Meses: false,
    cuotas12: null,
    cuotas12Str: '',
    cuotas6Str: '',
    cuotas8Str: '',
    financierasDisponibles: [],
    tieneFinanciacion: false,
    aplicaKrediya: false,
    mostrarPlanCuotas: false,
    productType: 'accesorio',
  };

  it('renders single-tier in card when product has no financing', () => {
    const der: DerivadosPricing = {
      ...baseDer,
      tieneFinanciacion: false,
      mostrarPlanCuotas: false,
    };

    render(<PriceDisplay variant="card" der={der} />);

    expect(screen.getByText('Contado')).toBeInTheDocument();
    expect(screen.getByText('$2.000.000')).toBeInTheDocument();
    expect(screen.queryByText('Crédito')).not.toBeInTheDocument();
    expect(screen.queryByText(/cuotas/i)).not.toBeInTheDocument();
  });

  it('renders dual-tier with "Crédito disponible" badge in card when product has financing but no Krediya cuotas (e.g. iPhone or Accesorio > 100k)', () => {
    const der: DerivadosPricing = {
      ...baseDer,
      tieneFinanciacion: true,
      aplicaKrediya: false,
      mostrarPlanCuotas: false,
    };

    render(<PriceDisplay variant="card" der={der} />);

    expect(screen.getByText('Contado')).toBeInTheDocument();
    expect(screen.getByText('$2.000.000')).toBeInTheDocument();
    expect(screen.getByText('Crédito')).toBeInTheDocument();
    expect(screen.getByText('Crédito disponible')).toBeInTheDocument();
    // Must NOT show dashes or "/qna"
    expect(screen.queryByText(/—/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\/qna/)).not.toBeInTheDocument();
  });

  it('renders dual-tier with fixed cuotas in card when product applies to Krediya and has cuotas loaded', () => {
    const der: DerivadosPricing = {
      ...baseDer,
      tieneFinanciacion: true,
      aplicaKrediya: true,
      mostrarPlanCuotas: true,
      cuotas6Str: '$150.000',
      cuotas8Str: '$280.000',
    };

    render(<PriceDisplay variant="card" der={der} />);

    expect(screen.getByText('Contado')).toBeInTheDocument();
    expect(screen.getByText('$2.000.000')).toBeInTheDocument();
    expect(screen.getByText('Crédito')).toBeInTheDocument();
    expect(screen.getByText('16 cuotas')).toBeInTheDocument();
    expect(screen.getByText(/\$150\.000/)).toBeInTheDocument();
    expect(screen.getByText('/qna')).toBeInTheDocument();
    expect(screen.queryByText('Crédito disponible')).not.toBeInTheDocument();
  });

  it('renders modal variant correctly with regular price', () => {
    const der: DerivadosPricing = {
      ...baseDer,
      showPromoPrice: false,
      priceRegularStr: '$2.000.000',
    };

    render(<PriceDisplay variant="modal" der={der} />);

    expect(screen.getByText('Precio contado:')).toBeInTheDocument();
    expect(screen.getByText('$2.000.000')).toBeInTheDocument();
  });

  it('renders modal variant correctly with promo price', () => {
    const der: DerivadosPricing = {
      ...baseDer,
      showPromoPrice: true,
      priceRegularStr: '$2.500.000',
      pricePromoStr: '$2.000.000',
      promoBadgeText: 'OFERTA',
    };

    render(<PriceDisplay variant="modal" der={der} />);

    expect(screen.getByText('Precio regular:')).toBeInTheDocument();
    expect(screen.getByText('$2.500.000')).toBeInTheDocument();
    expect(screen.getByText('Precio promocional:')).toBeInTheDocument();
    expect(screen.getByText('$2.000.000')).toBeInTheDocument();
    expect(screen.getByText('OFERTA')).toBeInTheDocument();
  });

  it('renders page variant with regular + promo price (same block as modal)', () => {
    const der: DerivadosPricing = {
      ...baseDer,
      showPromoPrice: true,
      priceRegularStr: '$2.500.000',
      pricePromoStr: '$2.000.000',
      promoBadgeText: 'OFERTA',
    };

    render(<PriceDisplay variant="page" der={der} />);

    expect(screen.getByText('Precio regular:')).toBeInTheDocument();
    expect(screen.getByText('$2.500.000')).toBeInTheDocument();
    expect(screen.getByText('Precio promocional:')).toBeInTheDocument();
    expect(screen.getByText('$2.000.000')).toBeInTheDocument();
    expect(screen.getByText('OFERTA')).toBeInTheDocument();
  });
});
