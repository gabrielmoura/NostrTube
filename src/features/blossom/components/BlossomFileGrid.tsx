import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { BlossomFileRecord } from '../blossom.types'
import { formatBytes } from '../blossom.utils'
import { BlossomFileActions, BlossomFileTypeBadge, getBlossomFileIcon } from './BlossomFileActions'
import { useBlossomVirtualWindow } from './useBlossomVirtualWindow'

const GRID_ROW_HEIGHT = 214

export interface BlossomFileListProps {
  files: BlossomFileRecord[]
  selectedIds: string[]
  totalCount?: number
  hasMore?: boolean
  isLoadingMore?: boolean
  onLoadMore?: () => void
  onToggleSelected: (fileId: string) => void
  onCopyUrl: (file: BlossomFileRecord) => void
  onCopyHash: (file: BlossomFileRecord) => void
  onViewDetails: (file: BlossomFileRecord) => void
  onRemoveLocal: (file: BlossomFileRecord) => void
}

export function BlossomFileGrid({
  files,
  selectedIds,
  onToggleSelected,
  onCopyUrl,
  onCopyHash,
  onViewDetails,
  onRemoveLocal,
  totalCount,
  hasMore,
  isLoadingMore,
  onLoadMore,
}: BlossomFileListProps) {
  const columns = useBlossomGridColumns()
  const rows = useMemo(() => chunkFiles(files, columns), [columns, files])
  const virtualCount = rows.length + (hasMore || isLoadingMore ? 1 : 0)
  const { parentRef, scrollMargin, totalSize, virtualItems } = useBlossomVirtualWindow({
    count: virtualCount,
    estimateSize: () => GRID_ROW_HEIGHT,
    getItemKey: (index) => rows[index]?.map((file) => file.id).join(':') ?? 'footer',
    hasMore,
    isLoadingMore,
    loadMoreIndex: Math.max(rows.length - 2, 0),
    onLoadMore,
    overscan: 4,
  })

  return (
    <div ref={parentRef} role="list" aria-label="Arquivos Blossom" className="relative" style={{ height: totalSize }}>
      {virtualItems.map((virtualRow) => {
        const row = rows[virtualRow.index]
        const top = virtualRow.start - scrollMargin

        if (!row) {
          return (
            <div key="footer" className="absolute left-0 top-0 w-full" style={{ transform: `translateY(${top}px)` }}>
              <BlossomInfiniteFooter
                shownCount={files.length}
                totalCount={totalCount ?? files.length}
                hasMore={hasMore}
                isLoadingMore={isLoadingMore}
                onLoadMore={onLoadMore}
              />
            </div>
          )
        }

        return (
          <div
            key={virtualRow.key}
            className="absolute left-0 top-0 grid w-full gap-4 md:grid-cols-2 xl:grid-cols-3"
            style={{ transform: `translateY(${top}px)` }}
          >
            {row.map((file) => (
              <BlossomFileCard
                key={file.id}
                file={file}
                selected={selectedIds.includes(file.id)}
                onToggleSelected={() => onToggleSelected(file.id)}
                onCopyUrl={() => onCopyUrl(file)}
                onCopyHash={() => onCopyHash(file)}
                onViewDetails={() => onViewDetails(file)}
                onRemoveLocal={() => onRemoveLocal(file)}
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}

function BlossomFileCard({
  file,
  selected,
  onToggleSelected,
  onCopyUrl,
  onCopyHash,
  onViewDetails,
  onRemoveLocal,
}: {
  file: BlossomFileRecord
  selected: boolean
  onToggleSelected: () => void
  onCopyUrl: () => void
  onCopyHash: () => void
  onViewDetails: () => void
  onRemoveLocal: () => void
}) {
  const Icon = getBlossomFileIcon(file.type)

  return (
    <Card role="listitem" className={cn(selected && 'border-primary/50 bg-primary/8')}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-border/70 bg-secondary/55 text-primary">
            <Icon className="size-5" />
          </div>
          <BlossomFileActions
            file={file}
            onCopyUrl={onCopyUrl}
            onCopyHash={onCopyHash}
            onViewDetails={onViewDetails}
            onRemoveLocal={onRemoveLocal}
          />
        </div>
        <div className="mt-4 min-w-0">
          <p className="truncate font-medium text-foreground" title={file.name}>
            {file.name}
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{file.pathLabel}</p>
        </div>
        <div className="mt-4 flex items-center justify-between gap-2">
          <BlossomFileTypeBadge file={file} />
          <span className="text-xs text-muted-foreground">{formatBytes(file.size)}</span>
        </div>
        <label className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelected}
            className="size-4 rounded border-border bg-background text-primary focus:ring-primary/50"
          />
          Selecionar
        </label>
      </CardContent>
    </Card>
  )
}

export function BlossomInfiniteFooter({
  shownCount,
  totalCount,
  hasMore,
  isLoadingMore,
  onLoadMore,
}: {
  shownCount: number
  totalCount: number
  hasMore?: boolean
  isLoadingMore?: boolean
  onLoadMore?: () => void
}) {
  return (
    <div className="col-span-full flex items-center justify-center gap-3 p-4 text-xs text-muted-foreground">
      <span>{isLoadingMore ? 'Carregando arquivos...' : `Exibindo ${shownCount} de ${totalCount}`}</span>
      {hasMore ? (
        <Button type="button" variant="glass" size="sm" onClick={onLoadMore} disabled={isLoadingMore}>
          Carregar mais
        </Button>
      ) : null}
    </div>
  )
}

function chunkFiles(files: BlossomFileRecord[], columns: number) {
  const rows: BlossomFileRecord[][] = []
  for (let i = 0; i < files.length; i += columns) rows.push(files.slice(i, i + columns))
  return rows
}

function useBlossomGridColumns() {
  return useStateFromWindow()
}

function getBlossomColumnCount() {
  if (window.matchMedia('(min-width: 1280px)').matches) return 3
  if (window.matchMedia('(min-width: 768px)').matches) return 2
  return 1
}

function useStateFromWindow() {
  const [columns, setColumns] = useState(getBlossomColumnCount)

  useEffect(() => {
    const updateColumns = () => setColumns(getBlossomColumnCount())
    window.addEventListener('resize', updateColumns)
    return () => window.removeEventListener('resize', updateColumns)
  }, [])

  return columns
}
