import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useParams } from 'react-router-dom';
import Catalogo from './Catalogo';
import { WhatsappNumberProvider } from '../contexts/WhatsappNumberContext';
import { CartProvider } from '../contexts/CartContext';
import type { Product } from '../types';
import type { UseProductsReturn } from '../hooks/useProducts';
import type { UseConfigReturn } from '../hooks/useConfig';

// Mock dependencies
const mockUseProducts = vi.fn<() => UseProductsReturn>();
const mockUseConfig = vi.fn<() => UseConfigReturn>();

vi.mock('../hooks/useProducts', () => ({
  useProducts: () => mockUseProducts(),
}));

vi.mock('../hooks/useConfig', () => ({
  useConfig: () => mockUseConfig(),
}));

vi.mock('./BannerSlider', () => ({
  default: () => <div data-testid="banner-slider">Banner Slider</div>,
}));

vi.mock('./GeminiChat', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./GeminiChat')>();
  return {
    ...actual,
    default: () => <div data-testid="gemini-chat">Gemini Chat</div>,
  };
});

vi.mock('./WelcomeModal', () => ({
  default: () => <div data-testid="welcome-modal">Welcome Modal</div>,
}));

const mockProductsList: Product[] = [
  {
    id: '1',
    nombre: 'Samsung Galaxy S24 Ultra',
    marca: 'Samsung',
    categoria: 'Celulares',
    descripcion: 'Smartphone de alta gama con cámara de 200MP y 256GB',
    contado: 4500000,
    imagen: 'https://img.test/s24.jpg',
  },
  {
    id: '2',
    nombre: 'Xiaomi Redmi Note 13 Pro',
    marca: 'Redmi',
    categoria: 'Celulares',
    descripcion: 'Excelente relación calidad precio con 128GB',
    contado: 1200000,
    imagen: 'https://img.test/redmi13.jpg',
  },
  {
    id: '3',
    nombre: 'Apple iPhone 15 Pro',
    marca: 'Apple',
    categoria: 'Celulares',
    descripcion: 'Titanio con chip A17 Pro y 256GB',
    contado: 4800000,
    imagen: 'https://img.test/iphone15.jpg',
  },
  {
    id: '4',
    nombre: 'Tecno Spark 20 Pro',
    marca: 'Tecno',
    categoria: 'Celulares',
    descripcion: 'Dispositivo accesible con 256GB y 8GB RAM',
    contado: 750000,
    imagen: 'https://img.test/tecno.jpg',
  },
];

// Stub de la ruta de detalle: permite assertear el redirect a /producto/:id
const ProductoPageStub = () => {
  const { productId } = useParams();
  return <div data-testid="producto-page">Producto {productId}</div>;
};

function renderCatalogo(initialEntries = ['/catalogo']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <WhatsappNumberProvider>
        <CartProvider>
          <Routes>
            <Route path="/catalogo" element={<Catalogo />} />
            <Route path="/producto/:productId" element={<ProductoPageStub />} />
          </Routes>
        </CartProvider>
      </WhatsappNumberProvider>
    </MemoryRouter>
  );
}

