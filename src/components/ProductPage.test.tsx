import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within, waitFor, act, fireEvent, cleanup } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ProductPage from './ProductPage'
import { WhatsappNumberProvider } from '../contexts/WhatsappNumberContext'
import { CartProvider } from '../contexts/CartContext'
import { recordProductView } from '../services/productStats.service'
import { recordLegalConsent } from '../services/legal-consent.service'
import { trackLead, trackAddToCart, trackPurchase } from '../utils/metaPixel'
import { formatPrice } from '../utils/formatters'
import type { Product } from '../types'
import type { UseProductsReturn } from '../hooks/useProducts'

// ─── mocks (mismo patrón que ProductCard.test) ───
const { mockUseProducts, addToCartSpy } = vi.hoisted(() => ({
  mockUseProducts: vi.fn(),
  addToCartSpy: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  onSnapshot: vi.fn(() => vi.fn()),
}))

vi.mock('../firebase', () => ({ db: {} }))

vi.mock('../services/productStats.service', () => ({
  recordProductView: vi.fn(),
}))

vi.mock('../hooks/useProducts', () => ({
  useProducts: () => mockUseProducts(),
  reloadProducts: vi.fn(),
}))

vi.mock('../utils/metaPixel', () => ({
  trackLead: vi.fn(),
  trackAddToCart: vi.fn(),
  trackPurchase: vi.fn(),
  trackMetaEvent: vi.fn(),
}))

vi.mock('../services/legal-consent.service', () => ({
  recordLegalConsent: vi.fn(),
  getLegalConsentRecords: vi.fn(() => []),
  LEGAL_CONSENT_STORAGE_KEY: 'gio-legal-consent-v1',
}))

// Spy de useCart().addToCart que DELEGA al real (así se cubre addToCart(producto,'contado')
// Y el trackAddToCart interno de CartContext sin tocar el intocable CartContext).
vi.mock('../contexts/cart-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../contexts/cart-context')>()
  return {
    ...actual,
    useCart: () => {
      const real = actual.useCart()
      return {
        ...real,
        addToCart: (...args: Parameters<typeof real.addToCart>) => {
          addToCartSpy(...args)
          return real.addToCart(...args)
        },
      }
    },
  }
})

// ─── fixtures ───
const baseProduct = (overrides: Record<string, unknown> = {}) =>
  ({
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

const krediyaProduct = () =>
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
  })

const promoProduct = () =>
  baseProduct({
    id: 'promo-1',
    nombre: 'iPhone 15 Pro',
    contado: 5000000,
    promo: true,
    promoPrice: 4500000,
    promoStart: Date.now() - 60000,
    promoEnd: Date.now() + 60000,
  })

// Accesorio barato → tieneFinanciacion === false (misma data que ProductCard.test)
const accesorioSinFinanciacion = () =>
  baseProduct({
    id: 'acc-1',
    nombre: 'Funda Protectora Silicona',
    marca: 'Genérica',
    categoria: 'Accesorios',
    contado: 50000,
    cuotas6: null,
    cuotas8: null,
  })

// Accesorio con crédito disponible (> $100k) — migrado de ProductCard.test
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

const PRODUCTS: Product[] = [
  baseProduct(),
  krediyaProduct(),
  promoProduct(),
  accesorioSinFinanciacion(),
  accesorioFinanciable(),
]

