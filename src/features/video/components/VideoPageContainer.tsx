import { PageSpinner } from "@/components/PageSpinner";
import { useVideoPageController } from "@/features/video/hooks/use-video-page-controller";
import { VideoPageView } from "@/features/video/components/VideoPageView";

export function VideoPageContainer() {
  const { video, assets, handleCanPlay } = useVideoPageController();

  if (!video?.event || !video.identification) {
    return <PageSpinner />;
  }

  return (
    <VideoPageView
      event={video.event}
      title={video.title || "Untitled"}
      image={video.image}
      fallbackUrl={video.url}
      eventIdentifier={video.identification}
      assetSet={assets}
      onCanPlay={handleCanPlay}
    />
  );
}
