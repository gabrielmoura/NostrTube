import { useNavigate } from '@tanstack/react-router'
import { t } from 'i18next'
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Copy,
  ExternalLink,
  Film,
  ImagePlus,
  LinkIcon,
  Rocket,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  WandSparkles,
} from 'lucide-react'
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ButtonWithLoader } from '@/components/ButtonWithLoader'
import { Image } from '@/components/Image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/videoPlayer/components/Tooltip'
import { UploadFormView } from '@/features/upload/components/UploadFormView'
import { useUploadDraftPersistence } from '@/features/upload/hooks/useUploadDraftPersistence'
import {
  generateVideoThumbnailFromUrl,
  prepareVideoUploadAsset,
} from '@/features/upload/services/local-media-processing.service'
import { copyText } from '@/helper/format'
import { usePublishVideo } from '@/hooks/usePublishVideo'
import Player, { VideoUpload } from '@/routes/new/@components/VideoUpload'
import { useVideoUploadStore } from '@/store/videoUpload/useVideoUploadStore'

interface PublishedState {
  naddr: string
  shareUrl: string
}

function StepDot({ current, step, label }: { current: number; step: 1 | 2 | 3; label: string }) {
  const active = current === step
  const completed = current > step

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <div
        className={`flex size-10 shrink-0 items-center justify-center rounded-2xl border text-sm font-semibold transition-colors ${
          completed
            ? 'border-primary bg-primary text-primary-foreground shadow-[0_0_24px_color-mix(in_oklab,var(--primary)_24%,transparent)]'
            : active
              ? 'border-primary/70 bg-primary/14 text-primary'
              : 'border-border bg-secondary/45 text-muted-foreground'
        }`}
      >
        {completed ? <CheckCircle2 className="size-4" /> : step}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{label}</p>
        <p className="hidden text-xs text-muted-foreground sm:block">
          {completed
            ? t('complete', 'Complete')
            : active
              ? t('current_step', 'Current step')
              : t('next_step', 'Next step')}
        </p>
      </div>
    </div>
  )
}

function UploadWizardHeader({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border/70 bg-card/80 shadow-[0_20px_80px_color-mix(in_oklab,var(--background)_55%,black_20%)] backdrop-blur-xl">
      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-primary/80">Relay Cinema Upload</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            {t('creator_ready_title', 'Prepare a video event for the Nostr network')}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {t(
              'creator_ready_description',
              'Import media, enrich metadata, review the event and publish without leaving the current workflow.',
            )}
          </p>
        </div>
        <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">{t('wizard_progress', 'Wizard progress')}</p>
              <p className="text-2xl font-semibold tabular-nums">{currentStep}/3</p>
            </div>
            <Rocket className="size-8 text-primary" />
          </div>
        </div>
      </div>
      <div className="grid gap-4 border-t border-border/70 bg-secondary/20 p-4 sm:grid-cols-3 sm:px-6">
        <StepDot current={currentStep} step={1} label={t('Select_file', 'Select file')} />
        <StepDot current={currentStep} step={2} label={t('Metadata', 'Metadata')} />
        <StepDot current={currentStep} step={3} label={t('Review_publish', 'Review and publish')} />
      </div>
    </div>
  )
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
  )
}

function UploadProgressSummary({
  isUploading,
  uploadProgress,
  uploadStage,
  hasVideo,
}: {
  isUploading: boolean
  uploadProgress: number
  uploadStage: string
  hasVideo: boolean
}) {
  const statusText = useMemo(() => {
    if (isUploading && uploadStage === 'processing') {
      return t('processing_video', 'Preparing metadata, thumbnails and optional optimization...')
    }
    if (isUploading && uploadStage === 'mirroring') {
      return t('mirroring_upload', 'Replicating media to your configured servers...')
    }
    if (isUploading) {
      return t('Sending_files', 'Sending files')
    }
    if (hasVideo) {
      return t('upload_complete', 'Upload complete. Continue to metadata.')
    }
    return t('upload_ready_hint', 'Upload or import a playable video source to continue.')
  }, [hasVideo, isUploading, uploadStage])

  return (
    <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">{t('Upload_status', 'Upload status')}</p>
          <p className="text-sm text-muted-foreground">{statusText}</p>
        </div>
        <p className="shrink-0 text-2xl font-semibold tabular-nums">
          {isUploading ? `${uploadProgress}%` : hasVideo ? '100%' : '0%'}
        </p>
      </div>
      <Progress value={isUploading ? uploadProgress : hasVideo ? 100 : 0} className="mt-4 h-2.5" />
    </div>
  )
}

