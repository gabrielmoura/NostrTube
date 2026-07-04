import type { NDKEvent } from '@nostr-dev-kit/ndk'
import { type NDKFilter, NDKSubscriptionCacheUsage, useSubscribe } from '@nostr-dev-kit/ndk-hooks'
import { createRoute, Link, useNavigate } from '@tanstack/react-router'
import { t } from 'i18next'
import {
  Activity,
  ChevronRight,
  Compass,
  ExternalLink,
  Globe,
  Hash,
  Radio,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  Video,
  Zap,
} from 'lucide-react'
import { nip19 } from 'nostr-tools'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import VideoCard, { VideoCardLoading } from '@/components/cards/videoCard'
import { AppShell } from '@/components/layout/AppShell'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { useBatchProfiles } from '@/features/nostr/hooks/useBatchProfiles'
import { useContentVisibilityFilter } from '@/features/nostr/hooks/useContentVisibilityFilter'
import { NORMAL_VIDEO_EVENT_KINDS } from '@/features/video/services/video-kinds'
import { getVideoRouteReference } from '@/features/video/services/video-reference.service'
import { getTagValues } from '@/helper/nostrTags'
import { Route as rootRoute } from '@/routes/__root'

// ─── Rotas ───────────────────────────────────────────────
export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/explore',
  component: ExplorePage,
  head: () => ({
    meta: [
      { title: `${t('explore_page_title')} - ${import.meta.env.VITE_APP_NAME}` },
      { name: 'description', content: t('explore_page_description') },
      { property: 'og:title', content: `${t('explore_page_title')} - ${import.meta.env.VITE_APP_NAME}` },
    ],
  }),
})

// ─── Categorias ──────────────────────────────────────────
type ExploreCategory = 'all' | 'videos' | 'channels' | 'hashtags' | 'live' | 'apps'

const CATEGORIES: { key: ExploreCategory; icon: typeof Compass }[] = [
  { key: 'all', icon: Compass },
  { key: 'videos', icon: Video },
  { key: 'channels', icon: Users },
  { key: 'hashtags', icon: Hash },
  { key: 'live', icon: Radio },
  { key: 'apps', icon: Globe },
]

// ─── Hook de dados ───────────────────────────────────────
function useExploreData() {
  const { filterEvents } = useContentVisibilityFilter()
  // Vídeos recentes (proxy para "destaque")
  const filterVideos: NDKFilter = {
    kinds: NORMAL_VIDEO_EVENT_KINDS,
    limit: 40,
  }
  const { events: videoEvents, eose } = useSubscribe([filterVideos], {
    closeOnEose: false,
    cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
  })

  // Perfis dos autores
  const profiles = useBatchProfiles(videoEvents)
  const visibleVideoEvents = useMemo(() => filterEvents(videoEvents), [filterEvents, videoEvents])

  // Extrair hashtags únicas dos vídeos
  const trendingHashtags = useMemo(() => {
    const tagCount = new Map<string, number>()
    visibleVideoEvents.forEach((ev: NDKEvent) => {
      const tags = getTagValues('t', ev.tags)
      tags.forEach((tag: string) => {
        const normalized = tag.toLowerCase().trim()
        if (normalized) tagCount.set(normalized, (tagCount.get(normalized) || 0) + 1)
      })
    })
    return [...tagCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)
  }, [visibleVideoEvents])

  // Autores únicos (canais)
  const uniqueAuthors = useMemo(() => {
    const seen = new Set<string>()
    return visibleVideoEvents
      .filter((ev: NDKEvent) => {
        if (ev.pubkey && !seen.has(ev.pubkey)) {
          seen.add(ev.pubkey)
          return true
        }
        return false
      })
      .slice(0, 12)
  }, [visibleVideoEvents])

  // {t("explore_featured_videos")} (top 12 mais recentes)
  const featuredVideos = useMemo(() => {
    return [...visibleVideoEvents]
      .sort((a: NDKEvent, b: NDKEvent) => (b.created_at ?? 0) - (a.created_at ?? 0))
      .slice(0, 12)
  }, [visibleVideoEvents])

  return {
    videoEvents: visibleVideoEvents,
    profiles,
    trendingHashtags,
    uniqueAuthors,
    featuredVideos,
    isLoading: !eose,
    eose,
  }
}

