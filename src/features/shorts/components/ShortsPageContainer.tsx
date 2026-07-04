import { useDebouncedValue } from '@tanstack/react-pacer'
import { t } from 'i18next'
import { Film } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { PageSpinner } from '@/components/PageSpinner'
import { Button } from '@/components/ui/button'
import { useBatchProfiles } from '@/features/nostr/hooks/useBatchProfiles'
import { ShortsGrid } from '@/features/shorts/components/ShortsGrid'
import { ShortsSearchBar } from '@/features/shorts/components/ShortsSearchBar'
import { useShortsFeed } from '@/features/shorts/hooks/useShortsFeed'

interface ShortsPageContainerProps {
  search?: string
  onSearchChange: (search?: string) => void
}

export function ShortsPageContainer({ search, onSearchChange }: ShortsPageContainerProps) {
  const [searchInput, setSearchInput] = useState(search ?? '')
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const [debouncedSearch, debouncer] = useDebouncedValue(searchInput, { wait: 450 }, (state) => ({
    isPending: state.isPending,
  }))
  const normalizedSearch = debouncedSearch.trim()
  const { shorts, isLoading, isEmpty, fetchNextPage, hasNextPage, isFetchingNextPage } = useShortsFeed({
    search: normalizedSearch || undefined,
  })
  const eventsForProfiles = useMemo(() => shorts.map((short) => short.event), [shorts])
  const profiles = useBatchProfiles(eventsForProfiles)

  useEffect(() => {
    setSearchInput(search ?? '')
  }, [search])

  useEffect(() => {
    onSearchChange(normalizedSearch || undefined)
  }, [normalizedSearch, onSearchChange])

  const handleClearSearch = () => {
    setSearchInput('')
    onSearchChange(undefined)
  }

  const requestNextPage = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return
    void fetchNextPage()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  useEffect(() => {
    const node = loadMoreRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          requestNextPage()
        }
      },
      { rootMargin: '720px 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [requestNextPage])

  return (
    <AppShell
      activeKey="shorts"
      title={t('shorts_page_title', 'Shorts')}
      description={t('shorts_page_description', 'Vertical short videos published as Nostr short video events.')}
      eyebrow="Short video"
      badge="34236 / 22"
      icon={Film}
      className="pb-4"
    >
      <ShortsSearchBar
        value={searchInput}
        isPending={debouncer.state.isPending}
        onChange={setSearchInput}
        onClear={handleClearSearch}
      />

      {isLoading ? (
        <PageSpinner
          label={t('loading_shorts', 'Carregando shorts')}
          description={t('loading_shorts_desc', 'Buscando vídeos curtos nos relays conectados.')}
        />
      ) : null}

      {isEmpty ? (
        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-border/70 bg-card/70 p-8 text-center">
          <Film className="mb-4 size-10 text-muted-foreground" />
          <h2 className="text-xl font-semibold">{t('shorts_empty_title', 'Nenhum short encontrado')}</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {normalizedSearch
              ? t('shorts_empty_search_desc', 'Nenhum short corresponde a esta busca.')
              : t(
                  'shorts_empty_desc',
                  'Quando eventos de short video forem encontrados nos relays, eles aparecerão aqui.',
                )}
          </p>
          <Button
            className="mt-5"
            variant="outline"
            onClick={normalizedSearch ? handleClearSearch : () => location.reload()}
          >
            {normalizedSearch ? t('clear_search', 'Limpar busca') : t('try_again', 'Tentar novamente')}
          </Button>
        </div>
      ) : null}

      {shorts.length > 0 ? (
        <div className="space-y-5">
          <ShortsGrid shorts={shorts} profiles={profiles} />
          <div ref={loadMoreRef} className="h-8" aria-hidden="true" />
          {isFetchingNextPage ? (
            <p className="text-center text-xs text-muted-foreground">
              {t('loading_more_shorts', 'Carregando mais shorts...')}
            </p>
          ) : null}
          {!hasNextPage && !isFetchingNextPage ? (
            <p className="text-center text-xs text-muted-foreground">
              {t('shorts_no_more', 'Todos os shorts carregados.')}
            </p>
          ) : null}
        </div>
      ) : null}
    </AppShell>
  )
}
