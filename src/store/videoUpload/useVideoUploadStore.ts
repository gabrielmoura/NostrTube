import type { NDKImetaTag } from '@nostr-dev-kit/ndk-hooks'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { VideoContentType } from '@/features/video/services/video-kinds'
import { AgeEnum } from '@/store/store/sessionTypes.ts'

export interface VideoMetadata {
  url: string
  fallback: string[]
  title: string
  summary: string
  alt: string
  thumbnail: string
  fileType: string
  fileHash: string
  fileSize: number
  duration: number
  hashtags: string[]
  indexers: string[]
  contentWarning: string
  blurhash: string
  dim: string
  mime_type: string
  imetaVideo: NDKImetaTag
  imetaVariants?: NDKImetaTag[]
  imetaAudioTracks?: NDKImetaTag[]
  rawImetaTags?: string[][]
  imetaThumb: NDKImetaTag
  imetaImage: NDKImetaTag
  age: AgeEnum
  language?: string
  geohash?: string
  contentType?: VideoContentType
  origin?: {
    platform: string
    externalId: string
    originalUrl: string
    metadata?: string
  }
}

const DRAFT_KEY = 'video-upload-draft'

export type ThumbnailMode = 'auto' | 'upload' | 'url'

export interface UploadThumbnailState {
  mode: ThumbnailMode
  file?: File
  localPreviewUrl?: string
  remoteUrl?: string
  inputUrl?: string
  isGenerating: boolean
  isUploading: boolean
  error?: string
}

interface UploadDraftSnapshot {
  videoData: Partial<VideoMetadata>
  currentStep: 1 | 2 | 3
  updatedAt: number
  thumbnailPreviewUrl?: string
  thumbnailState?: Pick<UploadThumbnailState, 'mode' | 'remoteUrl' | 'inputUrl' | 'error'>
}

export interface VideoUploadState {
  videoData: Partial<VideoMetadata>
  thumbnailPreviewUrl?: string
  thumbnailState: UploadThumbnailState
  sourceVideoFile?: File
  currentStep: 1 | 2 | 3
  isUploading: boolean
  uploadProgress: number
  uploadStage: 'idle' | 'validating' | 'uploading' | 'processing' | 'mirroring' | 'complete' | 'error'
  error?: string
  showEventInput: boolean
  setVideoData: (data: Partial<VideoMetadata>) => void
  setCurrentStep: (step: 1 | 2 | 3) => void
  setIndexers: (indexers: string[]) => void
  setHashtags: (hashtags: string[]) => void
  setLanguage: (language?: string) => void
  setGeohash: (geohash?: string) => void
  setContentType: (contentType?: VideoContentType) => void
  setUploadingState: (isUploading: boolean) => void
  setUploadProgress: (progress: number) => void
  setUploadStage: (stage: VideoUploadState['uploadStage']) => void
  setError: (error?: string) => void
  resetForm: () => void
  setTitle: (title: string) => void
  setShowEventInput: (show: boolean) => void
  setUrl: (url: string) => void
  setThumbnail: (thumbnail: string) => void
  setThumbnailPreviewUrl: (thumbnailPreviewUrl?: string) => void
  setThumbnailMode: (mode: ThumbnailMode) => void
  setThumbnailFile: (file?: File, localPreviewUrl?: string) => void
  setThumbnailRemoteUrl: (url?: string) => void
  setThumbnailInputUrl: (url: string) => void
  setThumbnailGenerating: (isGenerating: boolean) => void
  setThumbnailUploading: (isUploading: boolean) => void
  setThumbnailError: (error?: string) => void
  clearThumbnail: () => void
  setSourceVideoFile: (file?: File) => void
  setSummary: (summary: string) => void
  setContentWarning: (contentWarning: string) => void
  setVideoUpload: (data: Partial<VideoMetadata>) => void
  clearUploadedMedia: () => void
  saveDraft: () => void
  loadDraft: () => void
  clearLocalDraft: () => void
  getDraftSnapshot: () => UploadDraftSnapshot
  applyDraftSnapshot: (snapshot: Partial<UploadDraftSnapshot>) => void
}

