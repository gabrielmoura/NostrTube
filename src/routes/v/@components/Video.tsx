import { NDKEvent } from "@nostr-dev-kit/ndk-hooks";
import { VideoProvider } from "@/context/VideoContext.tsx";
import { useLoaderData } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { VideoPageContainer } from "@/features/video/components/VideoPageContainer";
import { VideoFeatureBoundary } from "@/features/video/boundaries/VideoFeatureBoundary";

export function VideoPage() {
  const event = useLoaderData({ from: "/v/$eventId" }) as NDKEvent;
  return (
    <AppShell>
      <VideoProvider event={event}>
        <VideoFeatureBoundary>
          <VideoPageContainer />
        </VideoFeatureBoundary>
      </VideoProvider>
    </AppShell>
  );
}
