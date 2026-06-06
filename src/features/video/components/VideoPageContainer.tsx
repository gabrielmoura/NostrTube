import { PageSpinner } from "@/components/PageSpinner";
import { useVideoPageController } from "@/features/video/hooks/use-video-page-controller";
import { VideoPageView } from "@/features/video/components/VideoPageView";
import { RecommendationRail } from "@/features/recommendations/components/RecommendationRail";
import { getTagValues } from "@welshman/util";
import { useParams } from "@tanstack/react-router";

const TARGET_RECOMMENDATION_EVENT = "nevent1qgs0cv88dkwyd5dh00z870xjehmq5m9tjszktrthgxtwtc2akushcqcpz4mhxue69uhhyetvv9ujuerpd46hxtnfduhsqgzvhm9dejyd3mxaw0j0t04vhcu5gxw4rlr3m9ymxq2s7xf5dhcnp5tepsv0";

export function VideoPageContainer() {
  const { video, assets, handleCanPlay } = useVideoPageController();
  const { eventId } = useParams({ from: "/v/$eventId" });

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
      {eventId === TARGET_RECOMMENDATION_EVENT ? (
        <RecommendationRail
          title="Porque voce assistiu este video"
          subtitle="Sugestoes puxadas das tags do video atual e do seu historico recente."
          tags={getTagValues("t", video.event.tags)}
          excludeEventId={video.event.id}
        />
      ) : null}
    </>
  );
}
