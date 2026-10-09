import { describe, it, expect } from 'vitest'
import {
  seleccionarDestacados,
  mezclarPorVisita,
  RECOMENDADOS_POOL,
} from './featured-products'
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

const ids = (r: Product[]) => r.map((p) => p.id)

describe('seleccionarDestacados', () => {
  it('devuelve [] cuando no hay productos', () => {
    expect(seleccionarDestacados([], d1)).toEqual([])
  })

  it('mismo día → misma lista (consistencia compartida)', () => {
    const r1 = seleccionarDestacados(productos, d1)
    const r1b = seleccionarDestacados(productos, d1)
    expect(ids(r1)).toEqual(ids(r1b))
  })

  it('rota al cambiar el día (con ids reales de Firestore)', () => {
    const productosFirestore = firestoreIds.map(prod)
    const r1 = seleccionarDestacados(productosFirestore, d1)
    const r2 = seleccionarDestacados(productosFirestore, d2)
    expect(ids(r1)).not.toEqual(ids(r2))
  })

  it('días consecutivos → listas distintas (4 días seguidos, catálogo completo)', () => {
    const vistas = new Set<string>()
    for (let dia = 0; dia < 4; dia++) {
      const fecha = new Date(2026, 7, 15 + dia, 12)
      vistas.add(ids(seleccionarDestacados(productos, fecha)).join('|'))
    }
    expect(vistas.size).toBe(4)
  })

  it('alcanza todo el pool: más de 4 productos distintos en 10 días', () => {
    const vistos = new Set<string>()
    for (let dia = 0; dia < 10; dia++) {
      const fecha = new Date(2026, 7, 15 + dia, 12)
      ids(seleccionarDestacados(productos, fecha)).forEach((id) => vistos.add(id))
    }
    expect(vistos.size).toBeGreaterThan(4)
  })

  it('devuelve exactamente `count` cuando hay inventario', () => {
    const r = seleccionarDestacados(productos, d1)
    expect(r).toHaveLength(4)
    expect(new Set(ids(r)).size).toBe(4)
  })

  it('nunca devuelve más productos de los que existen', () => {
    const pocos = productos.slice(0, 3)
    const r = seleccionarDestacados(pocos, d1)
    expect(r).toHaveLength(3)
  })

  it('nunca duplica ids aunque el catálogo tenga repetidos', () => {
    const repetidos = [prod('x'), prod('x'), prod('y'), prod('z')]
    const r = seleccionarDestacados(repetidos, d1)
    expect(new Set(ids(r)).size).toBe(r.length)
  })
})

describe('mezclarPorVisita', () => {
  it('misma semilla → mismo orden (estable durante la visita)', () => {
    const a = ids(mezclarPorVisita(productos, 0.42))
    const b = ids(mezclarPorVisita(productos, 0.42))
    expect(a).toEqual(b)
  })

  it('semilla distinta → orden distinto (cada visita muestra otra cara)', () => {
    const a = ids(mezclarPorVisita(productos, 0.11))
    const b = ids(mezclarPorVisita(productos, 0.93))
    expect(a).not.toEqual(b)
  })

  it('es una permutación: conserva todos los elementos, sin duplicar ni perder', () => {
    const r = ids(mezclarPorVisita(productos, 0.7))
    expect(r).toHaveLength(productos.length)
    expect(new Set(r).size).toBe(productos.length)
    expect([...r].sort()).toEqual([...ids(productos)].sort())
  })

  it('no muta el array de entrada', () => {
    const entrada = ids(productos)
    mezclarPorVisita(productos, 0.33)
    expect(ids(productos)).toEqual(entrada)
  })

  it('con el pool de la ficha: subconjuntos distintos por semilla', () => {
    const pool = [...productos]
    const visitas = new Set<string>()
    for (let v = 0; v < 5; v++) {
      const seis = mezclarPorVisita(pool, (v + 1) * 0.17).slice(0, 6)
      visitas.add(ids(seis).join('|'))
    }
    expect(visitas.size).toBe(5)
    expect(RECOMENDADOS_POOL).toBeGreaterThan(6)
  })
})
