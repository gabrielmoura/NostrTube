import { useCallback, useEffect, useState } from 'react'
import { readCachedBlossomFilesPage } from '../blossom.db'
import type { BlossomFileRecord, BlossomFileSort, BlossomFileTypeFilter } from '../blossom.types'

const PAGE_SIZE = 40

export function useBlossomDbFiles({
  pubkey,
  search,
  typeFilter,
  sort,
  cacheVersion,
}: {
  pubkey?: string
  search: string
  typeFilter: BlossomFileTypeFilter
  sort: BlossomFileSort
  cacheVersion: number
}) {
  const [files, setFiles] = useState<BlossomFileRecord[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoadingPage, setIsLoadingPage] = useState(false)
  const [page, setPage] = useState(0)
  const requestKey = `${pubkey ?? 'anon'}:${search}:${typeFilter}:${sort}:${cacheVersion}`

  const loadPage = useCallback(
    async (pageToLoad: number, mode: 'replace' | 'append') => {
      if (!pubkey) {
        setFiles([])
        setTotalCount(0)
        return
      }

      setIsLoadingPage(true)
      try {
        const result = await readCachedBlossomFilesPage({
          pubkey,
          search,
          typeFilter,
          sort,
          offset: pageToLoad * PAGE_SIZE,
          limit: PAGE_SIZE,
        })
        setTotalCount(result.total)
        setFiles((current) => (mode === 'replace' ? result.files : mergeFiles(current, result.files)))
        setPage(pageToLoad)
      } finally {
        setIsLoadingPage(false)
      }
    },
    [pubkey, search, sort, typeFilter],
  )

  useEffect(() => {
    void requestKey
    void loadPage(0, 'replace')
  }, [loadPage, requestKey])

  const hasMore = files.length < totalCount
  const loadMore = useCallback(() => {
    if (!isLoadingPage && hasMore) void loadPage(page + 1, 'append')
  }, [hasMore, isLoadingPage, loadPage, page])

  return {
    files,
    totalCount,
    hasMore,
    isLoadingPage,
    loadMore,
  }
}

function mergeFiles(current: BlossomFileRecord[], next: BlossomFileRecord[]) {
  const byId = new Map(current.map((file) => [file.id, file]))
  for (const file of next) byId.set(file.id, file)
  return Array.from(byId.values())
}
