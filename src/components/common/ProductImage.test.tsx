import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import ProductImage, { getCategoryIcon } from './ProductImage';
import {
  toCanvasProbeUrl,
  isVisuallyBlankMetrics,
  isCorsProbeSafeHost,
} from './image-blank-detection';

describe('ProductImage Component - Blindaje Resiliente de Imágenes', () => {
  it('renders img with valid src, alt, loading="lazy" and decoding="async"', () => {
    render(
      <ProductImage
        src="https://img.test/iphone15.jpg"
        alt="iPhone 15"
        brand="Apple"
      />
    );

    const img = screen.getByAltText('iPhone 15');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://img.test/iphone15.jpg');
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('decoding', 'async');
    expect(img).toHaveClass('product-image-loading');
  });

  it('transitions opacity class on load event', () => {
    render(
      <ProductImage
        src="https://img.test/galaxy.jpg"
        alt="Samsung Galaxy S24"
        brand="Samsung"
      />
    );

    const img = screen.getByAltText('Samsung Galaxy S24');
    expect(img).toHaveClass('product-image-loading');

    fireEvent.load(img);

    expect(img).toHaveClass('product-image-loaded');
  });

  it('switches to glassmorphic vector fallback immediately when onError is fired', () => {
    render(
      <ProductImage
        src="https://img.test/broken-image.jpg"
        alt="Xiaomi Redmi Note 13"
        brand="Xiaomi"
        category="Celulares"
      />
    );

    const img = screen.getByAltText('Xiaomi Redmi Note 13');
    expect(img).toBeInTheDocument();

    // Simular fallo de red / 404
    fireEvent.error(img);

    // Image disappears, fallback container is rendered
    expect(screen.queryByAltText('Xiaomi Redmi Note 13')).not.toBeInTheDocument();
    const fallback = screen.getByTestId('product-image-fallback');
    expect(fallback).toBeInTheDocument();
    expect(fallback).toHaveAttribute('role', 'img');

    // Shows Xiaomi brand logo and category icon
    expect(screen.getByTestId('product-fallback-brand-logo')).toBeInTheDocument();
    expect(screen.getByTestId('product-fallback-category-icon')).toHaveClass('bi-phone');
    expect(screen.getByText('Xiaomi')).toBeInTheDocument();
  });

  it('renders vector fallback immediately if src is empty or whitespace without rendering broken img tag', () => {
    render(
      <ProductImage
        src=""
        alt="Apple iPad Air"
        brand="Apple"
        category="Tablets"
      />
    );

    expect(screen.queryByRole('img', { name: '' })).not.toBeInTheDocument();
    const fallback = screen.getByTestId('product-image-fallback');
    expect(fallback).toBeInTheDocument();
    expect(screen.getByTestId('product-fallback-brand-logo')).toBeInTheDocument();
    expect(screen.getByTestId('product-fallback-category-icon')).toHaveClass('bi-tablet');
  });

  it('renders thumbnail variant fallback for compact areas (cart, admin table)', () => {
    render(
      <ProductImage
        src=""
        alt="Miniatura Accesorio"
        category="Accesorios"
        variant="thumb"
      />
    );

    const thumbFallback = screen.getByTestId('product-image-fallback-thumb');
    expect(thumbFallback).toBeInTheDocument();
    expect(thumbFallback.querySelector('.bi-box-seam')).toBeInTheDocument();
  });

  it('switches thumbnail variant to fallback on onError event', () => {
    render(
      <ProductImage
        src="https://img.test/bad-thumb.jpg"
        alt="Smartwatch Deportivo"
        category="Smartwatch"
        variant="thumb"
      />
    );

    const img = screen.getByAltText('Smartwatch Deportivo');
    fireEvent.error(img);

    const thumbFallback = screen.getByTestId('product-image-fallback-thumb');
    expect(thumbFallback).toBeInTheDocument();
    expect(thumbFallback.querySelector('.bi-smartwatch')).toBeInTheDocument();
  });

  it('resets error state when src prop updates dynamically', () => {
    const { rerender } = render(
      <ProductImage
        src=""
        alt="Preview Dinámico"
        brand="Motorola"
      />
    );

    expect(screen.getByTestId('product-image-fallback')).toBeInTheDocument();

    // User types or selects valid URL
    rerender(
      <ProductImage
        src="https://img.test/motorola-edge.jpg"
        alt="Preview Dinámico"
        brand="Motorola"
      />
    );

    const img = screen.getByAltText('Preview Dinámico');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://img.test/motorola-edge.jpg');
    expect(screen.queryByTestId('product-image-fallback')).not.toBeInTheDocument();
  });

  describe('getCategoryIcon helper', () => {
    it('resolves correct icons based on category and title keywords', () => {
      expect(getCategoryIcon('Celulares', 'Samsung S24')).toBe('bi-phone');
      expect(getCategoryIcon('Tablets', 'iPad Pro 11')).toBe('bi-tablet');
      expect(getCategoryIcon('Smartwatch', 'Huawei Band 8')).toBe('bi-smartwatch');
      expect(getCategoryIcon('Audio', 'AirPods Pro 2')).toBe('bi-headphones');
      expect(getCategoryIcon('Accesorios', 'Cargador 67W')).toBe('bi-box-seam');
      expect(getCategoryIcon('Laptops', 'MacBook Air M2')).toBe('bi-laptop');
      expect(getCategoryIcon('Servicio Técnico', 'Cambio de pantalla')).toBe('bi-tools');
    });
  });

  describe('Detección de imagen vacía (stage en blanco)', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    it('toCanvasProbeUrl reescribe blob de GitHub a raw.githubusercontent y deja el resto intacto', () => {
      expect(toCanvasProbeUrl('https://github.com/Est3banj/logo/blob/main/cubo.png?raw=true')).toBe(
        'https://raw.githubusercontent.com/Est3banj/logo/main/cubo.png'
      );
      expect(toCanvasProbeUrl('https://github.com/a/b/blob/refs/heads/main/x%20y.png?raw=true')).toBe(
        'https://raw.githubusercontent.com/a/b/refs/heads/main/x%20y.png'
      );
      expect(toCanvasProbeUrl('https://http2.mlstatic.com/img.webp')).toBe('https://http2.mlstatic.com/img.webp');
      expect(toCanvasProbeUrl('https://github.com/a/b/commit/abc')).toBe('https://github.com/a/b/commit/abc');
    });

    it('isVisuallyBlankMetrics marca como vacía solo con ratios calibrados (vr<0.2 o std<18)', () => {
      expect(isVisuallyBlankMetrics(0.13, 14.4)).toBe(true); // cableipho.png (90% transparente)
      expect(isVisuallyBlankMetrics(0.4, 10.1)).toBe(true); // cubo.png (plana)
      expect(isVisuallyBlankMetrics(1.0, 13.3)).toBe(true); // foto plana casi blanca
      expect(isVisuallyBlankMetrics(0.0, 0.0)).toBe(true); // totalmente transparente
      expect(isVisuallyBlankMetrics(0.269, 46.1)).toBe(false); // siguiente más baja del catálogo
      expect(isVisuallyBlankMetrics(0.9, 24.9)).toBe(false); // imagen sana con bajo contraste
      expect(isVisuallyBlankMetrics(1.0, 60)).toBe(false); // imagen sana normal
    });

    it('isCorsProbeSafeHost acepta por sufijo los hosts con CORS conocidos y rechaza el resto', () => {
      // Allowlist por sufijo (subdominios variables)
      expect(isCorsProbeSafeHost('https://raw.githubusercontent.com/a/b/main/x.png')).toBe(true);
      expect(isCorsProbeSafeHost('https://avatars.githubusercontent.com/u/1?v=4')).toBe(true);
      expect(isCorsProbeSafeHost('https://http2.mlstatic.com/x.webp')).toBe(true);
      expect(isCorsProbeSafeHost('https://http0.mlstatic.com/x.webp')).toBe(true);
      expect(isCorsProbeSafeHost('https://m.media-amazon.com/images/I/x.jpg')).toBe(true);
      expect(isCorsProbeSafeHost('https://cdn.media-amazon.com/images/I/x.jpg')).toBe(true);
      expect(isCorsProbeSafeHost('https://i.ssl-images-amazon.com/images/I/x.jpg')).toBe(true);
      expect(isCorsProbeSafeHost('https://cdn.appmifile.com/x.png')).toBe(true);
      // Fuera de allowlist → no se sondea
      expect(isCorsProbeSafeHost('https://cemelectronix.com/wp-content/uploads/x.png')).toBe(false);
      expect(isCorsProbeSafeHost('https://github.com/a/b/blob/main/x.png?raw=true')).toBe(false);
      // ...pero el blob de GitHub SÍ se sondea: la puerta se evalúa SIEMPRE
      // sobre la URL ya normalizada a raw.githubusercontent.com
      expect(
        isCorsProbeSafeHost(toCanvasProbeUrl('https://github.com/a/b/blob/main/x.png?raw=true'))
      ).toBe(true);
      expect(isCorsProbeSafeHost('https://img.test/x.png')).toBe(false);
      expect(isCorsProbeSafeHost('https://notgithubusercontent.com/x.png')).toBe(false);
      expect(isCorsProbeSafeHost('https://evil.githubusercontent.com.attacker.com/x.png')).toBe(false);
      expect(isCorsProbeSafeHost('not-a-url')).toBe(false);
    });

    it('sustituye la imagen por el placeholder cuando el probe confirma que está vacía (host en allowlist)', async () => {
      class BlankProbeImage {
        crossOrigin: string | null = null;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_value: string) {
          queueMicrotask(() => this.onload?.());
        }
      }
      vi.stubGlobal('Image', BlankProbeImage);
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
        drawImage: vi.fn(),
        getImageData: () => ({ data: new Uint8ClampedArray(64 * 64 * 4) }),
      } as unknown as RenderingContext);

      render(
        <ProductImage
          src="https://raw.githubusercontent.com/Est3banj/logo/main/totalmente-transparente.png"
          alt="Producto Vacío"
          brand="Apple"
        />
      );

      const img = screen.getByAltText('Producto Vacío');
      fireEvent.load(img);
      expect(img).toHaveClass('product-image-loaded');

      await waitFor(() => expect(screen.getByTestId('product-image-fallback')).toBeInTheDocument());
      expect(screen.queryByAltText('Producto Vacío')).not.toBeInTheDocument();
    });

    it('conserva la imagen cuando el probe no puede concluir (CORS sin soportar)', async () => {
      class CorsFailImage {
        crossOrigin: string | null = null;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_value: string) {
          queueMicrotask(() => this.onerror?.());
        }
      }
      vi.stubGlobal('Image', CorsFailImage);

      // Host en allowlist: el probe SÍ se emite, pero falla → fail-open
      render(
        <ProductImage
          src="https://http2.mlstatic.com/real-pero-sin-cors.png"
          alt="Producto Real"
          brand="Apple"
        />
      );

      const img = screen.getByAltText('Producto Real');
      fireEvent.load(img);

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(screen.getByAltText('Producto Real')).toBeInTheDocument();
      expect(screen.queryByTestId('product-image-fallback')).not.toBeInTheDocument();
    });

    it('NO sondea ni marca vacía cuando el host está fuera de la allowlist (cemelectronix)', async () => {
      let probeImagesCreated = 0;
      class WouldBeBlankProbeImage {
        crossOrigin: string | null = null;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        constructor() {
          probeImagesCreated += 1;
        }
        set src(_value: string) {
          // Si el probe llegara a emitirse, esta imagen "vacía" marcaría el
          // placeholder: probar pixels transparentes → blank=true
          queueMicrotask(() => this.onload?.());
        }
      }
      vi.stubGlobal('Image', WouldBeBlankProbeImage);
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
        drawImage: vi.fn(),
        getImageData: () => ({ data: new Uint8ClampedArray(64 * 64 * 4) }),
      } as unknown as RenderingContext);

      render(
        <ProductImage
          src="https://cemelectronix.com/wp-content/uploads/cargador.png"
          alt="Producto Cemelectronix"
          brand="Apple"
        />
      );

      const img = screen.getByAltText('Producto Cemelectronix');
      fireEvent.load(img);
      expect(img).toHaveClass('product-image-loaded');

      await new Promise((resolve) => setTimeout(resolve, 10));
      // Sin request de sondeo: 0 errores CORS en consola
      expect(probeImagesCreated).toBe(0);
      // Fail-open pre-fix: la imagen se conserva, sin placeholder
      expect(screen.getByAltText('Producto Cemelectronix')).toBeInTheDocument();
      expect(screen.queryByTestId('product-image-fallback')).not.toBeInTheDocument();
    });
  });
});
