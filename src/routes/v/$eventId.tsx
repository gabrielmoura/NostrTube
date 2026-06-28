import { createRoute, redirect } from "@tanstack/react-router";
import { VideoPage } from "@/routes/v/@components/Video.tsx";
import { NotFoundVideo } from "@/routes/v/@components/NotFoundVideo.tsx";
import { PageSpinner } from "@/components/PageSpinner.tsx";
import type NDK__default from "@nostr-dev-kit/ndk";
import { geVideoByEventIdData, type GeVideoByEventIdDataParams } from "@/helper/loaders/geVideoByEventIdData.ts";
import { getTagValue } from "@/helper/nostrTags";
import { VideoRouteError } from "@/features/video/components/VideoRouteError";
import { Route as rootRoute } from "@/routes/__root";
import { resolveVideoRouteParam } from "@/features/video/services/video-route-resolution.service";

/*
 * @route /v/$eventId
 */
export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/v/$eventId",
  beforeLoad: ({ params: { eventId } }) => {
    const resolution = resolveVideoRouteParam(eventId);
    if (resolution.type === "invalid") {
      throw new Error(resolution.reason);
    }
    if (resolution.type === "naddr") {
      throw redirect({
        to: "/v/$eventId",
        params: { eventId: resolution.identifier },
        replace: true
      });
    }
  },
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
