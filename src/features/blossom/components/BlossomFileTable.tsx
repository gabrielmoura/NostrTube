import { Card, CardContent } from '@/components/ui/card'
import type { BlossomFileRecord, BlossomViewMode } from '../blossom.types'
import { formatBytes, formatRelativeDate } from '../blossom.utils'
import { BlossomFileActions, BlossomFileTypeBadge, getBlossomFileIcon } from './BlossomFileActions'
import { BlossomFileGrid, type BlossomFileListProps, BlossomInfiniteFooter } from './BlossomFileGrid'
import { useBlossomVirtualWindow } from './useBlossomVirtualWindow'

const TABLE_ROW_HEIGHT = 78
const tableGridClassName =
  'grid-cols-[48px_minmax(0,1fr)_72px] sm:grid-cols-[48px_minmax(0,1fr)_88px_72px] md:grid-cols-[48px_minmax(0,1fr)_88px_104px_72px] lg:grid-cols-[48px_minmax(0,1fr)_88px_104px_120px_72px] xl:grid-cols-[48px_minmax(0,1fr)_88px_104px_120px_minmax(0,220px)_72px]'

interface BlossomFileTableProps extends BlossomFileListProps {
  viewMode: BlossomViewMode
}

export function BlossomFileTable(props: BlossomFileTableProps) {
  if (props.viewMode === 'grid') return <BlossomFileGrid {...props} />

  const virtualCount = props.files.length + (props.hasMore || props.isLoadingMore ? 1 : 0)
  const { parentRef, scrollMargin, totalSize, virtualItems } = useBlossomVirtualWindow({
    count: virtualCount,
    estimateSize: () => TABLE_ROW_HEIGHT,
    getItemKey: (index) => props.files[index]?.id ?? 'footer',
    hasMore: props.hasMore,
    isLoadingMore: props.isLoadingMore,
    loadMoreIndex: Math.max(props.files.length - 8, 0),
    onLoadMore: props.onLoadMore,
    overscan: 12,
  })

  return (
    <Card>
      <CardContent className="overflow-hidden p-0">
        <div
          ref={parentRef}
          role="table"
          aria-label="Arquivos Blossom"
          aria-rowcount={props.totalCount ?? props.files.length}
          className="w-full text-sm"
        >
          <BlossomTableHeader />
          <div className="relative" style={{ height: totalSize }}>
            {virtualItems.map((virtualRow) => {
              const file = props.files[virtualRow.index]
              const top = virtualRow.start - scrollMargin

              if (!file) {
                return (
                  <div
                    key="footer"
                    className="absolute left-0 top-0 w-full"
                    style={{ transform: `translateY(${top}px)` }}
                  >
                    <BlossomInfiniteFooter
                      shownCount={props.files.length}
                      totalCount={props.totalCount ?? props.files.length}
                      hasMore={props.hasMore}
                      isLoadingMore={props.isLoadingMore}
                      onLoadMore={props.onLoadMore}
                    />
                  </div>
                )
              }

              return (
                <BlossomFileRow
                  key={virtualRow.key}
                  file={file}
                  rowIndex={virtualRow.index + 2}
                  selected={props.selectedIds.includes(file.id)}
                  top={top}
                  onToggleSelected={() => props.onToggleSelected(file.id)}
                  onCopyUrl={() => props.onCopyUrl(file)}
                  onCopyHash={() => props.onCopyHash(file)}
                  onViewDetails={() => props.onViewDetails(file)}
                  onRemoveLocal={() => props.onRemoveLocal(file)}
                />
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function BlossomTableHeader() {
  return (
    <div
      role="row"
      className={`grid ${tableGridClassName} border-b border-border/70 text-left text-xs uppercase tracking-[0.16em] text-muted-foreground`}
    >
      <div role="columnheader" className="px-4 py-3" />
      <div role="columnheader" className="px-4 py-3">
        Nome
      </div>
      <div role="columnheader" className="hidden px-4 py-3 sm:block">
        Tipo
      </div>
      <div role="columnheader" className="hidden px-4 py-3 md:block">
        Tamanho
      </div>
      <div role="columnheader" className="hidden px-4 py-3 lg:block">
        Data
      </div>
      <div role="columnheader" className="hidden px-4 py-3 xl:block">
        URL do blossom
      </div>
      <div role="columnheader" className="px-4 py-3 text-right">
        Ações
      </div>
    </div>
  )
}

function BlossomFileRow({
  file,
  selected,
  rowIndex,
  top,
  onToggleSelected,
  onCopyUrl,
  onCopyHash,
  onViewDetails,
  onRemoveLocal,
}: {
  file: BlossomFileRecord
  selected: boolean
  rowIndex: number
  top: number
  onToggleSelected: () => void
  onCopyUrl: () => void
  onCopyHash: () => void
  onViewDetails: () => void
  onRemoveLocal: () => void
}) {
  const Icon = getBlossomFileIcon(file.type)

  return (
    <div
      role="row"
      aria-rowindex={rowIndex}
      className={`absolute left-0 top-0 grid w-full ${tableGridClassName} border-b border-border/50 align-middle`}
      style={{ height: TABLE_ROW_HEIGHT, transform: `translateY(${top}px)` }}
    >
      <div role="cell" className="px-4 py-4">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelected}
          aria-label={`Selecionar ${file.name}`}
          className="size-4 rounded border-border bg-background text-primary focus:ring-primary/50"
        />
      </div>
      <div role="cell" className="min-w-0 px-4 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-secondary/55 text-primary">
            <Icon className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground" title={file.name}>
              {file.name}
            </p>
            <p className="truncate text-xs text-muted-foreground" title={file.pathLabel}>
              {file.pathLabel ?? 'Blossom'}
            </p>
          </div>
        </div>
      </div>
      <div role="cell" className="hidden px-4 py-4 sm:block">
        <BlossomFileTypeBadge file={file} />
      </div>
      <div role="cell" className="hidden whitespace-nowrap px-4 py-4 text-sm text-muted-foreground md:block">
        {formatBytes(file.size)}
      </div>
      <div role="cell" className="hidden whitespace-nowrap px-4 py-4 text-sm text-muted-foreground lg:block">
        {formatRelativeDate(file.createdAt)}
      </div>
      <div
        role="cell"
        className="hidden max-w-[220px] truncate px-4 py-4 font-mono text-xs text-muted-foreground xl:block"
        title={file.blossomServerUrl}
      >
        {file.blossomServerUrl}
      </div>
      <div role="cell" className="px-4 py-4 text-right">
        <BlossomFileActions
          file={file}
          onCopyUrl={onCopyUrl}
          onCopyHash={onCopyHash}
          onViewDetails={onViewDetails}
          onRemoveLocal={onRemoveLocal}
        />
      </div>
    </div>
  )
}