function UploadReviewCard({
  title,
  summary,
  thumbnail,
  language,
  hashtags,
  indexers,
}: {
  title?: string
  summary?: string
  thumbnail?: string
  language?: string
  hashtags?: string[]
  indexers?: string[]
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">{t('Title', 'Title')}</p>
            <p className="text-lg font-semibold">{title || t('missing_title', 'Missing title')}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('Description', 'Description')}</p>
            <p className="whitespace-pre-wrap text-sm leading-6 text-foreground/90">
              {summary || t('missing_description', 'Add a short description before publishing.')}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <p className="text-sm text-muted-foreground">{t('Language', 'Language')}</p>
                <InfoHint
                  text={t(
                    'language_tooltip',
                    'This helps discovery and recommendation ranking for the right audience.',
                  )}
                />
              </div>
              <p className="text-sm font-medium uppercase">{language || '-'}</p>
            </div>
            <div>
              <div className="mb-2 flex items-center gap-2">
                <p className="text-sm text-muted-foreground">Indexers</p>
                <InfoHint
                  text={t(
                    'indexers_tooltip',
                    'Use indexer identifiers when you want to link this video to external catalog systems.',
                  )}
                />
              </div>
              <p className="text-sm font-medium">{indexers?.length ? indexers.join(', ') : '-'}</p>
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm text-muted-foreground">Hashtags</p>
            <div className="flex flex-wrap gap-2">
              {hashtags?.length ? (
                hashtags.map((tag) => (
                  <span key={tag} className="rounded-full border bg-secondary px-3 py-1 text-xs font-medium">
                    #{tag}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">{t('no_tags_added', 'No tags added yet.')}</span>
              )}
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-xl border border-border/70 bg-background/60 p-3">
            <p className="mb-3 text-sm font-medium">Thumbnail</p>
            {thumbnail ? (
              <Image
                src={thumbnail}
                alt="Thumbnail"
                width={288}
                className="aspect-video w-full rounded-lg border object-cover"
              />
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                {t('thumbnail_optional_hint', 'Thumbnail optional. A generated preview will be used if available.')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function looksLikeImageUrl(value?: string) {
  if (!value) return false
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function UploadSidebarPanel({ onSaveDraft, uploadStage }: { onSaveDraft: () => void; uploadStage: string }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const videoData = useVideoUploadStore((state) => state.videoData)
  const thumbnailPreviewUrl = useVideoUploadStore((state) => state.thumbnailPreviewUrl)
  const thumbnailState = useVideoUploadStore((state) => state.thumbnailState)
  const sourceVideoFile = useVideoUploadStore((state) => state.sourceVideoFile)
  const setThumbnailMode = useVideoUploadStore((state) => state.setThumbnailMode)
  const setThumbnailFile = useVideoUploadStore((state) => state.setThumbnailFile)
  const setThumbnailRemoteUrl = useVideoUploadStore((state) => state.setThumbnailRemoteUrl)
  const setThumbnailInputUrl = useVideoUploadStore((state) => state.setThumbnailInputUrl)
  const setThumbnailGenerating = useVideoUploadStore((state) => state.setThumbnailGenerating)
  const setThumbnailError = useVideoUploadStore((state) => state.setThumbnailError)
  const setVideoData = useVideoUploadStore((state) => state.setVideoData)
  const clearThumbnail = useVideoUploadStore((state) => state.clearThumbnail)
  const thumbnail =
    thumbnailState.localPreviewUrl || thumbnailState.remoteUrl || thumbnailPreviewUrl || videoData.thumbnail
  const isUrlModeInvalid =
    thumbnailState.mode === 'url' && Boolean(thumbnailState.inputUrl) && !looksLikeImageUrl(thumbnailState.inputUrl)
  const isAutoWorking = thumbnailState.isGenerating || (thumbnailState.mode === 'auto' && uploadStage === 'processing')

  const handleManualThumbnail = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setThumbnailError(t('invalid_file_type', 'Invalid file type'))
      return
    }

    setThumbnailMode('upload')
    setThumbnailFile(file, URL.createObjectURL(file))
  }

  const handleUrlChange = (value: string) => {
    setThumbnailMode('url')
    setThumbnailInputUrl(value)
    if (!value.trim()) {
      setThumbnailError(undefined)
      return
    }
    if (looksLikeImageUrl(value)) {
      setThumbnailRemoteUrl(value.trim())
      return
    }
    setThumbnailError(t('invalid_thumbnail_url', 'Enter a valid image URL.'))
  }

  const handleAutoRetry = async () => {
    setThumbnailMode('auto')
    if (!sourceVideoFile && !videoData.url) {
      setThumbnailError(t('thumbnail_wait_for_video', 'Select or restore a video before generating a thumbnail.'))
      return
    }

    try {
      setThumbnailGenerating(true)
      setThumbnailError(undefined)

      if (sourceVideoFile) {
        const prepared = await prepareVideoUploadAsset(sourceVideoFile, {
          enableFFmpeg: true,
          generateThumbnail: true,
          thumbnailGenerationMode: 'local',
        })

        if (!prepared.thumbnailFile || !prepared.thumbnailPreviewUrl) {
          throw new Error(t('thumbnail_generation_failed', 'Could not generate a thumbnail automatically.'))
        }

        if (prepared.duration && !videoData.duration) {
          setVideoData({ duration: prepared.duration })
        }

        setThumbnailFile(prepared.thumbnailFile, prepared.thumbnailPreviewUrl)
        return
      }

      if (videoData.url) {
        const generated = await generateVideoThumbnailFromUrl(videoData.url, videoData.title || 'video-thumbnail')
        if (generated.duration && !videoData.duration) {
          setVideoData({ duration: generated.duration })
        }
        setThumbnailFile(generated.file, generated.objectUrl)
      }
    } catch (error) {
      setThumbnailError(error instanceof Error ? error.message : String(error))
    } finally {
      setThumbnailGenerating(false)
    }
  }

  const modeButtonClass = (active: boolean) =>
    active
      ? 'border-primary/50 bg-primary/10 text-primary'
      : 'border-border/70 bg-background/50 text-muted-foreground hover:bg-muted/50 hover:text-foreground'

  return (
    <aside className="space-y-5 lg:sticky lg:top-24 lg:h-fit">
      <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur">
        <div className="mb-3 flex items-center gap-2">
          <p className="text-sm font-medium">Thumbnail</p>
          <InfoHint
            text={t(
              'thumbnail_tooltip',
              'Generate a frame automatically, upload an image, or use a public image URL. Local previews are uploaded before publishing.',
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            className={`rounded-xl border px-2 py-2 text-xs font-medium transition-colors ${modeButtonClass(thumbnailState.mode === 'auto')}`}
            onClick={() => void handleAutoRetry()}
          >
            <WandSparkles className="mx-auto mb-1 size-4" />
            Auto
          </button>
          <button
            type="button"
            className={`rounded-xl border px-2 py-2 text-xs font-medium transition-colors ${modeButtonClass(thumbnailState.mode === 'upload')}`}
            onClick={() => {
              setThumbnailMode('upload')
              fileInputRef.current?.click()
            }}
          >
            <UploadCloud className="mx-auto mb-1 size-4" />
            Upload
          </button>
          <button
            type="button"
            className={`rounded-xl border px-2 py-2 text-xs font-medium transition-colors ${modeButtonClass(thumbnailState.mode === 'url')}`}
            onClick={() => setThumbnailMode('url')}
          >
            <LinkIcon className="mx-auto mb-1 size-4" />
            URL
          </button>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={handleManualThumbnail} />

        <div className="mt-3 overflow-hidden rounded-xl border border-border/70 bg-background/60">
          {thumbnail ? (
            <div className="relative">
              <img
                src={thumbnail}
                alt={t('thumbnail_preview', 'Thumbnail preview')}
                className="aspect-video w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent px-3 py-3 text-white">
                <p className="text-sm font-medium">
                  {thumbnailState.file
                    ? t('thumbnail_local_ready', 'Thumbnail ready for upload')
                    : t('thumbnail_loaded', 'Thumbnail loaded')}
                </p>
                <p className="text-xs text-white/80">
                  {thumbnailState.file
                    ? t('thumbnail_uploads_on_publish', 'It will be uploaded to Blossom before publishing.')
                    : t('thumbnail_public_url_ready', 'This public URL will be used in the event.')}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex aspect-video flex-col items-center justify-center gap-2 p-4 text-center text-muted-foreground">
              <ImagePlus className="size-8" />
              <p className="text-sm font-medium text-foreground">
                {t('no_thumbnail_available', 'No thumbnail available')}
              </p>
              <p className="max-w-[240px] text-xs">
                {t(
                  'thumbnail_empty_hint',
                  'Auto generation starts after selecting a local video. You can also upload an image or paste a URL.',
                )}
              </p>
            </div>
          )}
        </div>

        {thumbnailState.mode === 'url' ? (
          <div className="mt-3 space-y-2">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="thumbnail-url">
              URL da thumbnail
            </label>
            <Input
              id="thumbnail-url"
              value={thumbnailState.inputUrl ?? ''}
              placeholder="https://example.com/thumbnail.jpg"
              aria-invalid={isUrlModeInvalid}
              onChange={(event) => handleUrlChange(event.target.value)}
            />
          </div>
        ) : null}

        <div className="mt-3 space-y-2">
          {isAutoWorking ? (
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
              {t('generating_thumbnail', 'Generating thumbnail...')}
            </div>
          ) : null}
          {thumbnailState.isUploading ? (
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
              {t('uploading_thumbnail', 'Uploading thumbnail before publishing...')}
            </div>
          ) : null}
          {thumbnailState.error ? (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <p>{thumbnailState.error}</p>
            </div>
          ) : null}
          {!thumbnail && thumbnailState.mode === 'auto' && videoData.url ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => void handleAutoRetry()}
              disabled={thumbnailState.isGenerating}
            >
              <WandSparkles className="size-4" />
              {t('generate_thumbnail_now', 'Generate thumbnail now')}
            </Button>
          ) : null}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => fileInputRef.current?.click()}>
              <UploadCloud className="size-4" />
              {thumbnail ? t('replace', 'Replace') : t('Upload_thumbnail', 'Upload thumbnail')}
            </Button>
            {thumbnail ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearThumbnail}
                aria-label={t('remove_thumbnail', 'Remove thumbnail')}
              >
                <Trash2 className="size-4" />
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <p className="text-sm font-medium">{t('publish_tips', 'Publishing tips')}</p>
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>{t('publish_tip_title', 'Use a direct, descriptive title so the feed remains scannable.')}</li>
          <li>{t('publish_tip_tags', 'Add a few strong tags instead of many weak ones.')}</li>
          <li>{t('publish_tip_language', 'Set the content language to improve discovery.')}</li>
        </ul>
        <Button variant="ghost" className="mt-4 w-full" onClick={onSaveDraft}>
          {t('save_as_draft')}
        </Button>
      </div>
    </aside>
  )
}

export function UploadPageContainer() {
  const navigate = useNavigate()
  const videoData = useVideoUploadStore((state) => state.videoData)
  const thumbnailPreviewUrl = useVideoUploadStore((state) => state.thumbnailPreviewUrl)
  const thumbnailState = useVideoUploadStore((state) => state.thumbnailState)
  const currentStep = useVideoUploadStore((state) => state.currentStep)
  const setCurrentStep = useVideoUploadStore((state) => state.setCurrentStep)
  const setTitle = useVideoUploadStore((state) => state.setTitle)
  const setSummary = useVideoUploadStore((state) => state.setSummary)
  const setContentWarning = useVideoUploadStore((state) => state.setContentWarning)
  const setHashtags = useVideoUploadStore((state) => state.setHashtags)
  const setIndexers = useVideoUploadStore((state) => state.setIndexers)
  const setLanguage = useVideoUploadStore((state) => state.setLanguage)
  const setGeohash = useVideoUploadStore((state) => state.setGeohash)
  const setContentType = useVideoUploadStore((state) => state.setContentType)
  const clearUploadedMedia = useVideoUploadStore((state) => state.clearUploadedMedia)
  const resetForm = useVideoUploadStore((state) => state.resetForm)
  const isUploading = useVideoUploadStore((state) => state.isUploading)
  const uploadProgress = useVideoUploadStore((state) => state.uploadProgress)
  const uploadStage = useVideoUploadStore((state) => state.uploadStage)

  const { publish, isPending } = usePublishVideo()
  const { saveDraft, restoreDraft, clearDraft } = useUploadDraftPersistence()
  const [publishedState, setPublishedState] = useState<PublishedState | null>(null)

  useEffect(() => {
    void restoreDraft()
  }, [restoreDraft])

  const displayThumbnail =
    thumbnailState.localPreviewUrl || thumbnailState.remoteUrl || thumbnailPreviewUrl || videoData.thumbnail
  const canContinueFromStepOne = Boolean(videoData.url) && !isUploading
  const canContinueFromStepTwo = Boolean(videoData.title?.trim())
  const canPublish = Boolean(videoData.url && videoData.title && !publishedState)

  const handleNext = () => {
    if (currentStep === 1 && canContinueFromStepOne) {
      setCurrentStep(2)
      return
    }

    if (currentStep === 2 && canContinueFromStepTwo) {
      setCurrentStep(3)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as 1 | 2 | 3)
    }
  }

  const handlePublish = async () => {
    const result = await publish(videoData)
    if (!result) return
    await clearDraft()
    setPublishedState({ naddr: result.naddr, shareUrl: result.shareUrl })
  }

  const handleCopyLink = async () => {
    if (!publishedState) return
    await copyText(publishedState.shareUrl)
    toast.success(t('Link copied!', 'Link copied!'))
  }

  const handlePublishAnother = async () => {
    setPublishedState(null)
    await clearDraft()
    resetForm()
  }

  const handleSaveDraft = () => {
    void saveDraft()
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <UploadWizardHeader currentStep={currentStep} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          {publishedState ? (
            <div className="rounded-3xl border border-primary/30 bg-primary/10 p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3 text-primary">
                <CheckCircle2 className="size-6" />
                <h2 className="text-xl font-semibold">{t('publish_success_title', 'Video ready to share')}</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {t(
                  'publish_success_description',
                  'The event was published successfully. You can copy the public link or open the video now.',
                )}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={handleCopyLink}>
                  <Copy className="size-4" />
                  {t('copy_link', 'Copy link')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate({ to: '/v/$eventId', params: { eventId: publishedState.naddr } })}
                >
                  <ExternalLink className="size-4" />
                  {t('go_to_video', 'Go to video')}
                </Button>
                <Button variant="ghost" onClick={() => void handlePublishAnother()}>
                  {t('publish_another', 'Publish another')}
                </Button>
              </div>
            </div>
          ) : null}

          {currentStep === 1 ? (
            <>
              <div className="overflow-hidden rounded-3xl border border-border/70 bg-background/70 shadow-sm">
                {videoData.url ? (
                  <Player
                    url={videoData.url}
                    title={videoData.title}
                    image={displayThumbnail}
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
                    {t('replace_file', 'Replace file')}
                  </Button>
                  <Button onClick={handleNext} disabled={!canContinueFromStepOne}>
                    {t('continue_to_metadata', 'Continue to metadata')}
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
                  <Film className="mb-3 size-5 text-primary" />
                  <p className="text-sm font-medium">{t('video_first_upload', 'Video-first')}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('video_first_upload_desc', 'Preview the exact playback source before metadata work.')}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
                  <ShieldCheck className="mb-3 size-5 text-relay-green" />
                  <p className="text-sm font-medium">{t('local_safe_upload', 'Local-safe')}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('local_safe_upload_desc', 'Drafts and processing stay recoverable during the flow.')}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
                  <Sparkles className="mb-3 size-5 text-lightning" />
                  <p className="text-sm font-medium">{t('discoverable_upload', 'Discoverable')}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('discoverable_upload_desc', 'Tags, language and thumbnail improve feed quality.')}
                  </p>
                </div>
              </div>
            </>
          ) : null}

          {currentStep === 2 ? (
            <div className="space-y-6">
              <div className="overflow-hidden rounded-3xl border border-border/70 bg-background/70 shadow-sm">
                {videoData.url ? (
                  <Player
                    url={videoData.url}
                    title={videoData.title}
                    image={displayThumbnail}
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
                contentType={videoData.contentType}
                onTitleChange={setTitle}
                onSummaryChange={setSummary}
                onContentWarningChange={setContentWarning}
                onHashtagsChange={setHashtags}
                onIndexersChange={setIndexers}
                onLanguageChange={setLanguage}
                onGeohashChange={setGeohash}
                onContentTypeChange={setContentType}
              />
            </div>
          ) : null}

          {currentStep === 3 ? (
            <div className="space-y-6">
              <div className="overflow-hidden rounded-3xl border border-border/70 bg-background/70 shadow-sm">
                {videoData.url ? (
                  <Player
                    url={videoData.url}
                    title={videoData.title}
                    image={displayThumbnail}
                    mimeType={videoData.mime_type}
                  />
                ) : (
                  <VideoUpload />
                )}
              </div>
              <UploadReviewCard
                title={videoData.title}
                summary={videoData.summary}
                thumbnail={displayThumbnail}
                language={videoData.language}
                hashtags={videoData.hashtags}
                indexers={videoData.indexers}
              />
            </div>
          ) : null}

          {!publishedState ? (
            <div className="sticky bottom-4 z-20 flex flex-wrap items-center gap-3 rounded-2xl border border-border/70 bg-card/90 p-3 shadow-[0_18px_60px_color-mix(in_oklab,var(--background)_45%,black_28%)] backdrop-blur-xl">
              <Button variant="ghost" onClick={handleBack} disabled={currentStep === 1}>
                <ChevronLeft className="size-4" />
                {t('Back', 'Back')}
              </Button>
              <div className="ml-auto flex flex-wrap gap-2 sm:gap-3">
                <Button variant="glass" onClick={handleSaveDraft}>
                  {t('save_as_draft')}
                </Button>
                {currentStep < 3 ? (
                  <Button
                    variant="gradient"
                    onClick={handleNext}
                    disabled={currentStep === 1 ? !canContinueFromStepOne : !canContinueFromStepTwo}
                  >
                    {currentStep === 1
                      ? t('continue_to_metadata', 'Continue to metadata')
                      : t('continue_to_review', 'Continue to review')}
                    <ChevronRight className="size-4" />
                  </Button>
                ) : (
                  <ButtonWithLoader onClick={handlePublish} isLoading={isPending} disabled={!canPublish}>
                    {t('Publish')}
                  </ButtonWithLoader>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <UploadSidebarPanel onSaveDraft={handleSaveDraft} uploadStage={uploadStage} />
      </div>
    </div>
  )
}
