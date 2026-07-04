import type { NDKKind } from '@nostr-dev-kit/ndk'
import { NDKSubscriptionCacheUsage, useSubscribe } from '@nostr-dev-kit/ndk-hooks'
import { Spinner } from '@radix-ui/themes'
import { useMemo } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/videoPlayer/components/Tooltip.tsx'
import { summarizeViewEvents } from '@/features/video/services/video-engagement.service'
import { relativeTime } from '@/helper/date.ts'
import { formatNumber, getVideoDetails } from '@/helper/format.ts'
import { NostrKind } from '@/helper/type.ts'

export default function VideoMeta({ event }: { event: Parameters<typeof getVideoDetails>[0] }) {
  const { publishedAt } = getVideoDetails(event)
  const eventIdentifier = event.dTag
  const filters = eventIdentifier
    ? [
        {
          kinds: [NostrKind.VideoViewer as unknown as NDKKind],
          '#a': [eventIdentifier],
        },
      ]
    : false

  const { events, eose } = useSubscribe(
    filters,
    {
      closeOnEose: false,
      cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
    },
    [eventIdentifier],
  )

  const count = useMemo(() => summarizeViewEvents(Array.from(events)).totalViews, [events])

  return (
    <div className="flex items-center gap-x-1.5 text-[13px] font-semibold text-foreground">
      <Tooltip>
        <TooltipContent>Está é apenas uma estimativa, não é um dado confiável</TooltipContent>
        <TooltipTrigger>
          <p>{eose ? `${formatNumber(count)} views` : <Spinner />}</p>
        </TooltipTrigger>
      </Tooltip>
      {!!publishedAt && (
        <>
          <span>•</span>
          <p>{relativeTime(new Date(publishedAt * 1000))}</p>
        </>
      )}
    </div>
  )
}
