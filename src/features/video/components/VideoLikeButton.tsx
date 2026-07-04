import type { NDKEvent } from '@nostr-dev-kit/ndk-hooks'
import LikeToggleButton from '@/components/LikeToggleButton'
import Spinner from '@/components/Spinner'
import { useVideoLikeController } from '@/features/video/hooks/use-video-like-controller'

export function VideoLikeButton({ contentEvent }: { contentEvent: NDKEvent }) {
  const controller = useVideoLikeController(contentEvent)

  if (!controller.eose) {
    return <Spinner />
  }

  return (
    <LikeToggleButton
      active={controller.activeReaction}
      likeCount={controller.upVotes}
      unLikeCount={controller.downVotes}
      onClick={controller.toggleLike}
    />
  )
}
