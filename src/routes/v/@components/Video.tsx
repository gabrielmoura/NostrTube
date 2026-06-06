import { NDKEvent } from "@nostr-dev-kit/ndk-hooks";
import { VideoProvider } from "@/context/VideoContext.tsx";
import { useLoaderData } from "@tanstack/react-router";
import { VideoPageContainer } from "@/features/video/components/VideoPageContainer";
import { VideoFeatureBoundary } from "@/features/video/boundaries/VideoFeatureBoundary";

export function VideoPage() {
  const event = useLoaderData({ from: "/v/$eventId" }) as NDKEvent;
  return <VideoProvider event={event}>
    <VideoFeatureBoundary>
      <VideoPageContainer />
    </VideoFeatureBoundary>
  </VideoProvider>;

}
