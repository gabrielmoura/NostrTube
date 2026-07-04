import type { NDKEvent } from '@nostr-dev-kit/ndk-hooks'
import { useFollows, useProfileValue } from '@nostr-dev-kit/ndk-hooks'
import { VideoActionsView } from '@/features/video/components/VideoActionsView'
import { getVideoDetails } from '@/helper/format'

interface VideoActionsContainerProps {
  event: NDKEvent
}

export function VideoActionsContainer({ event }: VideoActionsContainerProps) {
  const profile = useProfileValue(event.author.pubkey)
  const follows = useFollows()
  const { summary, title } = getVideoDetails(event)

  return (
    <VideoActionsView
      event={event}
      profile={profile}
      summary={Array.isArray(summary) ? summary.join(' ') : summary}
      title={Array.isArray(title) ? (title[0] ?? 'Untitled') : title}
      followerCount={follows.size}
    />
  )
}
