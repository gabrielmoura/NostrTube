import type { NDKEvent, NDKFilter } from '@nostr-dev-kit/ndk'
import { SHORT_VIDEO_EVENT_KINDS } from '@/features/video/services/video-kinds'

export interface ShortsFeedFilterParams {
  author?: string
  limit?: number
  until?: number
  search?: string
}

export function buildShortsFeedFilter({ author, limit = 30, until, search }: ShortsFeedFilterParams = {}): NDKFilter {
  const filter: NDKFilter = {
    kinds: SHORT_VIDEO_EVENT_KINDS,
    limit,
  }

  if (author) {
    filter.authors = [author]
  }

  if (until) {
    filter.until = until
  }

  const normalizedSearch = search?.trim()
  if (normalizedSearch) {
    filter.search = normalizedSearch
  }

  return filter
}

export function sortShortsEvents(events: NDKEvent[]): NDKEvent[] {
  return [...events].sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0))
}
