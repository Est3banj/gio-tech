import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
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

const androidKrediyaProduct = (overrides: Record<string, unknown> = {}) =>
  baseProduct({
    id: 's24-krediya',
    nombre: 'Samsung Galaxy S24',
    marca: 'Samsung',
    categoria: 'Celulares',
    contado: 3500000,
    cuotas6: 220000,
    cuotas8: 440000,
    cuotaInicial: 500000,
    solo12Meses: true,
    cuotas12: 350000,
    ...overrides,
  })

function renderCard(producto: Product) {
  return render(
    <MemoryRouter>
      <WhatsappNumberProvider>
        <CartProvider>
          <ProductCard producto={producto} />
        </CartProvider>
      </WhatsappNumberProvider>
    </MemoryRouter>,
  )
}

const normalizarTexto = (texto: string) => texto.normalize('NFKC').replace(/\s+/g, ' ').trim()

function getPrecio(texto: string) {
  return screen.getByText(normalizarTexto(texto), { normalizer: (t) => normalizarTexto(t) })
}

async function abrirModal() {
  fireEvent.click(screen.getByRole('button', { name: /Cotizar/ }))
  await waitFor(() => {
    expect(screen.getByText('¿Qué quieres hacer?')).toBeInTheDocument()
  })
}

async function irACredito() {
  await abrirModal()
  fireEvent.click(screen.getByRole('button', { name: /Comprar Ahora/ }))
  fireEvent.click(screen.getByRole('button', { name: /Crédito/ }))
  await waitFor(() => {
    expect(screen.getByText('Elige una financiera')).toBeInTheDocument()
  })
}

