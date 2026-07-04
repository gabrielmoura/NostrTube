import { useNavigate } from '@tanstack/react-router'
import { t } from 'i18next'
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Film,
  LinkIcon,
  PlaySquare,
  Sparkles,
  Youtube,
} from 'lucide-react'
import { type FormEvent, useCallback, useMemo, useState } from 'react'
import { ButtonWithLoader } from '@/components/ButtonWithLoader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { VideoPlayer } from '@/components/videoPlayer'
import {
  buildYouTubeThumbnailUrl,
  buildYouTubeWatchUrl,
  extractYouTubeVideoId,
} from '@/features/import-youtube/services/youtube-url.service'
import { buildYouTubeVideoDraft } from '@/features/import-youtube/services/youtube-video-event.service'
import { UploadFormView } from '@/features/upload/components/UploadFormView'
import type { VideoContentType } from '@/features/video/services/video-kinds'
import { usePublishVideo } from '@/hooks/usePublishVideo'
import { cn } from '@/lib/utils'

interface YouTubeImportDraft {
  title: string
  summary: string
  contentWarning: string
  hashtags: string[]
  indexers: string[]
  duration?: number
  language?: string
  geohash?: string
  contentType?: VideoContentType
}

type ImportStatus = 'idle' | 'valid' | 'invalid' | 'importing' | 'ready'
type MetadataStatus = 'idle' | 'loading' | 'ready' | 'unavailable'

interface ImportedYouTubeVideo {
  videoId: string
  canonicalUrl: string
  thumbnailUrl: string
}

interface PublishedState {
  naddr: string
  shareUrl: string
}

const YOUTUBE_URL_PLACEHOLDER = 'https://www.youtube.com/watch?v=GHvYoKHmtGU'

function useYouTubeImportDraft() {
  const [draft, setDraft] = useState<YouTubeImportDraft>({
    title: '',
    summary: '',
    contentWarning: '',
    hashtags: [],
    indexers: [],
  })

  const setTitle = useCallback((title: string) => setDraft((current) => ({ ...current, title })), [])
  const setDuration = useCallback((duration?: number) => setDraft((current) => ({ ...current, duration })), [])
  const setSummary = useCallback((summary: string) => setDraft((current) => ({ ...current, summary })), [])
  const setContentWarning = useCallback(
    (contentWarning: string) => setDraft((current) => ({ ...current, contentWarning })),
    [],
  )
  const setHashtags = useCallback((hashtags: string[]) => setDraft((current) => ({ ...current, hashtags })), [])
  const setIndexers = useCallback((indexers: string[]) => setDraft((current) => ({ ...current, indexers })), [])
  const setLanguage = useCallback((language?: string) => setDraft((current) => ({ ...current, language })), [])
  const setGeohash = useCallback((geohash?: string) => setDraft((current) => ({ ...current, geohash })), [])
  const setContentType = useCallback(
    (contentType: VideoContentType) => setDraft((current) => ({ ...current, contentType })),
    [],
  )

  return {
    draft,
    setTitle,
    setDuration,
    setSummary,
    setContentWarning,
    setHashtags,
    setIndexers,
    setLanguage,
    setGeohash,
    setContentType,
  }
}

