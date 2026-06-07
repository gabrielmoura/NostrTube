import type { NDKEvent } from "@nostr-dev-kit/ndk-hooks";
import type { VideoAssetSet } from "@/features/video/services/video-imeta.service";
import { ErrorBoundaryVideo } from "@/routes/v/@components/error";
import { VideoPlayerContainer } from "@/routes/v/@components/VideoPlayerContainer";
import { VideoActionsContainer } from "@/features/video/components/VideoActionsContainer";
import { VideoCommentsContainer } from "@/features/video/components/VideoCommentsContainer";

interface VideoPageViewProps {
  event: NDKEvent;
  title: string;
  image?: string;
  fallbackUrl?: string;
  eventIdentifier: string;
  assetSet: VideoAssetSet;
  onCanPlay: () => Promise<void> | void;
}

export function VideoPageView({
  event,
  title,
  image,
  fallbackUrl,
  eventIdentifier,
  assetSet,
  onCanPlay
}: VideoPageViewProps) {
  return (
    <div className="mx-auto max-w-7xl pb-4 sm:py-4">
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="shrink-1 flex-1 md:min-w-[500px]">
          <div className="sticky top-[calc(var(--header-height))] z-30 aspect-video w-full overflow-hidden sm:static sm:max-h-[calc(61vw-32px)] sm:rounded-xl sm:px-4">
            <ErrorBoundaryVideo>
              <VideoPlayerContainer
                title={title}
                image={image}
                fallbackUrl={fallbackUrl}
                assetSet={assetSet}
                onCanPlay={onCanPlay}
                className="overflow-hidden sm:rounded-xl"
              />
            </ErrorBoundaryVideo>
          </div>
          <div className="px-4">
            <div className="pt-1">
              <ErrorBoundaryVideo>
                <VideoActionsContainer event={event} />
              </ErrorBoundaryVideo>
            </div>
            <ErrorBoundaryVideo>
              <VideoCommentsContainer
                eventReference={eventIdentifier}
                eventId={event.id}
                pubkey={event.pubkey}
              />
            </ErrorBoundaryVideo>
          </div>
        </div>
      </div>
    </div>
  );
}
