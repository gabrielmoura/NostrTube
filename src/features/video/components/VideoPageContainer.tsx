import { PageSpinner } from "@/components/PageSpinner";
import { useVideoPageController } from "@/features/video/hooks/use-video-page-controller";
import { VideoPageView } from "@/features/video/components/VideoPageView";
import { RecommendationRail } from "@/features/recommendations/components/RecommendationRail";
import { getTagValues } from "@welshman/util";

export function VideoPageContainer() {
  const { video, assets, handleCanPlay } = useVideoPageController();

  if (!video?.event || !video.identification) {
    return <PageSpinner />;
  }

  return (
    <>
      <VideoPageView
        event={video.event}
        title={video.title || "Untitled"}
        image={video.image}
        fallbackUrl={video.url}
        eventIdentifier={video.identification}
        assetSet={assets}
        onCanPlay={handleCanPlay}
      />
      <RecommendationRail
        title="Porque voce assistiu este video"
        subtitle="Sugestoes puxadas das tags do video atual e do seu historico recente."
        tags={getTagValues("t", video.event.tags)}
        excludeEventId={video.event.id}
      />
    </>
  );
}
