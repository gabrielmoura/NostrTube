import NDK, { type NDKEvent, type NDKFilter, NDKKind } from '@nostr-dev-kit/ndk'
import { nip19 } from 'nostr-tools'
import { ALL_VIDEO_EVENT_KINDS, NORMAL_VIDEO_EVENT_KINDS } from '@/features/video/services/video-kinds'
import { resolveVideoRouteParam } from '@/features/video/services/video-route-resolution.service'
import { extractSingleEventId, type NexusFetchOptions, type NexusOperationType, ndkNexusBridge } from '@/lib/nexus-p2p'

type FetchMode = 'cache-first' | 'parallel'

interface QueryOptions {
  mode?: FetchMode
  relayUrls?: string[]
  closeOnEose?: boolean
  groupable?: boolean
  operation?: NexusOperationType
  policy?: NexusFetchOptions['policy']
  p2pWindowMs?: number
}

function normalizeRelayUrls(relayUrls?: string[] | string | null): string[] | undefined {
  const values = Array.isArray(relayUrls)
    ? relayUrls
    : typeof relayUrls === 'string'
      ? relayUrls.split(',').map((relay) => relay.trim())
      : []
  if (!values.length) return undefined
  const normalized = Array.from(new Set(values.filter(Boolean)))
  return normalized.length > 0 ? normalized : undefined
}

export async function fetchEventCached(
  ndk: NDK,
  filters: NDKFilter | NDKFilter[],
  options: QueryOptions = {},
): Promise<NDKEvent | null> {
  return ndkNexusBridge.fetchEvent(
    ndk,
    filters,
    {
      mode: options.mode,
      closeOnEose: options.closeOnEose,
      groupable: options.groupable,
      relayUrls: normalizeRelayUrls(options.relayUrls),
    },
    {
      operation: options.operation,
      policy: options.policy,
      p2pWindowMs: options.p2pWindowMs,
    },
  )
}

export async function fetchEventsCached(
  ndk: NDK,
  filters: NDKFilter | NDKFilter[],
  options: QueryOptions = {},
): Promise<Set<NDKEvent>> {
  return ndkNexusBridge.fetchEvents(
    ndk,
    filters,
    {
      mode: options.mode,
      closeOnEose: options.closeOnEose,
      groupable: options.groupable,
      relayUrls: normalizeRelayUrls(options.relayUrls),
    },
    {
      operation: options.operation,
      policy: options.policy,
      p2pWindowMs: options.p2pWindowMs,
    },
  )
}

export function getSearchRelayUrls(): string[] | undefined {
  return normalizeRelayUrls(import.meta.env.VITE_NOSTR_SEARCH_RELAYS)
}

/**
 * Returns the relay pool used when resolving videos by addressable `d` tag.
 *
 * Address-only URLs such as `/v/my-d-tag` do not carry relay hints or author
 * information, so the lookup must use both search relays and the app's default
 * relay set.
 */
export function getDefaultVideoLookupRelayUrls(): string[] | undefined {
  const relays = [
    ...(normalizeRelayUrls(import.meta.env.VITE_NOSTR_SEARCH_RELAYS) ?? []),
    ...(normalizeRelayUrls(
      import.meta.env.PROD ? import.meta.env.VITE_NOSTR_RELAYS : import.meta.env.VITE_NOSTR_DEV_RELAYS,
    ) ?? []),
    ...(normalizeRelayUrls(import.meta.env.VITE_NOSTR_RELAYS) ?? []),
  ]
  return normalizeRelayUrls(relays)
}

function newestEvent(events: Iterable<NDKEvent>) {
  let newest: NDKEvent | null = null
  for (const event of events) {
    if (!newest || (event.created_at || 0) > (newest.created_at || 0)) {
      newest = event
    }
  }
  return newest
}

function isAddressableVideoReference(reference: string) {
  const resolution = resolveVideoRouteParam(reference)
  return resolution.type === 'd-tag' || resolution.type === 'naddr'
}

