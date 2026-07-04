import type { NDKEvent } from '@nostr-dev-kit/ndk'
import { useProfileValue } from '@nostr-dev-kit/ndk-hooks'
import { Avatar } from '@radix-ui/themes'
import { Link } from '@tanstack/react-router'
import { t } from 'i18next'
import { ChevronDown, ChevronUp, CornerDownRight, MessageSquareReply } from 'lucide-react'
import { lazy, useMemo, useState } from 'react'
import { HiCheckBadge } from 'react-icons/hi2'
import { RenderText } from '@/components/RenderText.tsx'
import { relativeTime } from '@/helper/date.ts'
import { getNameToShow, getTwoLetters } from '@/helper/format.ts'
import CommentInput from './CommentInput'

const ReactionButtons = lazy(() => import('@/routes/v/@components/Comments/ReactionButtons.tsx'))

interface CommentTreeNode {
  comment: NDKEvent
  replies: CommentTreeNode[]
}

type CommentFeedProps = {
  comments: NDKEvent[]
  rootEventId: string
  rootEventReference: string
  rootPubkey?: string
  onReplySubmitted: (event: NDKEvent) => void
}

type CommentItemProps = {
  event: NDKEvent
  replies: CommentTreeNode[]
  depth: number
  rootEventId: string
  rootEventReference: string
  rootPubkey?: string
  onReplySubmitted: (event: NDKEvent) => void
}

function buildCommentTree(allComments: NDKEvent[], parentEventId: string | null = null): CommentTreeNode[] {
  const directComments: NDKEvent[] = []
  const eventIds = new Set(allComments.map((event) => event.id))

  for (const comment of allComments) {
    const replyToTag = comment.tags.find((tag) => tag[0] === 'e' && tag[3] === 'reply')

    if (parentEventId === null) {
      const isReplyToExistingComment = replyToTag && eventIds.has(replyToTag[1])

      if (!isReplyToExistingComment) {
        directComments.push(comment)
      }
      continue
    }

    if (replyToTag && replyToTag[1] === parentEventId) {
      directComments.push(comment)
    }
  }

  directComments.sort((a, b) => (a.created_at ?? 0) - (b.created_at ?? 0))

  return directComments.map((comment) => ({
    comment,
    replies: buildCommentTree(allComments, comment.id),
  }))
}

export default function CommentFeed({
  comments,
  rootEventId,
  rootEventReference,
  rootPubkey,
  onReplySubmitted,
}: CommentFeedProps) {
  const commentTree = useMemo(() => buildCommentTree(comments), [comments])

  if (comments.length === 0) {
    return (
      <div className="center py-2 text-sm text-muted-foreground">
        <p>{t('no_comments_yet')}</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <ul className="space-y-4">
        {commentTree.map(({ comment, replies }) => (
          <li key={comment.id}>
            <CommentItem
              event={comment}
              replies={replies}
              depth={0}
              rootEventId={rootEventId}
              rootEventReference={rootEventReference}
              rootPubkey={rootPubkey}
              onReplySubmitted={onReplySubmitted}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

export function CommentItem({
  event,
  replies,
  depth,
  rootEventId,
  rootEventReference,
  rootPubkey,
  onReplySubmitted,
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [showReplies, setShowReplies] = useState(true)
  const npub = event.author.npub
  const profile = useProfileValue(event.author.pubkey)
  const indentationClass = depth > 0 ? 'ml-2 border-l-2 border-border/60 pl-4 py-2 md:ml-4 lg:ml-6' : ''

  const replyTags = [
    ['a', rootEventReference],
    ['e', rootEventId],
    ['e', event.id, '', 'reply'],
    ['p', event.pubkey],
    ...(rootPubkey && rootPubkey !== event.pubkey ? [['p', rootPubkey]] : []),
  ]

  return (
    <div className={`flex flex-col ${indentationClass}`}>
      <div className="flex w-full items-start gap-x-3 overflow-hidden sm:gap-x-4">
        <Link to={`/u/$userId`} params={{ userId: npub }}>
          <Avatar
            className="h-9 w-9 flex-shrink-0 rounded-full bg-gray-200 object-cover sm:h-10 sm:w-10"
            src={profile?.image}
            alt={profile?.displayName}
            fallback={getTwoLetters({ npub, profile })}
          />
        </Link>

        <div className="flex-1 space-y-2 overflow-hidden">
          <div className="flex flex-wrap items-center gap-x-2 text-sm">
            <span className="break-words font-semibold text-foreground">{getNameToShow({ npub, profile })}</span>
            {!!profile?.nip05 && <HiCheckBadge className="h-3.5 w-3.5 shrink-0 text-blue-500" />}
            <p className="text-xs text-muted-foreground">{relativeTime(new Date((event.created_at ?? 0) * 1000))}</p>
          </div>

          <div className="break-words text-foreground/90">
            <RenderText text={event.content} />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <ReactionButtons event={event} />
            <button
              type="button"
              onClick={() => setShowReplyForm((current) => !current)}
              className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <MessageSquareReply className="h-3.5 w-3.5" />
              {showReplyForm ? t('cancel', 'Cancel') : t('reply', 'Reply')}
            </button>
            {replies.length > 0 ? (
              <button
                type="button"
                onClick={() => setShowReplies((current) => !current)}
                className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {showReplies ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {showReplies
                  ? t('hide_replies', { defaultValue: 'Hide replies' })
                  : t('show_replies', {
                      count: replies.length,
                      defaultValue: replies.length === 1 ? 'Show 1 reply' : `Show ${replies.length} replies`,
                    })}
              </button>
            ) : null}
          </div>

          {showReplyForm ? (
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
              <div className="mb-3 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <CornerDownRight className="h-3.5 w-3.5" />
                {t('replying_to', { defaultValue: 'Replying to {{name}}', name: getNameToShow({ npub, profile }) })}
              </div>
              <CommentInput
                autoFocus
                initialTags={replyTags}
                onSubmitted={(submittedEvent) => {
                  onReplySubmitted(submittedEvent)
                  setShowReplyForm(false)
                  setShowReplies(true)
                }}
              />
            </div>
          ) : null}
        </div>
      </div>

      {replies.length > 0 && showReplies ? (
        <ul className="mt-2 space-y-2">
          {replies.map(({ comment, replies: subReplies }) => (
            <li key={comment.id}>
              <CommentItem
                event={comment}
                replies={subReplies}
                depth={depth + 1}
                rootEventId={rootEventId}
                rootEventReference={rootEventReference}
                rootPubkey={rootPubkey}
                onReplySubmitted={onReplySubmitted}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
