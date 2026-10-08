import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { WhatsappNumberProvider } from '../../contexts/WhatsappNumberContext'
import { CartProvider } from '../../contexts/CartContext'
import { recordProductView } from '../../services/productStats.service'
import { formatPrice } from '../../utils/formatters'
import ProductCard from '../ProductCard'
import type { Product } from '../../types'

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  onSnapshot: vi.fn(() => vi.fn()),
}))

vi.mock('../../firebase', () => ({
  db: {},
}))

vi.mock('../../services/productStats.service', () => ({
  recordProductView: vi.fn(),
  getPopularProductsStats: vi.fn(async () => []),
}))

const baseProduct = (overrides: Record<string, unknown> = {}) => ({
  id: 'prod-1',
  nombre: 'iPhone 15',
  marca: 'Apple',
  categoria: 'Celulares',
  contado: 4200000,
  cuotas6: 350000,
  cuotas8: 262500,
  imagen: 'https://img.test/iphone15.jpg',
  descripcion: 'Un celular de prueba',
  ...overrides,
}) as unknown as Product

const promoProduct = (overrides: Record<string, unknown> = {}) =>
  baseProduct({
    promo: true,
    promoPrice: 3850000,
    promoBadgeText: 'PROMO+',
    promoStart: Date.now() - 60000,
    promoEnd: Date.now() + 60000,
    ...overrides,
  })

// Harness con rutas: la card navega a /producto/:id (sin modal)
function renderCard(producto: Product) {
  return render(
    <MemoryRouter initialEntries={['/catalogo']}>
      <WhatsappNumberProvider>
        <CartProvider>
          <Routes>
            <Route path="/catalogo" element={<ProductCard producto={producto} />} />
            <Route path="/producto/:productId" element={<div data-testid="producto-detail" />} />
          </Routes>
        </CartProvider>
      </WhatsappNumberProvider>
    </MemoryRouter>,
  )
}

const normalizarTexto = (texto: string) => texto.normalize('NFKC').replace(/\s+/g, ' ').trim()

function getPrecio(texto: string) {
  return screen.getByText(normalizarTexto(texto), { normalizer: (t) => normalizarTexto(t) })
}

// Reemplaza al viejo abrirModal(): clic en "Ver detalles" + assert de navegación
async function navegarADetalle() {
  fireEvent.click(screen.getByRole('button', { name: /Ver detalles/ }))
  await waitFor(() => {
    expect(screen.getByTestId('producto-detail')).toBeInTheDocument()
  })
}

