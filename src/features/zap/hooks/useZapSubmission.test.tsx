// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useZapSubmission } from '@/features/zap/hooks/useZapSubmission'

const useNDKMock = vi.fn()
const useNDKCurrentUserMock = vi.fn()
const startZapMock = vi.fn()
const getZapErrorMessageMock = vi.fn()
const toastSuccess = vi.fn()
const toastInfo = vi.fn()
const toastError = vi.fn()

vi.mock('@nostr-dev-kit/ndk-hooks', () => ({
  useNDK: () => useNDKMock(),
  useNDKCurrentUser: () => useNDKCurrentUserMock(),
}))

vi.mock('@/features/zap/services/zap.service', () => ({
  startZap: (...args: unknown[]) => startZapMock(...args),
  getZapErrorMessage: (...args: unknown[]) => getZapErrorMessageMock(...args),
}))

vi.mock('i18next', () => ({
  t: (key: string) => key,
}))

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    info: (...args: unknown[]) => toastInfo(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}))

describe('useZapSubmission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useNDKMock.mockReturnValue({ ndk: { clientName: 'ndk' } })
    useNDKCurrentUserMock.mockReturnValue({ pubkey: 'user-pubkey' })
    getZapErrorMessageMock.mockImplementation((error: { code?: string }) => error?.code ?? 'unknown')
  })

  it('submits a zap and resolves success state', async () => {
    startZapMock.mockResolvedValue({ status: 'paid', invoice: 'lnbc1paid' })

    const { result } = renderHook(() => useZapSubmission())

    const response = await result.current.submit({
      target: { type: 'user', pubkey: 'target' },
      amountSats: 100,
      comment: 'thanks',
    })

    expect(response).toEqual({ status: 'paid', invoice: 'lnbc1paid' })
    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(result.current.invoice).toBe('lnbc1paid')
    expect(toastSuccess).toHaveBeenCalledWith('zap.success.paid')
  })

  it('handles missing session as an error state', async () => {
    useNDKMock.mockReturnValue({ ndk: null })
    useNDKCurrentUserMock.mockReturnValue(null)

    const { result } = renderHook(() => useZapSubmission())
    const response = await result.current.submit({
      target: { type: 'user', pubkey: 'target' },
      amountSats: 100,
    })

    expect(response).toBeNull()
    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(toastError).toHaveBeenCalled()
  })

  it('stores invoice-ready status when payment must continue outside WebLN', async () => {
    startZapMock.mockResolvedValue({ status: 'invoice-ready', invoice: 'lnbc1pending' })

    const { result } = renderHook(() => useZapSubmission())
    await result.current.submit({
      target: { type: 'event', event: { id: 'evt' } as never },
      amountSats: 21,
    })

    await waitFor(() => expect(result.current.status).toBe('invoice-ready'))
    expect(result.current.invoice).toBe('lnbc1pending')
    expect(toastInfo).toHaveBeenCalledWith('zap.success.invoice_ready')
  })
})
