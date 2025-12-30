import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import { t } from "i18next";

import { cn } from "@/helper/format.ts";
import { usePublishVideo } from "@/hooks/usePublishVideo.ts";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/label.tsx";
import { Image } from "@/components/Image.tsx";
import { ButtonWithLoader } from "@/components/ButtonWithLoader.tsx";
import Player, { VideoUpload } from "@/routes/new/@components/VideoUpload.tsx";
import LanguagesCombo from "@/components/ComboBox/ComboLanguage.tsx";
import { AddTagInput } from "@/routes/new/@components/BoxAddToModal.tsx";
import { ButtonUploadThumb } from "@/routes/new/@components/ButtonUploadThumb.tsx";
import { withAuth } from "@/components/AuthGuard.tsx";
import { useVideoUploadStore } from "@/store/videoUpload/useVideoUploadStore.ts";
import AgeCombo from "@/components/ComboBox/AgeCombo.tsx";

// Lazy imports para performance
const Textarea = lazy(() => import("@/components/textarea.tsx"));

export const Route = createFileRoute("/new/")({
  component: withAuth(NewVideoPage),
  head: () => ({
    meta: [
      { title: t("upload_new_video", "Upload New Video") },
      {
        name: "description",
        content: t("upload_desc", "Upload a new video to NostrTube.")
      },
      { property: "og:title", content: t("upload_new_video", "Upload New Video") }
    ]
  })
});


function NewVideoPage() {
  const setHashtags = useVideoUploadStore((s) => s.setHashtags);
  const setIndexers = useVideoUploadStore((s) => s.setIndexers);

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 py-4">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">

        {/* MAIN */}
        <main className="space-y-6">
          <PlayerSwitch />

          <section className="space-y-4">
            <TitleInput />
            <SummaryInput />
          </section>

          {/* Actions closer to content */}
          <ActionForm />
        </main>

        {/* SIDEBAR */}
        <aside className="space-y-5">
          <ThumbNailSection />

          <div className="rounded-xl border bg-card p-4 shadow-sm space-y-4">
            <AddTagInput
              onTagsChange={setHashtags}
              label="Hashtags"
              placeholder="Ex: Bitcoin, Nostr"
            />

            <AddTagInput
              onTagsChange={setIndexers}
              label="Indexers"
              placeholder="Ex: imdb:tt12345"
            />
          </div>

          <ContentWarningInput />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <LanguageInput />
            <AgeRestrictionInput />
          </div>
        </aside>
      </div>
    </div>
  );
}


function ActionForm() {
  const saveDraft = useVideoUploadStore(s => s.saveDraft);
  const snap = useVideoUploadStore(s => s.videoData);
  const { publish, isPending } = usePublishVideo();

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end pt-2">
      <Button
        variant="outline"
        size="sm"
        onClick={saveDraft}
      >
        {t("save_as_draft")}
      </Button>

      <ButtonWithLoader
        size="sm"
        onClick={() => publish(snap)}
        isLoading={isPending}
        disabled={!snap.url || !snap.title}
      >
        {t("Publish")}
      </ButtonWithLoader>
    </div>
  );
}

function PlayerSwitch() {
  const { url, title, thumbnail } = useVideoUploadStore(s => s.videoData);

  return (
    <div className="w-full overflow-hidden rounded-2xl border bg-background shadow-sm aspect-video">
      {url ? (
        <Player url={url} title={title} image={thumbnail} />
      ) : (
        <VideoUpload />
      )}
    </div>
  );
}


function TitleInput() {
  const title = useVideoUploadStore((s) => s.videoData.title);
  const setTitle = useVideoUploadStore((s) => s.setTitle);
  return <Textarea
    value={title}
    onChange={(e) => setTitle(e.target.value)}
    placeholder={t("add_a_video_title") + "..."}
    autoFocus
    className="invisible-textarea text-3xl font-semibold tracking-tight placeholder:text-muted-foreground/70"
  />;
}

function SummaryInput() {
  const summary = useVideoUploadStore((s) => s.videoData.summary);
  const setSummary = useVideoUploadStore((s) => s.setSummary);
  return <Textarea
    value={summary}
    onChange={(e) => setSummary(e.target.value)}
    placeholder={t("write_a_short_summary_or_description") + "..."}
    // summary precisa ter uma altura maior
    className="invisible-textarea min-h-[150px] text-base placeholder:text-muted-foreground/70"
  />;
}

function LanguageInput() {
  const setLanguage = useVideoUploadStore((s) => s.setLanguage);
  return <LanguagesCombo
    label={t("Language")}
    placeholder={t("Select_language")}
    onChange={(lang) => lang && setLanguage(lang?.id)}
  />;
}

function ContentWarningInput() {
  const setContentWarning = useVideoUploadStore((s) => s.setContentWarning);
  const contentWarning = useVideoUploadStore((s) => s.videoData.contentWarning);
  return <div className="rounded-xl border bg-card p-4 shadow-sm space-y-2">
    <Label className="text-sm font-medium">{t("Content_warning", "Content warning")}</Label>
    <Textarea
      value={contentWarning}
      onChange={(e) => setContentWarning(e.target.value)}
      placeholder={t("content_warning_placeholder")}
      className="text-sm min-h-[60px]"
    />
  </div>;
}

function ThumbNailSection() {
  const thumbnail = useVideoUploadStore((s) => s.videoData.thumbnail);
  const setThumbnail = useVideoUploadStore((s) => s.setThumbnail);
  return <div className={cn("rounded-xl border bg-card p-4 shadow-sm", thumbnail && "space-y-3")}>
    <Label className="text-sm font-medium">Thumbnail</Label>
    {thumbnail ? (
      <div className="relative group">
        <Image
          src={thumbnail}
          alt="Thumbnail"
          className="w-full rounded-md border object-cover aspect-video"
          width="288"
        />
        <Button
          variant="secondary"
          size="sm"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setThumbnail("")}
        >
          Change
        </Button>
      </div>
    ) : (
      <ButtonUploadThumb
        setUrl={(url) => url && setThumbnail(url)}
        url={thumbnail}
        accept={{ "image/*": [] }}
      >
        <Button variant="outline" className="w-full">Upload Thumbnail</Button>
      </ButtonUploadThumb>
    )}
  </div>;
}

function AgeRestrictionInput() {
  const setAge = useVideoUploadStore((s) => s.setAge);
  const age = useVideoUploadStore((s) => s.videoData.age);
  return <AgeCombo
    label={t("Age_Restriction")}
    placeholder={t("Select_Age_Restriction")}
    onChange={(age) => age && setAge(age)}
    value={age}
  />;
}