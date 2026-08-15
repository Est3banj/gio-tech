import { describe, it, expect } from 'vitest'
import { seleccionarDestacados } from './featured-products'
import type { Product } from '../types'

function prod(id: string): Product {
  return { id, nombre: `Producto ${id}` } as unknown as Product
}

const productos = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'].map(prod)

const d1 = new Date('2026-08-15T12:00:00')
const d2 = new Date('2026-08-16T12:00:00')

const firestoreIds = [
  '07M5ugBdQ600YTxeufce',
  '1INLnbyqToxw8OC7qR68',
  '4AGNJuD7YMb5wz3FG0fg',
  '4AUiZMTVyyNTr0Bx1grV',
  '9NxNUgHiKzkNWheuhFml',
  'BPtWSYCAir1bmC1k4aa9',
  '7fLdojxmlatExf7ZjgsS',
  'KWS4CNiWisJP71yVzYsy',
  'FqtTcaF6QK8OE2d2Bw05',
  'AjMwU8obJqlmi7DaHXDO',
]

describe('seleccionarDestacados', () => {
  it('respeta el ranking de vistas cuando hay 4+ populares', () => {
    const r = seleccionarDestacados(productos, ['c', 'a', 'e', 'b'], d1)
    expect(r.map((p) => p.id)).toEqual(['c', 'a', 'e', 'b'])
  })

  it('devuelve [] cuando no hay productos', () => {
    expect(seleccionarDestacados([], [], d1)).toEqual([])
  })

  it('completa con rotativos sin duplicar cuando hay pocos populares', () => {
    const r = seleccionarDestacados(productos, ['c', 'a'], d1)
    const ids = r.map((p) => p.id)
    expect(ids).toHaveLength(4)
    expect(new Set(ids).size).toBe(4)
    expect(ids.slice(0, 2)).toEqual(['c', 'a'])
  })

  it('sin populares: devuelve 4 determinísticos para el día', () => {
    const r1 = seleccionarDestacados(productos, [], d1)
    const r1b = seleccionarDestacados(productos, [], d1)
    expect(r1).toHaveLength(4)
    expect(r1.map((p) => p.id)).toEqual(r1b.map((p) => p.id))
  })

  it('rota al cambiar el día (con ids reales de Firestore)', () => {
    const productosFirestore = firestoreIds.map(prod)
    const r1 = seleccionarDestacados(productosFirestore, [], d1)
    const r2 = seleccionarDestacados(productosFirestore, [], d2)
    expect(r1.map((p) => p.id)).not.toEqual(r2.map((p) => p.id))
  })

  it('nunca devuelve más productos de los que existen', () => {
    const pocos = productos.slice(0, 3)
    const r = seleccionarDestacados(pocos, [], d1)
    expect(r).toHaveLength(3)
  })
})
