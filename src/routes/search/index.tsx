import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { PageSpinner } from "@/components/PageSpinner.tsx";
import { lazy } from "react";
import { t } from "i18next";
import { AdvancedSearch } from "./@AdvancedSearch"; // Importe o novo componente
import { eventSearchSchema, getVideosFromSearchData } from "@/helper/loaders/getVideosFromSearchData.ts";
import { SearchIcon } from "lucide-react"; // Ou seu ícone de preferência

const VideoCard = lazy(() => import("@/components/cards/videoCard"));

export const Route = createFileRoute("/search/")({
  component: RouteComponent,
  validateSearch: zodValidator(eventSearchSchema),
  loader: async ({ context: { ndk }, deps }) => {
    // Passamos o objeto consolidado para a função performática
    return getVideosFromSearchData({
      ndk,
      ...deps
    });
  },
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
      {/* O componente de busca permanece aqui para que o usuário possa filtrar novamente */}
      <AdvancedSearch />

      <SearchResults />
    </div>
  );
}

function SearchResults() {
  // 1. Obtemos os dados já processados pelo loader
  // 'videos' aqui já está filtrado, ordenado e sem duplicatas
  const videos = Route.useLoaderData();

  // 2. Obtemos os parâmetros apenas para exibição (ex: contar resultados ou labels)
  const { search } = useSearch({ from: "/search/" });

  // 3. Estado Vazio
  // Se o loader não disparou notFound() mas retornou array vazio
  if (videos?.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
        <div className="bg-muted/30 p-6 rounded-full mb-4">
          <SearchIcon className="w-12 h-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold">Nenhum vídeo encontrado</h3>
        <p className="text-muted-foreground mt-2 max-w-sm">
          Não encontramos resultados para "{search}". Tente ajustar seus filtros ou usar termos diferentes.
        </p>
      </div>
    );
  }

  // 4. Renderização dos Resultados
  return (
    <section className="relative px-5 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between border-b pb-4">
        <h2 className="font-main font-bold text-xl sm:text-2xl tracking-tight">
          Resultados ({videos?.length})
        </h2>
      </div>

      <div className="relative">
        <ul className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {videos.map((e) => (
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