import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BannerSlider, { AUTOPLAY_DURATION } from './BannerSlider';

// Mock Firebase
let snapshotCallback: ((snapshot: unknown) => void) | null = null;
let errorCallback: ((error: unknown) => void) | null = null;

vi.mock('../firebase', () => ({
  db: {},
}));

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, className, style, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div className={className} style={style} {...props}>
        {children}
      </div>
    ),
    p: ({ children, className, style, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p className={className} style={style} {...props}>
        {children}
      </p>
    ),
  },
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({})),
  onSnapshot: vi.fn((_ref, onNext, onError) => {
    snapshotCallback = onNext;
    errorCallback = onError;
    return vi.fn();
  }),
}));

const mockBannersData = [
  {
    id: 'b1',
    data: () => ({
      url_imagen: 'https://img.test/banner1.jpg',
      titulo: 'Super Promo iPhone 15',
      descripcion: 'Llevátelo hoy a cuotas sin cuota inicial',
      enlace: '/catalogo?marca=Apple',
      orden: 1,
      activo: true,
    }),
  },
  {
    id: 'b2',
    data: () => ({
      url_imagen: 'https://img.test/banner2.jpg',
      titulo: 'Samsung Galaxy S24 Ultra',
      descripcion: 'Con 200MP y garantía oficial en Puerto Asís',
      enlace: 'https://external.promo.com/s24',
      orden: 2,
      activo: true,
    }),
  },
  {
    id: 'b3',
    data: () => ({
      url_imagen: 'https://img.test/banner3.jpg',
      titulo: 'Banner Inactivo',
      descripcion: 'No debe mostrarse',
      enlace: '',
      orden: 3,
      activo: false,
    }),
  },
];

