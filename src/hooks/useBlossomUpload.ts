import { useNDK } from '@nostr-dev-kit/ndk-hooks'
import { t } from 'i18next'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { uploadToConfiguredBlossomServers } from '@/features/upload/services/blossom-server.service'
import { generateBlurhashFromImageFile } from '@/features/upload/services/local-media-processing.service'
import { useThrottledProgress } from '@/hooks/useThrottledProgress'

interface UseBlossomUploadOptions {
  onSuccess?: (url: string) => void
  onError?: (error: Error) => void
}

export function useBlossomUpload(options?: UseBlossomUploadOptions) {
  const { ndk } = useNDK()
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const throttleProgress = useThrottledProgress(setProgress, 100)

  // Referência estável para evitar recriação do NDK durante upload
  const ndkRef = useRef(ndk)
  useEffect(() => {
    ndkRef.current = ndk
  }, [ndk])

  const uploadFile = async (file: File) => {
    const ndkInstance = ndkRef.current
    if (!ndkInstance) {
      const message = 'NDK not initialized'
      setError(message)
      toast.error(message)
      return
    }

    setIsUploading(true)
    setProgress(0)
    setError(null)

    const handleProgress = (p: { loaded: number; total: number }) => {
      throttleProgress(p.loaded, p.total)
    }

    try {
      const blurhash = await generateBlurhashFromImageFile(file)
      const result = await uploadToConfiguredBlossomServers({
        ndk: ndkInstance,
        file,
        onProgress: handleProgress,
        label: 'generic-upload',
      })

      toast.success(t('upload_success', 'File uploaded successfully'))
      if (result.url) {
        options?.onSuccess?.(result.url)
      }
      return { ...result, blurhash }
    } catch (error) {
      console.error('Blossom upload error:', error)
      const normalizedError = error instanceof Error ? error : new Error('Upload failed')
      setError(normalizedError.message)
      toast.error(t('upload_error', 'Upload failed'))
      options?.onError?.(normalizedError)
    } finally {
      setIsUploading(false)
    }
  }

  return { uploadFile, isUploading, progress, error }
}
