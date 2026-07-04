import { type NDKEvent, NDKKind, type NDKUserProfile } from '@nostr-dev-kit/ndk'
import { useNDK } from '@nostr-dev-kit/ndk-hooks'
import { useAsyncBatcher } from '@tanstack/react-pacer'
import { useEffect, useMemo, useState } from 'react'
import { fetchEventsCached } from '../services/ndk-query.service'

export function useBatchProfiles(events: NDKEvent[]): Record<string, NDKUserProfile | undefined> {
  const { ndk } = useNDK()
  const [profiles, setProfiles] = useState<Record<string, NDKUserProfile | undefined>>({})
  const profileBatcher = useAsyncBatcher<string>(
    async (pubkeys) => {
      if (!ndk || pubkeys.length === 0) {
        return {}
      }

      const loaded: Record<string, NDKUserProfile | undefined> = {}
      try {
        const metadataEvents = await fetchEventsCached(
          ndk,
          {
            authors: pubkeys,
            kinds: [NDKKind.Metadata],
          },
          { mode: 'cache-first' },
        )

        const newestMetadataByPubkey = new Map<string, NDKEvent>()
        for (const event of metadataEvents) {
          const pubkey = event.pubkey ?? event.author?.pubkey
          if (!pubkey) continue
          const current = newestMetadataByPubkey.get(pubkey)
          if (!current || (event.created_at ?? 0) >= (current.created_at ?? 0)) {
            newestMetadataByPubkey.set(pubkey, event)
          }
        }

        for (const [pubkey, event] of newestMetadataByPubkey) {
          try {
            const profile = JSON.parse(event.content) as NDKUserProfile
            if (profile) {
              loaded[pubkey] = profile
            }
          } catch {
            // skip malformed metadata payloads
          }
        }
      } catch {
        // skip failed profile batch fetches
      }

      return loaded
    },
    { key: 'batch-profiles', started: false, wait: Infinity, maxSize: Infinity },
  )

  const pubkeys = useMemo(() => {
    const keys = new Set<string>()
    for (const e of events) {
      if (e.author?.pubkey) keys.add(e.author.pubkey)
    }
    return Array.from(keys)
  }, [events])

  useEffect(() => {
    if (pubkeys.length === 0 || !ndk) {
      setProfiles({})
      return
    }

    let cancelled = false

    const fetchBatch = async () => {
      profileBatcher.clear()
      for (const pubkey of pubkeys) {
        profileBatcher.addItem(pubkey)
      }

      const loaded = await profileBatcher.flush()
      if (!cancelled) {
        setProfiles((loaded as Record<string, NDKUserProfile | undefined>) ?? {})
      }
    }

    fetchBatch()
    return () => {
      cancelled = true
    }
  }, [profileBatcher, pubkeys, ndk])

  return profiles
}
