import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ProductImage, { getCategoryIcon } from './ProductImage';

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
});
