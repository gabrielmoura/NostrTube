import { useNDK } from '@nostr-dev-kit/ndk-hooks'
import { t } from 'i18next'
import { useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { uploadToConfiguredBlossomServers } from '@/features/upload/services/blossom-server.service'
import { requestDvmThumbnails } from '@/features/upload/services/dvm-thumbnail.service'
import { prepareVideoUploadAsset } from '@/features/upload/services/local-media-processing.service'
import { useThrottledProgress } from '@/hooks/useThrottledProgress'
import { LoggerAgent } from '@/lib/debug.ts'
import { useVideoUploadStore } from '@/store/videoUpload/useVideoUploadStore.ts'

const logger = LoggerAgent.create('useVideoUploader')

export function useVideoUploader() {
  const { ndk } = useNDK()
  const ndkRef = useRef(ndk)

  const setVideoUpload = useVideoUploadStore((s) => s.setVideoUpload)
  const setShowEventInput = useVideoUploadStore((s) => s.setShowEventInput)
  const setUploadingState = useVideoUploadStore((s) => s.setUploadingState)
  const setUploadProgress = useVideoUploadStore((s) => s.setUploadProgress)
  const setUploadStage = useVideoUploadStore((s) => s.setUploadStage)
  const setThumbnailFile = useVideoUploadStore((s) => s.setThumbnailFile)
  const setThumbnailGenerating = useVideoUploadStore((s) => s.setThumbnailGenerating)
  const setThumbnailError = useVideoUploadStore((s) => s.setThumbnailError)
  const setThumbnailPreviewUrl = useVideoUploadStore((s) => s.setThumbnailPreviewUrl)
  const setSourceVideoFile = useVideoUploadStore((s) => s.setSourceVideoFile)
  const setError = useVideoUploadStore((s) => s.setError)
  const thumbnailMode = useVideoUploadStore((s) => s.thumbnailState.mode)
  const isLoading = useVideoUploadStore((s) => s.isUploading)
  const progress = useVideoUploadStore((s) => s.uploadProgress)
  const uploadStage = useVideoUploadStore((s) => s.uploadStage)
  const throttleProgress = useThrottledProgress(setUploadProgress, 100, 'video-upload-progress')

  useEffect(() => {
    ndkRef.current = ndk
  }, [ndk])

  const upload = useCallback(
    async (file: File) => {
      const ndkInstance = ndkRef.current
      if (!ndkInstance) return

      setUploadingState(true)
      setUploadProgress(0)
      setUploadStage('validating')
      setError(undefined)
      setThumbnailPreviewUrl(undefined)
      setThumbnailError(undefined)
      setSourceVideoFile(file.type.startsWith('video/') ? file : undefined)

      const handleProgress = (p: { loaded: number; total: number }) => {
        setUploadStage('uploading')
        throttleProgress(p.loaded, p.total)
      }

      try {
        let uploadFile = file
        let generatedThumbnailFile: File | undefined
        let generatedThumbnailPreviewUrl: string | undefined
        let preparedDim: string | undefined
        let preparedDuration: string | undefined
        let preparedMimeType: string | undefined

        if (file.type.startsWith('video/')) {
          setUploadStage('processing')
          setThumbnailGenerating(thumbnailMode === 'auto')
          const prepared = await prepareVideoUploadAsset(file, {
            enableFFmpeg: true,
            generateThumbnail: thumbnailMode === 'auto',
            thumbnailGenerationMode: thumbnailMode === 'auto' ? 'local' : 'remote',
          })
          uploadFile = prepared.uploadFile
          generatedThumbnailFile = prepared.thumbnailFile
          generatedThumbnailPreviewUrl = prepared.thumbnailPreviewUrl
          preparedDim = prepared.width && prepared.height ? `${prepared.width}x${prepared.height}` : undefined
          preparedDuration = prepared.duration ? String(prepared.duration) : undefined
          preparedMimeType = prepared.mimeType

          if (generatedThumbnailPreviewUrl) {
            setThumbnailFile(generatedThumbnailFile, generatedThumbnailPreviewUrl)
          } else if (thumbnailMode === 'auto') {
            setThumbnailError(
              t(
                'thumbnail_generation_failed',
                'Could not generate a thumbnail automatically. Upload an image or add a URL before publishing.',
              ),
            )
          }
          setThumbnailGenerating(false)
        }

        const imeta = await uploadToConfiguredBlossomServers({
          ndk: ndkInstance,
          file: uploadFile,
          onProgress: handleProgress,
          onMirroringStart: () => setUploadStage('mirroring'),
          label: 'video-upload',
        })

        const blurhash = imeta.blurhash || undefined
        let dim = preparedDim || imeta.dim || undefined
        let duration = preparedDuration || imeta.duration || undefined

        if (file.type.startsWith('video/') && thumbnailMode === 'auto' && !generatedThumbnailFile) {
          try {
            const dvmResult = await requestDvmThumbnails({
              ndk: ndkInstance,
              videoUrl: imeta.url!,
              requesterPubkey: ndkInstance.activeUser!.pubkey,
            })
            const thumbnailUrl = dvmResult?.thumbnails[0]
            if (thumbnailUrl) {
              useVideoUploadStore.getState().setThumbnailRemoteUrl(thumbnailUrl)
            }
            dim = dvmResult?.dim || dim
            duration = dvmResult?.duration || duration
          } catch (dvmError) {
            logger.error('DVM thumbnail generation failed', dvmError)
          }
        }

        const fallbackUrls = imeta.fallback ?? []

        setVideoUpload({
          url: imeta.url,
          fallback: fallbackUrls,
          title: file.name,
          fileType: uploadFile.type || file.type,
          fileHash: (imeta.sha256 || imeta.x) as string,
          fileSize: imeta.size ? parseInt(imeta.size) : undefined,
          blurhash,
          dim,
          duration: duration ? Number(duration) : undefined,
          mime_type: preparedMimeType || imeta.m || undefined,
          thumbnail: useVideoUploadStore.getState().thumbnailState.remoteUrl,
          imetaVideo: {
            ...imeta,
            image: useVideoUploadStore.getState().thumbnailState.remoteUrl,
            blurhash,
            dim,
            duration,
            fallback: fallbackUrls,
          },
          imetaVariants: [
            {
              ...imeta,
              image: useVideoUploadStore.getState().thumbnailState.remoteUrl,
              blurhash,
              dim,
              duration,
              fallback: fallbackUrls,
            },
          ],
        })

        setUploadStage('complete')
        setUploadProgress(100)
        toast.success(t('upload_success', 'File uploaded successfully'))
        setShowEventInput(false)
      } catch (error) {
        logger.error('Fatal upload error', error)
        setUploadStage('error')
        setError(error instanceof Error ? error.message : String(error))
        setThumbnailGenerating(false)
        toast.error(t('upload_error', 'Error during file upload'))
      } finally {
        setUploadingState(false)
      }
    },
    [
      setError,
      setShowEventInput,
      setSourceVideoFile,
      setThumbnailError,
      setThumbnailFile,
      setThumbnailGenerating,
      setThumbnailPreviewUrl,
      setUploadProgress,
      setUploadStage,
      setUploadingState,
      setVideoUpload,
      thumbnailMode,
      throttleProgress,
    ],
  )

  return { upload, isLoading, progress, uploadStage }
}
