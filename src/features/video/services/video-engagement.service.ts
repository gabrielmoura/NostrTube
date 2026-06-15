import type { NDKEvent } from '@nostr-dev-kit/ndk'
import type { likeOptions } from '@/components/LikeToggleButton'
import { getTagValue } from '@/helper/nostrTags'

function keepLatestEventByAuthor(events: NDKEvent[]) {
  const byAuthor = new Map<string, NDKEvent>()

  for (const event of events) {
    const previous = byAuthor.get(event.pubkey)
    if (!previous) {
      byAuthor.set(event.pubkey, event)
      continue
    }

    const previousCreatedAt = previous.created_at ?? 0
    const currentCreatedAt = event.created_at ?? 0

    if (currentCreatedAt > previousCreatedAt || (currentCreatedAt === previousCreatedAt && event.id > previous.id)) {
      byAuthor.set(event.pubkey, event)
    }
  }

  return byAuthor
}

export function summarizeReactionEvents(events: NDKEvent[], currentPubkey?: string | null) {
  const latestByAuthor = keepLatestEventByAuthor(events)

  let upVotes = 0
  let downVotes = 0
  let activeReaction: likeOptions | undefined

  for (const [pubkey, event] of latestByAuthor) {
    if (event.content === '+') upVotes += 1
    if (event.content === '-') downVotes += 1

    if (currentPubkey && pubkey === currentPubkey && (event.content === '+' || event.content === '-')) {
      activeReaction = event.content
    }
  }

  return {
    upVotes,
    downVotes,
    activeReaction,
  }
}

export function summarizeViewEvents(events: NDKEvent[]) {
  const latestByAuthor = keepLatestEventByAuthor(events)

  const totalViews = Array.from(latestByAuthor.values()).reduce((accumulator, event) => {
    const rawValue = getTagValue('viewed', event.tags)
    const parsedValue = rawValue ? Number.parseInt(rawValue, 10) : 0
    return accumulator + (Number.isNaN(parsedValue) ? 0 : parsedValue)
  }, 0)

  return {
    events: Array.from(latestByAuthor.values()),
    totalViews,
  }
}
