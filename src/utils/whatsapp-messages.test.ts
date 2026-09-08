import { describe, it, expect } from 'vitest'
import {
  buildContadoWhatsAppMessage,
  buildCreditoWhatsAppMessage,
  buildWhatsAppUrl,
  CAMPO_LABELS,
  labelDeCampo,
} from './whatsapp-messages'

const NBSP = '\u00A0'

describe('buildContadoWhatsAppMessage', () => {
  // golden — byte-identidad REQ-001, no cambiar
  it('golden: contado con promo (rama "comprar el ... (antes ...)")', () => {
    const result = buildContadoWhatsAppMessage({
      nombre: 'iPhone 16 Pro',
      showPromoPrice: true,
      pricePromoStr: `$${NBSP}4.500.000`,
      priceRegularStr: `$${NBSP}5.000.000`,
    })
    expect(result).toBe('Hola, estoy interesado en comprar el iPhone 16 Pro.\nPrecio promocional: $\u00A04.500.000 (antes $\u00A05.000.000).\n¿Está disponible para entrega inmediata?')
  })

  // golden — byte-identidad REQ-001, no cambiar
  it('golden: contado sin promo (rama "comprar al contado el ...")', () => {
    const result = buildContadoWhatsAppMessage({
      nombre: 'iPhone 16 Pro',
      showPromoPrice: false,
      pricePromoStr: `$${NBSP}4.500.000`,
      priceRegularStr: `$${NBSP}5.000.000`,
    })
    expect(result).toBe('Hola, estoy interesado en comprar al contado el iPhone 16 Pro.\nPrecio: $\u00A05.000.000.\n¿Está disponible para entrega inmediata?')
  })
})

