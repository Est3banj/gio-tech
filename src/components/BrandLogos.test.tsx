import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  BrandLogo,
  AppleLogo,
  SamsungLogo,
  XiaomiLogo,
  MotorolaLogo,
  TecnoLogo,
  InfinixLogo,
  HuaweiLogo,
  HonorLogo,
  RealmeLogo,
  BRAND_ASSETS,
} from './BrandLogos';

describe('BrandLogos Component & Assets Integration', () => {
  it('mapea correctamente las rutas oficiales en BRAND_ASSETS', () => {
    expect(BRAND_ASSETS.apple).toBe('/logos marcas/apple.svg');
    expect(BRAND_ASSETS.samsung).toBe('/logos marcas/samsung.svg');
    expect(BRAND_ASSETS.xiaomi).toBe('/logos marcas/xiaomi.svg');
    expect(BRAND_ASSETS.redmi).toBe('/logos marcas/xiaomi.svg');
    expect(BRAND_ASSETS.poco).toBe('/logos marcas/xiaomi.svg');
    expect(BRAND_ASSETS.motorola).toBe('/logos marcas/motorola.svg');
    expect(BRAND_ASSETS.moto).toBe('/logos marcas/motorola.svg');
    expect(BRAND_ASSETS.tecno).toBe('/logos marcas/logotecno.svg');
    expect(BRAND_ASSETS.infinix).toBe('/logos marcas/logoinifinix.jpg');
    expect(BRAND_ASSETS.honor).toBe('/logos marcas/honor.svg');
  });

  it('renderiza etiquetas <img> accesibles para marcas con assets oficiales', () => {
    const { rerender } = render(<BrandLogo brand="Apple" />);
    const appleImg = screen.getByRole('img', { name: 'Logo oficial Apple' });
    expect(appleImg).toBeInTheDocument();
    expect(appleImg).toHaveAttribute('src', '/logos marcas/apple.svg');

    rerender(<BrandLogo brand="Samsung" />);
    const samsungImg = screen.getByRole('img', { name: 'Logo oficial Samsung' });
    expect(samsungImg).toHaveAttribute('src', '/logos marcas/samsung.svg');

    rerender(<BrandLogo brand="Tecno" />);
    const tecnoImg = screen.getByRole('img', { name: 'Logo oficial Tecno' });
    expect(tecnoImg).toHaveAttribute('src', '/logos marcas/logotecno.svg');

    rerender(<BrandLogo brand="Infinix" />);
    const infinixImg = screen.getByRole('img', { name: 'Logo oficial Infinix' });
    expect(infinixImg).toHaveAttribute('src', '/logos marcas/logoinifinix.jpg');

    rerender(<BrandLogo brand="Honor" />);
    const honorImg = screen.getByRole('img', { name: 'Logo oficial Honor' });
    expect(honorImg).toHaveAttribute('src', '/logos marcas/honor.svg');
  });

  it('renderiza fallback SVG para marcas sin asset oficial (Huawei, Realme)', () => {
    const { rerender } = render(<BrandLogo brand="Huawei" />);
    expect(screen.getByTestId('brand-logo-huawei')).toBeInTheDocument();

    rerender(<BrandLogo brand="Realme" />);
    expect(screen.getByTestId('brand-logo-realme')).toBeInTheDocument();
  });

  it('activa el fallback SVG si la imagen oficial falla al cargar (onError)', () => {
    render(<BrandLogo brand="Apple" />);
    const appleImg = screen.getByRole('img', { name: 'Logo oficial Apple' });
    expect(appleImg).toBeInTheDocument();

    // Simular error de carga en la imagen
    fireEvent.error(appleImg);

    // Debe renderizar el SVG de fallback tras el error
    expect(screen.getByTestId('brand-logo-apple')).toBeInTheDocument();
  });

  it('soporta marcas en minúsculas, mayúsculas y con espacios', () => {
    render(<BrandLogo brand="  SAMSUNG  " />);
    const img = screen.getByRole('img', { name: 'Logo oficial SAMSUNG' });
    expect(img).toHaveAttribute('src', '/logos marcas/samsung.svg');
  });

  it('retorna null para marcas no reconocidas', () => {
    const { container } = render(<BrandLogo brand="MarcaInexistente" />);
    expect(container.firstChild).toBeNull();
  });

  it('renderiza los componentes SVG individuales directamente', () => {
    const { container } = render(
      <div>
        <AppleLogo />
        <SamsungLogo />
        <XiaomiLogo />
        <MotorolaLogo />
        <TecnoLogo />
        <InfinixLogo />
        <HuaweiLogo />
        <HonorLogo />
        <RealmeLogo />
      </div>
    );
    expect(container.querySelectorAll('svg').length).toBe(9);
  });
});