describe('Catalogo Component - Control Hub Redesign', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.setItem('gio_welcome_seen_sess_v1', 'true');
    mockUseConfig.mockReturnValue({
      config: { nombre: 'GIO TECH' },
      isLoading: false,
      error: null,
    });
    mockUseProducts.mockReturnValue({
      products: mockProductsList,
      isLoading: false,
      error: null,
    });
  });

  it('renders brand dropdown with all brands and counts', () => {
    renderCatalogo();

    const brandSelect = screen.getByLabelText('Filtrar por marca');
    expect(brandSelect).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Todas las marcas \(4\)/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Apple \(1\)/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Redmi \(1\)/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Samsung \(1\)/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Tecno \(1\)/i })).toBeInTheDocument();
  });

  it('filters products correctly when selecting from Brand Dropdown', () => {
    renderCatalogo();

    const brandSelect = screen.getByLabelText('Filtrar por marca') as HTMLSelectElement;
    fireEvent.change(brandSelect, { target: { value: 'Apple' } });

    expect(brandSelect.value).toBe('Apple');
    expect(screen.getByText('Apple iPhone 15 Pro')).toBeInTheDocument();
    expect(screen.queryByText('Samsung Galaxy S24 Ultra')).not.toBeInTheDocument();
    expect(screen.queryByText('Xiaomi Redmi Note 13 Pro')).not.toBeInTheDocument();
    expect(screen.queryByText('Tecno Spark 20 Pro')).not.toBeInTheDocument();

    // Reset to all brands
    fireEvent.change(brandSelect, { target: { value: '' } });
    expect(screen.getByText('Samsung Galaxy S24 Ultra')).toBeInTheDocument();
    expect(screen.getByText('Apple iPhone 15 Pro')).toBeInTheDocument();
  });

  it('infers brand when product marca field is missing or empty', () => {
    mockUseProducts.mockReturnValue({
      products: [
        {
          id: '10',
          nombre: 'iPhone 13 128GB Medianoche',
          categoria: 'Celulares',
          contado: 2900000,
          imagen: 'https://img.test/ip13.jpg',
        },
        {
          id: '11',
          nombre: 'Galaxy A34 5G 128GB',
          categoria: 'Celulares',
          contado: 1100000,
          imagen: 'https://img.test/a34.jpg',
        },
      ],
      isLoading: false,
      error: null,
    });

    renderCatalogo();

    expect(screen.getByRole('option', { name: /Apple \(1\)/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Samsung \(1\)/i })).toBeInTheDocument();

    const brandSelect = screen.getByLabelText('Filtrar por marca') as HTMLSelectElement;
    fireEvent.change(brandSelect, { target: { value: 'Apple' } });

    expect(screen.getByText('iPhone 13 128GB Medianoche')).toBeInTheDocument();
    expect(screen.queryByText('Galaxy A34 5G 128GB')).not.toBeInTheDocument();
  });

  it('displays accurate count badge in header', () => {
    renderCatalogo();

    expect(screen.getByText('4 equipos')).toBeInTheDocument();
  });

  it('performs fuzzy search with Fuse.js matching with typo tolerance', () => {
    renderCatalogo();

    const searchInput = screen.getByPlaceholderText('Buscar por nombre o descripción...');

    // Typos: "sansung" instead of "samsung"
    fireEvent.change(searchInput, { target: { value: 'sansung' } });

    expect(screen.getByText('Samsung Galaxy S24 Ultra')).toBeInTheDocument();
    expect(screen.queryByText('Apple iPhone 15 Pro')).not.toBeInTheDocument();
    expect(screen.queryByText('Tecno Spark 20 Pro')).not.toBeInTheDocument();

    // Search by category / description keyword "titanio"
    fireEvent.change(searchInput, { target: { value: 'titanio' } });
    expect(screen.getByText('Apple iPhone 15 Pro')).toBeInTheDocument();
    expect(screen.queryByText('Samsung Galaxy S24 Ultra')).not.toBeInTheDocument();

    // Search with typo "radmi"
    fireEvent.change(searchInput, { target: { value: 'radmi' } });
    expect(screen.getByText('Xiaomi Redmi Note 13 Pro')).toBeInTheDocument();
  });

  it('filters cleanly by price range and combines with brand', () => {
    renderCatalogo();

    const priceSelect = screen.getByLabelText('Filtrar por rango de precio');
    // "$1.000.000 - $2.000.000"
    fireEvent.change(priceSelect, { target: { value: '1000000-2000000' } });

    expect(screen.getByText('Xiaomi Redmi Note 13 Pro')).toBeInTheDocument();
    expect(screen.queryByText('Tecno Spark 20 Pro')).not.toBeInTheDocument();
    expect(screen.queryByText('Apple iPhone 15 Pro')).not.toBeInTheDocument();
  });

  it('sorts products correctly by price ascending and descending', () => {
    const { container } = renderCatalogo();

    const sortSelect = screen.getByLabelText('Ordenar productos');

    // Price Ascending: Tecno (750k) -> Redmi (1.2M) -> Samsung (4.5M) -> iPhone (4.8M)
    fireEvent.change(sortSelect, { target: { value: 'price_asc' } });
    const titlesAsc = Array.from(container.querySelectorAll('.product-card-title')).map((el) => el.textContent?.trim());
    expect(titlesAsc[0]).toContain('Tecno Spark 20 Pro');
    expect(titlesAsc[titlesAsc.length - 1]).toContain('Apple iPhone 15 Pro');

    // Price Descending: iPhone (4.8M) -> Samsung (4.5M) -> Redmi (1.2M) -> Tecno (750k)
    fireEvent.change(sortSelect, { target: { value: 'price_desc' } });
    const titlesDesc = Array.from(container.querySelectorAll('.product-card-title')).map((el) => el.textContent?.trim());
    expect(titlesDesc[0]).toContain('Apple iPhone 15 Pro');
    expect(titlesDesc[titlesDesc.length - 1]).toContain('Tecno Spark 20 Pro');
  });

  it('shows empty state and allows resetting all filters', () => {
    renderCatalogo();

    const searchInput = screen.getByPlaceholderText('Buscar por nombre o descripción...');
    fireEvent.change(searchInput, { target: { value: 'xyznonexistentterm' } });

    expect(
      screen.getByText(/Lo sentimos, no se encontraron productos que coincidan con tu búsqueda o filtros./)
    ).toBeInTheDocument();

    const resetButton = screen.getByRole('button', { name: 'Ver todos los productos' });
    fireEvent.click(resetButton);

    expect((searchInput as HTMLInputElement).value).toBe('');
    expect(screen.getByText('Samsung Galaxy S24 Ultra')).toBeInTheDocument();
    expect(screen.getByText('Apple iPhone 15 Pro')).toBeInTheDocument();
  });

  it('resets all active filters when clicking the compact reset button in the control hub', () => {
    renderCatalogo();

    const brandSelect = screen.getByLabelText('Filtrar por marca') as HTMLSelectElement;
    fireEvent.change(brandSelect, { target: { value: 'Apple' } });

    const priceSelect = screen.getByLabelText('Filtrar por rango de precio');
    fireEvent.change(priceSelect, { target: { value: '4000000-999999999' } });

    expect(screen.getByText('Apple iPhone 15 Pro')).toBeInTheDocument();
    expect(screen.queryByText('Samsung Galaxy S24 Ultra')).not.toBeInTheDocument();

    const clearButton = screen.getByRole('button', { name: 'Limpiar filtros' });
    fireEvent.click(clearButton);

    expect(brandSelect.value).toBe('');
    expect((priceSelect as HTMLSelectElement).value).toBe('');
    expect(screen.getByText('Samsung Galaxy S24 Ultra')).toBeInTheDocument();
    expect(screen.getByText('Tecno Spark 20 Pro')).toBeInTheDocument();
    expect(screen.getByText('Xiaomi Redmi Note 13 Pro')).toBeInTheDocument();
  });

  it('deep link ?producto=ID redirige a /producto/ID sin renderizar catálogo ni prompt', () => {
    renderCatalogo(['/catalogo?producto=3']);

    // Redirect directo al detalle (Apple iPhone 15 Pro = id 3)
    expect(screen.getByTestId('producto-page')).toHaveTextContent('Producto 3');
    // Sin catálogo ni prompt "¿Qué quieres hacer?"
    expect(screen.queryByLabelText('Buscar dispositivos')).not.toBeInTheDocument();
    expect(screen.queryByText('¿Qué quieres hacer?')).not.toBeInTheDocument();
  });

  it('deep link ?id=ID (variante legacy) redirige a /producto/ID', () => {
    renderCatalogo(['/catalogo?id=1']);

    expect(screen.getByTestId('producto-page')).toHaveTextContent('Producto 1');
    expect(screen.queryByLabelText('Buscar dispositivos')).not.toBeInTheDocument();
    expect(screen.queryByText('¿Qué quieres hacer?')).not.toBeInTheDocument();
  });

  it('redirige aunque los productos aún estén cargando (isLoading true)', () => {
    mockUseProducts.mockReturnValue({
      products: [],
      isLoading: true,
      error: null,
    });

    renderCatalogo(['/catalogo?producto=2']);

    // El redirect es en render: no espera a los datos ni muestra el spinner
    expect(screen.getByTestId('producto-page')).toHaveTextContent('Producto 2');
    expect(screen.queryByText(/Cargando catálogo de tecnología/i)).not.toBeInTheDocument();
    expect(screen.queryByText('¿Qué quieres hacer?')).not.toBeInTheDocument();
  });

  it('redirige aunque el producto esté fuera del filtro activo (fallback ya no hace falta)', () => {
    // Marca que excluye al producto target (Samsung excluye al iPhone id 3)
    renderCatalogo(['/catalogo?producto=3&marca=Samsung']);

    expect(screen.getByTestId('producto-page')).toHaveTextContent('Producto 3');
    expect(screen.queryByText('Titanio con chip A17 Pro y 256GB')).not.toBeInTheDocument();
  });

  it('edge: redirige a /producto/ID aunque el producto no exista', () => {
    renderCatalogo(['/catalogo?producto=99999']);

    expect(screen.getByTestId('producto-page')).toHaveTextContent('Producto 99999');
    expect(screen.queryByText(/No se encontraron productos/i)).not.toBeInTheDocument();
    expect(screen.queryByText('¿Qué quieres hacer?')).not.toBeInTheDocument();
  });
});