// ─── Página Principal ────────────────────────────────────
function ExplorePage() {
  const { t } = useTranslation('pages')
  const { videoEvents, profiles, trendingHashtags, uniqueAuthors, featuredVideos, isLoading, eose } = useExploreData()
  const navigate = useNavigate()

  const categoryLabels: Record<ExploreCategory, string> = {
    all: t('explore_category_all'),
    videos: t('explore_category_videos'),
    channels: t('explore_category_channels'),
    hashtags: t('explore_category_hashtags'),
    live: t('explore_category_live'),
    apps: t('explore_category_apps'),
  }

  const isEmpty = eose && videoEvents.length === 0

  // Coluna direita
  const aside = (
    <>
      {/* Categorias populares */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-[oklch(var(--grass))]" />
            <CardTitle className="text-base">{t('explore_popular_categories')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {CATEGORIES.filter((c) => c.key !== 'all').map((cat) => (
            <Link
              key={cat.key}
              to="/search"
              search={{ tag: cat.key === 'hashtags' ? undefined : cat.key }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            >
              <cat.icon className="size-4" />
              <span className="flex-1">{categoryLabels[cat.key]}</span>
              <ChevronRight className="size-3" />
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Explore o ecossistema Nostr */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('explore_ecosystem_title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <a
            href="https://nostr.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Globe className="size-4" />
            <span className="flex-1">Nostr.com</span>
            <ExternalLink className="size-3" />
          </a>
          <a
            href="https://nostrapp.link"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ExternalLink className="size-4" />
            <span className="flex-1">Nostr Apps</span>
            <ExternalLink className="size-3" />
          </a>
        </CardContent>
      </Card>

      {/* Criadores em destaque */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-[oklch(var(--primary))]" />
            <CardTitle className="text-base">{t('explore_featured_creators')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {uniqueAuthors.slice(0, 5).map((ev) => {
            const profile = profiles[ev.pubkey]
            const npub = ev.pubkey ? nip19.npubEncode(ev.pubkey) : ''
            return (
              <Link
                key={ev.pubkey}
                to="/u/$userId"
                params={{ userId: npub }}
                className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/50"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
                  {profile?.displayName?.[0] || profile?.name?.[0] || '?'}
                </div>
                <span className="flex-1 truncate text-muted-foreground">
                  {profile?.displayName || profile?.name || 'anon'}
                </span>
                <ChevronRight className="size-3 text-muted-foreground" />
              </Link>
            )
          })}
          {uniqueAuthors.length === 0 && !isLoading && (
            <p className="text-muted-foreground">{t('explore_no_creators')}</p>
          )}
        </CardContent>
      </Card>

      {/* Dicas para explorar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('explore_tips_title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>{t('explore_tips_search')}</p>
          <p>{t('explore_tips_tags')}</p>
          <p>{t('explore_tips_follow')}</p>
          <p>{t('explore_tips_zaps')}</p>
        </CardContent>
      </Card>
    </>
  )

  // Loading
  if (isLoading && videoEvents.length === 0) {
    return (
      <AppShell
        activeKey="explore"
        title={t('explore_page_title')}
        description={t('explore_page_description')}
        icon={Compass}
        aside={aside}
      >
        <div className="space-y-8">
          {/* Skeleton categorias */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 w-40 shrink-0 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
          {/* Skeleton destaques */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <VideoCardLoading key={i} />
            ))}
          </div>
        </div>
      </AppShell>
    )
  }

  // Empty
  if (isEmpty) {
    return (
      <AppShell
        activeKey="explore"
        title={t('explore_page_title')}
        description={t('explore_page_description')}
        icon={Compass}
        aside={aside}
      >
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 inline-flex size-16 items-center justify-center rounded-full bg-muted">
            <Compass className="size-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">{t('explore_empty_title')}</h3>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">{t('explore_empty_description')}</p>
          <Link to="/search" className={buttonVariants({ variant: 'gradient' })}>
            <Search className="mr-2 size-4" />
            {t('explore_empty_action')}
          </Link>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell
      activeKey="explore"
      title={t('explore_page_title')}
      description={t('explore_page_description')}
      icon={Compass}
      aside={aside}
    >
      {/* Barra de busca rápida */}
      <Link
        to="/search"
        className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/50 px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted/30"
      >
        <Search className="size-4" />
        <span>{t('explore_search_placeholder')}</span>
        <kbd className="ml-auto hidden rounded-md border border-border bg-muted px-2 py-0.5 text-xs md:inline">⌘K</kbd>
      </Link>

      {/* Categorias principais */}
      <section>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.key}
              to={cat.key === 'all' ? '/explore' : '/search'}
              search={cat.key !== 'all' ? { tag: cat.key === 'hashtags' ? undefined : cat.key } : undefined}
              className="flex shrink-0 flex-col items-center gap-2 rounded-xl border border-border/50 bg-card/50 px-5 py-4 transition-all hover:border-primary/30 hover:bg-primary/5"
            >
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                <cat.icon className="size-5 text-primary" />
              </div>
              <span className="whitespace-nowrap text-xs font-medium">{categoryLabels[cat.key]}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Hashtags em alta */}
      {trendingHashtags.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="size-5 text-[oklch(var(--flame))]" />
            <h2 className="text-lg font-semibold tracking-tight">{t('explore_trending_hashtags')}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {trendingHashtags.map(([tag, count]) => (
              <Link
                key={tag}
                to="/search"
                search={{ tag }}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
              >
                <Hash className="size-3" />
                {tag}
                <Badge variant="secondary" className="ml-0.5 text-[10px]">
                  {count}
                </Badge>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Vídeos em destaque */}
      {featuredVideos.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-[oklch(var(--primary))]" />
              <h2 className="text-lg font-semibold tracking-tight">{t('explore_featured_videos')}</h2>
            </div>
            <Link
              to="/search"
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t('explore_view_all')}
              <ChevronRight className="size-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featuredVideos.map((ev) => (
              <div
                key={ev.id}
                role="link"
                tabIndex={0}
                className="cursor-pointer rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                onClick={(event) => {
                  if ((event.target as HTMLElement).closest('a, button')) return
                  navigate({ to: '/v/$eventId', params: { eventId: getVideoRouteReference(ev) } })
                }}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter' && event.key !== ' ') return
                  event.preventDefault()
                  navigate({ to: '/v/$eventId', params: { eventId: getVideoRouteReference(ev) } })
                }}
              >
                <VideoCard event={ev} profile={profiles[ev.pubkey]} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Canais recomendados */}
      {uniqueAuthors.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="size-5 text-[oklch(var(--water))]" />
              <h2 className="text-lg font-semibold tracking-tight">{t('explore_recommended_channels')}</h2>
            </div>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
            {uniqueAuthors.map((ev) => {
              const profile = profiles[ev.pubkey]
              const npub = ev.pubkey ? nip19.npubEncode(ev.pubkey) : ''
              return (
                <Link
                  key={ev.pubkey}
                  to="/u/$userId"
                  params={{ userId: npub }}
                  className="flex shrink-0 flex-col items-center gap-2 rounded-xl border border-border/50 bg-card/50 px-6 py-4 transition-all hover:border-primary/30 hover:bg-primary/5"
                >
                  <div className="flex size-14 items-center justify-center rounded-full bg-muted text-lg font-bold text-foreground shadow-sm">
                    {profile?.displayName?.[0] || profile?.name?.[0] || '?'}
                  </div>
                  <span className="max-w-24 truncate text-center text-xs font-medium">
                    {profile?.displayName || profile?.name || 'anon'}
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    {t('explore_channel_badge')}
                  </Badge>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Ao vivo agora */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Radio className="size-5 text-[oklch(var(--flame))]" />
          <h2 className="text-lg font-semibold tracking-tight">{t('explore_live_now')}</h2>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Radio className="size-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium">{t('explore_no_live')}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t('explore_no_live_description')}</p>
            </div>
            <Link to="/search" search={{ tag: 'live' }} className={buttonVariants({ variant: 'glass', size: 'sm' })}>
              <Radio className="mr-2 size-4" />
              {t('explore_search_live')}
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Rodapé CTA */}
      <section className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-6 text-center">
        <h3 className="mb-2 text-lg font-semibold">{t('explore_cta_title')}</h3>
        <p className="mb-4 text-sm text-muted-foreground">{t('explore_cta_description')}</p>
        <div className="flex justify-center gap-3">
          <Link to="/zaps" className={buttonVariants({ variant: 'gradient' })}>
            <Zap className="mr-2 size-4" />
            {t('explore_view_zaps')}
          </Link>
          <Link to="/trending" className={buttonVariants({ variant: 'glass' })}>
            <TrendingUp className="mr-2 size-4" />
            Trending
          </Link>
        </div>
      </section>
    </AppShell>
  )
}
