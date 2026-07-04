import NDK, { NDKEvent } from '@nostr-dev-kit/ndk'
import { NDKBlossom } from '@nostr-dev-kit/ndk-blossom'
import { MOCK_BLOSSOM_SERVERS } from '@/default'
import { PresetCacheService } from '@/features/presets/services/PresetCacheService'
import { LoggerAgent } from '@/lib/debug'
import useUserStore from '@/store/useUserStore'

const logger = LoggerAgent.create('BlossomServers')

type UploadProgress = {
  loaded: number
  total: number
}

export interface BlossomMediaUploadResult {
  url: string
  sha256?: string
  x?: string
  size?: string
  m?: string
  fallback?: string[]
  blurhash?: string
  dim?: string
  duration?: string
}

export interface ConfiguredBlossomServers {
  primary: string
  mirrors: string[]
  available: string[]
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

export function normalizeBlossomServerUrl(url: string): string {
  return url.trim().replace(/\/$/, '')
}

function getDefaultPrimary() {
  return normalizeBlossomServerUrl(import.meta.env.VITE_NOSTR_BLOSSOM_FALLBACK || MOCK_BLOSSOM_SERVERS[0]?.url || '')
}

function getActivePresetBlossomProxy(): string {
  try {
    const selectedPubkey = PresetCacheService.getSelectedPresetPubkey()
    if (!selectedPubkey) return ''
    const cachedPreset = PresetCacheService.getCachedPreset(selectedPubkey)?.preset
    return cachedPreset?.content.defaultBlossomProxy
      ? normalizeBlossomServerUrl(cachedPreset.content.defaultBlossomProxy)
      : ''
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Failed to read preset Blossom proxy', error)
    }
    return ''
  }
}

export function getConfiguredBlossomServers(): ConfiguredBlossomServers {
  const blossom = useUserStore.getState().blossom
  const presetBlossomProxy = getActivePresetBlossomProxy()
  const primary = normalizeBlossomServerUrl(blossom.default || presetBlossomProxy || getDefaultPrimary())
  const mirrors = uniqueStrings(blossom.mirrors.map(normalizeBlossomServerUrl)).filter((url) => url !== primary)
  const available = uniqueStrings([
    ...MOCK_BLOSSOM_SERVERS.map((server) => normalizeBlossomServerUrl(server.url)),
    ...blossom.custom.map(normalizeBlossomServerUrl),
    presetBlossomProxy,
    primary,
    ...mirrors,
  ])

  return { primary, mirrors, available }
}

export async function testBlossomServer(url: string): Promise<{ ok: boolean; message?: string }> {
  const normalized = normalizeBlossomServerUrl(url)

  try {
    const response = await fetch(`${normalized}/upload`, {
      method: 'HEAD',
    })

    if (response.ok || response.status === 400 || response.status === 401 || response.status === 405) {
      return { ok: true }
    }

    return { ok: false, message: `Server responded with status ${response.status}` }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Unable to reach server' }
  }
}

async function createBlossomAuthHeader(ndk: NDK, sha256: string, content: string) {
  const authEvent = new NDKEvent(ndk)
  authEvent.kind = 24242
  authEvent.created_at = Math.floor(Date.now() / 1000)
  authEvent.content = content
  authEvent.tags = [
    ['t', 'upload'],
    ['x', sha256],
    ['expiration', String(Math.floor(Date.now() / 1000) + 3600)],
  ]
  await authEvent.sign()
  return `Nostr ${btoa(JSON.stringify(authEvent.rawEvent()))}`
}