describe('buildCreditoWhatsAppMessage', () => {
  // golden — byte-identidad REQ-001, no cambiar
  it('golden: crédito genérico (financiera no-Krediya, sin cuotas, 2 campos en orden de inserción)', () => {
    const result = buildCreditoWhatsAppMessage({
      financiera: { id: 'sistecredito', nombre: 'Sistecredito' },
      nombre: 'iPhone 16 Pro',
      precioStr: `$${NBSP}5.000.000`,
      cuotaInicialStr: '',
      solo12Meses: false,
      cuotas12Str: '',
      cuotas6Str: `$${NBSP}380.000`,
      cuotas8Str: `$${NBSP}700.000`,
      formData: {
        nombres: 'Esteban Farias',
        cedula: '12345',
      },
    })
    expect(result).toBe('🧾 *Solicitud de crédito - Sistecredito*\n\n📱 *Producto:* iPhone 16 Pro\n💰 *Precio:* $\u00A05.000.000\n\n👤 *Datos del cliente:*\n▸ Nombres y apellidos: Esteban Farias\n▸ Cédula: 12345\n')
  })

  // golden — byte-identidad REQ-001, no cambiar
  it('golden: crédito Krediya con plan especial (cuotaInicial > 0 + solo12Meses/12 cuotas, SIN 16/8)', () => {
    const result = buildCreditoWhatsAppMessage({
      financiera: { id: 'krediya', nombre: 'Krediya' },
      nombre: 'iPhone 16 Pro',
      precioStr: `$${NBSP}4.500.000`,
      cuotaInicialStr: `$${NBSP}200.000`,
      solo12Meses: true,
      cuotas12Str: `$${NBSP}320.000`,
      cuotas6Str: `$${NBSP}380.000`,
      cuotas8Str: `$${NBSP}700.000`,
      formData: {
        nombres: 'Esteban Farias',
        compradoAntes: 'No',
      },
    })
    expect(result).toBe('🧾 *Solicitud de crédito - Krediya*\n\n📱 *Producto:* iPhone 16 Pro\n💰 *Precio:* $\u00A04.500.000\n💵 *Cuota inicial:* $\u00A0200.000\n📆 *12 cuotas mensuales:* $\u00A0320.000\n\n👤 *Datos del cliente:*\n▸ Nombres y apellidos: Esteban Farias\n▸ ¿Ha comprado antes?: No\n')
  })

  // golden — byte-identidad REQ-001, no cambiar
  it('golden: crédito Krediya plan standard (sin cuota inicial, CON 16 y 8)', () => {
    const result = buildCreditoWhatsAppMessage({
      financiera: { id: 'krediya', nombre: 'Krediya' },
      nombre: 'iPhone 16 Pro',
      precioStr: `$${NBSP}5.000.000`,
      cuotaInicialStr: '',
      solo12Meses: false,
      cuotas12Str: '',
      cuotas6Str: `$${NBSP}380.000`,
      cuotas8Str: `$${NBSP}700.000`,
      formData: {
        nombres: 'Esteban Farias',
      },
    })
    expect(result).toBe('🧾 *Solicitud de crédito - Krediya*\n\n📱 *Producto:* iPhone 16 Pro\n💰 *Precio:* $\u00A05.000.000\n📆 *16 cuotas quincenales:* $\u00A0380.000\n📆 *8 cuotas mensuales:* $\u00A0700.000\n\n👤 *Datos del cliente:*\n▸ Nombres y apellidos: Esteban Farias\n')
  })

  // golden — byte-identidad REQ-001, rareza congelada: cuotas null → formatPrice devuelve '—'
  it('golden: crédito Krediya con cuotas no cargadas (formatea "—")', () => {
    const result = buildCreditoWhatsAppMessage({
      financiera: { id: 'krediya', nombre: 'Krediya' },
      nombre: 'Auriculares',
      precioStr: '—',
      cuotaInicialStr: '',
      solo12Meses: false,
      cuotas12Str: '',
      cuotas6Str: '—',
      cuotas8Str: '—',
      formData: {
        nombres: 'Esteban Farias',
      },
    })
    expect(result).toBe('🧾 *Solicitud de crédito - Krediya*\n\n📱 *Producto:* Auriculares\n💰 *Precio:* —\n📆 *16 cuotas quincenales:* —\n📆 *8 cuotas mensuales:* —\n\n👤 *Datos del cliente:*\n▸ Nombres y apellidos: Esteban Farias\n')
  })

  // golden — byte-identidad REQ-001, no cambiar
  it('golden: label desconocida → key cruda', () => {
    const result = buildCreditoWhatsAppMessage({
      financiera: { id: 'sistecredito', nombre: 'Sistecredito' },
      nombre: 'iPhone 16 Pro',
      precioStr: `$${NBSP}5.000.000`,
      cuotaInicialStr: '',
      solo12Meses: false,
      cuotas12Str: '',
      cuotas6Str: `$${NBSP}380.000`,
      cuotas8Str: `$${NBSP}700.000`,
      formData: {
        keyNueva: 'valor',
      },
    })
    expect(result).toBe('🧾 *Solicitud de crédito - Sistecredito*\n\n📱 *Producto:* iPhone 16 Pro\n💰 *Precio:* $\u00A05.000.000\n\n👤 *Datos del cliente:*\n▸ keyNueva: valor\n')
  })
})

describe('CAMPO_LABELS / labelDeCampo', () => {
  it('mapea las 10 claves conocidas del mapa actual', () => {
    expect(CAMPO_LABELS).toEqual({
      nombres: 'Nombres y apellidos',
      cedula: 'Cédula',
      fechaNacimiento: 'Fecha y lugar de nacimiento',
      fechaExpedicion: 'Fecha y lugar de expedición',
      celular: 'Celular',
      email: 'Correo electrónico',
      compradoAntes: '¿Ha comprado antes?',
      reportesNegativos: '¿Reportes negativos?',
      cupo: 'Cupo disponible',
      primeraCompra: 'Primera compra',
    })
  })

  it('fallback a key cruda para claves no mapeadas', () => {
    expect(labelDeCampo('keyNueva')).toBe('keyNueva')
  })
})

