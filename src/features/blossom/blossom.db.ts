import Dexie, { type EntityTable } from 'dexie'
import type { BlossomFileRecord, BlossomFileSort, BlossomFileTypeFilter, BlossomServerStatus } from './blossom.types'
import { filterAndSortBlossomFiles } from './blossom.utils'

interface CachedBlossomFile {
  cacheKey: string
  pubkey: string
  hashOrUrl: string
  serverUrl: string
  source: BlossomServerStatus['source']
  file: BlossomFileRecord
  cachedAt: number
  lastSeenAt: number
}

interface CachedBlossomServer {
  cacheKey: string
  pubkey: string
  url: string
  server: BlossomServerStatus
  cachedAt: number
  lastSeenAt: number
}

const db = new Dexie('nostrtube-blossom') as Dexie & {
  files: EntityTable<CachedBlossomFile, 'cacheKey'>
  servers: EntityTable<CachedBlossomServer, 'cacheKey'>
}

db.version(1).stores({
  files: 'cacheKey, pubkey, hashOrUrl, serverUrl, cachedAt, lastSeenAt',
  servers: 'cacheKey, pubkey, url, cachedAt, lastSeenAt',
})

function fileCacheKey(pubkey: string, file: BlossomFileRecord) {
  return `${pubkey}:${file.hash ?? file.url}`
}

function serverCacheKey(pubkey: string, url: string) {
  return `${pubkey}:${url}`
}

export async function readCachedBlossomFiles(pubkey: string): Promise<BlossomFileRecord[]> {
  const rows = await db.files.where('pubkey').equals(pubkey).reverse().sortBy('lastSeenAt')
  return rows.map((row) => row.file)
}

export async function readCachedBlossomFilesPage({
  pubkey,
  search,
  typeFilter,
  sort,
  offset,
  limit,
}: {
  pubkey: string
  search: string
  typeFilter: BlossomFileTypeFilter
  sort: BlossomFileSort
  offset: number
  limit: number
}): Promise<{ files: BlossomFileRecord[]; total: number }> {
  const rows = await db.files.where('pubkey').equals(pubkey).toArray()
  const filtered = filterAndSortBlossomFiles(
    rows.map((row) => row.file),
    search,
    typeFilter,
    sort,
  )
  return {
    files: filtered.slice(offset, offset + limit),
    total: filtered.length,
  }
}

export async function readCachedBlossomServers(pubkey: string): Promise<BlossomServerStatus[]> {
  const rows = await db.servers.where('pubkey').equals(pubkey).reverse().sortBy('lastSeenAt')
  return rows.map((row) => row.server)
}

export async function cacheBlossomFiles(pubkey: string, server: BlossomServerStatus, files: BlossomFileRecord[]) {
  const now = Date.now()
  await db.files.bulkPut(
    files.map((file) => ({
      cacheKey: fileCacheKey(pubkey, file),
      pubkey,
      hashOrUrl: file.hash ?? file.url,
      serverUrl: server.url,
      source: server.source,
      file: {
        ...file,
        metadata: {
          ...file.metadata,
          cacheSource: server.source,
          cacheUpdatedAt: now,
        },
      },
      cachedAt: now,
      lastSeenAt: now,
    })),
  )
}

export async function cacheBlossomServer(pubkey: string, server: BlossomServerStatus) {
  const now = Date.now()
  await db.servers.put({
    cacheKey: serverCacheKey(pubkey, server.url),
    pubkey,
    url: server.url,
    server,
    cachedAt: now,
    lastSeenAt: now,
  })
}

export async function removeCachedBlossomFile(pubkey: string, file: BlossomFileRecord) {
  await db.files.delete(fileCacheKey(pubkey, file))
}
