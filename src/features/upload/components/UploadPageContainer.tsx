import { useState } from "react";
import { t } from "i18next";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { CheckCircle2, ChevronLeft, ChevronRight, CircleHelp, Copy, ExternalLink, Sparkles } from "lucide-react";
import { VideoUpload } from "@/routes/new/@components/VideoUpload";
import Player from "@/routes/new/@components/VideoUpload";
import { useVideoUploadStore } from "@/store/videoUpload/useVideoUploadStore";
import { usePublishVideo } from "@/hooks/usePublishVideo";
import { UploadFormView } from "@/features/upload/components/UploadFormView";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ButtonWithLoader } from "@/components/ButtonWithLoader";
import { Image } from "@/components/Image";
import { ButtonUploadThumb } from "@/routes/new/@components/ButtonUploadThumb";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/videoPlayer/components/Tooltip";
import { copyText } from "@/helper/format";

interface PublishedState {
  naddr: string;
  shareUrl: string;
}

function StepDot({ current, step, label }: { current: number; step: 1 | 2 | 3; label: string }) {
  const active = current === step;
  const completed = current > step;

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <div
        className={`flex size-10 items-center justify-center rounded-full border text-sm font-semibold ${
          completed
            ? "border-primary bg-primary text-primary-foreground"
            : active
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-background text-muted-foreground"
        }`}
      >
        {completed ? <CheckCircle2 className="size-4" /> : step}
      </div>
      <p className="min-w-0 text-sm font-medium">{label}</p>
    </div>
  );
}

function UploadWizardHeader({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
        <StepDot current={currentStep} step={1} label={t("Select_file", "Select file")} />
        <StepDot current={currentStep} step={2} label={t("Metadata", "Metadata")} />
        <StepDot current={currentStep} step={3} label={t("Review_publish", "Review and publish")} />
      </div>
    </div>
  );
}

function InfoHint({ text }: { text: string }) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={text}
          >
            <CircleHelp className="size-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-balance">{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function UploadProgressSummary({
  isUploading,
  uploadProgress,
  uploadStage,
  hasVideo
}: {
  isUploading: boolean;
  uploadProgress: number;
  uploadStage: string;
  hasVideo: boolean;
}) {
  const statusText = isUploading && uploadStage === "processing"
    ? t("processing_video", "Processing video metadata...")
    : isUploading
      ? t("Sending_files", "Sending files")
      : hasVideo
        ? t("upload_complete", "Upload complete. Continue to metadata.")
        : t("upload_ready_hint", "Upload or import a playable video source to continue.");

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{t("Upload_status", "Upload status")}</p>
          <p className="text-sm text-muted-foreground">{statusText}</p>
        </div>
        <p className="text-2xl font-semibold tabular-nums">
          {isUploading ? `${uploadProgress}%` : hasVideo ? "100%" : "0%"}
        </p>
      </div>
      <Progress value={isUploading ? uploadProgress : hasVideo ? 100 : 0} className="mt-4 h-2.5" />
    </div>
  );
}