/**
 * Builds NDK filters for supported video route references.
 *
 * Supports `note`, `nevent`, `naddr`, raw event ids, and plain addressable
 * `d` tags. Plain `d` tags are intentionally broad and are resolved later by
 * selecting the newest matching event.
 */
export function buildVideoLookupFilters(reference: string): NDKFilter[] {
  const resolution = resolveVideoRouteParam(reference)

  switch (resolution.type) {
    case 'event-id':
    case 'nevent':
    case 'note':
      return [{ ids: [resolution.id], limit: 1 }]
    case 'naddr':
      return [
        {
          authors: [resolution.pubkey],
          kinds: [resolution.kind],
          '#d': [resolution.identifier],
          limit: 1,
        },
        {
          kinds: [resolution.kind],
          '#d': [resolution.identifier],
          limit: 1,
        },
      ]
    case 'd-tag':
      return [
        {
          '#d': [resolution.dTag],
          kinds: ALL_VIDEO_EVENT_KINDS,
          limit: 1,
        },
      ]
    case 'invalid':
      throw new Error(resolution.reason)
  }
}

/**
 * Resolves a video event from a route reference.
 *
 * For plain `d` tags, this fetches all matching addressable video events and
 * returns the newest published version. For id-based references it keeps the
 * faster single-event lookup path.
 */
export async function fetchVideoEventByReference(ndk: NDK, reference: string, options: QueryOptions = {}) {
  const resolution = resolveVideoRouteParam(reference)
  const filters = buildVideoLookupFilters(reference)
  let relayHints: string[] = []

  if (reference.startsWith('n')) {
    try {
      const { type, data } = nip19.decode(reference)
      if (type === 'nevent') {
        const eventData = data as nip19.EventPointer
        if (eventData.relays?.length) relayHints = eventData.relays
      } else if (type === 'naddr') {
        const addr = data as nip19.AddressPointer
        if (addr.relays?.length) relayHints = addr.relays
      }
    } catch {
      /* ignore decode errors */
    }
  }

  const searchRelays = options.relayUrls ?? getDefaultVideoLookupRelayUrls()
  const allRelays = [...(searchRelays ?? []), ...relayHints]
  const dedupedRelays =
    allRelays.length > 0 ? Array.from(new Set(allRelays.map((r) => r.replace(/\/$/, '')))) : undefined

  if (isAddressableVideoReference(reference)) {
    const events = await fetchEventsCached(
      ndk,
      filters.map((filter) => ({ ...filter, limit: 100 })),
      {
        ...options,
        mode: options.mode ?? 'parallel',
        relayUrls: dedupedRelays,
      },
    )
    const newest = newestEvent(events)
    if (newest) return newest
  }

  const directEvent = await fetchEventCached(ndk, filters, {
    ...options,
    operation: extractSingleEventId(filters) ? 'event-by-id' : options.operation,
    mode: options.mode ?? 'parallel',
    relayUrls: dedupedRelays,
  })

  if (directEvent || resolution.type !== 'event-id') return directEvent

  const events = await fetchEventsCached(ndk, [{ '#d': [resolution.id], kinds: ALL_VIDEO_EVENT_KINDS, limit: 100 }], {
    ...options,
    mode: options.mode ?? 'parallel',
    relayUrls: dedupedRelays,
  })

  return newestEvent(events)
}

export async function fetchUserContentBundle(ndk: NDK, pubkey: string) {
  return fetchEventsCached(
    ndk,
    [
      {
        authors: [pubkey],
        kinds: NORMAL_VIDEO_EVENT_KINDS,
        limit: 100,
      },
      {
        authors: [pubkey],
        kinds: [NDKKind.Metadata],
        limit: 1,
      },
      {
        authors: [pubkey],
        kinds: [NDKKind.VideoCurationSet, NDKKind.EventDeletion],
      },
    ],
    {
      mode: 'parallel',
    },
  )
}
