import { createRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { PageSpinner } from "@/components/PageSpinner";
import { Route as rootRoute } from "@/routes/__root";

const ShortsPageContainer = lazy(async () => {
  const module = await import("@/features/shorts/components/ShortsPageContainer");
  return { default: module.ShortsPageContainer };
});

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/shorts",
  component: ShortsRoute,
  head: () => ({
    meta: [
      { title: `Shorts - ${import.meta.env.VITE_APP_NAME}` },
      { name: "description", content: "Feed vertical de vídeos curtos no NostrTube." },
    ],
  }),
});

function ShortsRoute() {
  return (
    <Suspense fallback={<PageSpinner label="Carregando Shorts" description="Preparando o feed vertical." />}>
      <ShortsPageContainer />
    </Suspense>
  );
}
