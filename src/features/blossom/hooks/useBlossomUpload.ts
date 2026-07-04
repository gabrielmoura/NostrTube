import { useNDK } from '@nostr-dev-kit/ndk-hooks'
import { useAsyncQueuer } from '@tanstack/react-pacer'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  BlossomAuthError,
  BlossomConfigurationError,
  BlossomFileTooLargeError,
  BlossomUploadRequirementError,
} from '@/errors'
import { uploadToConfiguredBlossomServers } from '@/features/upload/services/blossom-server.service'
import { useThrottledProgress } from '@/hooks/useThrottledProgress'
import { validateBud06UploadRequirements } from '../blossom.service'
import type { BlossomFileRecord, BlossomUploadResult, BlossomUploadStatus } from '../blossom.types'
import { BLOSSOM_MAX_FILE_SIZE_BYTES, calculateSha256, getFileKind } from '../blossom.utils'

interface UseBlossomUploadOptions {
  defaultServer: string
  hasUserConfiguration: boolean
  onUploaded: (result: BlossomUploadResult) => void
  concurrency?: number
}

type UploadJob = {
  id: string
  file: File
}

type PendingUpload = {
  resolve: (result: BlossomUploadResult) => void
  reject: (error: Error) => void
}

export function useBlossomUpload({
  defaultServer,
  hasUserConfiguration,
  onUploaded,
  concurrency = 1,
}: UseBlossomUploadOptions) {
  const { ndk } = useNDK()
  const [state, setState] = useStateCompat()
  const pendingUploadsRef = useRef(new Map<string, PendingUpload>())
  const throttleProgress = useThrottledProgress(
    (progress) => setState({ status: 'uploading', progress, error: null }),
    100,
    'blossom-upload-progress',
  )
  const blossomUploadQueue = useAsyncQueuer<UploadJob>(
    async ({ file }) => {
      if (!ndk) {
        throw new BlossomAuthError('Faça login para assinar o upload Blossom.')
      }
      if (!hasUserConfiguration && !defaultServer) {
        throw new BlossomConfigurationError('Configure um servidor Blossom antes de enviar.')
      }

      if (file.size > BLOSSOM_MAX_FILE_SIZE_BYTES) {
        throw new BlossomFileTooLargeError(`${file.name} excede o limite de 4GB.`, {
          fileName: file.name,
          fileSize: file.size,
        })
      }

      setState({ status: 'uploading', progress: 4, error: null })
      const localHash = await calculateSha256(file)
      if (localHash && defaultServer) {
        const requirements = await validateBud06UploadRequirements({
          serverUrl: defaultServer,
          sha256: localHash,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
        })
        if (!requirements.ok) {
          throw new BlossomUploadRequirementError(requirements.message, {
            fileName: file.name,
            mimeType: file.type || 'application/octet-stream',
            serverUrl: defaultServer,
          })
        }
      }

      const result = await uploadToConfiguredBlossomServers({
        ndk,
        file,
        label: 'blossom-explorer',
        onProgress: ({ loaded, total }) => {
          throttleProgress(loaded, total)
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
      return { file: record, fallbackUrls: result.fallback ?? [] }
    },
    {
      key: 'blossom-upload-queue',
      concurrency,
      started: true,
      onSuccess: (result, job) => {
        const pending = pendingUploadsRef.current.get(job.id)
        pending?.resolve(result as BlossomUploadResult)
        pendingUploadsRef.current.delete(job.id)
      },
      onError: (error, job) => {
        const pending = pendingUploadsRef.current.get(job.id)
        const normalizedError = error instanceof Error ? error : new Error(String(error))
        pending?.reject(normalizedError)
        pendingUploadsRef.current.delete(job.id)
      },
      onSettled: (_job) => {
        // cleanup happens in the success/error handlers; this keeps the queue key visible in Devtools
      },
    },
    () => ({}),
  )

  useEffect(() => {
    return () => {
      pendingUploadsRef.current.forEach(({ reject }) => {
        reject(new Error('Envio cancelado.'))
      })
      pendingUploadsRef.current.clear()
    }
  }, [])

  const enqueueUpload = (file: File) =>
    new Promise<BlossomUploadResult>((resolve, reject) => {
      const generatedId = globalThis.crypto?.randomUUID?.()
      const id = generatedId ?? `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`
      pendingUploadsRef.current.set(id, { resolve, reject })
      const accepted = blossomUploadQueue.addItem({ id, file })
      if (!accepted) {
        pendingUploadsRef.current.delete(id)
        reject(new Error('Fila de uploads Blossom está cheia.'))
      }
    })

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

    const validFiles: File[] = []
    for (const file of files) {
      if (file.size > BLOSSOM_MAX_FILE_SIZE_BYTES) {
        const message = `${file.name} excede o limite de 4GB.`
        setState({ status: 'error', progress: 0, error: message })
        toast.error(message)
        continue
      }

      validFiles.push(file)
    }

    if (validFiles.length === 0) {
      return
    }

    setState({ status: 'uploading', progress: 0, error: null })
    const settled = await Promise.allSettled(validFiles.map((file) => enqueueUpload(file)))
    const rejected = settled.find((entry): entry is PromiseRejectedResult => entry.status === 'rejected')

    if (rejected) {
      const message = rejected.reason instanceof Error ? rejected.reason.message : 'Falha ao enviar arquivo.'
      setState({ status: 'error', progress: 0, error: message })
      return
    }

    setState({ status: 'success', progress: 100, error: null })
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
