import type { NDKEvent } from '@nostr-dev-kit/ndk'
import { NDKSubscriptionCacheUsage, useNDKCurrentPubkey, useSubscribe } from '@nostr-dev-kit/ndk-hooks'
import { useMemo } from 'react'
import { MUTE_LIST_KIND, type ParsedMuteList, parseMuteListTags } from '@/features/nostr/services/mute-list.service'

const EMPTY_MUTE_LIST: ParsedMuteList = {
  pubkeys: new Set<string>(),
  events: new Set<string>(),
  hashtags: new Set<string>(),
  words: [],
}

function selectNewestMuteList(events: NDKEvent[]) {
  return events
    .filter((event) => event.kind === MUTE_LIST_KIND)
    .sort((left, right) => (right.created_at ?? 0) - (left.created_at ?? 0))[0]
}

export function useMuteList() {
  const currentPubkey = useNDKCurrentPubkey()
  const filters = useMemo(
    () =>
      currentPubkey
        ? [
            {
              kinds: [MUTE_LIST_KIND],
              authors: [currentPubkey],
              limit: 1,
            },
          ]
        : false,
    [currentPubkey],
  )
  const { events } = useSubscribe(
    filters,
    {
      closeOnEose: true,
      cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
    },
    [currentPubkey],
  )

  return useMemo(() => {
    if (!currentPubkey) return EMPTY_MUTE_LIST
    const muteList = selectNewestMuteList(events)
    return muteList ? parseMuteListTags(muteList.tags) : EMPTY_MUTE_LIST
  }, [currentPubkey, events])
}
