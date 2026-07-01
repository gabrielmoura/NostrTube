import { useDebouncedValue } from '@tanstack/react-pacer'
import { useMemo, useState, useTransition } from 'react'
import type { BlossomFileRecord, BlossomFileSort, BlossomFileTypeFilter, BlossomViewMode } from '../blossom.types'
import { filterAndSortBlossomFiles } from '../blossom.utils'

export function useFileFilters(files: BlossomFileRecord[]) {
  const [search, setSearchState] = useState('')
  const [typeFilter, setTypeFilterState] = useState<BlossomFileTypeFilter>('all')
  const [sort, setSortState] = useState<BlossomFileSort>('newest')
  const [viewMode, setViewMode] = useState<BlossomViewMode>('table')
  const [isPending, startTransition] = useTransition()
  const [debouncedSearch, searchDebouncer] = useDebouncedValue(
    search,
    { wait: 250 },
    (state) => ({ isPending: state.isPending }),
  )

  const setSearch = (value: string) => startTransition(() => setSearchState(value))
  const setTypeFilter = (value: BlossomFileTypeFilter) => startTransition(() => setTypeFilterState(value))
  const setSort = (value: BlossomFileSort) => startTransition(() => setSortState(value))

  const filteredFiles = useMemo(
    () => filterAndSortBlossomFiles(files, debouncedSearch, typeFilter, sort),
    [debouncedSearch, files, sort, typeFilter],
  )

  return {
    search,
    debouncedSearch,
    typeFilter,
    sort,
    viewMode,
    filteredFiles,
    isPending: isPending || searchDebouncer.state.isPending,
    setSearch,
    setTypeFilter,
    setSort,
    setViewMode,
  }
}
