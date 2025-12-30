import { useMemo } from "react";
import { detectLanguageMain } from "@/helper/userLang.ts";
import { useNostrInfiniteFeed } from "@/hooks/useNostrInfiniteFeed.ts";
import { t } from "i18next";
import { VideoFeedPresenter } from "@/components/videoFeed/VideoFeedPresenter.tsx";
import { EmptyState } from "@/components/EmptyState.tsx";

export const LanguageFeed = () => {
  const lang = useMemo(() => detectLanguageMain()?.split("-")[0], []);
  const { events, isLoading, isFetchingNextPage, fetchNextPage } = useNostrInfiniteFeed(
    { "#l": lang ? [lang] : [] },
    !!lang
  );

  if (!lang) return <EmptyState title={t("Language not detected", "Idioma não detectado.")} />;

  return (
    <VideoFeedPresenter
      title={t("Videos in your language", "Vídeos no seu idioma")}
      events={events}
      isLoading={isLoading}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
      hasNextPage={true}
    />
  );
};