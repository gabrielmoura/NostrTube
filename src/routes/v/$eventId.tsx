import { createFileRoute, useRouter } from "@tanstack/react-router";
import { VideoPage } from "@/routes/v/@components/Video.tsx";
import { NotFoundVideo } from "@/routes/v/@components/NotFoundVideo.tsx";
import { PageSpinner } from "@/components/PageSpinner.tsx";
import type NDK__default from "@nostr-dev-kit/ndk";
import { geVideoByEventIdData, type GeVideoByEventIdDataParams } from "@/helper/loaders/geVideoByEventIdData.ts";
import { getTagValue } from "@welshman/util";

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
  head: (ctx) => ({
    meta: [
      { title: `${getTagValue("title", ctx.loaderData?.tags)} - ${import.meta.env.VITE_APP_NAME}` },
      { description: getTagValue("summary", ctx.loaderData?.tags) },
      {
        property: "og:title",
        content: `${getTagValue("title", ctx.loaderData?.tags)} - ${import.meta.env.VITE_APP_NAME}`
      }
    ]
  }),
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