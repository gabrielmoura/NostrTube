import type { NDKEvent } from '@nostr-dev-kit/ndk'
import { NDKSubscriptionCacheUsage, useSubscribe } from '@nostr-dev-kit/ndk-hooks'
import { createRoute, Link } from '@tanstack/react-router'
import { uniqBy } from 'ramda'
import { useMemo, useState } from 'react'
import {
  ArrowRight,
  Flame,
  HandCoins,
  Lightbulb,
  RefreshCw,
  Search,
  TrendingUp,
  UserRound,
  Zap,
} from 'lucide-react'
import VideoCard, { VideoCardLoading } from '@/components/cards/videoCard'
import { AppShell } from '@/components/layout/AppShell'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricCard } from '@/components/ui/metric-card'
import { StatusBadge } from '@/components/ui/status-badge'
import { Section, SectionContent, SectionHeader, SectionTitle } from '@/components/containers/pageSection'
import { useBatchProfiles } from '@/features/nostr/hooks/useBatchProfiles'
import { useTopSupporters } from '@/features/zap/hooks/useTopSupporters'
import { useZapStats } from '@/features/zap/hooks/useZapStats'
import { filterEventsByAge } from '@/features/video/services/age-filter.service'
import { VIDEO_EVENT_KINDS } from '@/features/video/services/video-kinds'
import { sortEventsByImages } from '@/helper/format.ts'
import { cn } from '@/lib/utils'
import { Route as rootRoute } from '@/routes/__root'
import useUserStore from '@/store/useUserStore'

// ============================================================
// Constantes
// ============================================================

const VIDEO_KINDS = VIDEO_EVENT_KINDS
const SEARCH_RELAYS =
  import.meta.env.VITE_NOSTR_SEARCH_RELAYS?.length > 5 ? import.meta.env.VITE_NOSTR_SEARCH_RELAYS : undefined

type TimeTab = 'now' | 'today' | 'week' | 'month'

const TIME_RANGES: Record<TimeTab, number> = {
  now: 60 * 60,            // 1 hora
  today: 60 * 60 * 24,     // 24 horas
  week: 60 * 60 * 24 * 7,  // 7 dias
  month: 60 * 60 * 24 * 30,// ~30 dias
}

const TIME_LABELS: Record<TimeTab, string> = {
  now: 'Agora',
  today: 'Hoje',
  week: 'Semana',
  month: 'Mês',
}

// ============================================================
// Rota
// ============================================================

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/trending',
  component: TrendingPage,
})

// ============================================================
// TrendingPage
// ============================================================

