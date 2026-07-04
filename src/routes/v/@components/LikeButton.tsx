import type { NDKEvent } from '@nostr-dev-kit/ndk-hooks'
import { VideoLikeButton } from '@/features/video/components/VideoLikeButton'

type LikeButtonProps = {
  contentEvent: NDKEvent
}
export default function LikeButton({ contentEvent }: LikeButtonProps) {
  return <VideoLikeButton contentEvent={contentEvent} />
}
