import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminCarouselManager from './AdminCarouselManager';
import { CarouselSlideAdmin } from '../types';
import * as firestore from 'firebase/firestore';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  doc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
}));

vi.mock('../firebase', () => ({
  db: {},
}));

const mockSlides: CarouselSlideAdmin[] = [
  {
    id: 'slide-1',
    url_imagen: 'https://example.com/banner1.jpg',
    titulo: 'Gran Venta de Navidad',
    orden: 1,
    activo: true,
  },
  {
    id: 'slide-2',
    url_imagen: 'https://example.com/banner2.jpg',
    titulo: 'Llegaron los nuevos iPhone 15',
    orden: 2,
    activo: false,
  },
];

describe('AdminCarouselManager Component', () => {
  const mockSetUrlImagenSlide = vi.fn();
  const mockSetTituloSlide = vi.fn();
  const mockSetOrdenSlide = vi.fn();
  const mockSetActivoSlide = vi.fn();
  const mockSetEditandoSlide = vi.fn();
  const mockSetPreviewImagenSlide = vi.fn();
  const mockSetError = vi.fn();
  const mockSetSuccess = vi.fn();
  const mockSetKey = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    slides: mockSlides,
    urlImagenSlide: 'https://example.com/banner-nuevo.jpg',
    setUrlImagenSlide: mockSetUrlImagenSlide,
    tituloSlide: 'Ofertas Flash',
    setTituloSlide: mockSetTituloSlide,
    ordenSlide: '3',
    setOrdenSlide: mockSetOrdenSlide,
    activoSlide: true,
    setActivoSlide: mockSetActivoSlide,
    editandoSlide: null,
    setEditandoSlide: mockSetEditandoSlide,
    previewImagenSlide: 'https://example.com/banner-nuevo.jpg',
    setPreviewImagenSlide: mockSetPreviewImagenSlide,
    setError: mockSetError,
    setSuccess: mockSetSuccess,
    setKey: mockSetKey,
  };

  it('renders form and active banners table', () => {
    render(<AdminCarouselManager {...defaultProps} />);

    expect(screen.getByRole('heading', { name: /Nuevo Slide \/ Banner Promocional/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Banners Activos en el Carrusel/i })).toBeInTheDocument();
    expect(screen.getByText('Gran Venta de Navidad')).toBeInTheDocument();
    expect(screen.getByText('Llegaron los nuevos iPhone 15')).toBeInTheDocument();
  });

  it('submits form to add a new slide', async () => {
    vi.mocked(firestore.addDoc).mockResolvedValueOnce({ id: 'new-slide-id' } as unknown as firestore.DocumentReference);

    render(<AdminCarouselManager {...defaultProps} />);

    const submitBtn = screen.getByRole('button', { name: /Agregar Slide/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(firestore.addDoc).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          url_imagen: 'https://example.com/banner-nuevo.jpg',
          titulo: 'Ofertas Flash',
          orden: 3,
          activo: true,
        })
      );
      expect(mockSetSuccess).toHaveBeenCalled();
    });
  });

  it('toggles slide active state', async () => {
    vi.mocked(firestore.updateDoc).mockResolvedValueOnce(undefined);

    render(<AdminCarouselManager {...defaultProps} />);

    const toggleBtn = screen.getByRole('button', { name: /^Activo$/i });
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(firestore.updateDoc).toHaveBeenCalled();
    });
  });

  it('contains zero raw emoji characters and uses vector icons', () => {
    const { container } = render(<AdminCarouselManager {...defaultProps} />);
    const textContent = container.textContent || '';
    expect(textContent).not.toMatch(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u);
    expect(container.querySelector('.bi-images')).toBeInTheDocument();
  });
});
