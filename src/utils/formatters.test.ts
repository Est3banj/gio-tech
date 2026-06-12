import { describe, it, expect } from 'vitest'
import { formatPrice, normalizeText } from './formatters'

describe('formatPrice', () => {
  it('formats a number as COP currency', () => {
    const result = formatPrice(1500000)
    expect(result).toBe('$ 1.500.000')
  })

  it('returns "—" for null', () => {
    expect(formatPrice(null)).toBe('—')
  })

  it('returns "—" for undefined', () => {
    expect(formatPrice(undefined)).toBe('—')
  })

  it('parses and formats a string number', () => {
    const result = formatPrice('2500000')
    expect(result).toBe('$ 2.500.000')
  })

  it('returns "—" for an empty string', () => {
    expect(formatPrice('')).toBe('—')
  })

  it('returns "—" for NaN values', () => {
    expect(formatPrice('not-a-number')).toBe('—')
  })
})

describe('normalizeText', () => {
  it('removes accents and lowercases', () => {
    expect(normalizeText('José María')).toBe('jose maria')
  })

  it('trims whitespace', () => {
    expect(normalizeText('  HOLA  ')).toBe('hola')
  })

  it('returns empty string for non-string input', () => {
    expect(normalizeText(null as unknown as string)).toBe('')
  })
})
