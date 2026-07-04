import { NDKKind, NDKSubscriptionCacheUsage, useSubscribe } from '@nostr-dev-kit/ndk-hooks'
import { VideoCommentsView } from '@/features/video/components/VideoCommentsView'

interface VideoCommentsContainerProps {
  eventReference: string
  eventId: string
  pubkey?: string
}

export function VideoCommentsContainer({ eventReference, eventId, pubkey }: VideoCommentsContainerProps) {
  const { events, eose } = useSubscribe(
    [
      {
        kinds: [NDKKind.Text],
        '#e': [eventId],
      },
    ],
    {
      closeOnEose: false,
      cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
    },
    [eventId, eventReference],
  )

  return (
    <VideoCommentsView
      comments={events}
      eose={eose}
      eventReference={eventReference}
      eventId={eventId}
      pubkey={pubkey}
    />
  )
}
