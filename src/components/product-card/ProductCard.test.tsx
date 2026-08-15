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

const promoProduct = () =>
  baseProduct({
    promo: true,
    promoPrice: 3850000,
    promoBadgeText: 'PROMO+',
    promoStart: Date.now() - 60000,
    promoEnd: Date.now() + 60000,
    cuotaInicial: 500000,
    solo12Meses: true,
    cuotas12: 350000,
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
  fireEvent.click(screen.getByRole('button', { name: /Ver detalles/ }))
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

  it('renders card with title and regular price', () => {
    renderCard(baseProduct())

    expect(screen.getByText('iPhone 15')).toBeInTheDocument()
    expect(getPrecio(formatPrice(4200000))).toBeInTheDocument()
  })

  it('renders card with promo price and del regular price', () => {
    renderCard(promoProduct())

    expect(getPrecio(formatPrice(3850000))).toBeInTheDocument()
    expect(getPrecio(formatPrice(4200000)).tagName).toBe('DEL')
  })

  it('opens the modal in product step with prices and plan', async () => {
    renderCard(promoProduct())

    await abrirModal()

    expect(screen.getByText('Precio regular:')).toBeInTheDocument()
    expect(screen.getByText('Precio promocional:')).toBeInTheDocument()
    const badgesPromoEnModal = screen.getAllByText('PROMO+').filter((el) => el.closest('.modal-body'))
    expect(badgesPromoEnModal).toHaveLength(1)
    expect(
      getPrecio(`12 cuotas mensuales de ${formatPrice(350000)}`),
    ).toBeInTheDocument()
    expect(screen.getByText(/Cuota inicial:/)).toBeInTheDocument()
  })

  it('registers the product view on mount', () => {
    renderCard(baseProduct())

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

      fireEvent.click(screen.getByRole('button', { name: /Ver detalles/ }))
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

    it('runs the validation steps and auto-sends whatsapp when it applies', async () => {
      openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
      renderCard(baseProduct())

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Ver detalles/ }))
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
        vi.advanceTimersByTime(800)
      })
      expect(screen.getByText('Consultando cupo...')).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(1200)
      })
      expect(screen.getByText(/Cupo disponible: \$500\.000/)).toBeInTheDocument()
      expect(screen.getByText(/supera tu cupo por/)).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(1500)
      })
      expect(screen.getByText('¡Aplicas para Sistecredito!')).toBeInTheDocument()
      expect(screen.getByText('Te redirigimos a WhatsApp...')).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(2000)
      })
      expect(openSpy).toHaveBeenCalledTimes(1)
      const url = openSpy.mock.calls[0][0] as string
      const mensaje = decodeURIComponent(url.split('text=')[1])
      expect(mensaje).toContain('🧾 *Solicitud de crédito - Sistecredito*')
      expect(mensaje).toContain('▸ Nombres y apellidos: Juan Pérez')
    })
  })
})