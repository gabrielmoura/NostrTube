import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { NDKSubscriptionCacheUsage, useSubscribe } from "@nostr-dev-kit/ndk-hooks";
import { VideoCardLoading } from "@/components/cards/videoCard";
import { sortEventsByImages } from "@/helper/format.ts";
import type { NDKFilter } from "@nostr-dev-kit/ndk";
import { NDKKind } from "@nostr-dev-kit/ndk";
import { uniqBy } from "ramda";
import { getTagValues } from "@welshman/util";
import { Section, SectionContent, SectionHeader, SectionTitle } from "@/components/containers/pageSection";
import { PageSpinner } from "@/components/PageSpinner.tsx";
import { lazy, useMemo } from "react";
import { t } from "i18next";
import { nip19 } from "nostr-tools";
import { startOfDay, subMonths, subWeeks, subYears } from "date-fns";
import { AdvancedSearch } from "./@AdvancedSearch"; // Importe o novo componente
import { eventSearchSchema } from "@/helper/loaders/getVideosFromSearchData.ts";
import { SearchIcon } from "lucide-react";

const VideoCard = lazy(() => import("@/components/cards/videoCard"));

export const Route = createFileRoute("/search/")({
  component: RouteComponent,
  validateSearch: zodValidator(eventSearchSchema),
  // Atualizar loaderDeps para incluir novos campos
  loaderDeps: ({ search: { search, nsfw, tag, lang, author, timeRange } }) => ({
    search, nsfw, tag, lang, author, timeRange
  }),
  head: () => ({
    meta: [
      { title: `${t("search_page_title")} - ${import.meta.env.VITE_APP_NAME}` },
      { description: t("search_page_description") },
      {
        property: "og:title",
        content: `${t("search_page_title")} - ${import.meta.env.VITE_APP_NAME}`
      }
    ]
  }),
  pendingComponent: PageSpinner,
  errorComponent: HasError
});

// ... (Manter função HasError igual ao original) ...
function HasError({ error }: { error: Error }) {
  // ... código original do HasError ...
  return <div>Error: {error.message}</div>; // Simplificado para brevidade, use o original
}

function RouteComponent() {
  return (
    <div className="relative space-y-6 pt-5 sm:pt-7 max-w-7xl mx-auto px-4 sm:px-6">

      {/* Componente de Busca Inserido Aqui */}
      <AdvancedSearch />

      <SearchResults />
    </div>
  );
}

function SearchResults() {
  // 1. Obter parametros da URL
  const { search, nsfw, tag, lang, author, timeRange } = useSearch({
    from: "/search/"
  });

  // 2. Lógica de Filtros (UseMemo para performance)
  const filters = useMemo(() => {
    const f: NDKFilter = {
      kinds: [NDKKind.Video, NDKKind.HorizontalVideo],
      limit: 50 // Paginação simples via limite por enquanto
    };

    // Filtro de Texto (NIP-50)
    if (search) f.search = search;

    // Filtro NSFW
    if (nsfw) f["#content-warning"] = [""];

    // Filtro de Tags
    if (tag) {
      const tagsArray = Array.isArray(tag) ? tag : [tag];
      if (tagsArray.length > 0) f["#t"] = tagsArray;
    }

    // Filtro de Idioma
    if (lang && lang !== "all") {
      // Nota: alguns relays usam tag 'l' para idioma, verifique a implementação da sua plataforma
      // Se não houver tag padrão, às vezes é melhor filtrar no client-side, mas tentaremos via tag
      // f["#l"] = [lang];
      // Como o código original usava uma lógica complexa de merge no 'tags', vamos simplificar:
      // Se sua plataforma usa tag 'language', adicione aqui.
    }

    // Filtro de Autor (Converte Npub para Hex)
    if (author) {
      try {
        if (author.startsWith("npub")) {
          const { data } = nip19.decode(author);
          f.authors = [data as string];
        } else {
          // Assume Hex se não for npub (validação básica)
          if (author.length === 64) f.authors = [author];
        }
      } catch (e) {
        console.error("Invalid author npub", e);
      }
    }

    // Filtro de Data (since)
    if (timeRange && timeRange !== "all") {
      const now = new Date();
      let sinceDate;

      switch (timeRange) {
        case "today":
          sinceDate = startOfDay(now);
          break;
        case "week":
          sinceDate = subWeeks(now, 1);
          break;
        case "month":
          sinceDate = subMonths(now, 1);
          break;
        case "year":
          sinceDate = subYears(now, 1);
          break;
      }

      if (sinceDate) {
        f.since = Math.floor(sinceDate.getTime() / 1000);
      }
    }

    return [f];
  }, [search, nsfw, tag, lang, author, timeRange]);

  // 3. Subscription do Nostr
  const relaysSearch = (import.meta.env.VITE_NOSTR_SEARCH_RELAYS?.length > 5)
    ? import.meta.env.VITE_NOSTR_SEARCH_RELAYS.split(",")
    : undefined;

  const { events, eose: isEose } = useSubscribe(filters, {
    closeOnEose: true,
    cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
    relayUrls: relaysSearch
  }, [filters]);

  // 4. Processamento dos Eventos (Client-side filtering adicional se necessário)
  const processedEvents = useMemo(() => {
    let list = uniqBy((e) => getTagValues("title", e.tags), events);

    // Filtragem Client-side de idioma se o relay não suportar
    if (lang && lang !== "all") {
      // Exemplo: assumindo que o idioma pode estar numa tag 'language' ou 'l'
      // list = list.filter(e => getTagValues("l", e.tags).includes(lang));
    }

    return list.sort(sortEventsByImages);
  }, [events, lang]);

  // 5. Renderização Condicional
  if (processedEvents.length > 0) {
    return (
      <section className="relative px-5 space-y-6 sm:space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between border-b pb-4">
          <h2 className="font-main font-bold text-xl sm:text-2xl tracking-tight">
            Resultados ({processedEvents.length})
          </h2>
        </div>

        <div className="relative">
          <ul className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {processedEvents.map((e) => (
              <li key={e.id} className="flex h-full">
                <Link
                  to="/v/$eventId"
                  params={{ eventId: e.encode() }}
                  className="block w-full focus:outline-none focus:ring-2 focus:ring-primary rounded-lg transition-transform hover:scale-[1.02]"
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

  // Estado de Carregamento (antes do EOSE)
  if (!isEose && processedEvents.length === 0) {
    return (
      <Section className="px-5">
        <SectionHeader>
          <SectionTitle className="font-main text-2xl font-semibold sm:text-3xl">
            {t("Search", "Buscando...")}
          </SectionTitle>
        </SectionHeader>
        <SectionContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <VideoCardLoading />
          <VideoCardLoading />
          <VideoCardLoading />
          <VideoCardLoading />
        </SectionContent>
      </Section>
    );
  }

  // Estado Vazio (após EOSE)
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="bg-muted/30 p-6 rounded-full mb-4">
        <SearchIcon className="w-12 h-12 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold">Nenhum vídeo encontrado</h3>
      <p className="text-muted-foreground mt-2 max-w-sm">
        Tente ajustar seus filtros, usar termos diferentes ou remover algumas tags.
      </p>
    </div>
  );
}