function formatSeconds(value?: number): string {
  if (!value || !Number.isFinite(value)) return '-'
  const totalSeconds = Math.max(0, Math.floor(value))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function buildImportedVideo(videoId: string): ImportedYouTubeVideo {
  return {
    videoId,
    canonicalUrl: buildYouTubeWatchUrl(videoId),
    thumbnailUrl: buildYouTubeThumbnailUrl(videoId),
  }
}

function ImportHero({ status }: { status: ImportStatus }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border/70 bg-card/80 shadow-[0_20px_80px_color-mix(in_oklab,var(--background)_55%,black_20%)] backdrop-blur-xl">
      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-primary/80">YouTube metadata import</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            {t('import_youtube_title', 'Importar vídeo do YouTube')}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {t(
              'import_youtube_description',
              'Gere um evento Nostr apontando para um vídeo original do YouTube, reutilizando os metadados editoriais do NostrTube.',
            )}
          </p>
        </div>
        <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">{t('import_status', 'Status')}</p>
              <p className="text-lg font-semibold">
                {status === 'ready'
                  ? t('preview_ready', 'Preview pronto')
                  : status === 'importing'
                    ? t('importing', 'Importando')
                    : t('draft', 'Rascunho')}
              </p>
            </div>
            <Youtube className="size-8 text-primary" />
          </div>
        </div>
      </div>
      <div className="grid gap-3 border-t border-border/70 bg-secondary/20 p-4 text-sm text-muted-foreground sm:grid-cols-3 sm:px-6">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>
            {t('youtube_import_metadata_only', 'Nesta etapa, o vídeo não será baixado nem hospedado no Blossom.')}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <LinkIcon className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>
            {t(
              'youtube_import_original_reference',
              'O evento apontará para a URL original e para a thumbnail pública do YouTube.',
            )}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>
            {t(
              'youtube_import_phase_one_notice',
              'Publicação e metadados automáticos do player entram nas próximas fases.',
            )}
          </span>
        </div>
      </div>
    </div>
  )
}

function YouTubeUrlCard({
  url,
  status,
  detectedVideoId,
  showInvalidState,
  onUrlChange,
  onSubmit,
}: {
  url: string
  status: ImportStatus
  detectedVideoId: string | null
  showInvalidState: boolean
  onUrlChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  const isImporting = status === 'importing'

  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">{t('youtube_url', 'URL do YouTube')}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('youtube_url_help', 'Cole uma URL pública do YouTube para validar e montar o preview inicial.')}
          </p>
        </div>
        <div className="rounded-2xl bg-primary/10 p-2 text-primary">
          <PlaySquare className="size-5" />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="youtube-url" className="text-sm font-medium">
          {t('youtube_video_url', 'URL do vídeo')}
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            id="youtube-url"
            value={url}
            placeholder={YOUTUBE_URL_PLACEHOLDER}
            aria-invalid={showInvalidState}
            aria-describedby="youtube-url-hint"
            className="h-11 rounded-xl bg-background/60"
            disabled={isImporting}
            onChange={(event) => onUrlChange(event.target.value)}
          />
          <Button
            type="submit"
            variant="gradient"
            size="lg"
            isLoading={isImporting}
            disabled={!url.trim() || isImporting}
          >
            {t('Import', 'Importar')}
          </Button>
        </div>
        <div id="youtube-url-hint" className="min-h-5">
          {showInvalidState ? (
            <p className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="size-4" />
              {t('invalid_youtube_url', 'Informe uma URL válida do YouTube com um ID de vídeo de 11 caracteres.')}
            </p>
          ) : detectedVideoId ? (
            <p className="flex items-center gap-2 text-sm text-primary">
              <CheckCircle2 className="size-4" />
              {t('youtube_url_detected', 'URL válida detectada. Clique em Importar para carregar o preview.')}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t(
                'youtube_url_empty_state',
                'Aceita links youtube.com/watch, youtu.be, embed, v, shorts e youtube-nocookie.',
              )}
            </p>
          )}
        </div>
      </div>
    </form>
  )
}

function PreviewThumbnail({ importedVideo }: { importedVideo?: ImportedYouTubeVideo }) {
  const [hasImageError, setHasImageError] = useState(false)

  if (!importedVideo || hasImageError) {
    return (
      <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/80 bg-secondary/30 p-5 text-center">
        <Film className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium">
          {importedVideo ? t('thumbnail_unavailable', 'Thumbnail indisponível') : t('empty_preview', 'Preview vazio')}
        </p>
        <p className="max-w-[260px] text-xs text-muted-foreground">
          {importedVideo
            ? t(
                'thumbnail_fallback_hint',
                'A imagem pública do YouTube não carregou, mas a URL e o ID continuam disponíveis.',
              )
            : t('empty_preview_hint', 'Importe uma URL válida para visualizar a thumbnail e os dados detectados.')}
        </p>
      </div>
    )
  }

  return (
    <img
      src={importedVideo.thumbnailUrl}
      alt={t('youtube_thumbnail_alt', 'Thumbnail do vídeo importado do YouTube')}
      className="aspect-video w-full rounded-2xl border border-border/70 object-cover"
      onError={() => setHasImageError(true)}
    />
  )
}

