import { useRouter, createFileRoute } from "@tanstack/react-router";
import { VideoPage } from "@/routes/v/@components/Video.tsx";
import { NotFoundVideo } from "@/routes/v/@components/NotFoundVideo.tsx";
import { PageSpinner } from "@/components/PageSpinner.tsx";
import type NDK__default from "@nostr-dev-kit/ndk";
import { geVideoByEventIdData, type GeVideoByEventIdDataParams } from "@/helper/loaders/geVideoByEventIdData.ts";

/*
 * @route /v/$eventId
 */
export const Route = createFileRoute("/v/$eventId")({
  component: VideoPage,
  loader: ({ params: { eventId }, context: { ndk } }: {
    context: {
      ndk: NDK__default,
    },
    params: {
      eventId: string,
    }
  }) => geVideoByEventIdData({ eventId, ndk } as GeVideoByEventIdDataParams),
  pendingComponent: PageSpinner,
  notFoundComponent: () => <NotFoundVideo />,
  errorComponent: ({ error }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const router = useRouter();

    return (
      <div>
        {error.message}
        <button
          onClick={() => {
            // Invalidate the route to reload the loader, which will also reset the error boundary
            router.invalidate();
          }}
        >
          retry
        </button>
      </div>
    );
  }

});