describe('BannerSlider Component - Optimizado CRO, Touch Swipe, Smart Pause & CLS Shimmer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    snapshotCallback = null;
    errorCallback = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debe renderizar el Skeleton Shimmer para evitar Layout Shift (CLS) mientras carga Firestore', () => {
    render(
      <MemoryRouter>
        <BannerSlider />
      </MemoryRouter>
    );

    const skeleton = screen.getByTestId('banner-skeleton');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
  });

  it('debe renderizar null si la colección no contiene banners activos', () => {
    const { container } = render(
      <MemoryRouter>
        <BannerSlider />
      </MemoryRouter>
    );

    act(() => {
      snapshotCallback?.({
        docs: [
          {
            id: 'inactive-1',
            data: () => ({
              url_imagen: 'https://img.test/inactive.jpg',
              titulo: 'Inactivo',
              activo: false,
            }),
          },
        ],
      });
    });

    expect(container.firstChild).toBeNull();
  });

  it('debe renderizar los banners activos con imagen, título, descripción y botón CTA interactivo', () => {
    render(
      <MemoryRouter>
        <BannerSlider />
      </MemoryRouter>
    );

    act(() => {
      snapshotCallback?.({
        docs: mockBannersData,
      });
    });

    // Primer banner activo
    expect(screen.getByText('Super Promo iPhone 15')).toBeInTheDocument();
    expect(screen.getByText('Llevátelo hoy a cuotas sin cuota inicial')).toBeInTheDocument();

    const ctaLink = screen.getByRole('link', { name: /Ver promoción de Super Promo iPhone 15/i });
    expect(ctaLink).toBeInTheDocument();
    expect(ctaLink).toHaveAttribute('href', '/catalogo?marca=Apple');

    const img = screen.getByAltText('Super Promo iPhone 15');
    expect(img).toHaveAttribute('src', 'https://img.test/banner1.jpg');
  });

  it('debe renderizar enlace externo con target="_blank" si el enlace es una URL absoluta', () => {
    render(
      <MemoryRouter>
        <BannerSlider />
      </MemoryRouter>
    );

    act(() => {
      snapshotCallback?.({
        docs: mockBannersData,
      });
    });

    // Avanzar al segundo banner
    const nextBtn = screen.getByRole('button', { name: 'Siguiente' });
    fireEvent.click(nextBtn);

    expect(screen.getByText('Samsung Galaxy S24 Ultra')).toBeInTheDocument();

    const externalCta = screen.getByRole('link', { name: /Conocer más sobre Samsung Galaxy S24 Ultra/i });
    expect(externalCta).toBeInTheDocument();
    expect(externalCta).toHaveAttribute('href', 'https://external.promo.com/s24');
    expect(externalCta).toHaveAttribute('target', '_blank');
    expect(externalCta).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('debe cambiar de banner al hacer clic en los botones Anterior y Siguiente', () => {
    render(
      <MemoryRouter>
        <BannerSlider />
      </MemoryRouter>
    );

    act(() => {
      snapshotCallback?.({
        docs: mockBannersData,
      });
    });

    expect(screen.getByText('Super Promo iPhone 15')).toBeInTheDocument();

    const nextBtn = screen.getByRole('button', { name: 'Siguiente' });
    fireEvent.click(nextBtn);
    expect(screen.getByText('Samsung Galaxy S24 Ultra')).toBeInTheDocument();

    const prevBtn = screen.getByRole('button', { name: 'Anterior' });
    fireEvent.click(prevBtn);
    expect(screen.getByText('Super Promo iPhone 15')).toBeInTheDocument();
  });

  it('debe cambiar de banner al hacer clic en los dots indicadores', () => {
    render(
      <MemoryRouter>
        <BannerSlider />
      </MemoryRouter>
    );

    act(() => {
      snapshotCallback?.({
        docs: mockBannersData,
      });
    });

    const dot2 = screen.getByRole('tab', { name: 'Ir al slide 2' });
    fireEvent.click(dot2);

    expect(screen.getByText('Samsung Galaxy S24 Ultra')).toBeInTheDocument();
  });

  it('debe soportar gestos táctiles fluidos (Swipe Left para Siguiente, Swipe Right para Anterior)', () => {
    render(
      <MemoryRouter>
        <BannerSlider />
      </MemoryRouter>
    );

    act(() => {
      snapshotCallback?.({
        docs: mockBannersData,
      });
    });

    const slider = screen.getByTestId('banner-slider-container');

    // Swipe izquierda (deslizar dedo de derecha a izquierda: inicio 200, fin 100 -> delta 100 > 50 -> siguiente)
    fireEvent.touchStart(slider, { targetTouches: [{ clientX: 200 }] });
    fireEvent.touchMove(slider, { targetTouches: [{ clientX: 100 }] });
    fireEvent.touchEnd(slider);

    expect(screen.getByText('Samsung Galaxy S24 Ultra')).toBeInTheDocument();

    // Swipe derecha (deslizar dedo de izquierda a derecha: inicio 100, fin 200 -> delta -100 < -50 -> anterior)
    fireEvent.touchStart(slider, { targetTouches: [{ clientX: 100 }] });
    fireEvent.touchMove(slider, { targetTouches: [{ clientX: 200 }] });
    fireEvent.touchEnd(slider);

    expect(screen.getByText('Super Promo iPhone 15')).toBeInTheDocument();
  });

  it('debe soportar navegación por teclado con teclas ArrowRight y ArrowLeft', () => {
    render(
      <MemoryRouter>
        <BannerSlider />
      </MemoryRouter>
    );

    act(() => {
      snapshotCallback?.({
        docs: mockBannersData,
      });
    });

    const slider = screen.getByTestId('banner-slider-container');

    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(screen.getByText('Samsung Galaxy S24 Ultra')).toBeInTheDocument();

    fireEvent.keyDown(slider, { key: 'ArrowLeft' });
    expect(screen.getByText('Super Promo iPhone 15')).toBeInTheDocument();
  });

  it('debe pausar el autoplay en hover (pauseOnHover) y reanudar al salir', () => {
    render(
      <MemoryRouter>
        <BannerSlider />
      </MemoryRouter>
    );

    act(() => {
      snapshotCallback?.({
        docs: mockBannersData,
      });
    });

    const slider = screen.getByTestId('banner-slider-container');

    // Hover sobre el carrusel
    fireEvent.mouseEnter(slider);

    // Avanzar el tiempo 5 segundos
    act(() => {
      vi.advanceTimersByTime(AUTOPLAY_DURATION);
    });

    // Sigue en el primer banner porque está en pausa
    expect(screen.getByText('Super Promo iPhone 15')).toBeInTheDocument();

    // Salir del hover
    fireEvent.mouseLeave(slider);

    // Avanzar 5 segundos más
    act(() => {
      vi.advanceTimersByTime(AUTOPLAY_DURATION);
    });

    // Ahora sí avanzó al segundo banner
    expect(screen.getByText('Samsung Galaxy S24 Ultra')).toBeInTheDocument();
  });

  it('debe pausar el autoplay en foco (pauseOnFocus) y reanudar al perder el foco', () => {
    render(
      <MemoryRouter>
        <BannerSlider />
      </MemoryRouter>
    );

    act(() => {
      snapshotCallback?.({
        docs: mockBannersData,
      });
    });

    const slider = screen.getByTestId('banner-slider-container');

    // Foco en el carrusel
    fireEvent.focus(slider);

    act(() => {
      vi.advanceTimersByTime(AUTOPLAY_DURATION);
    });

    // No debe cambiar mientras esté en foco
    expect(screen.getByText('Super Promo iPhone 15')).toBeInTheDocument();

    // Blur
    fireEvent.blur(slider);

    act(() => {
      vi.advanceTimersByTime(AUTOPLAY_DURATION);
    });

    // Cambia tras el intervalo
    expect(screen.getByText('Samsung Galaxy S24 Ultra')).toBeInTheDocument();
  });

  it('debe manejar errores en la carga de Firestore apagando el loading', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { container } = render(
      <MemoryRouter>
        <BannerSlider />
      </MemoryRouter>
    );

    act(() => {
      errorCallback?.(new Error('Network failure'));
    });

    expect(container.firstChild).toBeNull();
    consoleSpy.mockRestore();
  });
});
