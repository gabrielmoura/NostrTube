import NDK, { type NDKEvent, type NDKFilter, NDKKind, NDKSubscriptionCacheUsage } from "@nostr-dev-kit/ndk";
import { nip19 } from "nostr-tools";
import { VIDEO_EVENT_KINDS } from "@/features/video/services/video-kinds";

type FetchMode = "cache-first" | "parallel";

interface QueryOptions {
  mode?: FetchMode;
  relayUrls?: string[];
  closeOnEose?: boolean;
  groupable?: boolean;
}

function toCacheUsage(mode: FetchMode = "cache-first") {
  return mode === "parallel" ? NDKSubscriptionCacheUsage.PARALLEL : NDKSubscriptionCacheUsage.CACHE_FIRST;
}

function normalizeRelayUrls(relayUrls?: string[] | null): string[] | undefined {
  if (!relayUrls?.length) return undefined;
  const normalized = Array.from(new Set(relayUrls.filter(Boolean)));
  return normalized.length > 0 ? normalized : undefined;
}

export async function fetchEventCached(ndk: NDK, filters: NDKFilter | NDKFilter[], options: QueryOptions = {}): Promise<NDKEvent | null> {
  return ndk.fetchEvent(filters, {
    cacheUsage: toCacheUsage(options.mode),
    closeOnEose: options.closeOnEose ?? true,
    groupable: options.groupable ?? true,
    relayUrls: normalizeRelayUrls(options.relayUrls)
  });
}

export async function fetchEventsCached(ndk: NDK, filters: NDKFilter | NDKFilter[], options: QueryOptions = {}): Promise<Set<NDKEvent>> {
  return ndk.fetchEvents(filters, {
    cacheUsage: toCacheUsage(options.mode),
    closeOnEose: options.closeOnEose ?? true,
    groupable: options.groupable ?? true,
    relayUrls: normalizeRelayUrls(options.relayUrls)
  });
}

export function getSearchRelayUrls(): string[] | undefined {
  return normalizeRelayUrls(import.meta.env.VITE_NOSTR_SEARCH_RELAYS);
}

export function buildVideoLookupFilters(reference: string): NDKFilter[] {
  if (!reference || reference.length <= 5) {
    throw new Error("Invalid event reference");
  }

  if (reference.startsWith("n")) {
    const { type, data } = nip19.decode(reference);

    switch (type) {
      case "note":
        return [{ ids: [data], limit: 1 }];
      case "nevent": {
        const eventData = data as nip19.EventPointer;
        return [{ ids: [eventData.id], limit: 1 }];
      }
      case "naddr": {
        const addr = data as nip19.AddressPointer;
        return [
          {
            authors: [addr.pubkey],
            kinds: [addr.kind],
            "#d": [addr.identifier],
            limit: 1
          },
          {
            kinds: [addr.kind],
            "#d": [addr.identifier],
            limit: 1
          }
        ];
      }
      default:
        throw new Error(`Unsupported nostr reference: ${type}`);
    }
  }

  if (reference.length === 64) {
    return [{ ids: [reference], limit: 1 }];
  }

  return [{
    "#d": [reference],
    kinds: [NDKKind.Video, NDKKind.HorizontalVideo, 34235, 34236],
    limit: 1
  }];
}

export async function fetchVideoEventByReference(ndk: NDK, reference: string, options: QueryOptions = {}) {
  let relayHints: string[] = [];

  if (reference.startsWith("n")) {
    try {
      const { type, data } = nip19.decode(reference);
      if (type === "nevent") {
        const eventData = data as nip19.EventPointer;
        if (eventData.relays?.length) relayHints = eventData.relays;
      } else if (type === "naddr") {
        const addr = data as nip19.AddressPointer;
        if (addr.relays?.length) relayHints = addr.relays;
      }
    } catch { /* ignore decode errors */ }
  }

  const searchRelays = options.relayUrls ?? getSearchRelayUrls();
  const allRelays = [...(searchRelays ?? []), ...relayHints];
  const dedupedRelays = allRelays.length > 0
    ? Array.from(new Set(allRelays.map(r => r.replace(/\/$/, ""))))
    : undefined;

  return fetchEventCached(ndk, buildVideoLookupFilters(reference), {
    ...options,
    mode: options.mode ?? "parallel",
    relayUrls: dedupedRelays
  });
}

export async function fetchUserContentBundle(ndk: NDK, pubkey: string) {
  return fetchEventsCached(ndk, [
    {
      authors: [pubkey],
      kinds: VIDEO_EVENT_KINDS,
      limit: 100
    },
    {
      authors: [pubkey],
      kinds: [NDKKind.Metadata],
      limit: 1
    },
    {
      authors: [pubkey],
      kinds: [NDKKind.VideoCurationSet, NDKKind.EventDeletion]
    }
  ], {
    mode: "parallel"
  });
}
