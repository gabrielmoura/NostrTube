import NDK, { type NDKEvent } from "@nostr-dev-kit/ndk";
import { createRoute, redirect } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { z } from "zod";
import { PageSpinner } from "@/components/PageSpinner";
import { isShortVideoKind } from "@/features/video/services/video-kinds";
import { resolveVideoRouteParam } from "@/features/video/services/video-route-resolution.service";
import { geVideoByEventIdData, type GeVideoByEventIdDataParams } from "@/helper/loaders/geVideoByEventIdData";
import { Route as rootRoute } from "@/routes/__root";

const ShortsDirectPageContainer = lazy(async () => {
  const module = await import("@/features/shorts/components/ShortsDirectPageContainer");
  return { default: module.ShortsDirectPageContainer };
});

const ShortSearchSchema = z.object({
  author: z.string().optional(),
  video: z.string().optional(),
});

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/short/$eventId",
  beforeLoad: ({ params: { eventId } }) => {
    const resolution = resolveVideoRouteParam(eventId);
    if (resolution.type === "invalid") {
      throw new Error(resolution.reason);
    }
  },
  validateSearch: ShortSearchSchema,
  loader: async ({ params: { eventId }, context: { ndk } }: {
    context: {
      ndk: NDK;
    };
    params: {
      eventId: string;
    };
  }) => {
    const event = await geVideoByEventIdData({ eventId, ndk } as GeVideoByEventIdDataParams);

    if (!isShortVideoKind(event.kind)) {
      throw redirect({
        to: "/v/$eventId",
        params: { eventId },
        replace: true,
      });
    }

    return event;
  },
  component: ShortRoute,
  head: () => ({
    meta: [
      { title: `Short - ${import.meta.env.VITE_APP_NAME}` },
      { name: "description", content: "Video curto em tela cheia no NostrTube." },
    ],
  }),
  pendingComponent: PageSpinner,
});

function ShortRoute() {
  const event = Route.useLoaderData() as NDKEvent;
  const { eventId } = Route.useParams();
  const { author } = Route.useSearch();

  return (
    <Suspense fallback={<PageSpinner label="Carregando Short" description="Preparando a experiencia vertical." />}>
      <ShortsDirectPageContainer author={author} event={event} eventId={eventId} />
    </Suspense>
  );
}
