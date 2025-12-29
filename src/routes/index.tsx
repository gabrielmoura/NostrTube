import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { t } from "i18next";
import { NDKEvent, NDKKind } from "@nostr-dev-kit/ndk";
import { NDKSubscriptionCacheUsage, useSubscribe } from "@nostr-dev-kit/ndk-hooks";
import { uniqBy } from "ramda";
import { getTagValue, getTagValues } from "@welshman/util";
import { Clock, Flame, Languages, Search } from "lucide-react"; // Ícones sugeridos
import { sortEventsByImages } from "@/helper/format.ts";
import { detectLanguageMain } from "@/helper/userLang.ts";
import { Section, SectionContent, SectionHeader, SectionTitle } from "@/components/containers/pageSection";
import VideoCard, { VideoCardLoading } from "@/components/cards/videoCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";

// --- Constantes ---
const VIDEO_KINDS = [NDKKind.Video, NDKKind.HorizontalVideo];
const SEARCH_RELAYS = import.meta.env.VITE_NOSTR_SEARCH_RELAYS?.length > 5
  ? import.meta.env.VITE_NOSTR_SEARCH_RELAYS
  : undefined;

export const Route = createFileRoute("/")({
  component: IndexPageWithHelmet
});

function IndexPageWithHelmet() {
  return (
    <div className="w-full pb-10">

      <div className="w-full space-y-6">
        <Tabs defaultValue="recent" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="recent" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{t("Trending", "Tendências")}</span>
            </TabsTrigger>
            <TabsTrigger value="popular" className="flex items-center gap-2">
              <Flame className="w-4 h-4" />
              <span>{t("Popular", "Populares")}</span>
            </TabsTrigger>
            <TabsTrigger value="language" className="flex items-center gap-2">
              <Languages className="w-4 h-4" />
              <span>{t("By Language", "Por Idioma")}</span>
            </TabsTrigger>
          </TabsList>

          {/* O uso de unmountOnExit no TabsContent (se suportado pelo seu UI lib) ou keepMounted depende da estratégia de cache.
              Aqui assumimos renderização padrão. */}

          <TabsContent value="recent" className="focus-visible:outline-none">
            <RecentVideos />
          </TabsContent>

          <TabsContent value="popular" className="focus-visible:outline-none">
            <PopularVideos />
          </TabsContent>

          <TabsContent value="language" className="focus-visible:outline-none">
            <LanguageVideos />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// --- Componente Reutilizável de Feed ---
interface VideoFeedProps {
  events: NDKEvent[];
  title: string;
  isLoading?: boolean;
  emptyMessage?: string;
}

function VideoFeed({ events, title, isLoading, emptyMessage }: VideoFeedProps) {
  // Processamento memoizado para evitar recalculos caros no render
  const processedEvents = useMemo(() => {
    if (!events.length) return [];
    return uniqBy(
      (e) => getTagValues("title", e.tags),
      events
    ).sort(sortEventsByImages);
  }, [events]);

  // Estado de Loading
  if (isLoading && processedEvents.length === 0) {
    return (
      <Section className="px-5">
        <SectionHeader>
          <SectionTitle
            className="font-main text-2xl font-semibold sm:text-3xl animate-pulse bg-muted/20 w-1/3 h-8 rounded" />
        </SectionHeader>
        <SectionContent className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 relative mx-auto">
          {Array.from({ length: 8 }).map((_, i) => (
            <VideoCardLoading key={i} />
          ))}
        </SectionContent>
      </Section>
    );
  }

  // Estado Vazio
  if (!isLoading && processedEvents.length === 0) {
    return (
      <Section className="px-5 py-10 text-center">
        <div className="flex flex-col items-center justify-center space-y-3 text-muted-foreground">
          <Search className="w-10 h-10 opacity-50" />
          <p>{emptyMessage || t("No videos found", "Nenhum vídeo encontrado.")}</p>
        </div>
      </Section>
    );
  }

  // Estado com Dados
  return (
    <section className="relative px-5 space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="font-main font-bold text-2xl sm:text-3xl tracking-tight">
          {title}
        </h2>
      </div>

      <div className="relative">
        <ul className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {processedEvents.map((e) => (
            <li key={e.id} className="flex">
              <Link
                to="/v/$eventId"
                params={{ eventId: e.encode() }}
                className="block w-full focus:outline-none focus:ring-2 focus:ring-primary rounded-lg transition-transform hover:scale-[1.01]"
              >
                <VideoCard event={e} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// --- Sub-Componentes Lógicos ---

function RecentVideos() {
  const { events } = useSubscribe(
    [{
      kinds: VIDEO_KINDS,
      limit: 50, // Reduzido de 100 para melhorar first paint, ajuste conforme necessidade
      until: Math.floor(Date.now() / 1000) // Garante que pegamos até o momento atual
    }],
    {
      closeOnEose: false, // Mantive false para receber updates em tempo real, mude para true se preferir estático
      cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
      relayUrls: SEARCH_RELAYS
    },
    []
  );

  return (
    <VideoFeed
      events={events}
      title={t("Recent Uploads", "Envios Recentes")}
      isLoading={events.length === 0}
    />
  );
}

function LanguageVideos() {
  // Inicialização lazy para evitar useEffect desnecessário
  const [lang] = useState<string | undefined>(() => detectLanguageMain()?.split("-")[0]);

  const { events } = useSubscribe(
    lang ? [{
      kinds: VIDEO_KINDS,
      "#l": [lang], // NDK geralmente espera array ou string, mas array é mais seguro para filters
      limit: 50
    }] : [], // Não busca se não tiver lang
    {
      cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST
    },
    [lang]
  );

  if (!lang) {
    return <div
      className="p-5 text-center text-muted-foreground">{t("Language not detected", "Idioma não detectado.")}</div>;
  }

  return (
    <VideoFeed
      events={events}
      title={t("Videos in your language", "Vídeos no seu idioma")}
      isLoading={events.length === 0}
      emptyMessage={t("No videos found for language", `Nenhum vídeo encontrado para o idioma: ${lang}`)}
    />
  );
}

function PopularVideos() {
  // 1. Busca eventos de View Count (Kind 34237)
  const { events: viewEvents } = useSubscribe([{
    kinds: [34237],
    limit: 100,
    until: Math.floor(Date.now() / 1000)
  }], {
    cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST
  });

  // 2. Extrai os IDs dos vídeos mais vistos
  const popularVideoIds = useMemo(() => {
    return viewEvents
      .sort((a, b) => {
        const aViews = parseInt(getTagValues("viewed", a.tags)[0] || "0", 10);
        const bViews = parseInt(getTagValues("viewed", b.tags)[0] || "0", 10);
        return bViews - aViews;
      })
      .slice(0, 50) // Limite para não explodir a próxima query
      .map(e => getTagValue("d", e.tags))
      .filter((id): id is string => !!id); // Remove nulls
  }, [viewEvents]);

  // 3. Busca os vídeos baseados nos IDs encontrados
  const { events: videoEvents } = useSubscribe(
    popularVideoIds.length > 0 ? [{
      kinds: VIDEO_KINDS,
      "#d": popularVideoIds, // Correção: filtro por tag 'd' geralmente é '#d' em queries genéricas ou 'd' dependendo do relay wrapper
      limit: 50
    }] : [], // Evita query vazia
    {
      cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST
    },
    [popularVideoIds] // Re-executa quando a lista de IDs mudar
  );

  return (
    <VideoFeed
      events={videoEvents}
      title={t("Popular Videos", "Vídeos Populares")}
      isLoading={viewEvents.length > 0 && videoEvents.length === 0} // Loading se temos views mas ainda não temos os vídeos
    />
  );
}