// hooks/useNostrInfiniteFeed.ts
import { useState, useMemo, useEffect, useCallback } from "react";
import { NDKEvent, type NDKFilter, NDKKind } from "@nostr-dev-kit/ndk";
import { NDKSubscriptionCacheUsage, useSubscribe } from "@nostr-dev-kit/ndk-hooks";
import { deduplicateEvents } from "@/helper/deduplicateEvents.ts";

const VIDEO_KINDS = [NDKKind.Video, NDKKind.HorizontalVideo];
const SEARCH_RELAYS = import.meta.env.VITE_NOSTR_SEARCH_RELAYS?.length > 5
  ? import.meta.env.VITE_NOSTR_SEARCH_RELAYS
  : undefined;

// hooks/useNostrInfiniteFeed.ts
export function useNostrInfiniteFeed(baseFilter: Partial<NDKFilter>, enabled = true) {
  const [allEvents, setAllEvents] = useState<NDKEvent[]>([]);
  const [until, setUntil] = useState<number | undefined>(undefined);
  const [isFetching, setIsFetching] = useState(false);

  // 1. Estabilização do Filtro:
  // O JSON.stringify garante que o filtro só mude se o CONTEÚDO mudar,
  // ignorando se a referência do objeto baseFilter é nova.
  const filterKey = JSON.stringify(baseFilter);

  const filters: NDKFilter[] = useMemo(() => {
    if (!enabled) return [];
    return [{
      ...JSON.parse(filterKey),
      kinds: VIDEO_KINDS,
      limit: 40,
      until: until || Math.floor(Date.now() / 1000)
    }];
  }, [filterKey, until, enabled]);

  const { events } = useSubscribe(filters, {
    closeOnEose: false,
    cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
    relayUrls: SEARCH_RELAYS
  }, [filters]);

  // 2. Guarda de Atualização:
  // Só atualizamos o estado se houver eventos REALMENTE novos.
  useEffect(() => {
    if (!events || events.length === 0) return;

    setAllEvents((prev) => {
      // Filtra apenas eventos que ainda não existem no estado atual
      const hasNewEvents = events.some(
        (newEvent) => !prev.some((existing) => existing.id === newEvent.id)
      );

      // SE NÃO HÁ NOVIDADE, retorna a mesma referência de estado (Bate o loop)
      if (!hasNewEvents) return prev;

      const combined = deduplicateEvents([...prev, ...events]);
      return combined.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
    });

    setIsFetching(false);
  }, [events]); // 'events' vem do useSubscribe

  const fetchNextPage = useCallback(() => {
    if (allEvents.length === 0 || isFetching) return;
    const lastTimestamp = allEvents[allEvents.length - 1].created_at;
    if (lastTimestamp) {
      setIsFetching(true);
      setUntil(lastTimestamp - 1);
    }
  }, [allEvents.length, isFetching]); // Use .length para estabilizar a dependência

  return {
    events: allEvents,
    isLoading: allEvents.length === 0 && isFetching,
    isFetchingNextPage: isFetching,
    fetchNextPage
  };
}