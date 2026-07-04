import type { NDKEvent } from '@nostr-dev-kit/ndk'
import { useNavigate } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import VideoCard, { VideoCardLoading } from '@/components/cards/videoCard'
import { getVideoRouteReference } from '@/features/video/services/video-reference.service'
import { cn } from '@/helper/format.ts'

type VideosGridProps = {
  events: NDKEvent[]
  title?: string
  action?: ReactNode
  className?: string
  isLoading?: boolean
  empty?: () => ReactNode
}

export function VideosGrid({ events, title, action, className, isLoading, empty: Empty }: VideosGridProps) {
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className={cn('w-full', className)}>
        {title && (
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{title}</h2>
            {action}
          </div>
        )}
        <div className="md-feed-cols relative mx-auto gap-4 py-3">
          <VideoCardLoading />
          <VideoCardLoading />
          <VideoCardLoading />
          <VideoCardLoading />
          <VideoCardLoading />
        </div>
      </div>
    )
  }

  if (Empty && events.length === 0) {
    return (
      <div className={cn('w-full', className)}>
        {title && (
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{title}</h2>
            {action}
          </div>
        )}
        <div className="py-3">
          <Empty />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)}>
      {title && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          {action}
        </div>
      )}
      <div className="md-feed-cols relative mx-auto gap-4 py-3">
        {events.map((e) => (
          <div
            key={e.id}
            role="link"
            tabIndex={0}
            className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
            onClick={(event) => {
              if ((event.target as HTMLElement).closest('a')) return
              navigate({ to: '/v/$eventId', params: { eventId: getVideoRouteReference(e) } })
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                navigate({ to: '/v/$eventId', params: { eventId: getVideoRouteReference(e) } })
              }
            }}
          >
            <VideoCard event={e} />
          </div>
        ))}
      </div>
    </div>
  )
}