function ImportPreviewCard({
  importedVideo,
  detectedVideoId,
  status,
  url,
  metadataStatus,
  duration,
  currentTime,
}: {
  importedVideo?: ImportedYouTubeVideo
  detectedVideoId: string | null
  status: ImportStatus
  url: string
  metadataStatus: MetadataStatus
  duration?: number
  currentTime: number
}) {
  const isLoading = status === 'importing'
  const displayUrl = importedVideo?.canonicalUrl ?? url.trim()
  const displayVideoId = importedVideo?.videoId ?? detectedVideoId

  return (
    <aside className="space-y-5 lg:sticky lg:top-24 lg:h-fit">
      <div className="rounded-3xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">{t('import_preview', 'Preview da importação')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('import_preview_desc', 'Dados detectados antes da publicação.')}
            </p>
          </div>
          <span
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium',
              importedVideo
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-border bg-secondary/50 text-muted-foreground',
            )}
          >
            {importedVideo ? t('loaded', 'Carregado') : t('waiting', 'Aguardando')}
          </span>
        </div>

        {isLoading ? (
          <Skeleton className="aspect-video w-full rounded-2xl" />
        ) : (
          <PreviewThumbnail importedVideo={importedVideo} />
        )}

        <div className="mt-4 space-y-3 rounded-2xl border border-border/70 bg-background/45 p-3">
          <div>
            <p className="text-xs text-muted-foreground">{t('detected_url', 'URL detectada')}</p>
            {displayUrl ? (
              <a
                href={displayUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex max-w-full items-center gap-1 break-all text-sm font-medium text-primary hover:underline"
              >
                {displayUrl}
                <ExternalLink className="size-3.5 shrink-0" />
              </a>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">-</p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('detected_video_id', 'ID detectado')}</p>
            <p className="mt-1 font-mono text-sm font-medium">{displayVideoId ?? '-'}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">{t('duration', 'Duração')}</p>
              <p className="mt-1 font-mono text-sm font-medium">{formatSeconds(duration)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('current_time', 'Tempo atual')}</p>
              <p className="mt-1 font-mono text-sm font-medium">{formatSeconds(currentTime)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-sm text-primary">
        <p className="font-medium">
          {metadataStatus === 'loading'
            ? t('loading_player_metadata', 'Carregando metadados do player')
            : metadataStatus === 'ready'
              ? t('player_metadata_ready', 'Metadados do player detectados')
              : metadataStatus === 'unavailable'
                ? t('player_metadata_unavailable', 'Metadados do player indisponíveis')
                : t('youtube_import_not_hosted_title', 'Sem upload para Blossom nesta fase')}
        </p>
        <p className="mt-1 text-primary/80">
          {t(
            'youtube_import_not_hosted_desc',
            'A tela prepara metadados e preview. O evento e a publicação serão ativados nas próximas fases.',
          )}
        </p>
      </div>
    </aside>
  )
}

function YouTubePlayerMetadataPanel({
  importedVideo,
  title,
  metadataStatus,
  onCanPlay,
  onPlaybackError,
  onDurationChange,
  onTitleChange,
  onTimeChange,
}: {
  importedVideo?: ImportedYouTubeVideo
  title: string
  metadataStatus: MetadataStatus
  onCanPlay: () => void
  onPlaybackError: () => void
  onDurationChange: (duration: number) => void
  onTitleChange: (title: string) => void
  onTimeChange: (currentTime: number) => void
}) {
  if (!importedVideo) return null

  return (
    <div className="rounded-3xl border border-border/70 bg-card/80 p-3 shadow-sm backdrop-blur">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
        <div>
          <h3 className="text-lg font-semibold">{t('youtube_video_check', 'Conferir vídeo')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('youtube_video_check_desc', 'Confirme o vídeo importado antes de preencher os metadados editoriais.')}
          </p>
        </div>
        <span
          className={cn(
            'rounded-full border px-3 py-1 text-xs font-medium',
            metadataStatus === 'ready'
              ? 'border-primary/30 bg-primary/10 text-primary'
              : metadataStatus === 'unavailable'
                ? 'border-destructive/30 bg-destructive/10 text-destructive'
                : 'border-border bg-secondary/50 text-muted-foreground',
          )}
        >
          {metadataStatus === 'ready'
            ? t('player_ready', 'Player pronto')
            : metadataStatus === 'unavailable'
              ? t('player_unavailable', 'Player indisponível')
              : t('loading', 'Carregando')}
        </span>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/70">
        {metadataStatus === 'loading' ? (
          <div className="border-b border-border/70 bg-card/80 p-3">
            <Skeleton className="h-4 w-52" />
          </div>
        ) : null}
        <VideoPlayer
          src={importedVideo.canonicalUrl}
          title={title || t('youtube_import_player_title', 'Vídeo importado do YouTube')}
          image={importedVideo.thumbnailUrl}
          onCanPlay={onCanPlay}
          onPlaybackError={onPlaybackError}
          onDurationChange={onDurationChange}
          onTitleChange={onTitleChange}
          onTimeChange={onTimeChange}
        />
      </div>
    </div>
  )
}

export function YouTubeImportPageContainer() {
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [status, setStatus] = useState<ImportStatus>('idle')
  const [metadataStatus, setMetadataStatus] = useState<MetadataStatus>('idle')
  const [currentTime, setCurrentTime] = useState(0)
  const [titleEdited, setTitleEdited] = useState(false)
  const [importedVideo, setImportedVideo] = useState<ImportedYouTubeVideo | undefined>()
  const [publishedState, setPublishedState] = useState<PublishedState | null>(null)
  const { publish, isPending } = usePublishVideo()
  const {
    draft,
    setTitle,
    setDuration,
    setSummary,
    setContentWarning,
    setHashtags,
    setIndexers,
    setLanguage,
    setGeohash,
    setContentType,
  } = useYouTubeImportDraft()

  const detectedVideoId = useMemo(() => extractYouTubeVideoId(url), [url])
  const showInvalidState = Boolean(url.trim()) && !detectedVideoId && (hasSubmitted || status === 'invalid')
  const canPreparePublish = Boolean(importedVideo && draft.title.trim())

  const handleUrlChange = (value: string) => {
    setUrl(value)
    setHasSubmitted(false)
    setImportedVideo(undefined)
    setPublishedState(null)
    setMetadataStatus('idle')
    setCurrentTime(0)
    setDuration(undefined)
    const nextVideoId = extractYouTubeVideoId(value)
    if (!value.trim()) {
      setStatus('idle')
      return
    }
    setStatus(nextVideoId ? 'valid' : 'invalid')
  }

  const handleImport = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setHasSubmitted(true)

    if (!detectedVideoId) {
      setImportedVideo(undefined)
      setStatus('invalid')
      return
    }

    setStatus('importing')
    setMetadataStatus('loading')
    window.setTimeout(() => {
      setImportedVideo(buildImportedVideo(detectedVideoId))
      setStatus('ready')
    }, 350)
  }

  const handleManualTitleChange = (value: string) => {
    setTitleEdited(true)
    setTitle(value)
  }

  const handlePlayerTitleChange = (nextTitle: string) => {
    const normalizedTitle = nextTitle.trim()
    if (!normalizedTitle || titleEdited) return
    setTitle(normalizedTitle)
  }

  const handlePlayerDurationChange = (duration: number) => {
    if (!Number.isFinite(duration) || duration <= 0) return
    setDuration(duration)
    setMetadataStatus('ready')
  }

  const handlePublish = async () => {
    if (!importedVideo || !draft.title.trim()) return

    const result = await publish(
      buildYouTubeVideoDraft({
        videoId: importedVideo.videoId,
        title: draft.title.trim(),
        summary: draft.summary,
        duration: draft.duration,
        hashtags: draft.hashtags,
        indexers: draft.indexers,
        contentWarning: draft.contentWarning,
        language: draft.language,
        geohash: draft.geohash,
        contentType: draft.contentType,
      }),
    )

    if (!result) return
    setPublishedState({ naddr: result.naddr, shareUrl: result.shareUrl })
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <ImportHero status={status} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          {publishedState ? (
            <div className="rounded-3xl border border-primary/30 bg-primary/10 p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3 text-primary">
                <CheckCircle2 className="size-6" />
                <h2 className="text-xl font-semibold">
                  {t('youtube_publish_success_title', 'Vídeo do YouTube publicado')}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {t(
                  'youtube_publish_success_desc',
                  'O evento Nostr foi publicado com a referência para o vídeo original do YouTube.',
                )}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate({ to: '/v/$eventId', params: { eventId: publishedState.naddr } })}
                >
                  <ExternalLink className="size-4" />
                  {t('go_to_video', 'Go to video')}
                </Button>
              </div>
            </div>
          ) : null}

          <YouTubeUrlCard
            url={url}
            status={status}
            detectedVideoId={detectedVideoId}
            showInvalidState={showInvalidState}
            onUrlChange={handleUrlChange}
            onSubmit={handleImport}
          />

          <YouTubePlayerMetadataPanel
            importedVideo={importedVideo}
            title={draft.title}
            metadataStatus={metadataStatus}
            onCanPlay={() => setMetadataStatus('ready')}
            onPlaybackError={() => setMetadataStatus('unavailable')}
            onDurationChange={handlePlayerDurationChange}
            onTitleChange={handlePlayerTitleChange}
            onTimeChange={setCurrentTime}
          />

          <div className="rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur">
            <div className="mb-5">
              <h3 className="text-lg font-semibold">{t('video_metadata', 'Metadados do vídeo')}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(
                  'youtube_metadata_hint',
                  'Depois de conferir o vídeo, escreva o título, descrição e tags que serão publicados no evento.',
                )}
              </p>
            </div>
            <UploadFormView
              title={draft.title}
              summary={draft.summary}
              contentWarning={draft.contentWarning}
              hashtags={draft.hashtags}
              indexers={draft.indexers}
              language={draft.language}
              geohash={draft.geohash}
              contentType={draft.contentType}
              onTitleChange={handleManualTitleChange}
              onSummaryChange={setSummary}
              onContentWarningChange={setContentWarning}
              onHashtagsChange={setHashtags}
              onIndexersChange={setIndexers}
              onLanguageChange={setLanguage}
              onGeohashChange={setGeohash}
              onContentTypeChange={setContentType}
            />
          </div>

          <div className="sticky bottom-4 z-20 flex flex-wrap items-center gap-3 rounded-2xl border border-border/70 bg-card/90 p-3 shadow-[0_18px_60px_color-mix(in_oklab,var(--background)_45%,black_28%)] backdrop-blur-xl">
            <div className="min-w-0 flex-1 text-sm text-muted-foreground">
              {canPreparePublish
                ? t('youtube_publish_ready', 'Pronto para publicar um evento Nostr referenciando o vídeo do YouTube.')
                : t(
                    'youtube_publish_missing_required',
                    'Importe uma URL válida e informe um título para habilitar a publicação futuramente.',
                  )}
            </div>
            <ButtonWithLoader
              onClick={handlePublish}
              isLoading={isPending}
              disabled={!canPreparePublish || Boolean(publishedState)}
            >
              {t('Publish', 'Publicar')}
              <ChevronRight className="size-4" />
            </ButtonWithLoader>
          </div>
        </div>

        <ImportPreviewCard
          importedVideo={importedVideo}
          detectedVideoId={detectedVideoId}
          status={status}
          url={url}
          metadataStatus={metadataStatus}
          duration={draft.duration}
          currentTime={currentTime}
        />
      </div>
    </div>
  )
}
