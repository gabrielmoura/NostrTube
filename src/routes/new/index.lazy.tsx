import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { lazy, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useSnapshot } from "valtio/react";
import { toast } from "sonner";
import { t } from "i18next";
import { useNDKCurrentUser } from "@nostr-dev-kit/ndk-hooks";

import { cn } from "@/helper/format.ts";
import { newVideoStore } from "@/store/videoUploadStore.ts";
import { usePublishVideo } from "@/hooks/usePublishVideo.ts";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/label.tsx";
import { Image } from "@/components/Image.tsx";
import { ButtonWithLoader } from "@/components/ButtonWithLoader.tsx";
import Player, { VideoUpload } from "@/routes/new/@components/VideoUpload.tsx";
import LanguagesCombo from "@/components/ComboBox/ComboLanguage.tsx";
import { AddTagInput } from "@/routes/new/@components/BoxAddToModal.tsx";
import { ButtonUploadThumb } from "@/routes/new/@components/ButtonUploadThumb.tsx";

// Lazy imports para performance
const Textarea = lazy(() => import("@/components/textarea.tsx"));

export const Route = createLazyFileRoute("/new/")({
  component: NewVideoPage
});

function NewVideoPage() {
  const navigate = useNavigate();
  const currentUser = useNDKCurrentUser();
  const snap = useSnapshot(newVideoStore);

  // Hook customizado encapsulando a mutação
  const { publish, isPending } = usePublishVideo();

  // Auth Guard
  useEffect(() => {
    if (!currentUser) {
      navigate({ to: "/" }).then(() =>
        toast.warning(t("auth_required", "You must be logged in to upload videos"))
      );
    }
  }, [currentUser, navigate]);

  const handlePublish = () => {
    publish(snap);
  };

  return (
    <div className="flex flex-col gap-8 lg:flex-row py-2.5 px-5">
      <Helmet>
        <title>{t("upload_new_video", "Upload New Video")} - NostrTube</title>
        <meta
          name="description"
          content={t("upload_desc", "Upload a new video to NostrTube.")}
        />
      </Helmet>

      {/* Main Column: Player & Meta */}
      <div className="flex-1 min-w-[320px] md:min-w-[500px] space-y-6">
        {/* Player / Upload Switcher */}
        <div className="w-full overflow-hidden rounded-2xl border bg-background shadow-sm">
          {snap.url ? (
            <Player url={snap.url} title={snap.title} image={snap.thumbnail} />
          ) : (
            <VideoUpload />
          )}
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <Textarea
            value={snap.title}
            onChange={(e) => (newVideoStore.title = e.target.value)}
            placeholder={t("add_a_video_title") + "..."}
            autoFocus
            className="invisible-textarea text-3xl font-semibold tracking-tight placeholder:text-muted-foreground/70"
          />

          <Textarea
            value={snap.summary}
            onChange={(e) => (newVideoStore.summary = e.target.value)}
            placeholder={t("write_summary") + "..."}
            className="invisible-textarea min-h-[70px] text-base placeholder:text-muted-foreground/70"
          />

          <div className="flex items-center gap-3 pt-2">
            <Button variant="outline" size="sm" disabled>
              {t("save_as_draft")}
            </Button>
            <ButtonWithLoader
              size="sm"
              onClick={handlePublish}
              isLoading={isPending}
              disabled={!snap.url || !snap.title}
            >
              {t("Publish")}
            </ButtonWithLoader>
          </div>
        </div>
      </div>

      {/* Sidebar: Settings */}
      <aside className="w-full lg:max-w-[380px] space-y-5">
        {/* Thumbnail Section */}
        <div className={cn("rounded-xl border bg-card p-4 shadow-sm", snap.thumbnail && "space-y-3")}>
          <Label className="text-sm font-medium">Thumbnail</Label>
          {snap.thumbnail ? (
            <div className="relative group">
              <Image
                src={snap.thumbnail}
                alt="Thumbnail"
                className="w-full rounded-md border object-cover aspect-video"
                width="288"
              />
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => newVideoStore.thumbnail = ""}
              >
                Change
              </Button>
            </div>
          ) : (
            <ButtonUploadThumb
              setUrl={(url) => (newVideoStore.thumbnail = url)}
              url={snap.thumbnail}
              accept={{ "image/*": [] }}
            >
              <Button variant="outline" className="w-full">Upload Thumbnail</Button>
            </ButtonUploadThumb>
          )}
        </div>

        <AddTagInput
          onTagsChange={(tags) => (newVideoStore.hashtags = tags)}
          label="Hashtags"
          placeholder="Ex: Bitcoin, Nostr"
        />

        <AddTagInput
          onTagsChange={(idx) => (newVideoStore.indexers = idx)}
          label="Indexers"
          placeholder="Ex: imdb:tt12345"
        />

        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-2">
          <Label className="text-sm font-medium">Content warning</Label>
          <Textarea
            value={snap.contentWarning}
            onChange={(e) => (newVideoStore.contentWarning = e.target.value)}
            placeholder="Optional warning (e.g. sensitive content)"
            className="text-sm min-h-[60px]"
          />
        </div>

        <LanguagesCombo
          label={t("Language")}
          placeholder={t("Select_language")}
          onChange={(lang) => (newVideoStore.language = lang?.id)}
        />
      </aside>
    </div>
  );
}