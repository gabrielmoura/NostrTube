import type { NDKEvent } from '@nostr-dev-kit/ndk'
import { useNDK } from '@nostr-dev-kit/ndk-hooks'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useContentVisibilityFilter } from '@/features/nostr/hooks/useContentVisibilityFilter'
import { fetchEventsCached, getSearchRelayUrls } from '@/features/nostr/services/ndk-query.service'
import { toShortVideoViewModel } from '@/features/shorts/services/shorts-media.service'
import { buildShortsFeedFilter, sortShortsEvents } from '@/features/shorts/services/shorts-query.service'

const SHORTS_PAGE_SIZE = 20

interface UseShortsFeedParams {
  author?: string
  initialEvent?: NDKEvent
  search?: string
}

export function useShortsFeed({ author, initialEvent, search }: UseShortsFeedParams = {}) {
  const { ndk } = useNDK()
  const { filterEvents } = useContentVisibilityFilter()

  const query = useInfiniteQuery({
    queryKey: ['shortsFeed', { author, search }],
    enabled: Boolean(ndk),
    initialPageParam: undefined as number | undefined,
    queryFn: async ({ pageParam }) => {
      if (!ndk) return []
      const filter = buildShortsFeedFilter({
        author,
        limit: SHORTS_PAGE_SIZE,
        search,
        until: pageParam,
      })

      const events = await fetchEventsCached(ndk, filter, {
        mode: pageParam ? 'cache-first' : 'parallel',
        relayUrls: getSearchRelayUrls(),
      })

      return sortShortsEvents(Array.from(events))
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length < SHORTS_PAGE_SIZE) return undefined
      const lastEvent = lastPage[lastPage.length - 1]
      return lastEvent?.created_at ? lastEvent.created_at - 1 : undefined
    },
  })

  const shorts = useMemo(() => {
    const allEvents = [...(initialEvent ? [initialEvent] : []), ...(query.data?.pages.flatMap((page) => page) ?? [])]
    const uniqueEvents = deduplicateEventsById(allEvents)
    const visibleEvents = filterEvents(sortShortsEvents(uniqueEvents))
    return visibleEvents.map(toShortVideoViewModel).filter((short) => Boolean(short.source))
  }, [initialEvent, query.data?.pages, filterEvents])

  return {
    shorts,
    isLoading: !initialEvent && query.isLoading && shorts.length === 0,
    isEmpty: Boolean(query.isFetched && shorts.length === 0),
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  }
}

function deduplicateEventsById(events: NDKEvent[]): NDKEvent[] {
  const seen = new Set<string>()
  return events.filter((event) => {
    if (seen.has(event.id)) return false
    seen.add(event.id)
    return true
  })
}
