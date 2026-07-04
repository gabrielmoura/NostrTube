import { NDKKind } from '@nostr-dev-kit/ndk'
import { useSubscribe } from '@nostr-dev-kit/ndk-hooks'
import { t } from 'i18next'
import { useMemo } from 'react'
import { VideoFeedPresenter } from '@/components/videoFeed/VideoFeedPresenter.tsx'
import { useContentVisibilityFilter } from '@/features/nostr/hooks/useContentVisibilityFilter'
import { NORMAL_VIDEO_EVENT_KINDS } from '@/features/video/services/video-kinds'
import { processPopularVideos } from '@/helper/videoFilters'

const VIDEO_KINDS = NORMAL_VIDEO_EVENT_KINDS

export function PopularVideos() {
  // 1. Subscreve tanto aos vídeos quanto às métricas (ou faz queries separadas e combina)
  const { events: allEvents, eose: isLoading } = useSubscribe([
    { kinds: [34237 as NDKKind], limit: 50 },
    { kinds: VIDEO_KINDS, limit: 50 },
  ])
  const { filterEvents } = useContentVisibilityFilter()

  // 2. A lógica agora é uma simples transformação de dados
  const sortedPopularVideos = useMemo(() => {
    return filterEvents(processPopularVideos(allEvents))
  }, [allEvents, filterEvents])

  return (
    <VideoFeedPresenter
      title={t('Popular Videos', 'Vídeos Populares')}
      events={sortedPopularVideos}
      isLoading={isLoading}
      isFetchingNextPage={false}
      hasNextPage={false}
      fetchNextPage={() => undefined}
    />
  )
}