function renderPage(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <WhatsappNumberProvider>
        <CartProvider>
          <Routes>
            <Route path="/producto/:productId" element={<ProductPage />} />
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

function barraFlotante() {
  // Regresión del pulido ML: la barra de compra flotante NO debe volver.
  return document.querySelector('.product-mobile-cta')
}

describe('ProductPage', () => {
  let openSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    mockUseProducts.mockReturnValue({
      products: PRODUCTS,
      isLoading: false,
      error: null,
    } satisfies UseProductsReturn)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // (1) mount → recordProductView ×1 con el id
  it('registro de vista: llama recordProductView exactamente 1 vez en mount', () => {
    renderPage('/producto/prod-1')

    expect(recordProductView).toHaveBeenCalledTimes(1)
    expect(recordProductView).toHaveBeenCalledWith('prod-1')
  })

  // (2) regresión bug 8: activar una card NO agrega un recordProductView extra
  it('regresión bug 8: activar una card recomendada navega y NO suma un recordProductView extra', async () => {
    renderPage('/producto/prod-1')
    expect(recordProductView).toHaveBeenCalledTimes(1)
    expect(recordProductView).toHaveBeenCalledWith('prod-1')

    // clic en "Ver detalles" de la primer card recomendada
    fireEvent.click(screen.getAllByRole('button', { name: /Ver detalles/ })[0])

    // mount del detalle destino = exactamente 1 vista del nuevo id
    await waitFor(() => {
      expect(recordProductView).toHaveBeenCalledTimes(2)
    })
    const ids = recordProductView.mock.calls.map((c) => c[0] as string)
    const nuevoId = ids[1]
    expect(nuevoId).not.toBe('prod-1')
    // si la card registrara vista al navegar, el nuevo id aparecería 2 veces (click + mount)
    expect(ids.filter((id) => id === nuevoId)).toHaveLength(1)
  })

  // (3) PlanCuotas presente (Krediya) / ausente (iPhone)
  it('PlanCuotas se renderiza en el bloque de precio con producto Krediya y NO con iPhone', () => {
    renderPage('/producto/s24-krediya')
    expect(screen.getByText('Simulador de Financiación')).toBeInTheDocument()
    expect(screen.getByText('PLAN ESPECIAL EXCLUSIVO')).toBeInTheDocument()
    expect(getPrecio(`12 cuotas mensuales de ${formatPrice(350000)}`)).toBeInTheDocument()
    expect(screen.getByText(/Cuota inicial:/)).toBeInTheDocument()

    cleanup()

    renderPage('/producto/prod-1')
    expect(screen.queryByText('Simulador de Financiación')).not.toBeInTheDocument()
    expect(screen.queryByText(/cuotas quincenales:/i)).not.toBeInTheDocument()
  })

  // (4) "Comprar por WhatsApp" → copy byte-exacto + trackLead ×1 + sin purchase + step sin cambios
  it('CTA "Comprar por WhatsApp" abre wa.me con el copy genérico byte-exacto, dispara trackLead y NO cambia el step', async () => {
    openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    renderPage('/producto/prod-1')

    const ctas = screen.getAllByRole('button', { name: /Comprar por WhatsApp/ })
    expect(ctas.length).toBeGreaterThanOrEqual(1)
    fireEvent.click(ctas[0])

    await waitFor(() => expect(openSpy).toHaveBeenCalledTimes(1))

    const url = openSpy.mock.calls[0][0] as string
    expect(url).toContain('wa.me/')
    const mensaje = decodeURIComponent(url.split('text=')[1])
    expect(mensaje).toBe('Hola, estoy interesado en el iPhone 15. ¿Me confirmas disponibilidad y precio? Gracias.')
    expect(mensaje).not.toContain('al contado')

    expect(trackLead).toHaveBeenCalledTimes(1)
    expect(trackPurchase).not.toHaveBeenCalled()

    // el step NO cambia: no entró al wizard de crédito
    expect(screen.queryByText('Selecciona una financiera')).not.toBeInTheDocument()
    // pulido ML: sin barra de compra flotante (el buybox inline manda)
    expect(barraFlotante()).toBeNull()

    // Convergencia promo/no-promo: el copy genérico es único e ignora el precio (caso unificado)
    cleanup()
    openSpy.mockClear()
    renderPage('/producto/promo-1')
    const ctasPromo = screen.getAllByRole('button', { name: /Comprar por WhatsApp/ })
    fireEvent.click(ctasPromo[0])

    await waitFor(() => expect(openSpy).toHaveBeenCalledTimes(1))
    const urlPromo = openSpy.mock.calls[0][0] as string
    const mensajePromo = decodeURIComponent(urlPromo.split('text=')[1])
    expect(mensajePromo).toBe('Hola, estoy interesado en el iPhone 15 Pro. ¿Me confirmas disponibilidad y precio? Gracias.')
    expect(mensajePromo).not.toContain('al contado')
    expect(mensajePromo).not.toContain(formatPrice(4500000))
  })

  // (5) "Financiar" → grilla directo, sin "¿Cómo deseas pagar?"
  it('"Financiar" entra DIRECTO a credito-financieras (sin paso intermedio payment)', async () => {
    renderPage('/producto/prod-1')

    fireEvent.click(screen.getByRole('button', { name: 'Financiar' }))

    await waitFor(() => {
      expect(screen.getByText('Selecciona una financiera')).toBeInTheDocument()
    })
    expect(screen.queryByText('¿Cómo deseas pagar?')).not.toBeInTheDocument()
    expect(screen.queryByText('Elige cómo pagar:')).not.toBeInTheDocument()
  })

  // (6) sin financiación → sin botón "Financiar"
  it('producto sin financiación: solo "Comprar por WhatsApp", sin CTA "Financiar" y sin PlanCuotas', () => {
    renderPage('/producto/acc-1')

    expect(screen.getAllByRole('button', { name: /Comprar por WhatsApp/ }).length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByRole('button', { name: 'Financiar' })).not.toBeInTheDocument()
    // sin barra flotante: la compra vive 100% en el buybox inline (ML)
    expect(barraFlotante()).toBeNull()
    // y la acción de carrito sigue disponible dentro del buybox
    expect(screen.getByRole('button', { name: /Agregar al carrito/ })).toBeInTheDocument()
    // sin simulador Krediya (accesorios nunca aplican)
    expect(screen.queryByText('Simulador de Financiación')).not.toBeInTheDocument()
  })

  // Migrado de ProductCard.test — grilla iPhone: PayJoy deshabilitado, Esmiopcion avanza
  it('grilla de financieras (iPhone): PayJoy NO avanza, Esmiopcion avanza al form', async () => {
    renderPage('/producto/prod-1')

    fireEvent.click(screen.getByRole('button', { name: 'Financiar' }))
    await waitFor(() => {
      expect(screen.getByText('Selecciona una financiera')).toBeInTheDocument()
    })

    expect(screen.getByText('Sistecredito')).toBeInTheDocument()
    expect(screen.getByText('Esmiopcion')).toBeInTheDocument()

    fireEvent.click(screen.getByText('PayJoy'))
    await waitFor(() => {
      expect(screen.queryByText('Primero valida tu crédito:')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Selecciona una financiera')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Esmiopcion'))
    await waitFor(() => {
      expect(screen.getByText('Primero valida tu crédito:')).toBeInTheDocument()
    })
  })

  // Migrado de ProductCard.test — celular Android: las 5 financieras habilitadas
  it('grilla de financieras (Android): 5 financieras y PayJoy avanza al form', async () => {
    renderPage('/producto/s24-krediya')

    fireEvent.click(screen.getByRole('button', { name: 'Financiar' }))
    await waitFor(() => {
      expect(screen.getByText('Selecciona una financiera')).toBeInTheDocument()
    })

    expect(screen.getByText('Sistecredito')).toBeInTheDocument()
    expect(screen.getByText('Esmiopcion')).toBeInTheDocument()
    expect(screen.getByText('PayJoy')).toBeInTheDocument()
    expect(screen.getByText('Krediya')).toBeInTheDocument()
    expect(screen.getByText('Celya')).toBeInTheDocument()

    fireEvent.click(screen.getByText('PayJoy'))
    await waitFor(() => {
      expect(screen.getByText('Primero valida tu crédito:')).toBeInTheDocument()
    })
  })

  // Migrado de ProductCard.test — accesorio > $100k: crédito disponible en el detalle
  it('accesorio > $100k en el detalle: Financiar disponible, SIN PlanCuotas, grilla limitada a Sistecredito/Esmiopcion', async () => {
    renderPage('/producto/acc-2')

    expect(screen.getByRole('button', { name: 'Financiar' })).toBeInTheDocument()
    expect(screen.queryByText('Simulador de Financiación')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Financiar' }))
    await waitFor(() => {
      expect(screen.getByText('Selecciona una financiera')).toBeInTheDocument()
    })

    expect(screen.getByText('Sistecredito')).toBeInTheDocument()
    expect(screen.getByText('Esmiopcion')).toBeInTheDocument()

    // PayJoy/Krediya/Celya no avanzan para accesorios
    fireEvent.click(screen.getByText('PayJoy'))
    await waitFor(() => {
      expect(screen.queryByText('Primero valida tu crédito:')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Selecciona una financiera')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Esmiopcion'))
    await waitFor(() => {
      expect(screen.getByText('Primero valida tu crédito:')).toBeInTheDocument()
    })
  })

  // (7) "Agregar al carrito" (buybox inline) → addToCart(prod,'contado'), sin WhatsApp, trackAddToCart, sin purchase
  it('"Agregar al carrito" agrega de verdad y NO abre WhatsApp (bug paymentAction)', () => {
    openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    renderPage('/producto/prod-1')

    expect(addToCartSpy).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /Agregar al carrito/ }))

    expect(addToCartSpy).toHaveBeenCalledTimes(1)
    expect(addToCartSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'prod-1' }), 'contado')
    expect(openSpy).not.toHaveBeenCalled()
    // trackAddToCart vía CartContext (interno, no duplicado en la página)
    expect(trackAddToCart).toHaveBeenCalledTimes(1)
    expect(trackAddToCart).toHaveBeenCalledWith(expect.objectContaining({ id: 'prod-1' }), 'contado')
    expect(trackPurchase).not.toHaveBeenCalled()
  })

  // (12) PriceDisplay variant="page" renderiza precio promo + regular
  it('PriceDisplay variant="page" renderiza precio regular y promocional en el detalle', () => {
    renderPage('/producto/promo-1')

    const pricing = document.querySelector('.product-pricing') as HTMLElement
    expect(pricing).not.toBeNull()
    expect(within(pricing).getByText('Precio regular:')).toBeInTheDocument()
    expect(within(pricing).getByText('Precio promocional:')).toBeInTheDocument()
    expect(within(pricing).getByText(normalizarTexto(formatPrice(5000000)), { normalizer: normalizarTexto })).toBeInTheDocument()
    expect(within(pricing).getByText(normalizarTexto(formatPrice(4500000)), { normalizer: normalizarTexto })).toBeInTheDocument()
  })

  // (13) share → /producto/:id
  it('compartir comparte la URL canónica /producto/:id', async () => {
    const shareSpy = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { share: shareSpy })

    renderPage('/producto/prod-1')

    fireEvent.click(screen.getByRole('button', { name: 'Compartir producto' }))

    await waitFor(() => expect(shareSpy).toHaveBeenCalledTimes(1))
    const data = shareSpy.mock.calls[0][0] as { url: string }
    expect(data.url).toContain('/producto/prod-1')
    expect(data.url).not.toContain('/catalogo?producto=')
  })

  // ─── Pulido ML: compra en flujo (sin barra) + carrusel de recomendados ───
  it('compra en flujo: sin barra flotante y los 3 controles viven en el buybox inline', () => {
    renderPage('/producto/prod-1')

    expect(barraFlotante()).toBeNull()
    const buybox = document.querySelector('.product-buybox') as HTMLElement
    expect(buybox).not.toBeNull()
    expect(within(buybox).getByRole('button', { name: /Comprar por WhatsApp/ })).toBeInTheDocument()
    expect(within(buybox).getByRole('button', { name: /Financiar/ })).toBeInTheDocument()
    expect(within(buybox).getByRole('button', { name: /Agregar al carrito/ })).toBeInTheDocument()
    // 2 CTAs de compra de la spec + la acción fantasma de carrito
    expect(within(buybox).getAllByRole('button', { name: /Comprar por WhatsApp|Financiar/ })).toHaveLength(2)
  })

  it('recomendados: carrusel scroll-snap accesible y click de card navega al detalle', async () => {
    renderPage('/producto/prod-1')

    const track = document.querySelector('.recommended-track') as HTMLElement
    expect(track).not.toBeNull()
    // región focuseable con nombre accesible (tab + flechas la desplazan)
    expect(track.getAttribute('role')).toBe('region')
    expect(track.getAttribute('aria-label')).toBe('Productos recomendados')
    expect(track.tabIndex).toBe(0)
    // huella fija: cada card en su slide (el CSS fija el ancho)
    expect(track.querySelectorAll('.recommended-slide').length).toBeGreaterThan(1)
    expect(track.children.length).toBe(track.querySelectorAll('.recommended-slide').length)

    // la activación de la card sigue navegando (misma behavior de siempre)
    expect(recordProductView).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getAllByRole('button', { name: /Ver detalles/ })[0])
    await waitFor(() => {
      expect(recordProductView).toHaveBeenCalledTimes(2)
    })
  })

  // ─── Rotación de recomendados: shuffle por visita, estable durante la ficha ───
  function nombresRecomendados(): string[] {
    const track = document.querySelector('.recommended-track')
    if (!track) return []
    return [...track.querySelectorAll('.recommended-slide .product-card-title')].map(
      (el) => el.textContent?.trim() || '',
    )
  }

  it('recomendados: excluye el producto actual de la lista', () => {
    renderPage('/producto/prod-1')

    expect(nombresRecomendados()).not.toContain('iPhone 15')
    // el resto del pool sigue disponible para tener scroll real
    expect(nombresRecomendados().length).toBeGreaterThan(1)
  })

  it('recomendados: cada visita (recarga) muestra una mezcla distinta', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.11)
    const primera = renderPage('/producto/prod-1')
    const listaA = nombresRecomendados()
    primera.unmount()

    vi.spyOn(Math, 'random').mockReturnValue(0.93)
    renderPage('/producto/prod-1')
    const listaB = nombresRecomendados()

    expect(listaA.length).toBeGreaterThan(1)
    expect(listaA).not.toEqual(listaB)
  })

  it('recomendados: estable durante la visita (un re-render no re-mezcla)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.42)
    renderPage('/producto/prod-1')
    const antes = nombresRecomendados()

    // resize → sincronizarTrack → setState con objeto nuevo → re-render real
    window.dispatchEvent(new Event('resize'))
    const despues = nombresRecomendados()

    expect(antes.length).toBeGreaterThan(1)
    expect(despues).toEqual(antes)
  })

  // (10) Volver → step product + reset del wizard; (11) sin barra flotante +
  // buybox sticky solo en step product (pulido ML: 0 fixed de compra en móvil)
  it('sin barra flotante, buybox sticky en step product y "Volver" resetea el formulario', async () => {
    renderPage('/producto/prod-1')

    // (11) ningún elemento de compra fixed + buybox en modo sticky
    expect(barraFlotante()).toBeNull()
    expect(document.querySelector('.product-buybox')?.classList.contains('buybox-sticky')).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'Financiar' }))
    await waitFor(() => {
      expect(screen.getByText('Selecciona una financiera')).toBeInTheDocument()
    })
    // (11) en wizard el buybox sale del modo sticky (no compite con el overlay)
    expect(document.querySelector('.product-buybox')?.classList.contains('buybox-sticky')).toBe(false)
    expect(barraFlotante()).toBeNull()

    // entro al form y escribo (contraparte de "closing the modal resets the wizard state")
    fireEvent.click(screen.getByText('Sistecredito'))
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Nombres y apellidos')).toBeInTheDocument()
    })
    fireEvent.change(screen.getByPlaceholderText('Nombres y apellidos'), {
      target: { value: 'Juan Pérez' },
    })
    expect((screen.getByPlaceholderText('Nombres y apellidos') as HTMLInputElement).value).toBe('Juan Pérez')

    // (10) Volver → step product
    fireEvent.click(screen.getByRole('button', { name: 'Volver a detalles del producto' }))
    await waitFor(() => {
      expect(screen.queryByText('Selecciona una financiera')).not.toBeInTheDocument()
    })
    expect(document.querySelector('.product-buybox')?.classList.contains('buybox-sticky')).toBe(true)
    expect(barraFlotante()).toBeNull()
    expect(screen.getByRole('button', { name: 'Financiar' })).toBeInTheDocument()

    // re-entro: el wizard está reseteado (campos vacíos, financiera sin seleccionar)
    fireEvent.click(screen.getByRole('button', { name: 'Financiar' }))
    await waitFor(() => {
      expect(screen.getByText('Selecciona una financiera')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Sistecredito'))
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Nombres y apellidos')).toBeInTheDocument()
    })
    expect((screen.getByPlaceholderText('Nombres y apellidos') as HTMLInputElement).value).toBe('')
  })

  // (8) + (9) — flujo de crédito con consentimiento (fake timers, patrón migrado del modal)
  describe('flujo de crédito con consentimiento (fake timers)', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.clearAllMocks()
      mockUseProducts.mockReturnValue({
        products: PRODUCTS,
        isLoading: false,
        error: null,
      } satisfies UseProductsReturn)
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    async function abrirFormularioSistecredito(fields: {
      nombre: string
      cedula: string
      cupo?: string
      compradoAntes: 'Sí' | 'No'
    }) {
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Financiar' }))
      })
      fireEvent.click(screen.getByText('Sistecredito'))
      await act(async () => {
        fireEvent.change(screen.getByPlaceholderText('Nombres y apellidos'), {
          target: { value: fields.nombre },
        })
        fireEvent.change(screen.getByPlaceholderText('Número de cédula'), {
          target: { value: fields.cedula },
        })
        if (fields.cupo) {
          fireEvent.change(screen.getByPlaceholderText('Cupo disponible ($)'), {
            target: { value: fields.cupo },
          })
        }
        fireEvent.click(screen.getByRole('radio', { name: fields.compradoAntes }))
      })
    }

    // (8) flujo crédito completo con consent: bloqueo sin checkbox, luego evidencia + consent + trackLead
    it('consent gating: Validar bloqueado sin consentimiento; con consent emite evidencia + recordLegalConsent + trackLead', async () => {
      openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
      renderPage('/producto/prod-1')

      await abrirFormularioSistecredito({
        nombre: 'Juan Pérez',
        cedula: '123456789',
        cupo: '500000',
        compradoAntes: 'No',
      })

      // Gating: sin checkbox marcado el Validar está DESHABILITADO (envío bloqueado)
      const validarBtn = screen.getByRole('button', { name: /Validar/ }) as HTMLButtonElement
      expect(validarBtn.disabled).toBe(true)

      await act(async () => {
        fireEvent.click(screen.getByRole('checkbox'))
      })
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

      act(() => {
        vi.advanceTimersByTime(500)
      })
      expect(screen.getByText('¡Aplicas para Sistecredito!')).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(800)
      })

      // Envío completo con consentimiento
      expect(openSpy).toHaveBeenCalledTimes(1)
      const url = openSpy.mock.calls[0][0] as string
      expect(url).toContain('wa.me/')
      const mensaje = decodeURIComponent(url.split('text=')[1])
      expect(mensaje).toContain('🧾 *Solicitud de crédito - Sistecredito*')
      expect(mensaje).toContain('▸ Nombres y apellidos: Juan Pérez')
      // appendConsentEvidence: la evidencia legal viaja junto al mensaje crediticio
      expect(mensaje).toContain('Autorizacion de datos aceptada')
      expect(recordLegalConsent).toHaveBeenCalledWith('credit')
      expect(trackLead).toHaveBeenCalledTimes(1)
      expect(trackPurchase).not.toHaveBeenCalled()
      // el mensaje crediticio NO es el genérico de producto
      expect(mensaje).not.toBe('Hola, estoy interesado en el iPhone 15. ¿Me confirmas disponibilidad y precio? Gracias.')
    })

    // (9) wizard Sistecrédito: recomendación iPhone (migrado del modal)
    it('wizard Sistecrédito muestra recomendación para iPhone en primera compra', async () => {
      renderPage('/producto/prod-1')

      await abrirFormularioSistecredito({
        nombre: 'Maria Gomez',
        cedula: '987654321',
        compradoAntes: 'Sí',
      })

      await act(async () => {
        fireEvent.click(screen.getByRole('checkbox'))
      })
      fireEvent.click(screen.getByRole('button', { name: /Validar/ }))

      act(() => {
        vi.advanceTimersByTime(1200)
      })

      expect(screen.getByText(/Sistecrédito requiere compras previas/)).toBeInTheDocument()
      expect(screen.getByText(/Opciones recomendadas para tu iPhone:/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Continuar con Esmiopción/ })).toBeInTheDocument()
    })

    // Migrado de ProductCard.test — wizard Sistecrédito: recomendación Android en primera compra
    it('wizard Sistecrédito muestra recomendación para Android en primera compra', async () => {
      renderPage('/producto/s24-krediya')

      await abrirFormularioSistecredito({
        nombre: 'Carlos Ruiz',
        cedula: '555666777',
        compradoAntes: 'Sí',
      })

      await act(async () => {
        fireEvent.click(screen.getByRole('checkbox'))
      })
      fireEvent.click(screen.getByRole('button', { name: /Validar/ }))

      act(() => {
        vi.advanceTimersByTime(1200)
      })

      expect(screen.getByText(/Sistecrédito requiere compras previas/)).toBeInTheDocument()
      expect(screen.getByText(/Alternativas con aprobación inmediata/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Cambiar a Krediya/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Cambiar a PayJoy/ })).toBeInTheDocument()
    })
  })

  // ─── P1: el catálogo no disponible NO es un 404 ───
  describe('estados de carga del catálogo (P1)', () => {
    it('suscripción con error: NO dice "Producto no encontrado" y ofrece Reintentar', () => {
      mockUseProducts.mockReturnValue({
        products: [],
        isLoading: false,
        error: new Error('unavailable'),
      } satisfies UseProductsReturn)

      renderPage('/producto/prod-1')

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('No pudimos cargar el catálogo')).toBeInTheDocument()
      expect(screen.queryByText('Producto no encontrado')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Reintentar/ })).toBeInTheDocument()
    })

    it('lista vacía sin error: tampoco acusa al producto de no existir', () => {
      mockUseProducts.mockReturnValue({
        products: [],
        isLoading: false,
        error: null,
      } satisfies UseProductsReturn)

      renderPage('/producto/prod-1')

      expect(screen.getByText('No pudimos cargar el catálogo')).toBeInTheDocument()
      expect(screen.queryByText('Producto no encontrado')).not.toBeInTheDocument()
    })

    it('404 real: hay catálogo cargado y el id no está en la lista', () => {
      renderPage('/producto/que-no-existe')

      expect(screen.getByText('Producto no encontrado')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Reintentar/ })).not.toBeInTheDocument()
    })

    it('cargando el catálogo: spinner, ni 404 ni error', () => {
      mockUseProducts.mockReturnValue({
        products: [],
        isLoading: true,
        error: null,
      } satisfies UseProductsReturn)

      renderPage('/producto/prod-1')

      expect(document.querySelector('.product-page-loading')).toBeInTheDocument()
      expect(screen.queryByText('Producto no encontrado')).not.toBeInTheDocument()
    })
  })

  // ─── P1: tolerancia a data incompleta (Firestore editable desde admin) ───
  it('data incompleta (precio null, imagen vacía, specs undefined, imagenes no-array) no rompe el detalle', () => {
    mockUseProducts.mockReturnValue({
      products: [
        baseProduct({
          contado: null,
          imagen: '',
          descripcion: '',
          specs: undefined,
          imagenes: 'esto-no-es-un-array',
          cuotas6: null,
          cuotas8: null,
          cuotas12: null,
        }),
      ],
      isLoading: false,
      error: null,
    } satisfies UseProductsReturn)

    renderPage('/producto/prod-1')

    expect(screen.getByRole('heading', { level: 1, name: /iPhone 15/ })).toBeInTheDocument()
    expect(screen.queryByText('Producto no encontrado')).not.toBeInTheDocument()

    const buybox = document.querySelector('.product-buybox') as HTMLElement
    expect(buybox).not.toBeNull()
    // formatPrice(null | undefined) → '—' en vez de NaN/$0
    expect(within(buybox).getByText('—')).toBeInTheDocument()
    expect(within(buybox).getByRole('button', { name: /Comprar por WhatsApp/ })).toBeInTheDocument()
    expect(within(buybox).getByRole('button', { name: /Financiar/ })).toBeInTheDocument()
    // Sin cuotas configuradas no debe aparecer el simulador de cuotas
    expect(buybox.querySelector('.simulator-container')).toBeNull()
  })
})
