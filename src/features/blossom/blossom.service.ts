import NDK, { NDKEvent, type NDKRawEvent, type NDKSigner } from '@nostr-dev-kit/ndk'
import type { BlobDescriptor, EventTemplate, SignedEvent } from 'blossom-client-sdk'
import { BlossomClient } from 'blossom-client-sdk'
import { MOCK_BLOSSOM_SERVERS } from '@/default'
import { BlossomDeleteError } from '@/errors'
import { fetchEventCached } from '@/features/nostr/services/ndk-query.service'
import { normalizeBlossomServerUrl } from '@/features/upload/services/blossom-server.service'
import type {
  BlossomFileRecord,
  BlossomFilesLoadResult,
  BlossomServerCapabilities,
  BlossomServerStatus,
} from './blossom.types'
import { getFileKind, isValidBlossomUrl } from './blossom.utils'

const BLOSSOM_SERVER_LIST_KIND = 10063
const SERVER_CAPABILITY_TIMEOUT_MS = 2500
const SERVER_LIST_TIMEOUT_MS = 6500
const BUD03_TIMEOUT_MS = 4500

type BlossomDescriptorWithBud08 = BlobDescriptor & {
  nip94?: string[][]
  name?: string
  alt?: string
  blurhash?: string
  dim?: string
  magnet?: string
  infohash?: string
  ipfs?: string
}

interface LoadBlossomFilesParams {
  ndk: NDK
  pubkey: string
  localServers: string[]
  signer?: NDKSigner
}

export interface LoadBlossomServerFilesParams {
  ndk: NDK
  pubkey: string
  serverUrl: string
  localServers: string[]
  bud03Servers: string[]
  index: number
  signer?: NDKSigner
}

export async function loadBlossomFilesForUser({
  ndk,
  pubkey,
  localServers,
  signer,
}: LoadBlossomFilesParams): Promise<BlossomFilesLoadResult> {
  const bud03Servers = await fetchBud03ServerList(ndk, pubkey)
  const servers = resolveServerOrder(bud03Servers, localServers)

  if (servers.length === 0) {
    return { files: [], servers: [], serverErrors: [], source: 'empty' }
  }

  const settled = await Promise.all(
    servers.map(async (serverUrl, index) => {
      const startedAt = performance.now()
      try {
        const client = new BlossomClient(serverUrl, signer ? createBlossomSigner(ndk, signer) : undefined)
        const descriptors = await client.listBlobs(pubkey, {
          auth: Boolean(signer),
          timeout: SERVER_LIST_TIMEOUT_MS,
        })
        const latencyMs = Math.round(performance.now() - startedAt)
        const capabilities = await probeServerCapabilities(serverUrl)
        return {
          ok: true as const,
          server: {
            url: serverUrl,
            online: true,
            latencyMs,
            isDefault: index === 0,
            source: getServerSource(serverUrl, bud03Servers, localServers),
            capabilities,
            filesCount: descriptors.length,
          } satisfies BlossomServerStatus,
          files: descriptors.map((descriptor) => mapBlobDescriptorToFile(descriptor, serverUrl)),
        }
      } catch (error) {
        const capabilities = await probeServerCapabilities(serverUrl)
        return {
          ok: false as const,
          server: {
            url: serverUrl,
            online: false,
            isDefault: index === 0,
            source: getServerSource(serverUrl, bud03Servers, localServers),
            error: error instanceof Error ? error.message : 'Falha ao listar blobs.',
            capabilities,
          } satisfies BlossomServerStatus,
          files: [],
        }
      }
    }),
  )

  const serverErrors = settled
    .filter((entry) => !entry.ok)
    .map((entry) => ({ url: entry.server.url, message: entry.server.error ?? 'Servidor indisponível.' }))

  return {
    files: dedupeFilesByHash(settled.flatMap((entry) => entry.files)),
    servers: settled.map((entry) => entry.server),
    serverErrors,
    source: 'real',
  }
}

