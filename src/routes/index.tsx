import type { NDKEvent } from '@nostr-dev-kit/ndk'
import { NDKSubscriptionCacheUsage, useSubscribe } from '@nostr-dev-kit/ndk-hooks'
import { createRoute, Link, useNavigate } from '@tanstack/react-router'
import { uniqBy } from 'ramda'
import { useMemo, useRef } from 'react'
import { t } from 'i18next'
import { ArrowRight, CircleHelp, HandCoins, LayoutGrid, MonitorUp, Radio, Search, ShieldCheck, Sparkles, TrendingUp, Wifi, Zap } from 'lucide-react'
import VideoCard, { VideoCardLoading } from '@/components/cards/videoCard'
import { AppShell } from '@/components/layout/AppShell'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { Section, SectionContent, SectionHeader, SectionTitle } from '@/components/containers/pageSection'
import { useBatchProfiles } from '@/features/nostr/hooks/useBatchProfiles'
import { useContentVisibilityFilter } from '@/features/nostr/hooks/useContentVisibilityFilter'
import { useZapStats } from '@/features/zap/hooks/useZapStats'
import { filterEventsByAge } from '@/features/video/services/age-filter.service'
import { getVideoRouteReference } from '@/features/video/services/video-reference.service'
import { VIDEO_EVENT_KINDS } from '@/features/video/services/video-kinds'
import { sortEventsByImages } from '@/helper/format.ts'
import { cn } from '@/lib/utils'
import { Route as rootRoute } from '@/routes/__root'
import useUserStore from '@/store/useUserStore'

// --- Constantes ---
const VIDEO_KINDS = VIDEO_EVENT_KINDS
const SEARCH_RELAYS =
  import.meta.env.VITE_NOSTR_SEARCH_RELAYS?.length > 5 ? import.meta.env.VITE_NOSTR_SEARCH_RELAYS : undefined

// ============================================================
// Rota
// ============================================================
export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})

