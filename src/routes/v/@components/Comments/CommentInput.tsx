import type { NDKEvent } from '@nostr-dev-kit/ndk-hooks'
import { VideoCommentInput } from '@/features/video/components/VideoCommentInput'

export default function CommentInput({
  autoFocus,
  initialTags,
  onSubmitted,
}: {
  autoFocus?: boolean
  initialTags?: string[][]
  onSubmitted?: (event: NDKEvent) => void
}) {
  return <VideoCommentInput autoFocus={autoFocus} initialTags={initialTags} onSubmitted={onSubmitted} />
}