describe('buildWhatsAppUrl', () => {
  // golden — byte-identidad REQ-001, no cambiar
  it('golden: construye URL wa.me con encodeURIComponent byte-exacto', () => {
    const result = buildWhatsAppUrl('573223652569', 'Hola, estoy interesado en comprar el iPhone 16 Pro.\nPrecio promocional: $\u00A04.500.000 (antes $\u00A05.000.000).\n¿Está disponible para entrega inmediata?')
    expect(result).toBe('https://wa.me/573223652569?text=Hola%2C%20estoy%20interesado%20en%20comprar%20el%20iPhone%2016%20Pro.%0APrecio%20promocional%3A%20%24%C2%A04.500.000%20(antes%20%24%C2%A05.000.000).%0A%C2%BFEst%C3%A1%20disponible%20para%20entrega%20inmediata%3F')
  })
})

import { buildCartWhatsAppMessage } from './whatsapp-messages'
import type { CartItem } from '../types'

describe('buildCartWhatsAppMessage', () => {
  it('returns default fallback message when cart is empty', () => {
    expect(buildCartWhatsAppMessage([])).toBe(
      'Hola, estoy contactando a GIO TECH. No tengo productos en mi lista de interés.'
    )
  })

  it('generates structured message for single contado item with customer info', () => {
    const items: CartItem[] = [
      {
        itemId: 's24-contado',
        productId: 's24',
        nombre: 'Samsung Galaxy S24 Ultra',
        imagen: '',
        contado: 4500000,
        cuotas6: 0,
        cuotas8: 0,
        cotizacionType: 'contado',
        cantidad: 1,
      },
    ]

    const result = buildCartWhatsAppMessage(items, {
      nombre: 'Esteban Farias',
      municipio: 'Puerto Asís',
    })

    expect(result).toContain('🛒 *Nueva Cotización - GIO TECH*')
    expect(result).toContain('👤 *Datos del Cliente:*')
    expect(result).toContain('▸ Nombre: Esteban Farias')
    expect(result).toContain('▸ Municipio: Puerto Asís')
    expect(result).toContain('1. *Samsung Galaxy S24 Ultra* (x1)')
    expect(result).toContain('• Modalidad: Contado')
    expect(result).toContain('• Precio unitario:')
    expect(result).toContain('💰 *Total Estimado de Contado:*')
  })

  it('generates structured message for multi-quantity items and calculates subtotals', () => {
    const items: CartItem[] = [
      {
        itemId: 'redmi-contado',
        productId: 'redmi',
        nombre: 'Xiaomi Redmi Note 13',
        imagen: '',
        contado: 1000000,
        cuotas6: 0,
        cuotas8: 0,
        cotizacionType: 'contado',
        cantidad: 3,
      },
    ]

    const result = buildCartWhatsAppMessage(items)

    expect(result).toContain('1. *Xiaomi Redmi Note 13* (x3)')
    expect(result).toContain('• Subtotal (3 uds):')
    expect(result).not.toContain('👤 *Datos del Cliente:*')
  })

  it('generates structured message for 12 meses special plan items without showing $0', () => {
    const items: CartItem[] = [
      {
        itemId: 's24-credito',
        productId: 's24',
        nombre: 'Samsung Galaxy S24 Plan Especial',
        imagen: '',
        contado: 3500000,
        cuotas6: 0,
        cuotas8: 0,
        solo12Meses: true,
        cuotas12: 350000,
        cuotaInicial: 500000,
        cotizacionType: 'credito',
        cantidad: 1,
      },
    ]

    const result = buildCartWhatsAppMessage(items, { nombre: 'Laura Perez' })

    expect(result).toContain('1. *Samsung Galaxy S24 Plan Especial* (x1)')
    expect(result).toContain('• Modalidad: Crédito')
    expect(result).toContain('• Cuota inicial:')
    expect(result).toContain('• Plan especial: 12 cuotas mensuales de')
    expect(result).not.toContain('$0')
    expect(result).toContain('• Valor ref. contado:')
  })
})