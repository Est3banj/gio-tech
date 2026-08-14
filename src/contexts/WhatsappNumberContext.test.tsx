import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { doc, onSnapshot } from 'firebase/firestore'
import { WhatsappNumberProvider, useWhatsappNumber } from './WhatsappNumberContext'

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db: unknown, collection: string, id: string) => ({ collection, id })),
  onSnapshot: vi.fn(() => vi.fn()),
}))

vi.mock('../firebase', () => ({
  db: {},
}))

const DEFAULT_WHATSAPP_NUMBER = '573223652569'

function WhatsappProbe() {
  const number = useWhatsappNumber()
  return <div data-testid="whatsapp-number">{number}</div>
}

function getSnapshotCallbacks() {
  const call = vi.mocked(onSnapshot).mock.lastCall
  if (!call) throw new Error('onSnapshot not called')
  return { docRef: call[0], next: call[1], error: call[2] }
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  window.history.pushState({}, '', '/?asesor=asesor-1')
})

describe('WhatsappNumberContext', () => {
  it('lee el whatsappNumber desde perfiles_publicos y lo expone', async () => {
    render(
      <WhatsappNumberProvider>
        <WhatsappProbe />
      </WhatsappNumberProvider>,
    )

    await waitFor(() => {
      expect(onSnapshot).toHaveBeenCalled()
    })

    const { docRef, next } = getSnapshotCallbacks()
    expect(doc).toHaveBeenCalledWith({}, 'perfiles_publicos', 'asesor-1')
    expect(docRef).toEqual({ collection: 'perfiles_publicos', id: 'asesor-1' })

    act(() => {
      next({ exists: () => true, data: () => ({ whatsappNumber: '573123456789' }) })
    })

    await waitFor(() => {
      expect(screen.getByTestId('whatsapp-number')).toHaveTextContent('573123456789')
    })
  })

  it('usa el número default cuando el snapshot no existe', async () => {
    render(
      <WhatsappNumberProvider>
        <WhatsappProbe />
      </WhatsappNumberProvider>,
    )

    await waitFor(() => {
      expect(onSnapshot).toHaveBeenCalled()
    })

    const { next } = getSnapshotCallbacks()
    act(() => {
      next({ exists: () => false })
    })

    await waitFor(() => {
      expect(screen.getByTestId('whatsapp-number')).toHaveTextContent(DEFAULT_WHATSAPP_NUMBER)
    })
  })

  it('usa el número default cuando el snapshot existe sin campo whatsappNumber', async () => {
    render(
      <WhatsappNumberProvider>
        <WhatsappProbe />
      </WhatsappNumberProvider>,
    )

    await waitFor(() => {
      expect(onSnapshot).toHaveBeenCalled()
    })

    const { next } = getSnapshotCallbacks()
    act(() => {
      next({ exists: () => true, data: () => ({ nombreCompleto: 'Sin WhatsApp' }) })
    })

    await waitFor(() => {
      expect(screen.getByTestId('whatsapp-number')).toHaveTextContent(DEFAULT_WHATSAPP_NUMBER)
    })
  })

  it('usa el número default cuando el snapshot falla con error', async () => {
    render(
      <WhatsappNumberProvider>
        <WhatsappProbe />
      </WhatsappNumberProvider>,
    )

    await waitFor(() => {
      expect(onSnapshot).toHaveBeenCalled()
    })

    const { error } = getSnapshotCallbacks()
    act(() => {
      error(new Error('permission-denied'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('whatsapp-number')).toHaveTextContent(DEFAULT_WHATSAPP_NUMBER)
    })
  })
})