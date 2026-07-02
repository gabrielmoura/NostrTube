import { createRoute } from "@tanstack/react-router";
import { t } from "i18next";
import { Youtube } from "lucide-react";
import { lazy, Suspense } from "react";
import { withAuth } from "@/components/AuthGuard.tsx";
import { AppShell } from "@/components/layout/AppShell";
import { PageSpinner } from "@/components/PageSpinner";
import { UploadErrorBoundary } from "@/features/upload/components/UploadErrorBoundary";
import { Route as rootRoute } from "@/routes/__root";

const YouTubeImportPageContainer = lazy(async () => {
  const module = await import("@/features/import-youtube/components/YouTubeImportPageContainer");
  return { default: module.YouTubeImportPageContainer };
});

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/import/youtube",
  component: withAuth(YouTubeImportPage),
  head: () => ({
    meta: [
      { title: t("import_youtube_title", "Importar vídeo do YouTube") },
      {
        name: "description",
        content: t(
          "import_youtube_meta_desc",
          "Importe metadados de um vídeo do YouTube para preparar um evento Nostr no NostrTube.",
        ),
      },
      { property: "og:title", content: t("import_youtube_title", "Importar vídeo do YouTube") },
    ],
  }),
});

function YouTubeImportPage() {
  return (
    <AppShell
      activeKey="youtubeImport"
      title={t("import_youtube_title", "Importar vídeo do YouTube")}
      description={t(
        "import_youtube_page_desc",
        "Prepare uma referência Nostr para um vídeo do YouTube sem baixar ou hospedar o arquivo no Blossom.",
      )}
      eyebrow="Creator Studio"
      badge="YouTube"
      icon={Youtube}
    >
      <UploadErrorBoundary>
        <Suspense
          fallback={
            <PageSpinner
              label={t("preparing_youtube_import", "Preparando importação")}
              description={t("loading_youtube_import_tools", "Carregando formulário e preview do YouTube.")}
            />
          }
        >
          <YouTubeImportPageContainer />
        </Suspense>
      </UploadErrorBoundary>
    </AppShell>
  );
}
