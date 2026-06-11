import type { NDKFilter } from '@nostr-dev-kit/ndk'

export interface NostrEventLike {
  id: string
  pubkey: string
  created_at: number
  kind: number
  tags: string[][]
  content: string
  sig: string
}

export type NexusFetchPolicy = 'relay-first' | 'cache-first-race' | 'p2p-first' | 'p2p-only'

export type NexusOperationType =
  | 'initial-feed'
  | 'live-timeline'
  | 'event-by-id'
  | 'thread'
  | 'search'
  | 'trending'
  | 'media'
  | 'data-saver'
  | 'offline'

export interface NexusPolicyMap {
  [key: string]: NexusFetchPolicy
}

export interface NexusFetchOptions {
  operation?: NexusOperationType
  policy?: NexusFetchPolicy
  p2pWindowMs?: number
}

export interface NexusQueryContext extends NexusFetchOptions {
  filters: NDKFilter | NDKFilter[]
}

export interface NexusSidecarOptions {
  relayUrl: string
  enabled: boolean
  storageKey: string
  dbName: string
  cacheTtlMs: number
  heartbeatMs: number
  statsMs: number
  offerBatchDebounceMs: number
  maxPeers: number
  p2pRequestTimeoutMs: number
  reconnectDelayMs: number
}

export interface NexusEventRequestOptions {
  timeoutMs?: number
}

export interface NexusEventSummary {
  id: string
  pubkey: string
  kind: number
  created_at: number
}

export interface NexusDebugSnapshot {
  enabled: boolean
  configuredEnabled: boolean
  relayUrl: string
  storageBackend: string
  unifiedWithNdkCache: boolean
  started: boolean
  signalingOpen: boolean
  peerCount: number
  pendingRequestCount: number
  queuedAnnouncementCount: number
  cacheStats: {
    served: number
    received: number
    cached: number
  }
}
