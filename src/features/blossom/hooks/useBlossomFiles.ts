import type NDK from '@nostr-dev-kit/ndk'
import type { NDKSigner } from '@nostr-dev-kit/ndk'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  cacheBlossomFiles,
  cacheBlossomServer,
  readCachedBlossomFiles,
  readCachedBlossomServers,
  removeCachedBlossomFile,
} from '../blossom.db'
import {
  dedupeFilesByHash,
  fetchBud03ServerList,
  loadBlossomFilesFromServer,
  loadBlossomServerCapabilities,
  resolveServerOrder,
} from '../blossom.service'
import type { BlossomFileRecord, BlossomServerStatus } from '../blossom.types'

interface UseBlossomFilesResult {
  files: BlossomFileRecord[]
  servers: BlossomServerStatus[]
  serverErrors: Array<{ url: string; message: string }>
  cacheVersion: number
  pendingServers: number
  isDiscoveringServers: boolean
  isHydratingCache: boolean
  isLoading: boolean
  error: string | null
  addFile: (file: BlossomFileRecord) => void
  removeLocalFile: (file: BlossomFileRecord) => void
  retry: () => void
}

interface UseBlossomFilesParams {
  ndk?: NDK
  pubkey?: string
  localServers: string[]
  signer?: NDKSigner
}

export function useBlossomFiles({ ndk, pubkey, localServers, signer }: UseBlossomFilesParams): UseBlossomFilesResult {
  const [files, setFiles] = useState<BlossomFileRecord[]>([])
  const [servers, setServers] = useState<BlossomServerStatus[]>([])
  const [serverErrors, setServerErrors] = useState<Array<{ url: string; message: string }>>([])
  const [pendingServers, setPendingServers] = useState(0)
  const [isDiscoveringServers, setIsDiscoveringServers] = useState(false)
  const [isHydratingCache, setIsHydratingCache] = useState(false)
  const [cacheVersion, setCacheVersion] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const runIdRef = useRef(0)

  const addPendingServer = useCallback((server: BlossomServerStatus) => {
    setServers((current) => upsertServer(current, server))
    setPendingServers((current) => current + 1)
  }, [])

  useEffect(() => {
    const runId = runIdRef.current + 1 + reloadKey * 0
    runIdRef.current = runId
    const queriedServers = new Set<string>()

    setError(null)
    setFiles([])
    setServers([])
    setServerErrors([])
    setPendingServers(0)
    setIsDiscoveringServers(false)
    setIsHydratingCache(false)

    if (!ndk || !pubkey) return

    setIsHydratingCache(true)
    Promise.all([readCachedBlossomFiles(pubkey), readCachedBlossomServers(pubkey)])
      .then(([cachedFiles, cachedServers]) => {
        if (runIdRef.current !== runId) return
        if (cachedFiles.length > 0) setFiles(cachedFiles)
        if (cachedServers.length > 0) setServers(cachedServers)
      })
      .catch(() => {
        /* Cache is an optimization; remote loading remains authoritative. */
      })
      .finally(() => {
        if (runIdRef.current === runId) setIsHydratingCache(false)
      })

    const queryServer = (serverUrl: string, index: number, bud03Servers: string[]) => {
      if (queriedServers.has(serverUrl)) return
      queriedServers.add(serverUrl)
      const source = bud03Servers.includes(serverUrl)
        ? 'bud03'
        : localServers.includes(serverUrl)
          ? 'local'
          : 'fallback'

      addPendingServer({
        url: serverUrl,
        online: false,
        listStatus: 'pending',
        isDefault: index === 0,
        source,
      })

      loadBlossomFilesFromServer({ ndk, pubkey, serverUrl, localServers, bud03Servers, index, signer })
        .then((result) => {
          if (runIdRef.current !== runId) return
          setServers((current) => upsertServer(current, result.server))
          void cacheBlossomServer(pubkey, result.server)
          void cacheBlossomFiles(pubkey, result.server, result.files).then(() =>
            setCacheVersion((current) => current + 1),
          )
        })
        .catch((loadError) => {
          if (runIdRef.current !== runId) return
          const message = loadError instanceof Error ? loadError.message : 'Falha ao listar blobs.'
          setServers((current) =>
            upsertServer(current, {
              url: serverUrl,
              online: false,
              listStatus: 'error',
              isDefault: index === 0,
              source,
              error: message,
            }),
          )
          void cacheBlossomServer(pubkey, {
            url: serverUrl,
            online: false,
            listStatus: 'error',
            isDefault: index === 0,
            source,
            error: message,
          })
          setServerErrors((current) => [
            ...current.filter((entry) => entry.url !== serverUrl),
            { url: serverUrl, message },
          ])
        })
        .finally(() => {
          if (runIdRef.current !== runId) return
          setPendingServers((current) => Math.max(0, current - 1))
        })

      loadBlossomServerCapabilities(serverUrl)
        .then((capabilities) => {
          if (runIdRef.current !== runId) return
          setServers((current) => {
            const existing = current.find((server) => server.url === serverUrl)
            if (!existing) return current
            const next = { ...existing, capabilities }
            void cacheBlossomServer(pubkey, next)
            return upsertServer(current, next)
          })
        })
        .catch(() => {
          /* capabilities are non-blocking */
        })
    }

    const initialServers = localServers.length > 0 ? resolveServerOrder([], localServers) : []
    initialServers.forEach((serverUrl, index) => queryServer(serverUrl, index, []))

    setIsDiscoveringServers(true)
    fetchBud03ServerList(ndk, pubkey)
      .then((bud03Servers) => {
        if (runIdRef.current !== runId) return
        resolveServerOrder(bud03Servers, localServers).forEach((serverUrl, index) =>
          queryServer(serverUrl, index, bud03Servers),
        )
      })
      .catch(() => {
        /* BUD-03 discovery is optional and must not block direct listing. */
      })
      .finally(() => {
        if (runIdRef.current === runId) setIsDiscoveringServers(false)
      })
  }, [addPendingServer, localServers, ndk, pubkey, reloadKey, signer])

  return {
    files,
    servers,
    serverErrors,
    cacheVersion,
    pendingServers,
    isDiscoveringServers,
    isHydratingCache,
    isLoading: pendingServers > 0 || isDiscoveringServers,
    error,
    addFile: (file) =>
      setFiles((current) => {
        if (pubkey) {
          void cacheBlossomFiles(
            pubkey,
            { url: file.blossomServerUrl, online: true, listStatus: 'success', source: 'local' },
            [file],
          ).then(() => setCacheVersion((version) => version + 1))
        } else {
          setCacheVersion((version) => version + 1)
        }
        return dedupeFilesByHash([file, ...current.filter((item) => item.id !== file.id)])
      }),
    removeLocalFile: (file) => {
      if (pubkey) void removeCachedBlossomFile(pubkey, file).then(() => setCacheVersion((version) => version + 1))
      setFiles((current) => current.filter((entry) => entry.id !== file.id))
    },
    retry: () => setReloadKey((current) => current + 1),
  }
}

function upsertServer(servers: BlossomServerStatus[], next: BlossomServerStatus): BlossomServerStatus[] {
  const index = servers.findIndex((server) => server.url === next.url)
  if (index === -1) return [...servers, next]
  return servers.map((server) => (server.url === next.url ? { ...server, ...next } : server))
}