const initialState = {
  videoData: {},
  sourceVideoFile: undefined,
  currentStep: 1 as const,
  isUploading: false,
  uploadProgress: 0,
  uploadStage: 'idle' as const,
  error: undefined,
  showEventInput: false,
  thumbnailPreviewUrl: undefined,
  thumbnailState: {
    mode: 'auto' as const,
    file: undefined,
    localPreviewUrl: undefined,
    remoteUrl: undefined,
    inputUrl: undefined,
    isGenerating: false,
    isUploading: false,
    error: undefined,
  },
}

function revokeObjectUrl(url?: string) {
  if (url?.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

export const useVideoUploadStore = create<VideoUploadState>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      setVideoData: (data) =>
        set(
          (state) => {
            state.videoData = { ...state.videoData, ...data }
          },
          false,
          'video/setVideoData',
        ),

      setCurrentStep: (step) =>
        set(
          (state) => {
            state.currentStep = step
          },
          false,
          'ui/setCurrentStep',
        ),

      setIndexers: (indexers) =>
        set(
          (state) => {
            state.videoData.indexers = indexers
          },
          false,
          'video/setIndexers',
        ),

      setHashtags: (hashtags) =>
        set(
          (state) => {
            state.videoData.hashtags = hashtags
          },
          false,
          'video/setHashtags',
        ),

      setLanguage: (language) =>
        set(
          (state) => {
            state.videoData.language = language
          },
          false,
          'video/setLanguage',
        ),

      setGeohash: (geohash) =>
        set(
          (state) => {
            state.videoData.geohash = geohash
          },
          false,
          'video/setGeohash',
        ),

      setContentType: (contentType) =>
        set(
          (state) => {
            state.videoData.contentType = contentType
          },
          false,
          'video/setContentType',
        ),

      setShowEventInput: (show) =>
        set(
          (state) => {
            state.showEventInput = show
          },
          false,
          'video/setShowEventInput',
        ),

      setTitle: (title) =>
        set(
          (state) => {
            state.videoData.title = title
          },
          false,
          'video/setTitle',
        ),

      setUrl: (url) =>
        set(
          (state) => {
            state.videoData.url = url
          },
          false,
          'video/setUrl',
        ),

      setThumbnail: (thumbnail) =>
        set(
          (state) => {
            state.videoData.thumbnail = thumbnail
            state.thumbnailState.remoteUrl = thumbnail || undefined
            state.thumbnailState.inputUrl = thumbnail || state.thumbnailState.inputUrl
            state.thumbnailState.error = undefined
          },
          false,
          'video/setThumbnail',
        ),

      setThumbnailPreviewUrl: (thumbnailPreviewUrl) =>
        set(
          (state) => {
            if (state.thumbnailPreviewUrl !== thumbnailPreviewUrl) {
              revokeObjectUrl(state.thumbnailPreviewUrl)
            }
            state.thumbnailPreviewUrl = thumbnailPreviewUrl
          },
          false,
          'video/setThumbnailPreviewUrl',
        ),

      setThumbnailMode: (mode) =>
        set(
          (state) => {
            state.thumbnailState.mode = mode
            state.thumbnailState.error = undefined
          },
          false,
          'thumbnail/setMode',
        ),

      setThumbnailFile: (file, localPreviewUrl) =>
        set(
          (state) => {
            if (state.thumbnailState.localPreviewUrl !== localPreviewUrl) {
              revokeObjectUrl(state.thumbnailState.localPreviewUrl)
            }
            if (state.thumbnailPreviewUrl !== localPreviewUrl) {
              revokeObjectUrl(state.thumbnailPreviewUrl)
            }
            state.thumbnailState.file = file
            state.thumbnailState.localPreviewUrl = localPreviewUrl
            state.thumbnailState.remoteUrl = undefined
            state.thumbnailState.error = undefined
            state.thumbnailPreviewUrl = localPreviewUrl
            if (state.videoData.thumbnail?.startsWith('blob:')) {
              state.videoData.thumbnail = undefined
            }
          },
          false,
          'thumbnail/setFile',
        ),

      setThumbnailRemoteUrl: (url) =>
        set(
          (state) => {
            revokeObjectUrl(state.thumbnailState.localPreviewUrl)
            revokeObjectUrl(state.thumbnailPreviewUrl)
            state.thumbnailState.file = undefined
            state.thumbnailState.localPreviewUrl = undefined
            state.thumbnailState.remoteUrl = url
            state.thumbnailState.inputUrl = url || state.thumbnailState.inputUrl
            state.thumbnailState.error = undefined
            state.videoData.thumbnail = url || undefined
            state.thumbnailPreviewUrl = url
          },
          false,
          'thumbnail/setRemoteUrl',
        ),

      setThumbnailInputUrl: (url) =>
        set(
          (state) => {
            state.thumbnailState.inputUrl = url
          },
          false,
          'thumbnail/setInputUrl',
        ),

      setThumbnailGenerating: (isGenerating) =>
        set(
          (state) => {
            state.thumbnailState.isGenerating = isGenerating
          },
          false,
          'thumbnail/setGenerating',
        ),

      setThumbnailUploading: (isUploading) =>
        set(
          (state) => {
            state.thumbnailState.isUploading = isUploading
          },
          false,
          'thumbnail/setUploading',
        ),

      setThumbnailError: (error) =>
        set(
          (state) => {
            state.thumbnailState.error = error
          },
          false,
          'thumbnail/setError',
        ),

      clearThumbnail: () =>
        set(
          (state) => {
            revokeObjectUrl(state.thumbnailState.localPreviewUrl)
            revokeObjectUrl(state.thumbnailPreviewUrl)
            state.thumbnailState.file = undefined
            state.thumbnailState.localPreviewUrl = undefined
            state.thumbnailState.remoteUrl = undefined
            state.thumbnailState.inputUrl = undefined
            state.thumbnailState.error = undefined
            state.thumbnailPreviewUrl = undefined
            state.videoData.thumbnail = undefined
          },
          false,
          'thumbnail/clear',
        ),

      setSourceVideoFile: (file) =>
        set(
          (state) => {
            state.sourceVideoFile = file
          },
          false,
          'video/setSourceVideoFile',
        ),

      setSummary: (summary) =>
        set(
          (state) => {
            state.videoData.summary = summary
          },
          false,
          'video/setSummary',
        ),

      setContentWarning: (contentWarning) =>
        set(
          (state) => {
            state.videoData.contentWarning = contentWarning
          },
          false,
          'video/setContentWarning',
        ),

      setVideoUpload: (data) =>
        set(
          (state) => {
            const previousThumbnail = state.videoData.thumbnail
            const previousPreviewUrl = state.thumbnailPreviewUrl
            const previousThumbnailState = state.thumbnailState
            state.videoData = data
            if (data.thumbnail && !data.thumbnail.startsWith('blob:')) {
              state.thumbnailState.remoteUrl = data.thumbnail
              state.thumbnailState.inputUrl = data.thumbnail
              state.thumbnailPreviewUrl = data.thumbnail
            } else if (previousThumbnailState.localPreviewUrl || previousPreviewUrl || previousThumbnail) {
              state.thumbnailState = previousThumbnailState
              state.thumbnailPreviewUrl = previousPreviewUrl
              state.videoData.thumbnail = previousThumbnail
            }
          },
          false,
          'video/setVideoUpload',
        ),

      clearUploadedMedia: () =>
        set(
          (state) => {
            state.videoData.url = undefined
            state.videoData.fallback = undefined
            state.videoData.fileType = undefined
            state.videoData.fileHash = undefined
            state.videoData.fileSize = undefined
            state.videoData.duration = undefined
            state.videoData.dim = undefined
            state.videoData.mime_type = undefined
            state.videoData.imetaVideo = undefined
            state.videoData.imetaVariants = undefined
            state.videoData.imetaAudioTracks = undefined
            state.videoData.geohash = undefined
            state.videoData.origin = undefined
            state.videoData.thumbnail = undefined
            state.sourceVideoFile = undefined
            revokeObjectUrl(state.thumbnailState.localPreviewUrl)
            revokeObjectUrl(state.thumbnailPreviewUrl)
            state.thumbnailState = { ...initialState.thumbnailState }
            state.thumbnailPreviewUrl = undefined
            state.isUploading = false
            state.uploadProgress = 0
            state.uploadStage = 'idle'
            state.error = undefined
            state.showEventInput = false
            if (state.currentStep > 1) {
              state.currentStep = 1
            }
          },
          false,
          'video/clearUploadedMedia',
        ),

      setUploadingState: (isUploading) =>
        set(
          (state) => {
            state.isUploading = isUploading
          },
          false,
          'ui/setUploadingState',
        ),

      setUploadProgress: (progress) =>
        set(
          (state) => {
            state.uploadProgress = progress
          },
          false,
          'ui/setUploadProgress',
        ),

      setUploadStage: (stage) =>
        set(
          (state) => {
            state.uploadStage = stage
          },
          false,
          'ui/setUploadStage',
        ),

      setError: (error) =>
        set(
          (state) => {
            state.error = error
          },
          false,
          'ui/setError',
        ),

      resetForm: () => {
        localStorage.removeItem(DRAFT_KEY)
        set(
          (state) => {
            revokeObjectUrl(state.thumbnailState.localPreviewUrl)
            revokeObjectUrl(state.thumbnailPreviewUrl)
            Object.assign(state, initialState)
          },
          false,
          'video/resetForm',
        )
      },

      clearLocalDraft: () => {
        localStorage.removeItem(DRAFT_KEY)
      },

      getDraftSnapshot: () => {
        const { videoData, currentStep, thumbnailPreviewUrl, thumbnailState } = get()
        const persistedPreviewUrl = thumbnailPreviewUrl?.startsWith('blob:') ? undefined : thumbnailPreviewUrl
        return {
          videoData,
          currentStep,
          thumbnailPreviewUrl: persistedPreviewUrl,
          thumbnailState: {
            mode: thumbnailState.mode,
            remoteUrl: thumbnailState.remoteUrl,
            inputUrl: thumbnailState.inputUrl,
            error: thumbnailState.error,
          },
          updatedAt: Date.now(),
        }
      },

      applyDraftSnapshot: (snapshot) =>
        set(
          (state) => {
            state.videoData = snapshot.videoData || {}
            state.currentStep = snapshot.currentStep || 1
            state.thumbnailPreviewUrl = snapshot.thumbnailPreviewUrl ?? snapshot.videoData?.thumbnail
            state.thumbnailState = {
              ...initialState.thumbnailState,
              ...snapshot.thumbnailState,
              remoteUrl: snapshot.thumbnailState?.remoteUrl ?? snapshot.videoData?.thumbnail,
              inputUrl: snapshot.thumbnailState?.inputUrl ?? snapshot.videoData?.thumbnail,
            }
          },
          false,
          'video/applyDraftSnapshot',
        ),

      saveDraft: () => {
        const draft = JSON.stringify(get().getDraftSnapshot())
        localStorage.setItem(DRAFT_KEY, draft)
        console.log('Rascunho salvo com sucesso!')
      },

      loadDraft: () => {
        const draft = localStorage.getItem(DRAFT_KEY)
        if (draft) {
          try {
            const parsed = JSON.parse(draft)
            set(
              (state) => {
                state.videoData = parsed.videoData || {}
                state.currentStep = parsed.currentStep || 1
                state.thumbnailPreviewUrl = parsed.thumbnailPreviewUrl ?? parsed.videoData?.thumbnail
                state.thumbnailState = {
                  ...initialState.thumbnailState,
                  ...parsed.thumbnailState,
                  remoteUrl: parsed.thumbnailState?.remoteUrl ?? parsed.videoData?.thumbnail,
                  inputUrl: parsed.thumbnailState?.inputUrl ?? parsed.videoData?.thumbnail,
                }
              },
              false,
              'video/loadDraft',
            )
          } catch (e) {
            console.error('Falha ao carregar rascunho:', e)
          }
        }
      },
    })),
    { name: 'VideoUploadStore' },
  ),
)
