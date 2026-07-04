import type { NDKEvent } from '@nostr-dev-kit/ndk-hooks'
import { t } from 'i18next'
import { useMemo, useState } from 'react'
import Spinner from '@/components/Spinner'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatCount } from '@/helper/format'
import CommentFeed from '@/routes/v/@components/Comments/CommentFeed'
import CommentInput from '@/routes/v/@components/Comments/CommentInput'
import { ErrorBoundaryVideo } from '@/routes/v/@components/error'

interface VideoCommentsViewProps {
  comments: NDKEvent[]
  eose: boolean
  eventReference: string
  eventId: string
  pubkey?: string
}

export function VideoCommentsView({ comments, eose, eventReference, eventId, pubkey }: VideoCommentsViewProps) {
  const [optimisticComments, setOptimisticComments] = useState<NDKEvent[]>([])

  const mergedComments = useMemo(() => {
    const merged = new Map<string, NDKEvent>()

    for (const comment of [...comments, ...optimisticComments]) {
      merged.set(comment.id, comment)
    }

    return Array.from(merged.values()).sort((a, b) => (a.created_at ?? 0) - (b.created_at ?? 0))
  }, [comments, optimisticComments])

  const handleCommentSubmitted = (event: NDKEvent) => {
    setOptimisticComments((current) =>
      current.some((comment) => comment.id === event.id) ? current : [...current, event],
    )
  }

  if (!eose) {
    return <Spinner />
  }

  return (
    <ScrollArea className="space-y-2.5 py-2">
      <div>
        <div className="flex items-center">
          <h2 className="text-base font-semibold text-foreground">
            {mergedComments.length === 1 ? '1 Comment' : `${formatCount(mergedComments.length || 0)} ${t('comments')}`}
          </h2>
        </div>
      </div>
      <ErrorBoundaryVideo>
        <CommentInput
          initialTags={[
            ['a', eventReference],
            ['e', eventId, '', 'reply'],
            ['p', pubkey || ''],
          ]}
          onSubmitted={handleCommentSubmitted}
        />
      </ErrorBoundaryVideo>
      <ErrorBoundaryVideo>
        <CommentFeed
          comments={mergedComments}
          rootEventId={eventId}
          rootEventReference={eventReference}
          rootPubkey={pubkey}
          onReplySubmitted={handleCommentSubmitted}
        />
      </ErrorBoundaryVideo>
    </ScrollArea>
  )
}
