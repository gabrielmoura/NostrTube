import { t } from "i18next";
import { Loader2, Search } from "lucide-react";
import { NDKEvent } from "@nostr-dev-kit/ndk";
import { Section, SectionContent } from "@/components/containers/pageSection";
import { VideoCardLoading } from "@/components/cards/videoCard";
import { VirtualizedVideoGrid } from "./VirtualizedVideoGrid";

interface VideoFeedPresenterProps {
  title: string;
  events: NDKEvent[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  emptyMessage?: string;
}

export function VideoFeedPresenter({
                                     title,
                                     events,
                                     isLoading,
                                     isFetchingNextPage,
                                     hasNextPage,
                                     fetchNextPage,
                                     emptyMessage
                                   }: VideoFeedPresenterProps) {

  // 1. Estado de Carregamento Inicial (Skeleton)
  if (isLoading && events.length === 0) {
    return (
      <Section className="px-5">
        <SectionContent className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mx-auto">
          {Array.from({ length: 8 }).map((_, i) => <VideoCardLoading key={i} />)}
        </SectionContent>
      </Section>
    );
  }

  return (
    <section className="px-5 space-y-6 animate-in fade-in duration-500">
      <h2 className="font-main font-bold text-2xl sm:text-3xl tracking-tight">{title}</h2>

      {/* 2. Estado Vazio */}
      {events.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <Search className="w-10 h-10 mx-auto opacity-20 mb-4" />
          <p>{emptyMessage || t("No videos found", "Nenhum vídeo encontrado.")}</p>
        </div>
      ) : (
        /* 3. Grid Virtualizado */
        <>
          <VirtualizedVideoGrid
            events={events}
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
          />

          {/* Indicador de carregamento no final (Infinite Scroll) */}
          {isFetchingNextPage && (
            <div className="w-full py-6 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
        </>
      )}
    </section>
  );
}