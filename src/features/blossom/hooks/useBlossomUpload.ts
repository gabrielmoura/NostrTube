import { useNDK } from '@nostr-dev-kit/ndk-hooks'
import { useState } from 'react'
import { toast } from 'sonner'
import { uploadToConfiguredBlossomServers } from '@/features/upload/services/blossom-server.service'
import { validateBud06UploadRequirements } from '../blossom.service'
import type { BlossomFileRecord, BlossomUploadResult, BlossomUploadStatus } from '../blossom.types'
import { BLOSSOM_MAX_FILE_SIZE_BYTES, calculateSha256, getFileKind } from '../blossom.utils'

interface UseBlossomUploadOptions {
  defaultServer: string
  hasUserConfiguration: boolean
  onUploaded: (result: BlossomUploadResult) => void
}

export function useBlossomUpload({ defaultServer, hasUserConfiguration, onUploaded }: UseBlossomUploadOptions) {
  const { ndk } = useNDK()
  const [state, setState] = useStateCompat()

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return
    if (!ndk) {
      setState({ status: 'error', progress: 0, error: 'Faça login para assinar o upload Blossom.' })
      toast.error('Faça login para enviar arquivos.')
      return
    }
    if (!hasUserConfiguration && !defaultServer) {
      setState({ status: 'error', progress: 0, error: 'Configure um servidor Blossom antes de enviar.' })
      return
    }

    for (const file of files) {
      if (file.size > BLOSSOM_MAX_FILE_SIZE_BYTES) {
        const message = `${file.name} excede o limite de 4GB.`
        setState({ status: 'error', progress: 0, error: message })
        toast.error(message)
        continue
      }

      setState({ status: 'uploading', progress: 4, error: null })
      try {
        const localHash = await calculateSha256(file)
        if (localHash && defaultServer) {
          const requirements = await validateBud06UploadRequirements({
            serverUrl: defaultServer,
            sha256: localHash,
            mimeType: file.type || 'application/octet-stream',
            size: file.size,
          })
          if (!requirements.ok) {
            throw new Error(requirements.message)
          }
        }
        const result = await uploadToConfiguredBlossomServers({
          ndk,
          file,
          label: 'blossom-explorer',
          onProgress: ({ loaded, total }) => {
            setState({ status: 'uploading', progress: Math.round((loaded / total) * 100), error: null })
          },
        })
        const hash = result.x || result.sha256 || localHash
        const record: BlossomFileRecord = {
          id: hash || `${file.name}-${Date.now()}`,
          name: file.name,
          type: getFileKind(file.type, file.name),
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          createdAt: Date.now(),
          url: result.url,
          hash,
          blurhash: result.blurhash,
          blossomServerUrl: defaultServer || new URL(result.url).origin,
          pathLabel: 'uploads/recentes',
          metadata: { fallback: result.fallback },
        }

        onUploaded({ file: record, fallbackUrls: result.fallback ?? [] })
        setState({ status: 'success', progress: 100, error: null })
        toast.success(`${file.name} enviado para Blossom.`)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Falha ao enviar arquivo.'
        setState({ status: 'error', progress: 0, error: message })
        toast.error(message)
      }
    }
  }

  return { ...state, uploadFiles, reset: () => setState({ status: 'idle', progress: 0, error: null }) }
}

interface UploadState {
  status: BlossomUploadStatus
  progress: number
  error: string | null
}

function useStateCompat() {
  return useState<UploadState>({ status: 'idle', progress: 0, error: null })
}
