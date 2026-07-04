import { NDKEvent } from '@nostr-dev-kit/ndk-hooks'
import { useLoaderData } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/AppShell'
import { VideoProvider } from '@/context/VideoContext.tsx'
import { VideoFeatureBoundary } from '@/features/video/boundaries/VideoFeatureBoundary'
import { VideoPageContainer } from '@/features/video/components/VideoPageContainer'

export function VideoPage() {
  const event = useLoaderData({ from: '/v/$eventId' }) as NDKEvent
  return (
    <AppShell>
      <VideoProvider event={event}>
        <VideoFeatureBoundary>
          <VideoPageContainer />
        </VideoFeatureBoundary>
      </VideoProvider>
    </AppShell>
  )
}
