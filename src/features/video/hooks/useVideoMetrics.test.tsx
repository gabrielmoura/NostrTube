// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { type PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useVideoMetrics } from '@/features/video/hooks/useVideoMetrics'

const getVideoMetricsMock = vi.fn()

vi.mock('@/features/video/services/video-metrics.service', () => ({
  getVideoMetrics: (...args: unknown[]) => getVideoMetricsMock(...args),
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useVideoMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not fetch when disabled', () => {
    const wrapper = createWrapper()
    renderHook(
      () =>
        useVideoMetrics({ ndk: {} as never, event: { id: 'video-1', tagValue: () => 'd1' } as never, enabled: false }),
      { wrapper },
    )
    expect(getVideoMetricsMock).not.toHaveBeenCalled()
  })

  it('fetches metrics when enabled', async () => {
    getVideoMetricsMock.mockResolvedValue({
      views: 10,
      comments: 2,
      zapCount: 1,
      zapTotalSats: 100,
      zapEvents: [],
    })

    const wrapper = createWrapper()
    const { result } = renderHook(
      () =>
        useVideoMetrics({ ndk: {} as never, event: { id: 'video-1', tagValue: () => 'd1' } as never, enabled: true }),
      { wrapper },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getVideoMetricsMock).toHaveBeenCalledTimes(1)
    expect(result.current.data?.views).toBe(10)
  })
})
