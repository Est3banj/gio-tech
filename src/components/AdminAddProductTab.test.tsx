import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminAddProductTab from './AdminAddProductTab';
import * as productService from '../services/product.service';

vi.mock('../services/product.service', () => ({
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
}));

describe('AdminAddProductTab Component', () => {
  const mockSetNombreProducto = vi.fn();
  const mockSetDescripcionProducto = vi.fn();
  const mockSetContadoProducto = vi.fn();
  const mockSetCuotas6Producto = vi.fn();
  const mockSetCuotas8Producto = vi.fn();
  const mockSetImagenProducto = vi.fn();
  const mockSetCuotaInicialProducto = vi.fn();
  const mockSetEditandoProducto = vi.fn();
  const mockSetPromoActivo = vi.fn();
  const mockSetPromoPrice = vi.fn();
  const mockSetPromoBadgeText = vi.fn();
  const mockSetPromoBadgeBg = vi.fn();
  const mockSetPromoHighlight = vi.fn();
  const mockSetNuevoActivo = vi.fn();
  const mockSetNuevoBadgeText = vi.fn();
  const mockSetNuevoBadgeBg = vi.fn();
  const mockSetBadgeMode = vi.fn();
  const mockSetSolo12Meses = vi.fn();
  const mockSetCuotas12Producto = vi.fn();
  const mockSetSuccess = vi.fn();
  const mockSetError = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    nombreProducto: 'Xiaomi Redmi Note 13',
    setNombreProducto: mockSetNombreProducto,
    descripcionProducto: 'Pantalla AMOLED 120Hz',
    setDescripcionProducto: mockSetDescripcionProducto,
    contadoProducto: '1100000',
    setContadoProducto: mockSetContadoProducto,
    cuotas6Producto: '75000',
    setCuotas6Producto: mockSetCuotas6Producto,
    cuotas8Producto: '150000',
    setCuotas8Producto: mockSetCuotas8Producto,
    imagenProducto: 'https://example.com/redmi13.jpg',
    setImagenProducto: mockSetImagenProducto,
    cuotaInicialProducto: '0',
    setCuotaInicialProducto: mockSetCuotaInicialProducto,
    editandoProducto: null,
    setEditandoProducto: mockSetEditandoProducto,
    promoActivo: false,
    setPromoActivo: mockSetPromoActivo,
    promoPrice: '',
    setPromoPrice: mockSetPromoPrice,
    promoBadgeText: 'PROMO',
    setPromoBadgeText: mockSetPromoBadgeText,
    promoBadgeBg: '#d81b60',
    setPromoBadgeBg: mockSetPromoBadgeBg,
    promoHighlight: '',
    setPromoHighlight: mockSetPromoHighlight,
    nuevoActivo: false,
    setNuevoActivo: mockSetNuevoActivo,
    nuevoBadgeText: 'NUEVO',
    setNuevoBadgeText: mockSetNuevoBadgeText,
    nuevoBadgeBg: '#28a745',
    setNuevoBadgeBg: mockSetNuevoBadgeBg,
    badgeMode: 'promo',
    setBadgeMode: mockSetBadgeMode,
    solo12Meses: false,
    setSolo12Meses: mockSetSolo12Meses,
    cuotas12Producto: '',
    setCuotas12Producto: mockSetCuotas12Producto,
    setSuccess: mockSetSuccess,
    setError: mockSetError,
    onCancel: mockOnCancel,
  };

  it('renders all 4 SaaS cards and live preview correctly', () => {
    render(<AdminAddProductTab {...defaultProps} />);

    expect(screen.getByText(/1. Información Comercial/i)).toBeInTheDocument();
    expect(screen.getByText(/2. Especificaciones Técnicas Explícitas/i)).toBeInTheDocument();
    expect(screen.getByText(/3. Precios & Financiación/i)).toBeInTheDocument();
    expect(screen.getByText(/4. Imagen Oficial del Producto/i)).toBeInTheDocument();
    expect(screen.getByText(/Live Preview/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Guardar Producto/i })).toBeInTheDocument();
  });

  it('allows clicking quick spec pills for storage, ram and battery', () => {
    render(<AdminAddProductTab {...defaultProps} />);

    const pill256 = screen.getByRole('button', { name: '256GB' });
    fireEvent.click(pill256);

    const pill8gb = screen.getByRole('button', { name: '8GB' });
    fireEvent.click(pill8gb);

    const pill5000 = screen.getByRole('button', { name: '5000' });
    fireEvent.click(pill5000);

    // Live preview updates specs
    expect(screen.getAllByText(/256GB/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/8GB/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/5000mAh/i).length).toBeGreaterThan(0);
  });

  it('submits form and calls createProduct when adding a new product', async () => {
    vi.mocked(productService.createProduct).mockResolvedValueOnce('new-prod-id');

    render(<AdminAddProductTab {...defaultProps} />);

    const submitBtn = screen.getByRole('button', { name: /Guardar Producto/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(productService.createProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'Xiaomi Redmi Note 13',
          contado: 1100000,
          cuotas6: 75000,
          cuotas8: 150000,
          imagen: 'https://example.com/redmi13.jpg',
        })
      );
      expect(mockSetSuccess).toHaveBeenCalled();
    });
  });

  it('calls updateProduct when editing an existing product', async () => {
    vi.mocked(productService.updateProduct).mockResolvedValueOnce(undefined);

    const editProps = {
      ...defaultProps,
      editandoProducto: {
        id: 'existing-prod-123',
        nombre: 'iPhone 14 Pro',
        imagen: 'https://example.com/iphone14.jpg',
        contado: 4500000,
      },
    };

    render(<AdminAddProductTab {...editProps} />);

    expect(screen.getByRole('button', { name: /Actualizar Producto/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancelar Edición/i })).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Actualizar Producto/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(productService.updateProduct).toHaveBeenCalledWith(
        'existing-prod-123',
        expect.anything()
      );
      expect(mockSetSuccess).toHaveBeenCalled();
    });
  });

  it('handles cancel edition button click', () => {
    const editProps = {
      ...defaultProps,
      editandoProducto: {
        id: 'existing-prod-123',
        nombre: 'iPhone 14 Pro',
        imagen: 'https://example.com/iphone14.jpg',
      },
    };

    render(<AdminAddProductTab {...editProps} />);

    const cancelBtn = screen.getByRole('button', { name: /Cancelar Edición/i });
    fireEvent.click(cancelBtn);

    expect(mockSetEditandoProducto).toHaveBeenCalledWith(null);
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('contains zero raw emoji characters and uses vector icons', () => {
    const { container } = render(<AdminAddProductTab {...defaultProps} esDestacado={true} />);
    const textContent = container.textContent || '';
    expect(textContent).not.toMatch(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u);
    expect(container.querySelector('.bi-tag-fill')).toBeInTheDocument();
    expect(container.querySelector('.bi-cpu-fill')).toBeInTheDocument();
    expect(container.querySelector('.bi-star-fill')).toBeInTheDocument();
  });

  it('renders resilient glassmorphic fallback in Live Preview when imagenProducto is empty or triggers onError', () => {
    const emptyImgProps = {
      ...defaultProps,
      imagenProducto: '',
    };

    const { rerender } = render(<AdminAddProductTab {...emptyImgProps} />);

    // Empty URL shows fallback
    expect(screen.getByTestId('product-image-fallback')).toBeInTheDocument();

    // With URL, tries to render image
    rerender(<AdminAddProductTab {...defaultProps} imagenProducto="https://img.test/invalid-preview.jpg" />);

    const img = screen.getByAltText('Xiaomi Redmi Note 13');
    expect(img).toBeInTheDocument();

    // Trigger onError
    fireEvent.error(img);

    expect(screen.getByTestId('product-image-fallback')).toBeInTheDocument();
  });
});