export async function loadBlossomFilesFromServer({
  ndk,
  pubkey,
  serverUrl,
  localServers,
  bud03Servers,
  index,
  signer,
}: LoadBlossomServerFilesParams): Promise<{ server: BlossomServerStatus; files: BlossomFileRecord[] }> {
  const startedAt = performance.now()
  const client = new BlossomClient(serverUrl, signer ? createBlossomSigner(ndk, signer) : undefined)
  const descriptors = await client.listBlobs(pubkey, {
    auth: Boolean(signer),
    timeout: SERVER_LIST_TIMEOUT_MS,
  })

  return {
    server: {
      url: serverUrl,
      online: true,
      listStatus: 'success',
      latencyMs: Math.round(performance.now() - startedAt),
      isDefault: index === 0,
      source: getServerSource(serverUrl, bud03Servers, localServers),
      filesCount: descriptors.length,
    },
    files: descriptors.map((descriptor) => mapBlobDescriptorToFile(descriptor, serverUrl)),
  }
}

export async function deleteBlossomFile({
  ndk,
  signer,
  file,
  servers,
}: {
  ndk: NDK
  signer: NDKSigner
  file: BlossomFileRecord
  servers: string[]
}): Promise<Array<{ serverUrl: string; ok: boolean; message?: string }>> {
  if (!file.hash) throw new BlossomDeleteError('Arquivo sem hash SHA-256 para deleção Blossom.', { fileId: file.id })
  const signerAdapter = createBlossomSigner(ndk, signer)
  const targets = Array.from(new Set([file.blossomServerUrl, ...servers].filter(isValidBlossomUrl)))

  return Promise.all(
    targets.map(async (serverUrl) => {
      try {
        const client = new BlossomClient(serverUrl, signerAdapter)
        await client.deleteBlob(file.hash!, { auth: true, timeout: SERVER_LIST_TIMEOUT_MS })
        return { serverUrl, ok: true }
      } catch (error) {
        return { serverUrl, ok: false, message: error instanceof Error ? error.message : 'Falha ao deletar blob.' }
      }
    }),
  )
}

export async function loadBlossomServerCapabilities(serverUrl: string): Promise<BlossomServerCapabilities> {
  return probeServerCapabilities(serverUrl)
}

export async function validateBud06UploadRequirements({
  serverUrl,
  sha256,
  mimeType,
  size,
}: {
  serverUrl: string
  sha256: string
  mimeType: string
  size: number
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const response = await fetchWithAbort(
      `${serverUrl}/upload`,
      {
        method: 'HEAD',
        headers: {
          'X-SHA-256': sha256,
          'X-Content-Type': mimeType || 'application/octet-stream',
          'X-Content-Length': String(size),
        },
      },
      SERVER_CAPABILITY_TIMEOUT_MS,
    )

    if (response.ok || response.status === 401) return { ok: true }
    const reason = response.headers.get('X-Reason')
    return { ok: false, message: reason || `Servidor recusou o upload com status ${response.status}.` }
  } catch {
    return { ok: true }
  }
}

export async function fetchBud03ServerList(ndk: NDK, pubkey: string): Promise<string[]> {
  const event = await withTimeout(
    fetchEventCached(
      ndk,
      {
        authors: [pubkey],
        kinds: [BLOSSOM_SERVER_LIST_KIND],
        limit: 1,
      },
      { mode: 'parallel' },
    ),
    BUD03_TIMEOUT_MS,
  ).catch(() => null)

  return (
    event?.tags
      .filter((tag) => tag[0] === 'server' && tag[1])
      .map((tag) => normalizeBlossomServerUrl(tag[1]))
      .filter(isValidBlossomUrl) ?? []
  )
}

function getServerSource(url: string, bud03Servers: string[], localServers: string[]): 'bud03' | 'local' | 'fallback' {
  if (bud03Servers.includes(url)) return 'bud03'
  if (localServers.includes(url)) return 'local'
  return 'fallback'
}

export function resolveServerOrder(bud03Servers: string[], localServers: string[]): string[] {
  const fallbackServers = MOCK_BLOSSOM_SERVERS.map((server) => normalizeBlossomServerUrl(server.url)).filter(
    isValidBlossomUrl,
  )
  const shouldUseFallback = bud03Servers.length === 0 && localServers.length === 0
  return Array.from(
    new Set(
      [...bud03Servers, ...localServers, ...(shouldUseFallback ? fallbackServers : [])]
        .map((server) => normalizeBlossomServerUrl(server))
        .filter(isValidBlossomUrl),
    ),
  )
}

