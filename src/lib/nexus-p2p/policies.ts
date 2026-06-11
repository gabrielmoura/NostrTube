import type { NDKFilter } from '@nostr-dev-kit/ndk'
import type { NexusFetchPolicy, NexusOperationType, NexusPolicyMap } from '@/lib/nexus-p2p/types'

export const DEFAULT_NEXUS_POLICIES: Record<NexusOperationType, NexusFetchPolicy> = {
  'initial-feed': 'relay-first',
  'live-timeline': 'relay-first',
  'event-by-id': 'cache-first-race',
  thread: 'cache-first-race',
  search: 'relay-first',
  trending: 'relay-first',
  media: 'p2p-first',
  'data-saver': 'p2p-first',
  offline: 'p2p-only',
}

export function resolveNexusOperation(
  filters: NDKFilter | NDKFilter[],
  explicit?: NexusOperationType,
): NexusOperationType {
  if (explicit) return explicit

  const normalized = Array.isArray(filters) ? filters : [filters]
  if (normalized.some((filter) => filter['#e']?.length)) return 'thread'
  if (normalized.some((filter) => filter.ids?.length === 1)) return 'event-by-id'
  return 'search'
}

export function resolveNexusPolicy(
  operation: NexusOperationType,
  explicit?: NexusFetchPolicy,
  overrides: Partial<NexusPolicyMap> = {},
): NexusFetchPolicy {
  return explicit ?? overrides[operation] ?? DEFAULT_NEXUS_POLICIES[operation]
}
