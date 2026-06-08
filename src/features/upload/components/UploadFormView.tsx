import { lazy, useEffect, useMemo, useState } from "react";
import { t } from "i18next";
import { CircleHelp, MapPin, Minus, Plus } from "lucide-react";
import { AddTagInput } from "@/routes/new/@components/BoxAddToModal";
import LanguagesCombo from "@/components/ComboBox/ComboLanguage";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/videoPlayer/components/Tooltip";
import { COMBOBOX_LANGUAGES } from "@/default";
import useUserStore from "@/store/useUserStore";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Textarea = lazy(() => import("@/components/textarea"));

function FieldInfo({ content }: { content: string }) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={content}
          >
            <CircleHelp className="size-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-balance">{content}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface UploadFormViewProps {
  title?: string;
  summary?: string;
  contentWarning?: string;
  hashtags?: string[];
  indexers?: string[];
  language?: string;
  geohash?: string;
  onTitleChange: (value: string) => void;
  onSummaryChange: (value: string) => void;
  onContentWarningChange: (value: string) => void;
  onHashtagsChange: (values: string[]) => void;
  onIndexersChange: (values: string[]) => void;
  onLanguageChange: (value?: string) => void;
  onGeohashChange: (value?: string) => void;
}

export function UploadFormView({
  title,
  summary,
  contentWarning,
  hashtags,
  indexers,
  language,
  geohash,
  onTitleChange,
  onSummaryChange,
  onContentWarningChange,
  onHashtagsChange,
  onIndexersChange,
  onLanguageChange,
  onGeohashChange
}: UploadFormViewProps) {
  const storedGeoHash = useUserStore((state) => state.session?.geoHash);
  const [includeGeohash, setIncludeGeohash] = useState(Boolean(geohash || storedGeoHash));
  const [rawGeohash, setRawGeohash] = useState(geohash || storedGeoHash || "");
  const [precision, setPrecision] = useState(Math.max(1, (geohash || storedGeoHash || "").length || 3));

  useEffect(() => {
    const base = geohash || storedGeoHash || "";
    setIncludeGeohash(Boolean(base));
    setRawGeohash(base);
    setPrecision(Math.max(1, base.length || 3));
  }, [geohash, storedGeoHash]);

  const effectiveGeohash = useMemo(() => rawGeohash.trim().toLowerCase().slice(0, precision), [precision, rawGeohash]);

  useEffect(() => {
    onGeohashChange(includeGeohash && effectiveGeohash ? effectiveGeohash : undefined);
  }, [effectiveGeohash, includeGeohash, onGeohashChange]);

  return (
    <div className="space-y-4">
      <Textarea
        value={title}
        onChange={(event) => onTitleChange(event.target.value)}
        placeholder={`${t("add_a_video_title")}...`}
        autoFocus
        className="invisible-textarea text-3xl font-semibold tracking-tight placeholder:text-muted-foreground/70"
      />
      <Textarea
        value={summary}
        onChange={(event) => onSummaryChange(event.target.value)}
        placeholder={`${t("write_a_short_summary_or_description")}...`}
        className="invisible-textarea min-h-[150px] text-base placeholder:text-muted-foreground/70"
      />
      <AddTagInput
        initialTags={hashtags}
        onTagsChange={onHashtagsChange}
        label="Hashtags"
        placeholder="Ex: Bitcoin, Nostr"
      />
      <AddTagInput
        initialTags={indexers}
        onTagsChange={onIndexersChange}
        label="Indexers"
        placeholder="Ex: imdb:tt12345"
      />
      <div className="rounded-xl border bg-card p-4 shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">{t("Content_warning", "Content warning")}</label>
          <FieldInfo content={t("content_warning_tooltip", "Use this field when the video needs an explicit viewer warning before playback.")} />
        </div>
        <Textarea
          value={contentWarning}
          onChange={(event) => onContentWarningChange(event.target.value)}
          placeholder={t("content_warning_placeholder")}
          className="text-sm min-h-[60px]"
        />
      </div>
      <LanguagesCombo
        label={t("Language")}
        placeholder={t("Select_language")}
        value={language ? COMBOBOX_LANGUAGES.find((item) => item.id === language) ?? null : null}
        onChange={(nextLanguage) => onLanguageChange(nextLanguage?.id)}
      />
      {storedGeoHash ? (
        <div className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-emerald-500" />
                <label className="text-sm font-medium">Geohash regional</label>
                <FieldInfo content="Use o geohash salvo como base, ajuste manualmente e controle a precisão antes de publicar." />
              </div>
              <p className="text-sm text-muted-foreground">
                Salvo nas configurações: <span className="font-mono text-foreground">{storedGeoHash}</span>
              </p>
            </div>
            <Switch checked={includeGeohash} onCheckedChange={setIncludeGeohash} />
          </div>

          {includeGeohash ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Geohash publicado</label>
                <Input
                  value={rawGeohash}
                  onChange={(event) => setRawGeohash(event.target.value.replace(/[^0-9a-z]/gi, "").toLowerCase())}
                  placeholder={storedGeoHash}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Valor efetivo: <span className="font-mono text-foreground">{effectiveGeohash || "-"}</span>
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/30 p-3">
                <div>
                  <p className="text-sm font-medium">Precisão</p>
                  <p className="text-xs text-muted-foreground">Aumente ou reduza quantos caracteres serão publicados.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="icon" onClick={() => setPrecision((current) => Math.max(1, current - 1))} disabled={precision <= 1}>
                    <Minus className="size-4" />
                  </Button>
                  <span className="min-w-10 text-center font-mono text-sm font-semibold">{precision}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setPrecision((current) => Math.min(Math.max(rawGeohash.length, 1), current + 1))}
                    disabled={precision >= Math.max(rawGeohash.length, 1)}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