async function calculateFileSha256(file: File) {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function getUploadUrl(server: string) {
  return `${server}/upload`
}

function normalizeUploadResult(
  server: string,
  file: File,
  sha256: string,
  responseBody: unknown,
): BlossomMediaUploadResult {
  const response =
    responseBody && typeof responseBody === 'object' ? (responseBody as Partial<BlossomMediaUploadResult>) : {}
  return {
    ...response,
    url: response.url || `${server}/${sha256}`,
    sha256: response.sha256 || sha256,
    x: response.x || sha256,
    size: response.size || String(file.size),
    m: response.m || file.type,
  }
}

function parseJsonResponse(text: string): unknown {
  if (!text) return undefined
  try {
    return JSON.parse(text) as unknown
  } catch {
    return undefined
  }
}

async function uploadToSpecificServerDirect(
  ndk: NDK,
  file: File,
  server: string,
  onProgress?: (progress: UploadProgress) => void,
): Promise<BlossomMediaUploadResult> {
  const sha256 = await calculateFileSha256(file)
  const authorization = await createBlossomAuthHeader(ndk, sha256, `Upload ${file.name}`)
  onProgress?.({ loaded: 0, total: file.size })

  const response = await fetch(getUploadUrl(server), {
    method: 'PUT',
    headers: {
      Authorization: authorization,
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(body || `Upload request failed with status ${response.status}`)
  }

  const text = await response.text()
  const responseBody = parseJsonResponse(text)
  onProgress?.({ loaded: file.size, total: file.size })
  return normalizeUploadResult(server, file, sha256, responseBody)
}

async function uploadToSpecificServer(
  ndk: NDK,
  file: File,
  server: string,
  onProgress?: (progress: UploadProgress) => void,
): Promise<BlossomMediaUploadResult> {
  const blossom = new NDKBlossom(ndk)
  blossom.debug = import.meta.env.DEV

  if (onProgress) {
    blossom.onUploadProgress = (progress) => {
      onProgress(progress)
      return 'continue'
    }
  }

  try {
    return await uploadToSpecificServerDirect(ndk, file, server, onProgress)
  } catch (error) {
    logger.debug('Direct BUD-01 upload failed, trying NDK Blossom upload', {
      server,
      fileName: file.name,
      error: error instanceof Error ? error.message : String(error),
    })
    return blossom.upload(file, { server }) as Promise<BlossomMediaUploadResult>
  }
}

async function mirrorToServer(
  ndk: NDK,
  server: string,
  sourceUrl: string,
  sha256: string,
  fileName: string,
): Promise<BlossomMediaUploadResult> {
  const authorization = await createBlossomAuthHeader(ndk, sha256, `Mirror ${fileName}`)
  const response = await fetch(`${server}/mirror`, {
    method: 'PUT',
    headers: {
      Authorization: authorization,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url: sourceUrl }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(body || `Mirror request failed with status ${response.status}`)
  }

  return response.json() as Promise<BlossomMediaUploadResult>
}

export async function uploadToConfiguredBlossomServers({
  ndk,
  file,
  onProgress,
  onMirroringStart,
  label,
}: {
  ndk: NDK
  file: File
  onProgress?: (progress: UploadProgress) => void
  onMirroringStart?: () => void
  label?: string
}) {
  const { primary, mirrors, available } = getConfiguredBlossomServers()
  const uploadCandidates = uniqueStrings([primary, ...available])
  if (uploadCandidates.length === 0) {
    throw new Error('No Blossom server configured')
  }

  let primaryUpload: BlossomMediaUploadResult | undefined
  let selectedServer: string | undefined
  const uploadErrors: string[] = []

  for (const server of uploadCandidates) {
    try {
      logger.debug('Uploading to Blossom server', { server, label, fileName: file.name, mirrors })
      primaryUpload = await uploadToSpecificServer(ndk, file, server, onProgress)
      selectedServer = server
      break
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : String(uploadError)
      uploadErrors.push(`${server}: ${message}`)
      logger.debug('Blossom upload failed, trying next server', {
        server,
        label,
        error: message,
      })
    }
  }

  if (!primaryUpload || !selectedServer) {
    throw new Error(`Upload failed on all configured Blossom servers: ${uploadErrors.join('; ')}`)
  }

  const sha256 = primaryUpload.x || primaryUpload.sha256

  const fallbackUrls: string[] = []
  const mirrorCandidates = mirrors.filter((server) => server !== selectedServer)

  if (mirrorCandidates.length > 0 && sha256) {
    onMirroringStart?.()
  }

  for (const mirrorServer of mirrorCandidates) {
    if (!sha256) {
      logger.debug('Skipping mirror because sha256 is missing', { mirrorServer, label })
      continue
    }

    try {
      const mirrored = await mirrorToServer(ndk, mirrorServer, primaryUpload.url, sha256, file.name)
      if (mirrored.url && mirrored.url !== primaryUpload.url) {
        fallbackUrls.push(mirrored.url)
      }
      logger.debug('BUD-04 mirror success', { mirrorServer, label, url: mirrored.url })
      continue
    } catch (mirrorError) {
      logger.debug('BUD-04 mirror failed, falling back to direct upload', {
        mirrorServer,
        label,
        error: mirrorError instanceof Error ? mirrorError.message : String(mirrorError),
      })
    }

    try {
      const mirrored = await uploadToSpecificServer(ndk, file, mirrorServer)
      if (mirrored.url && mirrored.url !== primaryUpload.url) {
        fallbackUrls.push(mirrored.url)
      }
      logger.debug('Direct mirror upload success', { mirrorServer, label, url: mirrored.url })
    } catch (uploadError) {
      logger.debug('Direct mirror upload failed', {
        mirrorServer,
        label,
        error: uploadError instanceof Error ? uploadError.message : String(uploadError),
      })
    }
  }

  return {
    ...primaryUpload,
    fallback: uniqueStrings([...(primaryUpload.fallback ?? []), ...fallbackUrls]),
  }
}
