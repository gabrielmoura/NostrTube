import type { NDKEvent, NDKUserProfile } from '@nostr-dev-kit/ndk-hooks'
import { NDKSubscriptionCacheUsage, useNDK } from '@nostr-dev-kit/ndk-hooks'
import { useEffect, useMemo, useState } from 'react'

export function useBatchProfiles(events: NDKEvent[]): Record<string, NDKUserProfile | undefined> {
  const { ndk } = useNDK()
  const [profiles, setProfiles] = useState<Record<string, NDKUserProfile | undefined>>({})

  const pubkeys = useMemo(() => {
    const keys = new Set<string>()
    for (const e of events) {
      if (e.author?.pubkey) keys.add(e.author.pubkey)
    }
    return Array.from(keys)
  }, [events])

  useEffect(() => {
    if (pubkeys.length === 0 || !ndk) return
    let cancelled = false

    const fetchBatch = async () => {
      const loaded: Record<string, NDKUserProfile | undefined> = {}
      for (const pubkey of pubkeys) {
        try {
          const user = ndk.getUser({ pubkey })
          const profile = await user.fetchProfile({ cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST }, true)
          if (profile) loaded[pubkey] = profile
        } catch {
          // skip failed profile fetches
        }
      }
      if (!cancelled) setProfiles(loaded)
    }

    fetchBatch()
    return () => {
      cancelled = true
    }
  }, [pubkeys, ndk])

  return profiles
}
