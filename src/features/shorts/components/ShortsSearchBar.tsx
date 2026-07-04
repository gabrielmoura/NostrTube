import { t } from 'i18next'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ShortsSearchBarProps {
  value: string
  isPending?: boolean
  onChange: (value: string) => void
  onClear: () => void
}

export function ShortsSearchBar({ value, isPending, onChange, onClear }: ShortsSearchBarProps) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/80 p-3 shadow-sm backdrop-blur">
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={t('shorts_search_placeholder', 'Buscar shorts')}
            className="h-11 rounded-xl pl-9 pr-10"
            aria-label={t('shorts_search_label', 'Buscar shorts')}
          />
          {value ? (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-2 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={t('clear_search', 'Limpar busca')}
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-xl px-4"
          disabled={!value && !isPending}
          onClick={onClear}
        >
          {isPending ? t('searching', 'Buscando') : t('reset', 'Reset')}
        </Button>
      </div>
    </div>
  )
}
