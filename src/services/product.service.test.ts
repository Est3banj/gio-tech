import { describe, it, expect, vi } from 'vitest'

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => 'productos'),
  onSnapshot: vi.fn((_col, next) => {
    next({ docs: [] })
    return vi.fn()
  }),
  doc: vi.fn(() => 'doc-ref'),
  addDoc: vi.fn(() => Promise.resolve({ id: 'mock-id' })),
  updateDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
  orderBy: vi.fn(),
  limit: vi.fn(),
  QueryConstraint: class {},
}))

vi.mock('../firebase', () => ({
  db: {},
}))

describe('product.service exports', () => {
  it('exports subscribeToProducts', async () => {
    const mod = await import('./product.service')
    expect(mod.subscribeToProducts).toBeDefined()
    expect(typeof mod.subscribeToProducts).toBe('function')
  })

  it('exports createProduct', async () => {
    const mod = await import('./product.service')
    expect(mod.createProduct).toBeDefined()
    expect(typeof mod.createProduct).toBe('function')
  })

  it('exports updateProduct', async () => {
    const mod = await import('./product.service')
    expect(mod.updateProduct).toBeDefined()
    expect(typeof mod.updateProduct).toBe('function')
  })

  it('exports deleteProduct', async () => {
    const mod = await import('./product.service')
    expect(mod.deleteProduct).toBeDefined()
    expect(typeof mod.deleteProduct).toBe('function')
  })

  it('exports searchProducts', async () => {
    const mod = await import('./product.service')
    expect(mod.searchProducts).toBeDefined()
    expect(typeof mod.searchProducts).toBe('function')
  })


})
