import { PageSpinner } from '@/components/PageSpinner'
import { RecommendationRail } from '@/features/recommendations/components/RecommendationRail'
import { VideoPageView } from '@/features/video/components/VideoPageView'
import { useVideoPageController } from '@/features/video/hooks/use-video-page-controller'
import { getTagValues } from '@/helper/nostrTags'

export function VideoPageContainer() {
  const { video, assets, handleCanPlay } = useVideoPageController()

  if (!video?.event || !video.identification) {
    return (
      <PageSpinner
        label="Carregando vídeo"
        description="Buscando metadados, mídia e recomendações nos relays conectados."
      />
    )
  }

  return (
    <>
      <VideoPageView
        event={video.event}
        title={video.title || 'Untitled'}
        image={video.image}
        fallbackUrl={video.url}
        eventIdentifier={video.identification}
        assetSet={assets}
        onCanPlay={handleCanPlay}
      />
      <RecommendationRail
        title="Porque voce assistiu este video"
        subtitle="Sugestoes puxadas das tags do video atual e do seu historico recente."
        tags={getTagValues('t', video.event.tags)}
        excludeEventId={video.event.id}
      />
    </>
  )
}
