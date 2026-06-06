import { lazy } from "react";
import { t } from "i18next";
import { CircleHelp } from "lucide-react";
import { AddTagInput } from "@/routes/new/@components/BoxAddToModal";
import LanguagesCombo from "@/components/ComboBox/ComboLanguage";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/videoPlayer/components/Tooltip";
import { COMBOBOX_LANGUAGES } from "@/default";

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
  onTitleChange: (value: string) => void;
  onSummaryChange: (value: string) => void;
  onContentWarningChange: (value: string) => void;
  onHashtagsChange: (values: string[]) => void;
  onIndexersChange: (values: string[]) => void;
  onLanguageChange: (value?: string) => void;
}

export function UploadFormView({
  title,
  summary,
  contentWarning,
  hashtags,
  indexers,
  language,
  onTitleChange,
  onSummaryChange,
  onContentWarningChange,
  onHashtagsChange,
  onIndexersChange,
  onLanguageChange
}: UploadFormViewProps) {
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
    </div>
  );
}