function createBlossomSigner(ndk: NDK, signer: NDKSigner) {
  return async (draft: EventTemplate): Promise<SignedEvent> => {
    const event = new NDKEvent(ndk)
    event.kind = draft.kind
    event.content = draft.content
    event.created_at = draft.created_at
    event.tags = draft.tags
    await event.sign(signer)
    return event.rawEvent() as NDKRawEvent as SignedEvent
  }
}

async function probeServerCapabilities(serverUrl: string): Promise<BlossomServerCapabilities> {
  const [uploadRequirements, mediaOptimization, reporting] = await Promise.all([
    probeHeadEndpoint(`${serverUrl}/upload`),
    probeHeadEndpoint(`${serverUrl}/media`),
    probeReportEndpoint(serverUrl),
  ])

  return { uploadRequirements, mediaOptimization, reporting }
}

async function probeHeadEndpoint(url: string): Promise<'supported' | 'unsupported' | 'unknown'> {
  try {
    const response = await fetchWithAbort(url, { method: 'HEAD' }, SERVER_CAPABILITY_TIMEOUT_MS)
    if (response.status === 404 || response.status === 405) return 'unsupported'
    return 'supported'
  } catch {
    return 'unknown'
  }
}

async function probeReportEndpoint(serverUrl: string): Promise<'supported' | 'unsupported' | 'unknown'> {
  try {
    const response = await fetchWithAbort(`${serverUrl}/report`, { method: 'OPTIONS' }, SERVER_CAPABILITY_TIMEOUT_MS)
    if (response.status === 404 || response.status === 405) return 'unsupported'
    return 'supported'
  } catch {
    return 'unknown'
  }
}

async function fetchWithAbort(input: RequestInfo | URL, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

function mapBlobDescriptorToFile(descriptor: BlossomDescriptorWithBud08, serverUrl: string): BlossomFileRecord {
  const nip94 = Object.fromEntries(
    (descriptor.nip94 ?? []).filter((entry) => entry.length >= 2).map(([key, value]) => [key, value]),
  )
  const mimeType = descriptor.type || nip94.m || 'application/octet-stream'
  const url = descriptor.url || `${serverUrl}/${descriptor.sha256}`
  const name =
    descriptor.name || getNameFromUrl(url) || `${descriptor.sha256.slice(0, 12)}.${extensionFromMime(mimeType)}`

  return {
    id: `${serverUrl}-${descriptor.sha256}`,
    name,
    type: getFileKind(mimeType, name),
    mimeType,
    size: descriptor.size,
    createdAt: descriptor.uploaded * 1000,
    url,
    hash: descriptor.sha256,
    blurhash: descriptor.blurhash || nip94.blurhash,
    blossomServerUrl: serverUrl,
    pathLabel: 'BUD-02 /list',
    metadata: {
      nip94: descriptor.nip94,
      magnet: descriptor.magnet || nip94.magnet,
      infohash: descriptor.infohash || nip94.i,
      ipfs: descriptor.ipfs,
      dim: descriptor.dim || nip94.dim,
      alt: descriptor.alt || nip94.alt,
    },
  }
}

export function dedupeFilesByHash(files: BlossomFileRecord[]) {
  const byHash = new Map<string, BlossomFileRecord>()
  for (const file of files) {
    const key = file.hash ?? file.url
    const existing = byHash.get(key)
    if (!existing) {
      byHash.set(key, file)
      continue
    }

    byHash.set(key, {
      ...existing,
      metadata: {
        ...existing.metadata,
        mirrors: [...new Set([...(asStringArray(existing.metadata?.mirrors) ?? []), file.blossomServerUrl])],
      },
    })
  }
  return Array.from(byHash.values())
}

function asStringArray(value: unknown): string[] | undefined {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string') ? value : undefined
}

function getNameFromUrl(url: string): string | undefined {
  try {
    const pathname = new URL(url).pathname
    const last = pathname.split('/').filter(Boolean).at(-1)
    return last ? decodeURIComponent(last) : undefined
  } catch {
    return undefined
  }
}

function extensionFromMime(mimeType: string) {
  const subtype = mimeType.split('/')[1]
  if (!subtype) return 'bin'
  return subtype.split(';')[0].replace('jpeg', 'jpg')
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeout = setTimeout(() => reject(new Error('Tempo limite excedido.')), timeoutMs)
      }),
    ])
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}