describe('ProductCard', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders card with title and regular price and credito disponible badge for iPhone', () => {
    renderCard(baseProduct())

    expect(screen.getByText('iPhone 15')).toBeInTheDocument()
    expect(getPrecio(formatPrice(4200000))).toBeInTheDocument()
    // iPhone has credit available (Sistecrédito/Esmiopción) but NO fixed Krediya cuotas
    expect(screen.getByText('Crédito disponible')).toBeInTheDocument()
    expect(screen.queryByText(/16 cuotas/i)).not.toBeInTheDocument()
  })

  it('renders card with promo price and del regular price', () => {
    renderCard(promoProduct())

    expect(getPrecio(formatPrice(3850000))).toBeInTheDocument()
    expect(getPrecio(formatPrice(4200000)).tagName).toBe('DEL')
  })

  // D8: affordance de navegación "Ver detalles", sin CTA de compra
  it('renders "Ver detalles" affordance and never renders a "Cotizar / Financiar" purchase CTA', () => {
    renderCard(baseProduct())

    expect(screen.getByRole('button', { name: /Ver detalles/ })).toBeInTheDocument()
    expect(screen.getByText('Ver detalles')).toBeInTheDocument()
    expect(screen.queryByText('Cotizar / Financiar')).not.toBeInTheDocument()
    expect(screen.queryByText('Cotizar / Comprar')).not.toBeInTheDocument()
  })

  it('navigates to /producto/:id when the card CTA is activated, WITHOUT registering a product view', async () => {
    renderCard(baseProduct())

    // la vista la registra SOLO el mount de ProductPage (D7) — bug 8: doble conteo
    expect(recordProductView).not.toHaveBeenCalled()

    await navegarADetalle()

    expect(recordProductView).not.toHaveBeenCalled()
  })

  describe('Accesorios vs Celulares business rules (card tier)', () => {
    const accesorioEconomico = () =>
      baseProduct({
        id: 'acc-1',
        nombre: 'Funda Protectora Silicona',
        marca: 'Genérica',
        categoria: 'Accesorios',
        contado: 50000,
        cuotas6: null,
        cuotas8: null,
      })

    const accesorioFinanciable = () =>
      baseProduct({
        id: 'acc-2',
        nombre: 'Smartwatch Deportivo Pro',
        marca: 'Amazfit',
        categoria: 'Accesorios',
        contado: 150000,
        cuotas6: 15000,
        cuotas8: 12000,
      })

    it('accesorio <= $100k renders only contado in card (no credit tier, no cuota tags)', () => {
      renderCard(accesorioEconomico())

      expect(screen.getByText('Funda Protectora Silicona')).toBeInTheDocument()
      expect(getPrecio(formatPrice(50000))).toBeInTheDocument()

      expect(screen.queryByText(/cuotas/i)).not.toBeInTheDocument()
      expect(screen.queryByText('Crédito')).not.toBeInTheDocument()
      // Los asserts del flujo (sin Financiar / sin PlanCuotas) viven en ProductPage.test
    })

    it('accesorio > $100k renders dual-tier with credito disponible badge in card (no fixed cuotas)', () => {
      renderCard(accesorioFinanciable())

      expect(screen.getByText('Smartwatch Deportivo Pro')).toBeInTheDocument()
      expect(getPrecio(formatPrice(150000))).toBeInTheDocument()
      expect(screen.getByText('Crédito disponible')).toBeInTheDocument()
      expect(screen.queryByText(/16 cuotas/i)).not.toBeInTheDocument()
      // Los asserts del flujo (grilla habilitada / sin PlanCuotas) viven en ProductPage.test
    })
  })

  describe('Share functionality', () => {
    it('renders share button on card and copies the canonical /producto/:id deep link when clicked', async () => {
      const writeTextSpy = vi.fn().mockResolvedValue(undefined)
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextSpy,
        },
      })

      renderCard(baseProduct({ id: 'prod-share-1', nombre: 'iPhone 15 Pro' }))

      const shareBtn = screen.getByRole('button', { name: /Compartir iPhone 15 Pro/i })
      expect(shareBtn).toBeInTheDocument()

      fireEvent.click(shareBtn)

      await waitFor(() => {
        expect(writeTextSpy).toHaveBeenCalledWith(expect.stringContaining('/producto/prod-share-1'))
        expect(screen.getByText('¡Enlace copiado!')).toBeInTheDocument()
      })
    })

    it('uses navigator.share when available on card with the canonical /producto/:id url', async () => {
      const shareSpy = vi.fn().mockResolvedValue(undefined)
      Object.assign(navigator, {
        share: shareSpy,
      })

      renderCard(baseProduct({ id: 'prod-share-2', nombre: 'Xiaomi Redmi Note 13' }))

      const shareBtn = screen.getByRole('button', { name: /Compartir Xiaomi Redmi Note 13/i })
      fireEvent.click(shareBtn)

      await waitFor(() => {
        expect(shareSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.stringContaining('Xiaomi Redmi Note 13'),
            url: expect.stringContaining('/producto/prod-share-2'),
          }),
        )
      })
    })
  })

  describe('Spec Chips Rendering & Sanitization', () => {
    it('renders spec chips with accurate labels for smartphone with full specs in title and description', () => {
      const smartphone = baseProduct({
        id: 's25-ultra',
        nombre: 'Samsung Galaxy S25 Ultra 512GB/12 RAM',
        descripcion: 'Cámara principal de 200 MP, pantalla Dynamic AMOLED 6.8", batería 5000 mAh',
      })

      renderCard(smartphone)

      expect(screen.getByText('512GB')).toBeInTheDocument()
      expect(screen.getByText('12GB RAM')).toBeInTheDocument()
      expect(screen.getByText('200MP')).toBeInTheDocument()
      expect(screen.getByText('5000mAh')).toBeInTheDocument()
      expect(screen.getByText('6.8"')).toBeInTheDocument()
      expect(screen.queryByText('Garantía Oficial')).not.toBeInTheDocument()
    })

    it('shields against corrupted firestore specs and recalculates from real text', () => {
      const corruptedSmartphone = baseProduct({
        id: 's25-corrupted',
        nombre: 'Samsung Galaxy S25 Ultra 512GB/12 RAM',
        descripcion: 'Cámara 200MP, batería 5000 mAh',
        specs: {
          ram: 28 as unknown as number, // corrupt value in firestore
          pantalla: 56 as unknown as number, // corrupt value
          almacenamiento: 512,
        },
      })

      renderCard(corruptedSmartphone)

      // 12GB RAM is rescued from the title, corrupted 28 is discarded
      expect(screen.getByText('12GB RAM')).toBeInTheDocument()
      expect(screen.getByText('512GB')).toBeInTheDocument()
      expect(screen.getByText('200MP')).toBeInTheDocument()
      expect(screen.getByText('5000mAh')).toBeInTheDocument()
      // Corrupt screen 56 is discarded and not present in description
      expect(screen.queryByText('56"')).not.toBeInTheDocument()
    })

    it('renders "Garantía Oficial" and never renders smartphone specs for accessories', () => {
      const accesorio = baseProduct({
        id: 'case-1',
        nombre: 'Funda Protectora Transparente 128GB silicona 3.5"',
        categoria: 'Accesorios',
        descripcion: 'Funda ultra resistente 5000m',
      })

      renderCard(accesorio)

      expect(screen.getByText('Garantía Oficial')).toBeInTheDocument()
      expect(screen.queryByText(/RAM/i)).not.toBeInTheDocument()
      expect(screen.queryByText('128GB')).not.toBeInTheDocument()
      expect(screen.queryByText('3.5"')).not.toBeInTheDocument()
      expect(screen.queryByText(/5000/i)).not.toBeInTheDocument()
    })

    it('renders "Garantía Oficial" for smartphone with zero spec information', () => {
      const simplePhone = baseProduct({
        id: 'simple-phone',
        nombre: 'Celular Básico',
        descripcion: 'Un teléfono sencillo sin detalles técnicos',
      })

      renderCard(simplePhone)

      expect(screen.getByText('Garantía Oficial')).toBeInTheDocument()
    })

    it('prioritizes title storage over firestore specs and description in the card UI', () => {
      const phone = baseProduct({
        id: 'phone-priority',
        nombre: 'iPhone 15 128 GB',
        descripcion: 'Memoria interna 256GB de alta velocidad',
        specs: {
          almacenamiento: 64, // Firestore antiguo
          camara: 48,
        },
      })

      renderCard(phone)

      expect(screen.getByText('128GB')).toBeInTheDocument()
      expect(screen.queryByText('64GB')).not.toBeInTheDocument()
      expect(screen.queryByText('256GB')).not.toBeInTheDocument()
      expect(screen.getByText('48MP')).toBeInTheDocument()
    })

    it('correctly displays storage chips for real Gio Tech titles', () => {
      const redmi = baseProduct({
        id: 'redmi-14-pro',
        nombre: 'REDMI NOTE 14 PRO PLUS 5G/ 256 GB',
        descripcion: 'Cámara 200MP, batería 5000 mAh',
      })

      renderCard(redmi)

      expect(screen.getByText('256GB')).toBeInTheDocument()
      expect(screen.getByText('200MP')).toBeInTheDocument()
      expect(screen.getByText('5000mAh')).toBeInTheDocument()
      // Should not confuse 5G with 5GB RAM
      expect(screen.queryByText('5GB RAM')).not.toBeInTheDocument()
    })

    it('correctly displays 1TB storage chip for 1TB title', () => {
      const iphone1tb = baseProduct({
        id: 'iphone-1tb',
        nombre: 'iPhone 14 Pro Max 1TB',
        descripcion: 'Potencia extrema',
      })

      renderCard(iphone1tb)

      expect(screen.getByText('1TB')).toBeInTheDocument()
    })
  })

  describe('Resilient Image Fallback System', () => {
    it('renders image with lazy loading and switches to glassmorphic vector fallback on onError without breaking UI', () => {
      const prod = baseProduct({
        id: 'iphone-img-error',
        nombre: 'iPhone 15 Pro',
        marca: 'Apple',
        imagen: 'https://img.test/invalid-url.jpg',
      })

      renderCard(prod)

      const img = screen.getByAltText('iPhone 15 Pro')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('loading', 'lazy')

      // Trigger onError
      fireEvent.error(img)

      // Fallback is rendered safely
      expect(screen.getByTestId('product-image-fallback')).toBeInTheDocument()
      expect(screen.getByTestId('product-fallback-brand-logo')).toBeInTheDocument()
    })

    it('renders local vector fallback directly when imagen is empty string', () => {
      const prod = baseProduct({
        id: 'samsung-no-img',
        nombre: 'Samsung Galaxy A55',
        marca: 'Samsung',
        imagen: '',
      })

      renderCard(prod)

      expect(screen.getByTestId('product-image-fallback')).toBeInTheDocument()
      expect(screen.getByTestId('product-fallback-brand-logo')).toBeInTheDocument()
    })
  })
})