function TrendingPage() {
  const agePref = useUserStore((state) => state.session?.age)

  // --- Aba de tempo ---
  const [timeTab, setTimeTab] = useState<TimeTab>('week')

  // --- Filtros (estado local preparado para integração futura) ---
  const [topicFilter] = useState<string | null>(null)
  const [langFilter] = useState<string | null>(null)

  const since = useMemo(() => {
    const range = TIME_RANGES[timeTab]
    return Math.floor(Date.now() / 1000) - range
  }, [timeTab])

  // --- Dados de vídeos ---
  const { events, eose } = useSubscribe(
    [
      {
        kinds: VIDEO_KINDS,
        limit: 100,
        since,
        until: Math.floor(Date.now() / 1000),
      },
    ],
    {
      closeOnEose: false,
      cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
      relayUrls: SEARCH_RELAYS,
    },
    [since],
  )

  const filtered = useMemo(() => filterEventsByAge(events, agePref), [events, agePref])
  const processedEvents = useMemo(() => {
    if (!filtered.length) return []
    let result = uniqBy((e: NDKEvent) => {
      const titleTag = e.tags.find((t) => t[0] === 'title')
      return titleTag?.[1] ?? e.id
    }, filtered).sort(sortEventsByImages)

    // Filtro por tópico (se ativo)
    if (topicFilter) {
      result = result.filter((e) =>
        e.tags.some((t) => t[0] === 't' && t[1]?.toLowerCase() === topicFilter.toLowerCase()),
      )
    }

    // Filtro por idioma (se ativo)
    if (langFilter) {
      result = result.filter((e) =>
        e.tags.some((t) => t[0] === 'l' && t[1]?.toLowerCase() === langFilter.toLowerCase()),
      )
    }

    return result
  }, [filtered, topicFilter, langFilter])

  const profiles = useBatchProfiles(processedEvents)
  const getProfile = (pubkey: string) => profiles[pubkey]

  // --- Criadores únicos ---
  const uniqueCreators = useMemo(() => {
    const seen = new Set<string>()
    return processedEvents.filter((e) => {
      const pk = e.author.pubkey
      if (seen.has(pk)) return false
      seen.add(pk)
      return true
    })
  }, [processedEvents])

  // --- Tags extraídas ---
  const uniqueTags = useMemo(() => {
    const tagSet = new Set<string>()
    processedEvents.forEach((ev) => {
      ev.tags.forEach((t) => {
        if (t[0] === 't' && t[1]) tagSet.add(`#${t[1].toLowerCase()}`)
      })
    })
    return Array.from(tagSet).slice(0, 12)
  }, [processedEvents])

  // --- Zaps ---
  const zapStats = useZapStats()
  const zapActivity24h = zapStats.data?.activity?.filter((a) => {
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000
    return a.createdAt > dayAgo
  })
  const zapSats24h = zapActivity24h?.reduce((sum, a) => sum + (a.amountSats ?? 0), 0) ?? 0
  const { supporters: topSupporters, profiles: supporterProfiles } = useTopSupporters()

  // --- Estados ---
  const isLoading = !eose && events.length === 0
  const isEmpty = eose && processedEvents.length === 0

  // --- Coluna direita ---
  const aside = (
    <>
      {/* Top apoiadores */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HandCoins className="size-4 text-[oklch(var(--lightning))]" />
            <CardTitle className="text-base">Top apoiadores</CardTitle>
          </div>
          <CardDescription>Apoiadores com mais zaps no período.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {topSupporters.length > 0 ? (
            topSupporters.slice(0, 5).map((s, i) => {
              const profile = supporterProfiles[s.pubkey]
              return (
                <div key={s.pubkey} className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/50 px-3 py-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/12 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate text-muted-foreground">
                    {profile?.displayName || profile?.name || profile?.nip05 || 'anon'}
                  </span>
                  <StatusBadge tone="warning">{s.amountSats} sats</StatusBadge>
                </div>
              )
            })
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-border/60 px-3 py-3 text-muted-foreground">
              <Zap className="size-4 shrink-0" />
              <span>Nenhum apoiador detectado.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dicas para aparecer no trending */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Apareça no trending</CardTitle>
          <CardDescription>Dicas para aumentar seu alcance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" />
            Publique com frequência e consistency.
          </div>
          <div className="flex items-start gap-2">
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" />
            Use hashtags relevantes (#t) nos seus vídeos.
          </div>
          <div className="flex items-start gap-2">
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" />
            Incentive zaps e interações da comunidade.
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Apoie criadores em alta</CardTitle>
          <CardDescription>Fortaleça o ecossistema Nostr.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/zaps" className={cn(buttonVariants({ variant: "gradient" }), "w-full")}>
            <Zap className="size-4" />
            Apoie criadores
          </Link>
        </CardContent>
      </Card>
    </>
  )

  // ================================================================
  // Render
  // ================================================================

  return (
    <AppShell
      activeKey="trending"
      title="Trending"
      description="Descubra os vídeos, temas e criadores em alta no ecossistema Nostr."
      icon={Flame}
      eyebrow="Fase 5"
      badge="Relay Cinema"
      aside={aside}
    >
      {/* === Metric Cards === */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Vídeos em alta"
          value={String(processedEvents.length)}
          description={`No período "${TIME_LABELS[timeTab]}"`}
          icon={TrendingUp}
          tone="success"
        />
        <MetricCard
          title="Criadores em destaque"
          value={String(uniqueCreators.length)}
          description="Autores com conteúdo recente"
          icon={UserRound}
          tone="zap"
        />
        <MetricCard
          title="Zaps (24h)"
          value={zapSats24h > 0 ? `${zapSats24h} sats` : '—'}
          description={zapSats24h > 0 ? 'Sats nas últimas 24h' : 'Sem dados'}
          icon={Zap}
          tone="default"
        />
        <MetricCard
          title="Hashtags em tendência"
          value={String(uniqueTags.length)}
          description="Tags encontradas nos eventos"
          icon={Search}
          tone="relay"
        />
      </div>

      {/* === Tabs de tempo === */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl border border-border/60 bg-card/60 p-1">
          {(Object.keys(TIME_RANGES) as TimeTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setTimeTab(tab)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                timeTab === tab
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {TIME_LABELS[tab]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Todos os tópicos</span>
          <span className="size-1 rounded-full bg-border" />
          <span className="text-xs text-muted-foreground">Todos os idiomas</span>
          <span className="size-1 rounded-full bg-border" />
          <span className="text-xs text-muted-foreground">Mais quentes</span>
        </div>
      </div>

      {/* === Gráfico: Panorama do trending === */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="size-5 text-primary" />
            <CardTitle className="text-base">Panorama do trending</CardTitle>
          </div>
          <CardDescription>Série temporal de atividade dos vídeos em alta.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 bg-card/40 px-6 py-10 text-center">
            <TrendingUp className="size-10 text-muted-foreground/30" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Gráfico indisponível</p>
              <p className="text-xs text-muted-foreground/60">
                Dados de série temporal ainda não disponíveis para agregação.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* === Vídeos em alta agora === */}
      <section className="space-y-5">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Vídeos em alta agora
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {processedEvents.length > 0
              ? `${processedEvents.length} vídeo(s) encontrado(s) no período.`
              : 'Nenhum vídeo encontrado no período selecionado.'}
          </p>
        </div>

        {isLoading ? (
          <Section className="px-0">
            <SectionHeader>
              <SectionTitle className="font-main h-8 w-1/3 animate-pulse rounded bg-muted/20 text-2xl font-semibold sm:text-3xl" />
            </SectionHeader>
            <SectionContent className="relative mx-auto grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <VideoCardLoading key={i} />
              ))}
            </SectionContent>
          </Section>
        ) : isEmpty ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <div className="rounded-2xl border border-border/70 bg-secondary/50 p-4 text-muted-foreground">
                <Search className="size-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Nenhum vídeo em alta</h3>
                <p className="max-w-md text-sm text-muted-foreground">
                  Nenhum vídeo encontrado no período &ldquo;{TIME_LABELS[timeTab]}&rdquo;.
                  Tente um período maior ou publique seu conteúdo.
                </p>
              </div>
              <Link to="/new" className={buttonVariants({ variant: "glass" })}>
                Publicar vídeo
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {processedEvents.map((event, index) => (
              <div key={event.id} className="group relative">
                {/* Rank badge */}
                <span className="absolute -left-1 -top-1 z-10 flex size-7 items-center justify-center rounded-xl bg-primary/90 text-xs font-bold text-primary-foreground shadow-md backdrop-blur-sm">
                  {index + 1}
                </span>
                <div
                  className={cn(
                    'card-hover-lift cursor-pointer rounded-2xl border border-border/70 bg-card/80',
                    index === 0 && 'md:col-span-2 md:row-span-2',
                  )}
                  role="link"
                  tabIndex={0}
                  onClick={() => window.open(`/v/${event.encode()}`, '_self')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      window.open(`/v/${event.encode()}`, '_self')
                    }
                  }}
                >
                  <VideoCard event={event} profile={getProfile(event.author.pubkey)} className="h-full" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* === Criadores em destaque === */}
      {uniqueCreators.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Criadores em destaque
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Autores com mais conteúdo no período.
            </p>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2">
            {uniqueCreators.slice(0, 10).map((event) => {
              const profile = getProfile(event.author.pubkey)
              return (
                <Link
                  key={event.author.pubkey}
                  to="/u/$userId"
                  params={{ userId: event.author.npub ?? event.author.pubkey }}
                  className="flex shrink-0 flex-col items-center gap-2 rounded-2xl border border-border/60 bg-card/60 px-5 py-4 transition-colors hover:border-primary/40 hover:bg-card/80"
                >
                  <div className="flex size-14 items-center justify-center rounded-full border-2 border-border/70 bg-muted/30 text-lg font-bold text-muted-foreground">
                    {(profile?.displayName || profile?.name || '?').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="text-center">
                    <p className="max-w-[100px] truncate text-sm font-medium text-foreground">
                      {profile?.displayName || profile?.name || 'Anônimo'}
                    </p>
                    <p className="text-xs text-muted-foreground">Criador</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* === Tags em alta === */}
      {uniqueTags.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Tags em alta
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Hashtags mais frequentes nos vídeos do período.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {uniqueTags.map((tag) => (
              <Link
                key={tag}
                to="/search"
                search={{ search: tag } as never}
                className="rounded-xl border border-border/60 bg-card/60 px-3.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {tag}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* === Refresh / Ver todos === */}
      <div className="flex justify-center gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className={buttonVariants({ variant: "glass" })}
        >
          <RefreshCw className="mr-1.5 size-4" />
          Atualizar
        </button>
        <Link to="/search" className={buttonVariants({ variant: "glass" })}>
          Ver todos os vídeos
          <ArrowRight className="ml-1.5 size-4" />
        </Link>
      </div>
    </AppShell>
  )
}
