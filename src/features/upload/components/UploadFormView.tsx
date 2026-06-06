import { lazy } from "react";
import { t } from "i18next";
import { AddTagInput } from "@/routes/new/@components/BoxAddToModal";
import LanguagesCombo from "@/components/ComboBox/ComboLanguage";

const Textarea = lazy(() => import("@/components/textarea"));

interface UploadFormViewProps {
  title?: string;
  summary?: string;
  contentWarning?: string;
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
        onTagsChange={onHashtagsChange}
        label="Hashtags"
        placeholder="Ex: Bitcoin, Nostr"
      />
      <AddTagInput
        onTagsChange={onIndexersChange}
        label="Indexers"
        placeholder="Ex: imdb:tt12345"
      />
      <div className="rounded-xl border bg-card p-4 shadow-sm space-y-2">
        <label className="text-sm font-medium">{t("Content_warning", "Content warning")}</label>
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
        onChange={(language) => onLanguageChange(language?.id)}
      />
    </div>
  );
}
