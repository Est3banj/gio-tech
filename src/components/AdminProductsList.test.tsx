import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminProductsList from './AdminProductsList';
import * as productService from '../services/product.service';
import { Product } from '../types';

vi.mock('../services/product.service', () => ({
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
}));

const mockProducts: Product[] = [
  {
    id: 'prod-1',
    nombre: 'iPhone 15 Pro Max',
    marca: 'Apple',
    categoria: 'Celulares',
    contado: 5499000,
    cuotas6: 375000,
    cuotas8: 750000,
    imagen: 'https://example.com/iphone15.jpg',
    stock: 8,
    esDestacado: true,
    promo: true,
    promoBadgeText: 'OFERTA',
    specs: {
      almacenamiento: 256,
      ram: 8,
      camara: 48,
      pantalla: 6.7,
      bateria: 4422,
    },
  },
  {
    id: 'prod-2',
    nombre: 'Samsung Galaxy A54',
    marca: 'Samsung',
    categoria: 'Celulares',
    contado: 1399000,
    cuotas6: 95000,
    cuotas8: 190000,
    imagen: 'https://example.com/a54.jpg',
    stock: 0,
    nuevo: true,
    specs: {
      almacenamiento: 128,
      ram: 6,
      camara: 50,
      pantalla: 6.4,
      bateria: 5000,
    },
  },
  {
    id: 'prod-3',
    nombre: 'Audífonos Bluetooth Pro',
    marca: 'Xiaomi',
    categoria: 'Accesorios',
    contado: 89000,
    imagen: '',
    stock: 15,
  },
];

describe('AdminProductsList Component', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnAddNew = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders products list header and all products', () => {
    render(
      <AdminProductsList
        productos={mockProducts}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddNew={mockOnAddNew}
      />
    );

    expect(screen.getByRole('heading', { name: /Lista de Productos/i })).toBeInTheDocument();
    expect(screen.getAllByText('iPhone 15 Pro Max').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Samsung Galaxy A54').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Audífonos Bluetooth Pro').length).toBeGreaterThan(0);
  });

  it('filters products in real-time when typing in the search bar', () => {
    render(
      <AdminProductsList
        productos={mockProducts}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Buscar por nombre, marca o modelo.../i);
    fireEvent.change(searchInput, { target: { value: 'iPhone' } });

    expect(screen.getAllByText('iPhone 15 Pro Max').length).toBeGreaterThan(0);
    expect(screen.queryByText('Samsung Galaxy A54')).not.toBeInTheDocument();
    expect(screen.queryByText('Audífonos Bluetooth Pro')).not.toBeInTheDocument();
  });

  it('filters products by brand dropdown', () => {
    render(
      <AdminProductsList
        productos={mockProducts}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const brandSelect = screen.getByLabelText(/Filtrar por marca/i);
    fireEvent.change(brandSelect, { target: { value: 'Samsung' } });

    expect(screen.getAllByText('Samsung Galaxy A54').length).toBeGreaterThan(0);
    expect(screen.queryByText('iPhone 15 Pro Max')).not.toBeInTheDocument();
  });

  it('filters products by category dropdown', () => {
    render(
      <AdminProductsList
        productos={mockProducts}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const catSelect = screen.getByLabelText(/Filtrar por categoría/i);
    fireEvent.change(catSelect, { target: { value: 'Accesorios' } });

    expect(screen.getAllByText('Audífonos Bluetooth Pro').length).toBeGreaterThan(0);
    expect(screen.queryByText('iPhone 15 Pro Max')).not.toBeInTheDocument();
  });

  it('filters products by stock status', () => {
    render(
      <AdminProductsList
        productos={mockProducts}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const statusSelect = screen.getByLabelText(/Filtrar por estado/i);
    fireEvent.change(statusSelect, { target: { value: 'out_of_stock' } });

    expect(screen.getAllByText('Samsung Galaxy A54').length).toBeGreaterThan(0);
    expect(screen.queryByText('iPhone 15 Pro Max')).not.toBeInTheDocument();
  });

  it('triggers stock toggle via switch and calls updateProduct', async () => {
    vi.mocked(productService.updateProduct).mockResolvedValueOnce(undefined);

    render(
      <AdminProductsList
        productos={mockProducts}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[0]);

    await waitFor(() => {
      expect(productService.updateProduct).toHaveBeenCalledWith('prod-1', { stock: 0, enStock: false });
    });
  });

  it('calls onEdit when clicking the edit button', () => {
    render(
      <AdminProductsList
        productos={mockProducts}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const editButtons = screen.getAllByRole('button', { name: /Editar/i });
    fireEvent.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledWith(mockProducts[0]);
  });

  it('calls onDelete when clicking the delete button', () => {
    render(
      <AdminProductsList
        productos={mockProducts}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const deleteButtons = screen.getAllByRole('button', { name: /Eliminar/i });
    fireEvent.click(deleteButtons[0]);

    expect(mockOnDelete).toHaveBeenCalledWith('prod-1');
  });

  it('renders empty state when search returns zero results and allows clearing filters', () => {
    render(
      <AdminProductsList
        productos={mockProducts}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Buscar por nombre, marca o modelo.../i);
    fireEvent.change(searchInput, { target: { value: 'NonExistingProductXYZ' } });

    expect(screen.getByText('No se encontraron productos')).toBeInTheDocument();

    const resetBtn = screen.getByRole('button', { name: /Restablecer filtros/i });
    fireEvent.click(resetBtn);

    expect(screen.getAllByText('iPhone 15 Pro Max').length).toBeGreaterThan(0);
  });

  it('contains zero raw emoji characters and uses vector icons for badges and filters', () => {
    const { container } = render(
      <AdminProductsList
        productos={mockProducts}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddNew={mockOnAddNew}
      />
    );

    const textContent = container.textContent || '';
    expect(textContent).not.toMatch(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u);
    expect(container.querySelector('.bi-star-fill')).toBeInTheDocument();
    expect(container.querySelector('.bi-search')).toBeInTheDocument();
  });

  it('renders thumbnail fallback on onError event and for products without image', () => {
    render(
      <AdminProductsList
        productos={mockProducts}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Product without image ('Audífonos Bluetooth Pro') renders thumbnail fallback directly
    const fallbacks = screen.getAllByTestId('product-image-fallback-thumb');
    expect(fallbacks.length).toBeGreaterThan(0);

    // Product with broken image switches on error
    const img = screen.getAllByAltText('iPhone 15 Pro Max')[0];
    fireEvent.error(img);

    // Now fallback is rendered for iPhone too
    const updatedFallbacks = screen.getAllByTestId('product-image-fallback-thumb');
    expect(updatedFallbacks.length).toBeGreaterThan(fallbacks.length);
  });
});
