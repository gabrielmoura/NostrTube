import type { NDKEvent } from '@nostr-dev-kit/ndk'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getVideoCommentMetrics,
  getVideoMetrics,
  getVideoViewMetrics,
  getVideoZapMetrics,
} from '@/features/video/services/video-metrics.service'

const fetchEventsCached = vi.fn()

vi.mock('@/features/nostr/services/ndk-query.service', () => ({
  fetchEventsCached: (...args: unknown[]) => fetchEventsCached(...args),
}))

function makeEvent(
  partial: Partial<NDKEvent> & { id: string; pubkey?: string; tags?: string[][]; kind?: number },
): NDKEvent {
  return {
    id: partial.id,
    pubkey: partial.pubkey ?? 'author',
    kind: partial.kind ?? 1,
    tags: partial.tags ?? [],
    dTag: partial.dTag,
    created_at: partial.created_at,
    tagValue: (name: string) => partial.tags?.find((tag) => tag[0] === name)?.[1],
  } as NDKEvent
}

describe('video-metrics.service', () => {
  beforeEach(() => {
    fetchEventsCached.mockReset()
  })

  it('aggregates zap count and total sats', async () => {
    const video = makeEvent({ id: 'video-1', pubkey: 'author', kind: 34235, tags: [['d', 'video-d']], dTag: 'video-d' })
    const zapA = makeEvent({ id: 'zap-1', kind: 9735, tags: [['amount', '21000']] })
    const zapB = makeEvent({
      id: 'zap-2',
      kind: 9735,
      tags: [['description', JSON.stringify({ tags: [['amount', '100000']] })]],
    })
    fetchEventsCached.mockResolvedValueOnce(new Set([zapA, zapA, zapB]))

    await expect(getVideoZapMetrics({} as never, video)).resolves.toEqual({
      count: 2,
      totalSats: 121,
      zapEvents: [zapA, zapB],
    })
  })

  it('counts deduplicated comment events', async () => {
    const video = makeEvent({ id: 'video-1', pubkey: 'author', kind: 34235, tags: [['d', 'video-d']], dTag: 'video-d' })
    const comment = makeEvent({ id: 'comment-1', kind: 1 })
    fetchEventsCached.mockResolvedValueOnce(new Set([comment, comment]))

    await expect(getVideoCommentMetrics({} as never, video)).resolves.toEqual({
      count: 1,
      commentEvents: [comment],
    })
  })

  it('sums latest view counts', async () => {
    const video = makeEvent({ id: 'video-1', pubkey: 'author', kind: 34235, tags: [['d', 'video-d']], dTag: 'video-d' })
    const older = makeEvent({ id: 'view-1', pubkey: 'alice', tags: [['viewed', '2']], created_at: 1 })
    const newer = makeEvent({ id: 'view-2', pubkey: 'alice', tags: [['viewed', '4']], created_at: 2 })
    const bob = makeEvent({ id: 'view-3', pubkey: 'bob', tags: [['viewed', '3']], created_at: 1 })
    fetchEventsCached.mockResolvedValueOnce(new Set([older, newer, bob]))

    const result = await getVideoViewMetrics({} as never, video)
    expect(result.totalViews).toBe(7)
    expect(result.viewEvents).toHaveLength(2)
  })

  it('returns partial nulls when one metrics source fails', async () => {
    const video = makeEvent({ id: 'video-1', pubkey: 'author', kind: 34235, tags: [['d', 'video-d']], dTag: 'video-d' })
    const viewEvent = makeEvent({ id: 'view-1', pubkey: 'alice', tags: [['viewed', '5']], created_at: 1 })
    const zapEvent = makeEvent({ id: 'zap-1', kind: 9735, tags: [['amount', '21000']] })

    fetchEventsCached
      .mockResolvedValueOnce(new Set([viewEvent]))
      .mockRejectedValueOnce(new Error('comments unavailable'))
      .mockResolvedValueOnce(new Set([zapEvent]))

    const result = await getVideoMetrics({} as never, video)
    expect(result).toEqual({
      views: 5,
      comments: null,
      zapCount: 1,
      zapTotalSats: 21,
      zapEvents: [zapEvent],
    })
  })
})
