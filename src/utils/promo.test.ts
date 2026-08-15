import { describe, it, expect } from 'vitest'
import {
  getMillis,
  esVentanaPromo,
  hasValidPromoPrice,
  badgeModeEfectivo,
  debeMostrarPromoBadge,
  debeMostrarNuevoBadge,
  debeMostrarPrecioPromo,
  calcularCuotaInicial,
  resolveBadgeBg,
  resolveHighlightColor,
} from './promo'

describe('getMillis', () => {
  it('devuelve null para null/undefined/0/empty (falsy)', () => {
    expect(getMillis(null)).toBeNull()
    expect(getMillis(undefined)).toBeNull()
    expect(getMillis(0)).toBeNull()
    expect(getMillis('')).toBeNull()
  })

  it('devuelve el número tal cual', () => {
    expect(getMillis(1000)).toBe(1000)
  })

  it('parsea string de fecha', () => {
    expect(getMillis('2026-06-01T00:00:00.000Z')).toBe(new Date('2026-06-01T00:00:00.000Z').getTime())
  })

  it('usa toMillis() de objetos Timestamp-like', () => {
    expect(getMillis({ toMillis: () => 5000 })).toBe(5000)
  })

  it('no usa toMillis() si no es función', () => {
    expect(getMillis({ toMillis: 'nope' })).toBeNull()
  })

  it('devuelve null para strings inválidos', () => {
    expect(getMillis('not-a-date')).toBeNull()
  })
})

describe('esVentanaPromo', () => {
  const NOW = 100000

  it('sin fechas de promo → ventana abierta', () => {
    expect(esVentanaPromo(null, null, NOW)).toBe(true)
    expect(esVentanaPromo(undefined, undefined, NOW)).toBe(true)
  })

  it('start pasado y end futuro → en ventana', () => {
    expect(esVentanaPromo(5000, 200000, NOW)).toBe(true)
  })

  it('start futuro → fuera de ventana', () => {
    expect(esVentanaPromo(300000, 200000, NOW)).toBe(false)
  })

  it('end pasado → fuera de ventana', () => {
    expect(esVentanaPromo(5000, 5000, NOW)).toBe(false)
  })

  it('solo start pasado (sin end) → en ventana', () => {
    expect(esVentanaPromo(5000, null, NOW)).toBe(true)
  })

  it('solo end futuro (sin start) → en ventana', () => {
    expect(esVentanaPromo(null, 200000, NOW)).toBe(true)
  })
})

describe('hasValidPromoPrice', () => {
  it('falso con NaN', () => {
    expect(hasValidPromoPrice(NaN, 5000000)).toBe(false)
    expect(hasValidPromoPrice(4500000, NaN)).toBe(false)
  })

  it('falso con promo 0 o negativo', () => {
    expect(hasValidPromoPrice(0, 5000000)).toBe(false)
    expect(hasValidPromoPrice(-1, 5000000)).toBe(false)
  })

  it('falso con contado 0 o negativo', () => {
    expect(hasValidPromoPrice(4500000, 0)).toBe(false)
    expect(hasValidPromoPrice(4500000, -1)).toBe(false)
  })

  it('falso cuando promo >= contado', () => {
    expect(hasValidPromoPrice(5000000, 5000000)).toBe(false)
    expect(hasValidPromoPrice(6000000, 5000000)).toBe(false)
  })

  it('verdadero cuando 0 < promo < contado (números o strings)', () => {
    expect(hasValidPromoPrice(4500000, 5000000)).toBe(true)
    expect(hasValidPromoPrice('4500000', '5000000')).toBe(true)
  })
})

describe('badgeModeEfectivo / badges', () => {
  it('badgeMode undefined → promo (default actual)', () => {
    expect(badgeModeEfectivo(undefined)).toBe('promo')
    expect(badgeModeEfectivo(null)).toBe('promo')
  })

  it('respeta el badgeMode explícito', () => {
    expect(badgeModeEfectivo('nuevo')).toBe('nuevo')
    expect(badgeModeEfectivo('ambos')).toBe('ambos')
  })

  it('showPromoBadge: promo/ambos + promoActivo + enVentana', () => {
    expect(debeMostrarPromoBadge('ambos', true, true)).toBe(true)
    expect(debeMostrarPromoBadge('promo', true, true)).toBe(true)
    expect(debeMostrarPromoBadge(undefined, true, true)).toBe(true)
    expect(debeMostrarPromoBadge('nuevo', true, true)).toBe(false)
    expect(debeMostrarPromoBadge('promo', false, true)).toBe(false)
    expect(debeMostrarPromoBadge('promo', true, false)).toBe(false)
  })

  it('showNuevoBadge: nuevo/ambos + nuevo flag', () => {
    expect(debeMostrarNuevoBadge('ambos', true)).toBe(true)
    expect(debeMostrarNuevoBadge('nuevo', true)).toBe(true)
    expect(debeMostrarNuevoBadge('promo', true)).toBe(false)
    expect(debeMostrarNuevoBadge('nuevo', false)).toBe(false)
    expect(debeMostrarNuevoBadge(undefined, true)).toBe(false)
  })

  it('showPromoPrice: precio válido + enVentana + promoActivo', () => {
    expect(debeMostrarPrecioPromo(true, true, true)).toBe(true)
    expect(debeMostrarPrecioPromo(false, true, true)).toBe(false)
    expect(debeMostrarPrecioPromo(true, false, true)).toBe(false)
    expect(debeMostrarPrecioPromo(true, true, false)).toBe(false)
  })
})

describe('cuotaInicial y colores', () => {
  it('calcularCuotaInicial: Number(valor || 0)', () => {
    expect(calcularCuotaInicial(500000)).toBe(500000)
    expect(calcularCuotaInicial(null)).toBe(0)
    expect(calcularCuotaInicial(undefined)).toBe(0)
    expect(calcularCuotaInicial(0)).toBe(0)
  })

  it('resolveBadgeBg: fallback a var(--promo-badge-bg, #ff5722)', () => {
    expect(resolveBadgeBg(undefined)).toBe('var(--promo-badge-bg, #ff5722)')
    expect(resolveBadgeBg('#ff0000')).toBe('#ff0000')
  })

  it('resolveHighlightColor: trim + fallback a var(--promo-highlight, rgba(255,87,34,.25))', () => {
    expect(resolveHighlightColor(undefined)).toBe('var(--promo-highlight, rgba(255,87,34,.25))')
    expect(resolveHighlightColor('  #ff0000  ')).toBe('#ff0000')
    expect(resolveHighlightColor('')).toBe('var(--promo-highlight, rgba(255,87,34,.25))')
  })
})