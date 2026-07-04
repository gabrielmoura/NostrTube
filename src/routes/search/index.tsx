import { NDKEvent } from '@nostr-dev-kit/ndk'
import { useInfiniteQuery } from '@tanstack/react-query'
import { createRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useVirtualizer } from '@tanstack/react-virtual'
import { zodValidator } from '@tanstack/zod-adapter'
import { t } from 'i18next'
import { Compass, Sparkles } from 'lucide-react'
import { type ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import VideoCard, { VideoCardLoading } from '@/components/cards/videoCard'
import { AppShell } from '@/components/layout/AppShell'
import { PageSpinner } from '@/components/PageSpinner.tsx'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MetricCard } from '@/components/ui/metric-card'
import { useBatchProfiles } from '@/features/nostr/hooks/useBatchProfiles'
import { useContentVisibilityFilter } from '@/features/nostr/hooks/useContentVisibilityFilter'
import { getVideoRouteReference } from '@/features/video/services/video-reference.service'
import { eventSearchSchema, getVideosFromSearchData } from '@/helper/loaders/getVideosFromSearchData.ts'
import { Route as rootRoute } from '@/routes/__root'
import { AdvancedSearch } from './@AdvancedSearch'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/search',
  component: RouteComponent,
  validateSearch: zodValidator(eventSearchSchema),
  loader: async ({ context: { ndk }, deps }) => {
    const searchDeps = deps as {
      search?: string
      nsfw?: boolean
      tag?: string | string[]
      lang?: string
      author?: string
      geohash?: string
      timeRange?: 'all' | 'today' | 'week' | 'month' | 'year'
    }
    // Passamos o objeto consolidado para a função performática
    return getVideosFromSearchData({
      ndk,
      ...searchDeps,
      timeRange: searchDeps.timeRange ?? 'all',
    })
  },
  // Atualizar loaderDeps para incluir novos campos
  loaderDeps: ({ search: { search, nsfw, tag, lang, author, geohash, timeRange } }) => ({
    search,
    nsfw,
    tag,
    lang,
    author,
    geohash,
    timeRange,
  }),
  head: () => ({
    meta: [
      { title: `${t('search_page_title')} - ${import.meta.env.VITE_APP_NAME}` },
      { description: t('search_page_description') },
      {
        property: 'og:title',
        content: `${t('search_page_title')} - ${import.meta.env.VITE_APP_NAME}`,
      },
    ],
  }),
  pendingComponent: PageSpinner,
  errorComponent: HasError,
})

// ... (Manter função HasError igual ao original) ...
function HasError({ error }: { error: Error }) {
  // ... código original do HasError ...
  return <div>Error: {error.message}</div> // Simplificado para brevidade, use o original
}

function RouteComponent() {
  return (
    <AppShell
      activeKey="explore"
      title="Pesquisar"
      description="Busque vídeos, criadores e conteúdos no ecossistema Nostr."
      eyebrow="Discovery"
      badge="Search & Filters"
      icon={Compass}
    >
      <AdvancedSearch />
      <SearchResults />
    </AppShell>
  )
}

function useGridColumns() {
  const [columns, setColumns] = useState(1)

  useEffect(() => {
    const updateColumns = () => {
      if (window.innerWidth >= 1280)
        setColumns(4) // xl
      else if (window.innerWidth >= 1024)
        setColumns(3) // lg
      else if (window.innerWidth >= 768)
        setColumns(2) // md
      else setColumns(1) // sm/xs
    }

    updateColumns()
    window.addEventListener('resize', updateColumns)
    return () => window.removeEventListener('resize', updateColumns)
  }, [])

  return columns
}

