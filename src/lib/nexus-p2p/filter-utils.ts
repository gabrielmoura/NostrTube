import type { NDKFilter } from '@nostr-dev-kit/ndk'

export function toFilters(filters: NDKFilter | NDKFilter[]): NDKFilter[] {
  return Array.isArray(filters) ? filters : [filters]
}

export function extractSingleEventId(filters: NDKFilter | NDKFilter[]): string | null {
  const ids = extractCandidateEventIds(filters)
  return ids.length === 1 ? ids[0] : null
}

export function extractCandidateEventIds(filters: NDKFilter | NDKFilter[]): string[] {
  const candidates = new Set<string>()

  for (const filter of toFilters(filters)) {
    for (const eventId of filter.ids ?? []) {
      if (eventId) candidates.add(eventId)
    }

    for (const eventId of filter['#e'] ?? []) {
      if (eventId) candidates.add(eventId)
    }
  }

  return [...candidates]
}

export function isExactIdLookup(filters: NDKFilter | NDKFilter[]): boolean {
  const normalized = toFilters(filters)
  return (
    normalized.length > 0 &&
    normalized.every((filter) => {
      const keys = Object.keys(filter).filter((key) => filter[key as keyof NDKFilter] !== undefined)
      return keys.every((key) => key === 'ids' || key === 'limit') && (filter.ids?.length ?? 0) > 0
    })
  )
}
