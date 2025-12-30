import { useMemo } from "react";
import { NDKKind } from "@nostr-dev-kit/ndk";
import { useSubscribe } from "@nostr-dev-kit/ndk-hooks";
import { VideoFeedPresenter } from "@/components/videoFeed/VideoFeedPresenter.tsx";
import { t } from "i18next";
import { processPopularVideos } from "@/helper/videoFilters";

const VIDEO_KINDS = [NDKKind.Video, NDKKind.HorizontalVideo];

export function PopularVideos() {
  // 1. Subscreve tanto aos vídeos quanto às métricas (ou faz queries separadas e combina)
  const { events: allEvents, eose: isLoading } = useSubscribe([
    { kinds: [34237 as NDKKind], limit: 50 },
    { kinds: VIDEO_KINDS, limit: 50 }
  ]);

  // 2. A lógica agora é uma simples transformação de dados
  const sortedPopularVideos = useMemo(() => {
    return processPopularVideos(allEvents);
  }, [allEvents]);

  return (
    <VideoFeedPresenter
      title={t("Popular Videos", "Vídeos Populares")}
      events={sortedPopularVideos}
      isLoading={isLoading}
      isFetchingNextPage={false}
      hasNextPage={false}
      fetchNextPage={() => {
      }}
    />
  );
}