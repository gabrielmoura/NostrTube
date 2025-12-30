import { createFileRoute, Link } from "@tanstack/react-router";
import { t } from "i18next";
import { Clock, Flame, Languages } from "lucide-react";
import { RecentFeed } from "@/components/videoFeed/containers/RecentFeed.tsx";
import { PopularVideos } from "@/components/videoFeed/containers/PopularVideos.tsx";
import { LanguageFeed } from "@/components/videoFeed/containers/LanguageFeed.tsx";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import { cn } from "@/lib/utils"; // Utilitário padrão de classes

// Schema de validação
const indexSchema = z.object({
  tab: z.enum(["recent", "popular", "language"]).optional().default("recent")
});

// Mapeamento de títulos para o Head
const TAB_TITLES: Record<string, string> = {
  recent: t("Trending", "Tendências"),
  popular: t("Popular", "Populares"),
  language: t("By Language", "Por Idioma")
};

export const Route = createFileRoute("/")({
  validateSearch: zodValidator(indexSchema),
  head: ({ match: { search } }) => {
    const tabLabel = TAB_TITLES[search.tab] || TAB_TITLES.recent;
    const appName = import.meta.env.VITE_APP_NAME || "Nostr Video";

    return {
      meta: [
        { title: `${tabLabel} | ${appName}` },
        { name: "description", content: t("search_page_description") },
        { property: "og:title", content: `${tabLabel} | ${appName}` }
      ]
    };
  },
  component: IndexPage
});

const TABS_CONFIG = [
  { id: "recent", label: TAB_TITLES.recent, icon: Clock, component: RecentFeed },
  { id: "popular", label: TAB_TITLES.popular, icon: Flame, component: PopularVideos },
  { id: "language", label: TAB_TITLES.language, icon: Languages, component: LanguageFeed }
] as const;

export function IndexPage() {
  const { tab } = Route.useSearch();

  // Encontra a configuração da aba atual ou fallback para a primeira
  const currentTab = TABS_CONFIG.find((t) => t.id === tab) || TABS_CONFIG[0];
  const ActiveComponent = currentTab.component;

  return (
    <div className="w-full pb-10">
      <div className="w-full space-y-6">
        {/* Navegação Estilizada como Tabs */}
        <nav className="flex items-center justify-center p-1 bg-muted rounded-lg max-w-4xl mx-auto px-5 mb-6">
          <div className="grid w-full grid-cols-3">
            {TABS_CONFIG.map(({ id, label, icon: Icon }) => (
              <Link
                key={id}
                to="/"
                search={{ tab: id }}
                // Estilização baseada no estado ativo da rota
                className={cn(
                  "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                  tab === id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-background/50"
                )}
              >
                <Icon className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{label.split(" ")[0]}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Renderização Dinâmica do Conteúdo */}
        <main className="outline-none animate-in fade-in duration-300">
          <ActiveComponent />
        </main>
      </div>
    </div>
  );
}