import { NDKSubscriptionCacheUsage, useSubscribe } from "@nostr-dev-kit/ndk-hooks";
import { useMemo } from "react";
import { useContentVisibilityFilter } from "@/features/nostr/hooks/useContentVisibilityFilter";
import { buildShortsFeedFilter, sortShortsEvents } from "@/features/shorts/services/shorts-query.service";
import { toShortVideoViewModel } from "@/features/shorts/services/shorts-media.service";

const SEARCH_RELAYS = import.meta.env.VITE_NOSTR_SEARCH_RELAYS?.length > 5
  ? import.meta.env.VITE_NOSTR_SEARCH_RELAYS
  : undefined;

interface UseShortsFeedParams {
  search?: string;
}

export function useShortsFeed({ search }: UseShortsFeedParams = {}) {
  const { filterEvents } = useContentVisibilityFilter();
  const filter = useMemo(() => buildShortsFeedFilter({ limit: 30, search }), [search]);
  const { events, eose } = useSubscribe([filter], {
    closeOnEose: false,
    cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
    relayUrls: SEARCH_RELAYS,
  });

  const shorts = useMemo(() => {
    const visibleEvents = filterEvents(sortShortsEvents(events));
    return visibleEvents.map(toShortVideoViewModel).filter((short) => Boolean(short.source));
  }, [events, filterEvents]);

  return {
    shorts,
    isLoading: !eose && shorts.length === 0,
    isEmpty: Boolean(eose && shorts.length === 0),
  };
}
