import { t } from 'i18next'
import { VideoFeedPresenter } from '@/components/videoFeed/VideoFeedPresenter.tsx'
import { useNostrInfiniteFeed } from '@/hooks/useNostrInfiniteFeed.ts'

export const RecentFeed = () => {
  const { events, isLoading, isFetchingNextPage, fetchNextPage } = useNostrInfiniteFeed({})
  return (
    <VideoFeedPresenter
      title={t('Recent Uploads', 'Envios Recentes')}
      events={events}
      isLoading={isLoading}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
      hasNextPage={events.length < 500}
    />
  )
}
