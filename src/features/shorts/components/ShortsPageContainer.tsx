import { Film } from "lucide-react";
import { t } from "i18next";
import { PageSpinner } from "@/components/PageSpinner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { ShortsFeed } from "@/features/shorts/components/ShortsFeed";
import { useShortsFeed } from "@/features/shorts/hooks/useShortsFeed";

export function ShortsPageContainer() {
  const { shorts, isLoading, isEmpty } = useShortsFeed();

  return (
    <AppShell
      title={t("shorts_page_title", "Shorts")}
      description={t("shorts_page_description", "Vertical short videos published as Nostr short video events.")}
      eyebrow="Short video"
      badge="34236 / 22"
      icon={Film}
      className="pb-4"
    >
      {isLoading ? (
        <PageSpinner label={t("loading_shorts", "Carregando shorts")} description={t("loading_shorts_desc", "Buscando vídeos curtos nos relays conectados.")} />
      ) : null}

      {isEmpty ? (
        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-border/70 bg-card/70 p-8 text-center">
          <Film className="mb-4 size-10 text-muted-foreground" />
          <h2 className="text-xl font-semibold">{t("shorts_empty_title", "Nenhum short encontrado")}</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {t("shorts_empty_desc", "Quando eventos de short video forem encontrados nos relays, eles aparecerão aqui.")}
          </p>
          <Button className="mt-5" variant="outline" onClick={() => location.reload()}>
            {t("try_again", "Tentar novamente")}
          </Button>
        </div>
      ) : null}

      {shorts.length > 0 ? (
        <div className="mx-auto w-full max-w-[520px]">
          <ShortsFeed shorts={shorts} />
        </div>
      ) : null}
    </AppShell>
  );
}