describe('ProductCard', () => {
  let openSpy: ReturnType<typeof vi.spyOn>

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

  it('opens modal for iPhone without PlanCuotas simulator', async () => {
    renderCard(promoProduct())

    await abrirModal()

    expect(screen.getByText('Precio regular:')).toBeInTheDocument()
    expect(screen.getByText('Precio promocional:')).toBeInTheDocument()
    const badgesPromoEnModal = screen.getAllByText('PROMO+').filter((el) => el.closest('.modal-body'))
    expect(badgesPromoEnModal).toHaveLength(1)
    // iPhone does NOT show PlanCuotas simulator
    expect(screen.queryByText('Simulador de Financiación')).not.toBeInTheDocument()
    expect(screen.queryByText(/cuotas quincenales:/i)).not.toBeInTheDocument()
  })

  it('opens modal for Android with Krediya and displays PlanCuotas simulator', async () => {
    renderCard(androidKrediyaProduct())

    await abrirModal()

    expect(screen.getByText('Simulador de Financiación')).toBeInTheDocument()
    expect(screen.getByText('PLAN ESPECIAL EXCLUSIVO')).toBeInTheDocument()
    expect(
      getPrecio(`12 cuotas mensuales de ${formatPrice(350000)}`),
    ).toBeInTheDocument()
    expect(screen.getByText(/Cuota inicial:/)).toBeInTheDocument()
  })

  it('registers the product view only when opening details, not on mount', async () => {
    renderCard(baseProduct())

    expect(recordProductView).not.toHaveBeenCalled()

    await abrirModal()

    expect(recordProductView).toHaveBeenCalledTimes(1)
    expect(recordProductView).toHaveBeenCalledWith('prod-1')
  })

  describe('contado flow', () => {
    it('opens wa.me URL with promo message when buying with promo active', async () => {
      openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
      renderCard(promoProduct())

      await abrirModal()
      fireEvent.click(screen.getByRole('button', { name: /Comprar Ahora/ }))
      fireEvent.click(screen.getByRole('button', { name: /^Contado/ }))

      await waitFor(() => {
        expect(openSpy).toHaveBeenCalledTimes(1)
      })

      const url = openSpy.mock.calls[0][0] as string
      expect(url).toContain('wa.me/573223652569?text=')
      const mensaje = decodeURIComponent(url.split('text=')[1])
      expect(mensaje).toContain('comprar el iPhone 15')
      expect(mensaje).toContain(`Precio promocional: ${formatPrice(3850000)} (antes ${formatPrice(4200000)})`)
    })

    it('opens wa.me URL with no-promo message when buying without promo', async () => {
      openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
      renderCard(baseProduct())

      await abrirModal()
      fireEvent.click(screen.getByRole('button', { name: /Comprar Ahora/ }))
      fireEvent.click(screen.getByRole('button', { name: /^Contado/ }))

      await waitFor(() => {
        expect(openSpy).toHaveBeenCalledTimes(1)
      })

      const url = openSpy.mock.calls[0][0] as string
      const mensaje = decodeURIComponent(url.split('text=')[1])
      expect(mensaje).toContain('comprar al contado el iPhone 15')
      expect(mensaje).toContain(`Precio: ${formatPrice(4200000)}`)
    })
  })

  describe('credito flow', () => {
    it('shows financieras grid with unavailable disabled for iphone products', async () => {
      renderCard(baseProduct())

      await irACredito()

      expect(screen.getByText('Sistecredito')).toBeInTheDocument()
      expect(screen.getByText('Esmiopcion')).toBeInTheDocument()

      fireEvent.click(screen.getByText('PayJoy'))
      await waitFor(() => {
        expect(screen.queryByText('Primero valida tu crédito:')).not.toBeInTheDocument()
      })
      expect(screen.getByText('Elige una financiera')).toBeInTheDocument()

      fireEvent.click(screen.getByText('Esmiopcion'))
      await waitFor(() => {
        expect(screen.getByText('Primero valida tu crédito:')).toBeInTheDocument()
      })
    })

    it('closing the modal resets the wizard state', async () => {
      renderCard(baseProduct())

      await irACredito()
      fireEvent.click(screen.getByText('Sistecredito'))
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Nombres y apellidos')).toBeInTheDocument()
      })
      fireEvent.change(screen.getByPlaceholderText('Nombres y apellidos'), { target: { value: 'Juan Pérez' } })

      fireEvent.click(document.querySelector('.btn-close') as HTMLButtonElement)
      await waitFor(() => {
        expect(screen.queryByText('¿Qué quieres hacer?')).toBeNull()
      })

      fireEvent.click(screen.getByRole('button', { name: /Cotizar/ }))
      await waitFor(() => {
        expect(screen.getByText('¿Qué quieres hacer?')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByRole('button', { name: /Comprar Ahora/ }))
      fireEvent.click(screen.getByRole('button', { name: /Crédito/ }))
      await waitFor(() => {
        expect(screen.getByText('Elige una financiera')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('Sistecredito'))
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Nombres y apellidos')).toBeInTheDocument()
      })
      expect((screen.getByPlaceholderText('Nombres y apellidos') as HTMLInputElement).value).toBe('')
    })
  })

  describe('sistecredito wizard (fake timers)', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.clearAllMocks()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('runs the validation steps in 1.2s and auto-sends whatsapp when it applies', async () => {
      openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
      renderCard(baseProduct())

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Cotizar/ }))
      })
      fireEvent.click(screen.getByRole('button', { name: /Comprar Ahora/ }))
      fireEvent.click(screen.getByRole('button', { name: /Crédito/ }))
      fireEvent.click(screen.getByText('Sistecredito'))

      await act(async () => {
        fireEvent.change(screen.getByPlaceholderText('Nombres y apellidos'), { target: { value: 'Juan Pérez' } })
        fireEvent.change(screen.getByPlaceholderText('Número de cédula'), { target: { value: '123456789' } })
        fireEvent.change(screen.getByPlaceholderText('Cupo disponible ($)'), { target: { value: '500000' } })
        fireEvent.click(screen.getByRole('radio', { name: 'No' }))
        fireEvent.click(screen.getByRole('checkbox'))
      })

      const validarBtn = screen.getByRole('button', { name: /Validar/ }) as HTMLButtonElement
      expect(validarBtn.disabled).toBe(false)

      fireEvent.click(validarBtn)

      act(() => {
        vi.advanceTimersByTime(300)
      })
      expect(screen.getByText('Consultando cupo...')).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(400)
      })
      expect(screen.getByText(/Cupo disponible: \$500\.000/)).toBeInTheDocument()
      expect(screen.getByText(/supera tu cupo por/)).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(500)
      })
      expect(screen.getByText('¡Aplicas para Sistecredito!')).toBeInTheDocument()
      expect(screen.getByText('Te redirigimos a WhatsApp...')).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(800)
      })
      expect(openSpy).toHaveBeenCalledTimes(1)
      const url = openSpy.mock.calls[0][0] as string
      const mensaje = decodeURIComponent(url.split('text=')[1])
      expect(mensaje).toContain('🧾 *Solicitud de crédito - Sistecredito*')
      expect(mensaje).toContain('▸ Nombres y apellidos: Juan Pérez')
    })

    it('shows intelligent recommendation for iPhone when first purchase in Sistecredito', async () => {
      renderCard(baseProduct({ nombre: 'iPhone 15', marca: 'Apple' }))

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Cotizar/ }))
      })
      fireEvent.click(screen.getByRole('button', { name: /Comprar Ahora/ }))
      fireEvent.click(screen.getByRole('button', { name: /Crédito/ }))
      fireEvent.click(screen.getByText('Sistecredito'))

      await act(async () => {
        fireEvent.change(screen.getByPlaceholderText('Nombres y apellidos'), { target: { value: 'Maria Gomez' } })
        fireEvent.change(screen.getByPlaceholderText('Número de cédula'), { target: { value: '987654321' } })
        fireEvent.click(screen.getByRole('radio', { name: 'Sí' }))
        fireEvent.click(screen.getByRole('checkbox'))
      })

      fireEvent.click(screen.getByRole('button', { name: /Validar/ }))

      act(() => {
        vi.advanceTimersByTime(1200)
      })

      expect(screen.getByText(/Sistecrédito requiere compras previas/)).toBeInTheDocument()
      expect(screen.getByText(/Opciones recomendadas para tu iPhone:/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Continuar con Esmiopción/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Asesoría para Plan con Abono/ })).toBeInTheDocument()
    })

    it('shows intelligent recommendation for Android when first purchase in Sistecredito', async () => {
      renderCard(baseProduct({ id: 's24-1', nombre: 'Samsung Galaxy S24', marca: 'Samsung' }))

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Cotizar/ }))
      })
      fireEvent.click(screen.getByRole('button', { name: /Comprar Ahora/ }))
      fireEvent.click(screen.getByRole('button', { name: /Crédito/ }))
      fireEvent.click(screen.getByText('Sistecredito'))

      await act(async () => {
        fireEvent.change(screen.getByPlaceholderText('Nombres y apellidos'), { target: { value: 'Carlos Ruiz' } })
        fireEvent.change(screen.getByPlaceholderText('Número de cédula'), { target: { value: '555666777' } })
        fireEvent.click(screen.getByRole('radio', { name: 'Sí' }))
        fireEvent.click(screen.getByRole('checkbox'))
      })

      fireEvent.click(screen.getByRole('button', { name: /Validar/ }))

      act(() => {
        vi.advanceTimersByTime(1200)
      })

      expect(screen.getByText(/Sistecrédito requiere compras previas/)).toBeInTheDocument()
      expect(screen.getByText(/Alternativas con aprobación inmediata:/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Cambiar a Krediya/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Cambiar a PayJoy/ })).toBeInTheDocument()
    })
  })

  describe('Accesorios vs Celulares business rules', () => {
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

    it('accesorio <= $100k renders only contado in card and disables credit in modal', async () => {
      renderCard(accesorioEconomico())

      // Card must render title and contado price
      expect(screen.getByText('Funda Protectora Silicona')).toBeInTheDocument()
      expect(getPrecio(formatPrice(50000))).toBeInTheDocument()

      // Card must NOT show credit tier or cuota tags
      expect(screen.queryByText(/cuotas/i)).not.toBeInTheDocument()
      expect(screen.queryByText('Crédito')).not.toBeInTheDocument()

      // Open modal
      await abrirModal()

      // Modal must NOT show financing simulator / PlanCuotas
      expect(screen.queryByText('Simulador de Financiación')).not.toBeInTheDocument()

      // Proceed to payment step
      fireEvent.click(screen.getByRole('button', { name: /Comprar Ahora/ }))
      await waitFor(() => {
        expect(screen.getByText('Elige cómo pagar:')).toBeInTheDocument()
      })

      // In modal, only Contado is displayed; Crédito option is NOT rendered
      expect(screen.getByRole('button', { name: /Contado/ })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Crédito/ })).not.toBeInTheDocument()
    })

    it('accesorio > $100k renders dual-tier with credito disponible badge in card, hides simulator in modal and enables Sistecredito / Esmiopcion only', async () => {
      renderCard(accesorioFinanciable())

      // Card shows contado price and credit badge (no fixed cuotas because Krediya does not apply to accessories)
      expect(screen.getByText('Smartwatch Deportivo Pro')).toBeInTheDocument()
      expect(getPrecio(formatPrice(150000))).toBeInTheDocument()
      expect(screen.getByText('Crédito disponible')).toBeInTheDocument()
      expect(screen.queryByText(/16 cuotas/i)).not.toBeInTheDocument()

      // Open modal
      await abrirModal()

      // Modal must NOT show financing simulator / PlanCuotas (exclusive to Krediya)
      expect(screen.queryByText('Simulador de Financiación')).not.toBeInTheDocument()
      expect(screen.queryByText(/16 cuotas quincenales:/i)).not.toBeInTheDocument()

      // Proceed to payment step
      fireEvent.click(screen.getByRole('button', { name: /Comprar Ahora/ }))
      await waitFor(() => {
        expect(screen.getByText('Elige cómo pagar:')).toBeInTheDocument()
      })

      // Both Contado and Crédito buttons must be available
      expect(screen.getByRole('button', { name: /Contado/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Crédito/ })).toBeInTheDocument()

      // Click Crédito to enter financieras selection
      fireEvent.click(screen.getByRole('button', { name: /Crédito/ }))
      await waitFor(() => {
        expect(screen.getByText('Elige una financiera')).toBeInTheDocument()
      })

      // Sistecredito and Esmiopcion must be available
      expect(screen.getByText('Sistecredito')).toBeInTheDocument()
      expect(screen.getByText('Esmiopcion')).toBeInTheDocument()

      // PayJoy, Krediya, and Celya must be disabled (clicking PayJoy does not advance)
      fireEvent.click(screen.getByText('PayJoy'))
      await waitFor(() => {
        expect(screen.queryByText('Primero valida tu crédito:')).not.toBeInTheDocument()
      })
      expect(screen.getByText('Elige una financiera')).toBeInTheDocument()

      // Clicking Esmiopcion advances to credit form
      fireEvent.click(screen.getByText('Esmiopcion'))
      await waitFor(() => {
        expect(screen.getByText('Primero valida tu crédito:')).toBeInTheDocument()
      })
    })

    it('celular Android enables all 5 financieras in credit selection', async () => {
      renderCard(baseProduct({ id: 'xiaomi-1', nombre: 'Xiaomi Redmi Note 13', marca: 'Xiaomi', categoria: 'Celulares' }))

      await irACredito()

      // All 5 financieras exist
      expect(screen.getByText('Sistecredito')).toBeInTheDocument()
      expect(screen.getByText('Esmiopcion')).toBeInTheDocument()
      expect(screen.getByText('PayJoy')).toBeInTheDocument()
      expect(screen.getByText('Krediya')).toBeInTheDocument()
      expect(screen.getByText('Celya')).toBeInTheDocument()

      // PayJoy is enabled for Android
      fireEvent.click(screen.getByText('PayJoy'))
      await waitFor(() => {
        expect(screen.getByText('Primero valida tu crédito:')).toBeInTheDocument()
      })
    })
  })

  describe('Share functionality and autoOpen deep linking', () => {
    it('automatically opens modal when autoOpen prop is true', async () => {
      render(
        <MemoryRouter>
          <WhatsappNumberProvider>
            <CartProvider>
              <ProductCard producto={baseProduct()} autoOpen={true} />
            </CartProvider>
          </WhatsappNumberProvider>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('¿Qué quieres hacer?')).toBeInTheDocument()
      })
    })

    it('renders share button on card and copies product deep link to clipboard when clicked', async () => {
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
        expect(writeTextSpy).toHaveBeenCalledWith(expect.stringContaining('/catalogo?producto=prod-share-1'))
        expect(screen.getByText('¡Enlace copiado!')).toBeInTheDocument()
      })
    })

    it('uses navigator.share when available on card', async () => {
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
            url: expect.stringContaining('/catalogo?producto=prod-share-2'),
          })
        )
      })
    })

    it('renders share button in modal and allows copying link', async () => {
      const writeTextSpy = vi.fn().mockResolvedValue(undefined)
      Object.assign(navigator, {
        share: undefined,
        clipboard: {
          writeText: writeTextSpy,
        },
      })

      renderCard(baseProduct({ id: 'prod-modal-share', nombre: 'Samsung Galaxy S24' }))

      await abrirModal()

      const modalShareButtons = screen.getAllByRole('button', { name: /Compartir Samsung Galaxy S24/i })
      // Find the one inside modal header
      const modalHeaderShare = modalShareButtons.find((btn) => btn.closest('.modal-header'))
      expect(modalHeaderShare).toBeDefined()

      if (modalHeaderShare) {
        fireEvent.click(modalHeaderShare)
        await waitFor(() => {
          expect(writeTextSpy).toHaveBeenCalledWith(expect.stringContaining('/catalogo?producto=prod-modal-share'))
        })
      }
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
})