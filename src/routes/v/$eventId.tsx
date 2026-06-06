import { createFileRoute } from "@tanstack/react-router";
import { VideoPage } from "@/routes/v/@components/Video.tsx";
import { NotFoundVideo } from "@/routes/v/@components/NotFoundVideo.tsx";
import { PageSpinner } from "@/components/PageSpinner.tsx";
import type NDK__default from "@nostr-dev-kit/ndk";
import { geVideoByEventIdData, type GeVideoByEventIdDataParams } from "@/helper/loaders/geVideoByEventIdData.ts";
import { getTagValue } from "@welshman/util";
import { VideoRouteError } from "@/features/video/components/VideoRouteError";

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
  head: (ctx) => {
    const tags = ctx.loaderData?.tags ?? [];
    return {
      meta: [
        { title: `${getTagValue("title", tags)} - ${import.meta.env.VITE_APP_NAME}` },
        { description: getTagValue("summary", tags) },
        {
          property: "og:title",
          content: `${getTagValue("title", tags)} - ${import.meta.env.VITE_APP_NAME}`
        }
      ]
    };
  },
  pendingComponent: PageSpinner,
  notFoundComponent: () => <NotFoundVideo />,
  errorComponent: ({ error }) => <VideoRouteError error={error} />

});
