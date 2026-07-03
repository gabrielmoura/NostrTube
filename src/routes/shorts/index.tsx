import { createRoute } from "@tanstack/react-router";
import { lazy, Suspense, useCallback } from "react";
import { z } from "zod";
import { PageSpinner } from "@/components/PageSpinner";
import { Route as rootRoute } from "@/routes/__root";

const ShortsPageContainer = lazy(async () => {
  const module = await import("@/features/shorts/components/ShortsPageContainer");
  return { default: module.ShortsPageContainer };
});

const ShortsSearchSchema = z.object({
  search: z.string().optional(),
});

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/shorts",
  component: ShortsRoute,
  validateSearch: ShortsSearchSchema,
  head: () => ({
    meta: [
      { title: `Shorts - ${import.meta.env.VITE_APP_NAME}` },
      { name: "description", content: "Feed vertical de vídeos curtos no NostrTube." },
    ],
  }),
});

function ShortsRoute() {
  const { search } = Route.useSearch();
  const navigate = Route.useNavigate();

  const handleSearchChange = useCallback((nextSearch?: string) => {
    if ((search || undefined) === nextSearch) return;

    void navigate({
      to: "/shorts",
      search: { search: nextSearch } as never,
      replace: true,
    });
  }, [navigate, search]);

  return (
    <Suspense fallback={<PageSpinner label="Carregando Shorts" description="Preparando o feed vertical." />}>
      <ShortsPageContainer search={search} onSearchChange={handleSearchChange} />
    </Suspense>
  );
}
