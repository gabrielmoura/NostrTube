import { useCallback, useEffect, useRef } from 'react'
import { useNDK } from '@nostr-dev-kit/ndk-hooks'
import { toast } from 'sonner'
import { t } from 'i18next'
import { uploadToConfiguredBlossomServers } from '@/features/upload/services/blossom-server.service'
import { requestDvmThumbnails } from '@/features/upload/services/dvm-thumbnail.service'
import { generateBlurhashFromImageFile, prepareVideoUploadAsset } from '@/features/upload/services/local-media-processing.service'
import { LoggerAgent } from '@/lib/debug.ts'
import { useUploadPreferencesStore } from '@/store/useUploadPreferencesStore'
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
  const setThumbnailPreviewUrl = useVideoUploadStore((s) => s.setThumbnailPreviewUrl)
  const setError = useVideoUploadStore((s) => s.setError)
  const thumbnailGenerationMode = useUploadPreferencesStore((s) => s.thumbnailGenerationMode)
  const isLoading = useVideoUploadStore((s) => s.isUploading)
  const progress = useVideoUploadStore((s) => s.uploadProgress)
  const uploadStage = useVideoUploadStore((s) => s.uploadStage)

  useEffect(() => {
    ndkRef.current = ndk
  }, [ndk])

  const upload = useCallback(async (file: File) => {
    const ndkInstance = ndkRef.current
    if (!ndkInstance) return

    setUploadingState(true)
    setUploadProgress(0)
    setUploadStage('validating')
    setError(undefined)
    setThumbnailPreviewUrl(undefined)

    const handleProgress = (p: { loaded: number, total: number }) => {
      const percentage = Math.round((p.loaded / p.total) * 100)
      setUploadStage('uploading')
      setUploadProgress(percentage)
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
        const prepared = await prepareVideoUploadAsset(file, {
          enableFFmpeg: thumbnailGenerationMode === 'local',
          generateThumbnail: thumbnailGenerationMode === 'local',
          thumbnailGenerationMode,
        })
        uploadFile = prepared.uploadFile
        generatedThumbnailFile = prepared.thumbnailFile
        generatedThumbnailPreviewUrl = prepared.thumbnailPreviewUrl
        preparedDim = prepared.width && prepared.height ? `${prepared.width}x${prepared.height}` : undefined
        preparedDuration = prepared.duration ? String(prepared.duration) : undefined
        preparedMimeType = prepared.mimeType

        if (generatedThumbnailPreviewUrl) {
          setThumbnailPreviewUrl(generatedThumbnailPreviewUrl)
        }
      }

      const imeta = await uploadToConfiguredBlossomServers({
        ndk: ndkInstance,
        file: uploadFile,
        onProgress: handleProgress,
        onMirroringStart: () => setUploadStage('mirroring'),
        label: 'video-upload',
      })

      let thumbnailUrl: string | undefined
      let blurhash = imeta.blurhash || undefined
      let dim = preparedDim || imeta.dim || undefined
      let duration = preparedDuration || imeta.duration || undefined

      if (generatedThumbnailFile) {
        const thumbnailUpload = await uploadToConfiguredBlossomServers({
          ndk: ndkInstance,
          file: generatedThumbnailFile,
          onMirroringStart: () => setUploadStage('mirroring'),
          label: 'thumbnail-upload',
        })
        thumbnailUrl = thumbnailUpload.url
        blurhash = await generateBlurhashFromImageFile(generatedThumbnailFile)
      }

      if (!thumbnailUrl && file.type.startsWith('video/') && thumbnailGenerationMode === 'remote') {
        try {
          const dvmResult = await requestDvmThumbnails({
            ndk: ndkInstance,
            videoUrl: imeta.url!,
            requesterPubkey: ndkInstance.activeUser!.pubkey,
          })
          thumbnailUrl = dvmResult?.thumbnails[0]
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
        thumbnail: thumbnailUrl,
        imetaVideo: {
          ...imeta,
          image: thumbnailUrl,
          blurhash,
          dim,
          duration,
          fallback: fallbackUrls,
        },
        imetaVariants: [{
          ...imeta,
          image: thumbnailUrl,
          blurhash,
          dim,
          duration,
          fallback: fallbackUrls,
        }],
      })

      if (!thumbnailUrl && generatedThumbnailPreviewUrl) {
        setThumbnailPreviewUrl(generatedThumbnailPreviewUrl)
      }

      setUploadStage('complete')
      setUploadProgress(100)
      toast.success(t('upload_success', 'File uploaded successfully'))
      setShowEventInput(false)
    } catch (error) {
      logger.error('Fatal upload error', error)
      setUploadStage('error')
      setError(error instanceof Error ? error.message : String(error))
      toast.error(t('upload_error', 'Error during file upload'))
    } finally {
      setUploadingState(false)
    }
  }, [setError, setShowEventInput, setThumbnailPreviewUrl, setUploadProgress, setUploadStage, setUploadingState, setVideoUpload, thumbnailGenerationMode])

  return { upload, isLoading, progress, uploadStage }
}
