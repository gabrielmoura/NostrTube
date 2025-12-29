import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { t } from "i18next";
import { NDKEvent, NDKFilter, NDKKind } from "@nostr-dev-kit/ndk";
import { NDKSubscriptionCacheUsage, useSubscribe } from "@nostr-dev-kit/ndk-hooks";
import { uniqBy } from "ramda";
import { getTagValue, getTagValues } from "@welshman/util";
import { Clock, Flame, Languages, Loader2, Search } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { detectLanguageMain } from "@/helper/userLang.ts";
import { Section, SectionContent } from "@/components/containers/pageSection";
import VideoCard, { VideoCardLoading } from "@/components/cards/videoCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";

// --- Constantes ---
const VIDEO_KINDS = [NDKKind.Video, NDKKind.HorizontalVideo];
const SEARCH_RELAYS = import.meta.env.VITE_NOSTR_SEARCH_RELAYS?.length > 5
  ? import.meta.env.VITE_NOSTR_SEARCH_RELAYS
  : undefined;

// --- Hook para Responsividade do Grid ---
function useGridColumns() {
  const [columns, setColumns] = useState(1);
  useEffect(() => {
    const update = () => {
      if (window.innerWidth >= 1280) setColumns(4);
      else if (window.innerWidth >= 1024) setColumns(3);
      else if (window.innerWidth >= 768) setColumns(2);
      else setColumns(1);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return columns;
}

// --- Componente de Feed Virtualizado ---
interface VideoFeedProps {
  events: NDKEvent[];
  title: string;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  emptyMessage?: string;
}

function VideoFeed({
                     events,
                     title,
                     isLoading,
                     isFetchingNextPage,
                     hasNextPage,
                     fetchNextPage,
                     emptyMessage
                   }: VideoFeedProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const columns = useGridColumns();

  // Agrupar eventos em linhas (Chunks)
  const rows = useMemo(() => {
    const chunked: NDKEvent[][] = [];
    for (let i = 0; i < events.length; i += columns) {
      chunked.push(events.slice(i, i + columns));
    }
    return chunked;
  }, [events, columns]);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 350, // Altura estimada do card + gap
    overscan: 5
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  // Lógica de Infinite Scroll: Detectar quando a última linha está visível
  useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1];
    if (!lastItem) return;

    if (
      lastItem.index >= rows.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage &&
      !isLoading
    ) {
      fetchNextPage();
    }
  }, [virtualItems, rows.length, hasNextPage, isFetchingNextPage, isLoading, fetchNextPage]);

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

      <div
        ref={parentRef}
        className="h-[75vh] overflow-y-auto pr-2 custom-scrollbar"
      >
        {rows.length === 0 && !isLoading ? (
          <div className="py-20 text-center text-muted-foreground">
            <Search className="w-10 h-10 mx-auto opacity-20 mb-4" />
            <p>{emptyMessage || t("No videos found", "Nenhum vídeo encontrado.")}</p>
          </div>
        ) : (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative"
            }}
          >
            {virtualItems.map((virtualRow) => (
              <div
                key={virtualRow.key}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`
                }}
              >
                <ul className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {rows[virtualRow.index].map((e) => (
                    <li key={e.id} className="flex">
                      <Link
                        to="/v/$eventId"
                        params={{ eventId: e.encode() }}
                        className="block w-full hover:scale-[1.02] transition-transform"
                      >
                        <VideoCard event={e} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Indicador de carregamento no final */}
        {isFetchingNextPage && (
          <div className="w-full py-6 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
      </div>
    </section>
  );
}

// --- Lógica de Dados: RecentVideos com Infinite Scroll ---
function RecentVideos() {
  const [allEvents, setAllEvents] = useState<NDKEvent[]>([]);
  const [until, setUntil] = useState<number | undefined>(undefined);
  const [isFetching, setIsFetching] = useState(false);

  // Filtro atual
  const filters: NDKFilter[] = useMemo(() => [{
    kinds: VIDEO_KINDS,
    limit: 40,
    until: until || Math.floor(Date.now() / 1000)
  }], [until]);

  const { events } = useSubscribe(filters, {
    closeOnEose: false,
    cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
    relayUrls: SEARCH_RELAYS
  }, [until]);

  // Merge de eventos únicos
  useEffect(() => {
    if (events.length > 0) {
      setAllEvents(prev => {
        const combined = [...prev, ...events];
        return uniqBy((e) => getTagValue("title", e.tags) || e.id, combined)
          .sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
      });
      setIsFetching(false);
    }
  }, [events]);

  const fetchNextPage = useCallback(() => {
    if (allEvents.length === 0 || isFetching) return;

    // Pega o timestamp do evento mais antigo para buscar os próximos
    const lastTimestamp = allEvents[allEvents.length - 1].created_at;
    if (lastTimestamp) {
      setIsFetching(true);
      setUntil(lastTimestamp - 1);
    }
  }, [allEvents, isFetching]);

  return (
    <VideoFeed
      events={allEvents}
      title={t("Recent Uploads", "Envios Recentes")}
      isLoading={allEvents.length === 0 && isFetching}
      isFetchingNextPage={isFetching}
      hasNextPage={allEvents.length < 500} // Limite opcional para evitar excesso
      fetchNextPage={fetchNextPage}
    />
  );
}

// --- Lógica de Dados: PopularVideos ---
function PopularVideos() {
  // Para simplificar, faremos o fetch dos IDs populares
  // e usaremos a mesma VideoFeed, mas popularidade geralmente é estática/rankeada
  const { events: viewEvents } = useSubscribe([{
    kinds: [34237],
    limit: 50
  }], {
    closeOnEose: false,
    cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST
  });

  const popularVideoIds = useMemo(() => {
    return viewEvents
      .sort((a, b) => {
        const aViews = parseInt(getTagValues("viewed", a.tags)[0] || "0", 10);
        const bViews = parseInt(getTagValues("viewed", b.tags)[0] || "0", 10);
        return bViews - aViews;
      })
      .map(e => getTagValue("d", e.tags))
      .filter((id): id is string => !!id);
  }, [viewEvents]);

  const { events: videoEvents } = useSubscribe(
    popularVideoIds.length > 0 ? [{ kinds: VIDEO_KINDS, "#d": popularVideoIds }] : [],
    { cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST },
    [popularVideoIds]
  );

  const processedVideos = useMemo(() => {
    return uniqBy((e) => getTagValue("title", e.tags), videoEvents);
  }, [videoEvents]);

  return (
    <VideoFeed
      events={processedVideos}
      title={t("Popular Videos", "Vídeos Populares")}
      isLoading={videoEvents.length === 0}
      isFetchingNextPage={false}
      hasNextPage={false}
      fetchNextPage={() => {
      }}
    />
  );
}

function LanguageVideos() {
  // 1. Estados para Gerenciamento de Dados e Paginação
  const [allEvents, setAllEvents] = useState<NDKEvent[]>([]);
  const [until, setUntil] = useState<number | undefined>(undefined);
  const [isFetching, setIsFetching] = useState(false);

  // 2. Detecção do Idioma (ex: 'pt', 'en')
  const [lang] = useState<string | undefined>(() => {
    const detected = detectLanguageMain();
    return detected?.split("-")[0]; // Pega apenas o prefixo (pt-BR -> pt)
  });

  // 3. Filtro Dinâmico do Nostr
  const filters: NDKFilter[] = useMemo(() => {
    if (!lang) return [];
    return [{
      kinds: VIDEO_KINDS,
      "#l": [lang], // Filtro por tag de idioma
      limit: 40,
      until: until || Math.floor(Date.now() / 1000)
    }];
  }, [until, lang]);

  // 4. Subscrição ao NDK
  const { events } = useSubscribe(filters, {
    closeOnEose: false,
    cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
    relayUrls: SEARCH_RELAYS
  }, [until, lang]);

  // 5. Merge de Dados e Deduplicação
  useEffect(() => {
    if (events.length > 0) {
      setAllEvents(prev => {
        const combined = [...prev, ...events];
        // Remove duplicatas por ID e ordena por data (mais recente primeiro)
        return uniqBy((e) => e.id, combined)
          .sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
      });
      setIsFetching(false);
    } else if (events.length === 0 && isFetching) {
      // Se a query voltou vazia, paramos o loading
      setIsFetching(false);
    }
  }, [events]);

  // 6. Função para Carregar mais Itens (Infinite Scroll)
  const fetchNextPage = useCallback(() => {
    if (allEvents.length === 0 || isFetching) return;

    const lastTimestamp = allEvents[allEvents.length - 1].created_at;
    if (lastTimestamp) {
      setIsFetching(true);
      setUntil(lastTimestamp - 1); // Busca eventos anteriores ao último carregado
    }
  }, [allEvents, isFetching]);

  // Renderização de erro caso o idioma não seja detectado
  if (!lang) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        {t("Language not detected", "Idioma não detectado.")}
      </div>
    );
  }

  return (
    <VideoFeed
      events={allEvents}
      title={t("Videos in your language", "Vídeos no seu idioma")}
      isLoading={allEvents.length === 0 && isFetching}
      isFetchingNextPage={isFetching}
      hasNextPage={allEvents.length > 0 && allEvents.length % 40 === 0} // Heurística simples para saber se há mais
      fetchNextPage={fetchNextPage}
      emptyMessage={t("No videos found for language", `Nenhum vídeo encontrado para o idioma: ${lang}`)}
    />
  );
}

// --- Componente Principal da Rota ---
export const Route = createFileRoute("/")({
  component: IndexPage
});

function IndexPage() {
  return (
    <div className="w-full pb-10">
      <div className="w-full space-y-6">
        <Tabs defaultValue="recent" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 mx-auto max-w-4xl px-5">
            <TabsTrigger value="recent" className="flex items-center gap-2">
              <Clock className="w-4 h-4" /> <span>{t("Trending", "Tendências")}</span>
            </TabsTrigger>
            <TabsTrigger value="popular" className="flex items-center gap-2">
              <Flame className="w-4 h-4" /> <span>{t("Popular", "Populares")}</span>
            </TabsTrigger>
            <TabsTrigger value="language" className="flex items-center gap-2">
              <Languages className="w-4 h-4" /> <span>{t("By Language", "Por Idioma")}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="outline-none">
            <RecentVideos />
          </TabsContent>

          <TabsContent value="popular" className="outline-none">
            <PopularVideos />
          </TabsContent>

          <TabsContent value="language" className="outline-none">
            <LanguageVideos />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}