function UploadReviewCard({
  title,
  summary,
  thumbnail,
  language,
  hashtags,
  indexers
}: {
  title?: string;
  summary?: string;
  thumbnail?: string;
  language?: string;
  hashtags?: string[];
  indexers?: string[];
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">{t("Title", "Title")}</p>
            <p className="text-lg font-semibold">{title || t("missing_title", "Missing title")}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("Description", "Description")}</p>
            <p className="whitespace-pre-wrap text-sm leading-6 text-foreground/90">
              {summary || t("missing_description", "Add a short description before publishing.")}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <p className="text-sm text-muted-foreground">{t("Language", "Language")}</p>
                <InfoHint text={t("language_tooltip", "This helps discovery and recommendation ranking for the right audience.")} />
              </div>
              <p className="text-sm font-medium uppercase">{language || "-"}</p>
            </div>
            <div>
              <div className="mb-2 flex items-center gap-2">
                <p className="text-sm text-muted-foreground">Indexers</p>
                <InfoHint text={t("indexers_tooltip", "Use indexer identifiers when you want to link this video to external catalog systems.")} />
              </div>
              <p className="text-sm font-medium">{indexers?.length ? indexers.join(", ") : "-"}</p>
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm text-muted-foreground">Hashtags</p>
            <div className="flex flex-wrap gap-2">
              {hashtags?.length
                ? hashtags.map((tag) => (
                  <span key={tag} className="rounded-full border bg-secondary px-3 py-1 text-xs font-medium">
                    #{tag}
                  </span>
                ))
                : <span className="text-sm text-muted-foreground">{t("no_tags_added", "No tags added yet.")}</span>}
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-xl border bg-background p-3">
            <p className="mb-3 text-sm font-medium">Thumbnail</p>
            {thumbnail ? (
              <Image src={thumbnail} alt="Thumbnail" width={288} className="aspect-video w-full rounded-lg border object-cover" />
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                {t("thumbnail_optional_hint", "Thumbnail optional. A generated preview will be used if available.")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadSidebarPanel({
  thumbnail,
  onThumbnailChange,
  onSaveDraft
}: {
  thumbnail?: string;
  onThumbnailChange: (value: string) => void;
  onSaveDraft: () => void;
}) {
  return (
    <aside className="space-y-5 lg:sticky lg:top-24">
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <p className="text-sm font-medium">Thumbnail</p>
          <InfoHint text={t("thumbnail_tooltip", "Choose a clearer cover if the automatic frame is not ideal. This keeps the video card visually strong in feeds.")} />
        </div>
        {thumbnail ? (
          <div className="space-y-3">
            <Image src={thumbnail} alt="Thumbnail" width={288} className="aspect-video w-full rounded-lg border object-cover" />
            <Button variant="outline" className="w-full" onClick={() => onThumbnailChange("")}>{t("Change", "Change")}</Button>
          </div>
        ) : (
          <ButtonUploadThumb
            setUrl={(url) => url && onThumbnailChange(url)}
            url={thumbnail}
            accept={{ "image/*": [] }}
          >
            <Button variant="outline" className="w-full">{t("Upload_thumbnail", "Upload thumbnail")}</Button>
          </ButtonUploadThumb>
        )}
      </div>

      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <p className="text-sm font-medium">{t("publish_tips", "Publishing tips")}</p>
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>{t("publish_tip_title", "Use a direct, descriptive title so the feed remains scannable.")}</li>
          <li>{t("publish_tip_tags", "Add a few strong tags instead of many weak ones.")}</li>
          <li>{t("publish_tip_language", "Set the content language to improve discovery.")}</li>
        </ul>
        <Button variant="ghost" className="mt-4 w-full" onClick={onSaveDraft}>
          {t("save_as_draft")}
        </Button>
      </div>
    </aside>
  );
}

export function UploadPageContainer() {
  const navigate = useNavigate();
  const videoData = useVideoUploadStore((state) => state.videoData);
  const currentStep = useVideoUploadStore((state) => state.currentStep);
  const setCurrentStep = useVideoUploadStore((state) => state.setCurrentStep);
  const setTitle = useVideoUploadStore((state) => state.setTitle);
  const setSummary = useVideoUploadStore((state) => state.setSummary);
  const setContentWarning = useVideoUploadStore((state) => state.setContentWarning);
  const setHashtags = useVideoUploadStore((state) => state.setHashtags);
  const setIndexers = useVideoUploadStore((state) => state.setIndexers);
  const setLanguage = useVideoUploadStore((state) => state.setLanguage);
  const setGeohash = useVideoUploadStore((state) => state.setGeohash);
  const setThumbnail = useVideoUploadStore((state) => state.setThumbnail);
  const saveDraft = useVideoUploadStore((state) => state.saveDraft);
  const clearUploadedMedia = useVideoUploadStore((state) => state.clearUploadedMedia);
  const resetForm = useVideoUploadStore((state) => state.resetForm);
  const isUploading = useVideoUploadStore((state) => state.isUploading);
  const uploadProgress = useVideoUploadStore((state) => state.uploadProgress);
  const uploadStage = useVideoUploadStore((state) => state.uploadStage);

  const { publish, isPending } = usePublishVideo();
  const [publishedState, setPublishedState] = useState<PublishedState | null>(null);

  const canContinueFromStepOne = Boolean(videoData.url) && !isUploading;
  const canContinueFromStepTwo = Boolean(videoData.title?.trim());
  const canPublish = Boolean(videoData.url && videoData.title && !publishedState);

  const handleNext = () => {
    if (currentStep === 1 && canContinueFromStepOne) {
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2 && canContinueFromStepTwo) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as 1 | 2 | 3);
    }
  };

  const handlePublish = async () => {
    const result = await publish(videoData);
    if (!result) return;
    setPublishedState({ naddr: result.naddr, shareUrl: result.shareUrl });
  };

  const handleCopyLink = async () => {
    if (!publishedState) return;
    await copyText(publishedState.shareUrl);
    toast.success(t("Link copied!", "Link copied!"));
  };

  const handlePublishAnother = () => {
    setPublishedState(null);
    resetForm();
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-4 sm:px-6 lg:px-8">
      <UploadWizardHeader currentStep={currentStep} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          {publishedState ? (
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3 text-primary">
                <CheckCircle2 className="size-6" />
                <h2 className="text-xl font-semibold">{t("publish_success_title", "Video ready to share")}</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("publish_success_description", "The event was published successfully. You can copy the public link or open the video now.")}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={handleCopyLink}>
                  <Copy className="size-4" />
                  {t("copy_link", "Copy link")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate({ to: "/v/$eventId", params: { eventId: publishedState.naddr } })}
                >
                  <ExternalLink className="size-4" />
                  {t("go_to_video", "Go to video")}
                </Button>
                <Button variant="ghost" onClick={handlePublishAnother}>
                  {t("publish_another", "Publish another")}
                </Button>
              </div>
            </div>
          ) : null}

          {currentStep === 1 ? (
            <>
              <div className="w-full overflow-hidden rounded-2xl border bg-background shadow-sm">
                {videoData.url ? (
                  <Player
                    url={videoData.url}
                    title={videoData.title}
                    image={videoData.thumbnail}
                    mimeType={videoData.mime_type}
                  />
                ) : (
                  <VideoUpload />
                )}
              </div>

              <UploadProgressSummary
                isUploading={isUploading}
                uploadProgress={uploadProgress}
                uploadStage={uploadStage}
                hasVideo={Boolean(videoData.url)}
              />

              {videoData.url ? (
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={clearUploadedMedia}>
                    {t("replace_file", "Replace file")}
                  </Button>
                  <Button onClick={handleNext} disabled={!canContinueFromStepOne}>
                    {t("continue_to_metadata", "Continue to metadata")}
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              ) : null}
            </>
          ) : null}

          {currentStep === 2 ? (
            <div className="space-y-6">
              <div className="w-full overflow-hidden rounded-2xl border bg-background shadow-sm">
                {videoData.url ? (
                  <Player
                    url={videoData.url}
                    title={videoData.title}
                    image={videoData.thumbnail}
                    mimeType={videoData.mime_type}
                  />
                ) : (
                  <VideoUpload />
                )}
              </div>
              <UploadFormView
                title={videoData.title}
                summary={videoData.summary}
                contentWarning={videoData.contentWarning}
                hashtags={videoData.hashtags}
                indexers={videoData.indexers}
                language={videoData.language}
                geohash={videoData.geohash}
                onTitleChange={setTitle}
                onSummaryChange={setSummary}
                onContentWarningChange={setContentWarning}
                onHashtagsChange={setHashtags}
                onIndexersChange={setIndexers}
                onLanguageChange={setLanguage}
                onGeohashChange={setGeohash}
              />
            </div>
          ) : null}

          {currentStep === 3 ? (
            <div className="space-y-6">
              <div className="w-full overflow-hidden rounded-2xl border bg-background shadow-sm">
                {videoData.url ? (
                  <Player
                    url={videoData.url}
                    title={videoData.title}
                    image={videoData.thumbnail}
                    mimeType={videoData.mime_type}
                  />
                ) : (
                  <VideoUpload />
                )}
              </div>
              <UploadReviewCard
                title={videoData.title}
                summary={videoData.summary}
                thumbnail={videoData.thumbnail}
                language={videoData.language}
                hashtags={videoData.hashtags}
                indexers={videoData.indexers}
              />
            </div>
          ) : null}

          {!publishedState ? (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm">
              <Button variant="ghost" onClick={handleBack} disabled={currentStep === 1}>
                <ChevronLeft className="size-4" />
                {t("Back", "Back")}
              </Button>

              <div className="ml-auto flex flex-wrap gap-3">
                <Button variant="outline" onClick={saveDraft}>
                  {t("save_as_draft")}
                </Button>

                {currentStep < 3 ? (
                  <Button
                    onClick={handleNext}
                    disabled={currentStep === 1 ? !canContinueFromStepOne : !canContinueFromStepTwo}
                  >
                    {currentStep === 1 ? t("continue_to_metadata", "Continue to metadata") : t("continue_to_review", "Continue to review")}
                    <ChevronRight className="size-4" />
                  </Button>
                ) : (
                  <ButtonWithLoader onClick={handlePublish} isLoading={isPending} disabled={!canPublish}>
                    {t("Publish")}
                  </ButtonWithLoader>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <UploadSidebarPanel
          thumbnail={videoData.thumbnail}
          onThumbnailChange={setThumbnail}
          onSaveDraft={saveDraft}
        />
      </div>
    </div>
  );
}
