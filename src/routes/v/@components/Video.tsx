import { NDKEvent, useNDK, useNDKCurrentUser } from "@nostr-dev-kit/ndk-hooks";
import { VideoPlayer } from "@/components/videoPlayer";
import { ErrorBoundaryVideo } from "@/routes/v/@components/error.tsx";
import { useState } from "react";

import { useRecordView } from "@/hooks/useRecordView.ts";
import { useVideoContext, VideoProvider } from "@/context/VideoContext.tsx";
import { useLoaderData } from "@tanstack/react-router";
import { PageSpinner } from "@/components/PageSpinner.tsx";
import { Helmet } from "react-helmet-async";
import VideoActions from "./VideoActions.tsx";
import CommentSection from "./Comments/comments.tsx";

export function VideoPage() {
  const event = useLoaderData({ from: "/v/$eventId" }) as NDKEvent;
  return <VideoProvider event={event}>
    <ErrorBoundaryVideo>
      <EventLoaded />;
    </ErrorBoundaryVideo>
  </VideoProvider>;

}

function EventLoaded() {
  const [toViewer, setViewed] = useState<boolean>(true);
  const currentUser = useNDKCurrentUser();
  const { ndk } = useNDK();
  const { video } = useVideoContext();
  const { markView } = useRecordView();


  if (!video) {
    return <PageSpinner />;
  }

  async function onCanPlay() {
    if (toViewer && currentUser) {
      markView({
        eventIdentifier: video?.identification!,
        ndk: ndk!,
        pubKey: currentUser.pubkey!
      }).then(
        async (evt) => {
          await evt!.publish();
          setViewed(false);
        }
      );
    }
  }

  return <div className="mx-auto max-w-7xl pb-4 sm:py-4">
    <Helmet>
      <title>{video?.title || "Untitled"} - NostrTube</title>
      <meta name="description" content={video?.summary || ""} />
      {/*  Og */}
      <meta property="og:image" content={video?.image || ""} />
      <meta property="og:title" content={video?.title || ""} />
      <meta property="og:description" content={video?.summary || ""} />
      <meta property="og:type" content="video.other" />
      <meta property="og:video" content={video.url || ""} />
      <meta property="og:video:secure_url" content={video.url || ""} />
    </Helmet>
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="shrink-1 flex-1 md:min-w-[500px]">
        {/* Video Player */}
        <div
          className="sticky top-[calc(var(--header-height))] z-30 aspect-video w-full overflow-hidden sm:static sm:max-h-[calc(61vw-32px)] sm:rounded-xl sm:px-4">
          <ErrorBoundaryVideo>
            <VideoPlayer src={video.url!} image={video.image!} title={video?.title || "Untitled"}
                         onCanPlay={onCanPlay}
                         className="overflow-hidden sm:rounded-xl"
            />
          </ErrorBoundaryVideo>
        </div>
        <div className="px-4">
          <div className="pt-1">
            <ErrorBoundaryVideo>
              <VideoActions event={video.event!} />
            </ErrorBoundaryVideo>
          </div>
          <ErrorBoundaryVideo>

            <CommentSection
              eventReference={video.identification!}
              eventId={video.event!.id}
              pubkey={video.event?.pubkey as string}
            />

          </ErrorBoundaryVideo>
        </div>
      </div>
    </div>
  </div>
    ;
}