// ============================================================
// HomePage — container principal
// ============================================================
function HomePage() {
  const navigate = useNavigate()
  const agePref = useUserStore((state) => state.session?.age)
  const relayCount = useUserStore((state) => state.session?.relays?.length ?? 0)
  const { filterEvents } = useContentVisibilityFilter()

  // --- Dados reais de vídeos (mesma fonte do layout antigo) ---
  const { events } = useSubscribe(
    [
      {
        kinds: VIDEO_KINDS,
        limit: 50,
        until: Math.floor(Date.now() / 1000),
      },
    ],
    {
      closeOnEose: false,
      cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
      relayUrls: SEARCH_RELAYS,
    },
    [],
  )

  const filtered = useMemo(() => filterEvents(filterEventsByAge(events, agePref)), [events, agePref, filterEvents])
  const processedEvents = useMemo(() => {
    if (!filtered.length) return []
    return uniqBy((e) => {
      const titleTag = e.tags.find((t) => t[0] === 'title')
      return titleTag?.[1] ?? e.id
    }, filtered).sort(sortEventsByImages)
  }, [filtered])

  const profiles = useBatchProfiles(processedEvents)
  const getProfile = (pubkey: string) => profiles[pubkey]

  // --- Zaps widget data (leve, só stats) ---
  const zapStats = useZapStats()
  const topZaps = useMemo(() => {
    const activity = zapStats.data?.activity ?? []
    return activity.slice(0, 3)
  }, [zapStats.data?.activity])

  // --- Tags extraídas dos eventos ---
  const uniqueTags = useMemo(() => {
    const tagSet = new Set<string>()
    processedEvents.forEach((ev) => {
      ev.tags.forEach((t) => {
        if (t[0] === 't' && t[1]) tagSet.add(`#${t[1].toLowerCase()}`)
      })
    })
    return Array.from(tagSet).slice(0, 9)
  }, [processedEvents])

  const isLoading = events.length === 0
  const hasVideos = processedEvents.length > 0

  // --- Coluna direita ---
  const aside = (
    <>
      {/* Zaps em destaque */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-[oklch(var(--lightning))]" />
            <CardTitle className="text-base">Zaps em destaque</CardTitle>
          </div>
          <CardDescription>Atividade recente de Zaps.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {topZaps.length > 0 ? (
            topZaps.map((zap) => (
              <div key={zap.id} className="flex items-center justify-between rounded-xl border border-border/50 bg-card/50 px-3 py-2">
                <span className="truncate text-muted-foreground">{zap.targetLabel || 'vídeo'}</span>
                <StatusBadge tone="warning">{zap.amountSats} sats</StatusBadge>
              </div>
            ))
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-border/60 px-3 py-3 text-muted-foreground">
              <HandCoins className="size-4 shrink-0" />
              <span>Nenhum zap detectado ainda.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Relays ativos */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wifi className="size-4 text-cyan-400" />
            <CardTitle className="text-base">Relays ativos</CardTitle>
          </div>
          <CardDescription>{relayCount} relay(s) configurado(s).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/60 p-3">
            <div className="rounded-xl bg-emerald-500/14 p-2 text-emerald-400">
              <Radio className="size-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {relayCount > 0 ? `${relayCount} relay(s) conectado(s)` : 'Nenhum relay'}
              </p>
              <p className="text-xs text-muted-foreground">Status da malha Nostr</p>
            </div>
          </div>
          <div className="mt-3">
            <Link to="/relays" className={cn(buttonVariants({ variant: "glass", size: "sm" }), "w-full")}>
              Gerenciar relays
              <ArrowRight className="ml-1 size-3.5" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Explorar por tags */}
      {uniqueTags.length > 0 ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              <CardTitle className="text-base">Explorar por tags</CardTitle>
            </div>
            <CardDescription>Tags encontradas nos vídeos recentes.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {uniqueTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => navigate({ to: '/search', search: { search: tag } as never })}
                  className="rounded-xl border border-border/60 bg-card/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {tag}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* CTA de upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compartilhe seu conteúdo</CardTitle>
          <CardDescription>Publique vídeos diretamente na rede Nostr.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/new" className={cn(buttonVariants({ variant: "gradient" }), "w-full")}>
            <MonitorUp className="size-4" />
            Enviar vídeo
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ajuda e políticas</CardTitle>
          <CardDescription>Links rápidos para suporte e uso responsável.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link to="/faq" className={cn(buttonVariants({ variant: 'glass', size: 'sm' }), 'w-full justify-start')}>
            <CircleHelp className="mr-2 size-4" />
            FAQ
          </Link>
          <Link to="/terms" className={cn(buttonVariants({ variant: 'glass', size: 'sm' }), 'w-full justify-start')}>
            <ShieldCheck className="mr-2 size-4" />
            Termos de uso
          </Link>
        </CardContent>
      </Card>
    </>
  )

  return (
    <AppShell activeKey="home" aside={aside}>
      {/* ============ HERO SECTION ============ */}
      <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-[#0E1020] via-[#17142B] to-[#102838] px-8 py-10 sm:px-12 sm:py-14">
        {/* Glows decorativos */}
        <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-purple-600/18 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-16 right-40 size-48 rounded-full bg-cyan-500/14 blur-[70px]" />
        <div className="pointer-events-none absolute -left-8 top-1/3 size-40 rounded-full bg-amber-500/8 blur-[60px]" />

        <div className="relative">
          {/* Kicker */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-1.5">
            <Sparkles className="size-3.5 text-primary" />
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
              Relay Cinema
            </span>
          </div>

          {/* Título */}
          <h1 className="font-display max-w-[640px] text-3xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Vídeos livres para<br />
            <span className="bg-gradient-to-r from-primary via-accent to-[oklch(var(--lightning))] bg-clip-text text-transparent">
              criadores soberanos.
            </span>
          </h1>

          {/* Descrição */}
          <p className="mt-5 max-w-[520px] text-balance text-sm leading-relaxed text-muted-foreground sm:text-base">
            Publique, descubra e apoie criadores usando Nostr, relays e Blossom.
            Sem censura. Sem algoritmos.
          </p>

          {/* CTAs */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link to="/search" className={buttonVariants({ variant: "gradient", size: "lg" })}>
              Explorar vídeos
              <ArrowRight className="ml-1.5 size-4" />
            </Link>
            <Link to="/new" className={buttonVariants({ variant: "glass", size: "lg" })}>
              <MonitorUp className="mr-1.5 size-4" />
              Enviar vídeo
            </Link>
          </div>

          {/* Badges */}
          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Zap className="size-3.5 text-[oklch(var(--lightning))]" />
              Nostr nativo
            </span>
            <span className="size-1 rounded-full bg-border" />
            <span className="flex items-center gap-1.5">
              <Search className="size-3.5" />
              Sem anúncios
            </span>
            <span className="size-1 rounded-full bg-border" />
            <span className="flex items-center gap-1.5">
              <HandCoins className="size-3.5 text-[oklch(var(--lightning))]" />
              Apoie com Zaps
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border/70 bg-card/60 px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-primary/75">Knowledge & Trust</p>
            <h2 className="mt-1 text-lg font-semibold">Entenda a plataforma e navegue com contexto</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Leia as perguntas frequentes, conheça os termos da rede e descubra como publicar com mais segurança.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/faq" className={buttonVariants({ variant: 'glass' })}>FAQ</Link>
            <Link to="/terms" className={buttonVariants({ variant: 'glass' })}>Termos</Link>
          </div>
        </div>
      </section>

      {/* ============ TRENDING SECTION ============ */}
      <section className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t('Trending agora', 'Trending agora')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('Vídeos em alta na rede neste momento', 'Vídeos em alta na rede neste momento')}
          </p>
        </div>

        {isLoading && !hasVideos ? (
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
        ) : !hasVideos ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <div className="rounded-2xl border border-border/70 bg-secondary/50 p-4 text-muted-foreground">
                <Search className="size-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Nenhum vídeo encontrado</h3>
                <p className="max-w-md text-sm text-muted-foreground">
                  Ainda não há vídeos disponíveis nos relays consultados. Tente novamente mais tarde.
                </p>
              </div>
              <Link to="/new" className={buttonVariants({ variant: "glass" })}>
                Seja o primeiro a publicar
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {processedEvents.map((event, index) => (
              <div
                key={event.id}
                className={cn(
                  'card-hover-lift cursor-pointer rounded-2xl border border-border/70 bg-card/80',
                  index === 0 && 'md:col-span-2 md:row-span-2',
                )}
                role="link"
                tabIndex={0}
                onClick={() => navigate({ to: '/v/$eventId', params: { eventId: getVideoRouteReference(event) } })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    navigate({ to: '/v/$eventId', params: { eventId: getVideoRouteReference(event) } })
                  }
                }}
              >
                <VideoCard event={event} profile={getProfile(event.author.pubkey)} className="h-full" />
              </div>
            ))}
          </div>
        )}

        {hasVideos ? (
          <div className="flex justify-center">
          <Link to="/search" className={buttonVariants({ variant: "glass" })}>
            Ver todos os vídeos
            <ArrowRight className="ml-1.5 size-4" />
          </Link>
          </div>
        ) : null}
      </section>
    </AppShell>
  )
}
