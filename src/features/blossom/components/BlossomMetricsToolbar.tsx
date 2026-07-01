import { Grid2X2, List, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { BlossomFileSort, BlossomFileTypeFilter, BlossomMetric, BlossomViewMode } from '../blossom.types'

export function BlossomMetricCard({ metric }: { metric: BlossomMetric }) {
  return (
    <Card className="min-h-[148px]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{metric.title}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{metric.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{metric.description}</p>
          </div>
          <div className="rounded-2xl border border-primary/20 bg-primary/10 p-2.5 text-primary">
            <metric.icon className="size-5" />
          </div>
        </div>
        {typeof metric.progress === 'number' ? <Progress value={metric.progress} className="mt-4" /> : null}
      </CardContent>
    </Card>
  )
}

interface BlossomFileToolbarProps {
  search: string
  typeFilter: BlossomFileTypeFilter
  sort: BlossomFileSort
  viewMode: BlossomViewMode
  isPending?: boolean
  onSearchChange: (value: string) => void
  onTypeFilterChange: (value: BlossomFileTypeFilter) => void
  onSortChange: (value: BlossomFileSort) => void
  onViewModeChange: (value: BlossomViewMode) => void
}

export function BlossomFileToolbar({
  search,
  typeFilter,
  sort,
  viewMode,
  isPending,
  onSearchChange,
  onTypeFilterChange,
  onSortChange,
  onViewModeChange,
}: BlossomFileToolbarProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4 xl:flex-row xl:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar arquivos..."
            className="pl-9"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-[180px_180px_auto]">
          <Select value={typeFilter} onValueChange={(value) => onTypeFilterChange(value as BlossomFileTypeFilter)}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="video">Vídeos</SelectItem>
              <SelectItem value="image">Imagens</SelectItem>
              <SelectItem value="document">Documentos</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="other">Outros</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(value) => onSortChange(value as BlossomFileSort)}>
            <SelectTrigger>
              <SelectValue placeholder="Mais recentes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mais recentes</SelectItem>
              <SelectItem value="oldest">Mais antigos</SelectItem>
              <SelectItem value="largest">Maior tamanho</SelectItem>
              <SelectItem value="smallest">Menor tamanho</SelectItem>
              <SelectItem value="name">Nome</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex rounded-xl border border-border/70 bg-card/60 p-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Visualizar em tabela"
              onClick={() => onViewModeChange('table')}
              className={cn(viewMode === 'table' && 'bg-secondary text-foreground')}
            >
              <List className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Visualizar em grid"
              onClick={() => onViewModeChange('grid')}
              className={cn(viewMode === 'grid' && 'bg-secondary text-foreground')}
            >
              <Grid2X2 className="size-4" />
            </Button>
          </div>
        </div>
        {isPending ? <p className="text-xs text-muted-foreground">Filtrando...</p> : null}
      </CardContent>
    </Card>
  )
}