function SearchResults() {
  const { ndk } = Route.useRouteContext()
  const searchParams = useSearch({ from: '/search' })
  const initialData = Route.useLoaderData() // Dados do preload
  const parentRef = useRef<HTMLDivElement>(null)
  const columns = useGridColumns()
  const { filterEvents } = useContentVisibilityFilter()

  // 1. Query Infinita com dados iniciais do Loader
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['videoSearch', searchParams],
    queryFn: ({ pageParam }) =>
      getVideosFromSearchData({
        ndk,
        ...searchParams,
        timeRange: searchParams.timeRange ?? 'all',
        until: pageParam,
      }),
    initialPageParam: undefined as number | undefined,
    // Conecta o loader data ao TanStack Query para evitar "loading" na primeira página
    initialData: { pages: [initialData], pageParams: [undefined] },
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length < 20) return undefined
      const lastEvent = lastPage[lastPage.length - 1]
      return lastEvent?.created_at ? lastEvent.created_at - 1 : undefined
    },
  })

  // 2. Batch profile fetch para todas as profiles da página
  const allVideos = useMemo(() => filterEvents(data?.pages.flatMap((page) => page) ?? []), [data?.pages, filterEvents])
  const profiles = useBatchProfiles(allVideos)
  const activeFilters = useMemo(() => {
    const tagCount = Array.isArray(searchParams.tag) ? searchParams.tag.length : searchParams.tag ? 1 : 0
    return (
      [
        searchParams.search,
        searchParams.author,
        searchParams.lang,
        searchParams.geohash,
        searchParams.nsfw ? 'nsfw' : undefined,
        searchParams.timeRange && searchParams.timeRange !== 'all' ? searchParams.timeRange : undefined,
      ].filter(Boolean).length + tagCount
    )
  }, [searchParams])

  // 3. Agrupar vídeos em linhas baseadas nas colunas atuais
  const rows = useMemo(() => {
    const r = []
    for (let i = 0; i < allVideos.length; i += columns) {
      r.push(allVideos.slice(i, i + columns))
    }
    return r
  }, [allVideos, columns])

  // 3. Virtualizador de Linhas
  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? rows.length + 1 : rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 300, // Altura média do seu VideoCard + gap
    overscan: 3,
  })

  // 4. Navegação por clique no card (evita <a> dentro de <a> com VideoCard)
  const navigate = useNavigate()
  const handleCardClick = useCallback(
    (eventId: string) => (e: React.MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('a')) return
      navigate({ to: '/v/$eventId', params: { eventId } })
    },
    [navigate],
  )

  const handleCardKeyDown = useCallback(
    (eventId: string) => (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        navigate({ to: '/v/$eventId', params: { eventId } })
      }
    },
    [navigate],
  )

  // 5. Trigger de busca ao chegar no fim
  const virtualItems = rowVirtualizer.getVirtualItems()
  useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1]
    if (lastItem && lastItem.index >= rows.length - 1 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [virtualItems, rows.length, hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <section className="relative space-y-6 px-1">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px_240px]">
        <Card className="overflow-hidden border-border/60 bg-card/80">
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-primary/80">Resultados ativos</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
                {allVideos.length} vídeos encontrados
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {activeFilters > 0
                  ? `Busca refinada com ${activeFilters} filtro${activeFilters > 1 ? 's' : ''}.`
                  : 'Navegue pelos resultados mais recentes da busca.'}
              </p>
            </div>
            <div className="hidden rounded-3xl border border-primary/15 bg-primary/10 p-3 text-primary sm:block">
              <Sparkles className="size-6" />
            </div>
          </CardContent>
        </Card>
        <MetricCard
          title="Filtros ativos"
          value={activeFilters}
          description="Texto, idioma, tags e recortes avançados."
        />
        <MetricCard
          title="Páginas carregadas"
          value={data?.pages.length ?? 1}
          description="Scroll infinito otimizado para discovery."
          tone="relay"
        />
      </div>

      <div className="flex items-center justify-between gap-3 border-b pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-main text-lg font-bold tracking-tight sm:text-xl">Grade de resultados</h3>
          {searchParams.timeRange && searchParams.timeRange !== 'all' ? (
            <Badge variant="secondary">Período: {searchParams.timeRange}</Badge>
          ) : null}
        </div>
        <a href="/explore" className={buttonVariants({ variant: 'glass' })}>
          Explorar agora
        </a>
      </div>

      {allVideos.length === 0 ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 bg-card/40 px-6 py-12 text-center">
          <div className="mb-4 rounded-full border border-primary/15 bg-primary/10 p-4 text-primary">
            <Compass className="size-6" />
          </div>
          <h3 className="text-lg font-semibold">Nenhum vídeo encontrado</h3>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">
            Tente ampliar o período, remover filtros muito específicos ou usar termos mais curtos para aumentar a
            cobertura da busca.
          </p>
        </div>
      ) : null}

      <div ref={parentRef} className="max-h-[calc(100svh-21rem)] min-h-[480px] overflow-auto pr-2 scrollbar-thin">
        <div className="relative w-full" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
          {virtualItems.map((virtualRow) => {
            const isLoaderRow = virtualRow.index > rows.length - 1
            const rowVideos = rows[virtualRow.index]

            return (
              <div
                key={virtualRow.key}
                className="absolute top-0 left-0 w-full"
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {isLoaderRow ? (
                  // Skeleton Grid
                  <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    <VideoCardLoading />
                    <VideoCardLoading />
                  </div>
                ) : (
                  // Grid Original Preservado
                  <ul className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {(rowVideos ?? []).map((e) => (
                      <li key={e.id} className="flex h-full animate-in fade-in duration-300">
                        <div
                          role="link"
                          tabIndex={0}
                          className="block w-full focus:outline-none focus:ring-2 focus:ring-primary rounded-lg transition-transform hover:scale-[1.02] cursor-pointer"
                          onClick={handleCardClick(getVideoRouteReference(e))}
                          onKeyDown={handleCardKeyDown(getVideoRouteReference(e))}
                        >
                          <VideoCard event={e} profile={profiles[e.author?.pubkey]} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
