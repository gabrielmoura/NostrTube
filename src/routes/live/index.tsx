import type { NDKEvent } from '@nostr-dev-kit/ndk'
import { NDKSubscriptionCacheUsage, useSubscribe, type NDKFilter } from '@nostr-dev-kit/ndk-hooks'
import { createRoute, Link } from '@tanstack/react-router'
import {
  Bell,
  Calendar,
  ChevronRight,
  Dot,
  ExternalLink,
  Eye,
  Globe,
  MessageCircle,
  Mic,
  Music,
  Radio,
  Sparkles,
  Tv,
  UserRound,
  Users,
  Video,
  Zap,
} from 'lucide-react'
import { nip19 } from 'nostr-tools'
import { useEffect, useMemo, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { VideoPlayer } from '@/components/videoPlayer'
import { VideoCommentsContainer } from '@/features/video/components/VideoCommentsContainer'
import { useBatchProfiles } from '@/features/nostr/hooks/useBatchProfiles'
import { LIVE_EVENT_KIND } from '@/features/video/services/video-kinds'
import { cn } from '@/lib/utils'
import { Route as rootRoute } from '@/routes/__root'

// ─── Tipos ───────────────────────────────────────────────
interface LiveEvent {
  id: string
  dTag: string
  title: string
  summary: string
  image: string | null
  streaming: string | null
  recording: string | null
  status: 'live' | 'planned' | 'ended'
  starts: number | null
  ends: number | null
  currentParticipants: number | null
  totalParticipants: number | null
  tags: string[]
  pubkey: string
  event: NDKEvent
}

const CATEGORIES = [
  { key: 'all', label: 'Todas' },
  { key: 'technology', label: 'Tecnologia' },
  { key: 'bitcoin', label: 'Bitcoin' },
  { key: 'education', label: 'Educação' },
  { key: 'entertainment', label: 'Entretenimento' },
  { key: 'music', label: 'Música' },
  { key: 'gaming', label: 'Gaming' },
  { key: 'news', label: 'Notícias' },
  { key: 'talks', label: 'Palestras' },
]

const CATEGORY_TAG_MAP: Record<string, string[]> = {
  technology: ['technology', 'tech', 'programming', 'dev', 'software'],
  bitcoin: ['bitcoin', 'btc', 'crypto', 'lightning'],
  education: ['education', 'learning', 'tutorial', 'course'],
  entertainment: ['entertainment', 'fun', 'comedy', 'reviews'],
  music: ['music', 'musician', 'concert', 'live-music'],
  gaming: ['gaming', 'game', 'stream', 'twitch'],
  news: ['news', 'current-events', 'journalism'],
  talks: ['talks', 'lecture', 'conference', 'podcast'],
}

// ─── Rota ────────────────────────────────────────────────
export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/live',
  component: LivePage,
  head: () => ({
    meta: [
      { title: `Ao vivo - ${import.meta.env.VITE_APP_NAME}` },
      { name: 'description', content: 'Transmissões ao vivo da comunidade Nostr.' },
      { property: 'og:title', content: `Ao vivo - ${import.meta.env.VITE_APP_NAME}` },
    ],
  }),
})

// ─── Hook de dados ───────────────────────────────────────
function parseLiveEvent(event: NDKEvent): LiveEvent {
  return {
    id: event.id,
    dTag: event.tagValue('d') || event.id,
    title: event.tagValue('title') || 'Live sem título',
    summary: event.tagValue('summary') || '',
    image: event.tagValue('image') || null,
    streaming: event.tagValue('streaming') || null,
    recording: event.tagValue('recording') || null,
    status: (event.tagValue('status') as LiveEvent['status']) || 'live',
    starts: event.tagValue('starts') ? Number(event.tagValue('starts')) * 1000 : null,
    ends: event.tagValue('ends') ? Number(event.tagValue('ends')) * 1000 : null,
    currentParticipants: event.tagValue('current_participants') ? Number(event.tagValue('current_participants')) : null,
    totalParticipants: event.tagValue('total_participants') ? Number(event.tagValue('total_participants')) : null,
    tags: event.tags.filter((t) => t[0] === 't').map((t) => t[1].toLowerCase()),
    pubkey: event.pubkey,
    event,
  }
}

function useLiveData() {
  // Buscar todos os eventos 30311 (live)
  const filter: NDKFilter = { kinds: [LIVE_EVENT_KIND as number], limit: 100 }
  const { events, eose } = useSubscribe(  [filter], {
    closeOnEose: false,
    cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
  })

  // Parse events
  const liveEvents = useMemo(() => events.map(parseLiveEvent), [events])

  // Agrupar por status
  const liveNow = useMemo(
    () => liveEvents.filter((e) => e.status === 'live'),
    [liveEvents],
  )
  const planned = useMemo(
    () => liveEvents.filter((e) => e.status === 'planned'),
    [liveEvents],
  )
  // Featured = first live with streaming URL
  const featured = useMemo(
    () => liveNow.find((e) => e.streaming) || liveNow[0] || null,
    [liveNow],
  )

  // Other lives (exclude featured)
  const otherLives = useMemo(
    () => liveNow.filter((e) => e.id !== featured?.id),
    [liveNow, featured],
  )

  // Perfis
  const allPubkeys = useMemo(
    () => [...new Set(liveEvents.map((e) => e.pubkey))],
    [liveEvents],
  )
  const profiles = useBatchProfiles(
    useMemo(
      () => events.filter((e) => allPubkeys.includes(e.pubkey)),
      [events, allPubkeys],
    ),
  )

  return {
    liveNow,
    planned,
    featured,
    otherLives,
    liveEvents,
    profiles,
    isLoading: !eose,
  }
}

// ─── Página Principal ────────────────────────────────────
function LivePage() {
  const {
    liveNow,
    planned,
    featured,
    otherLives,
    profiles,
    isLoading,
  } = useLiveData()

  const [activeCategory, setActiveCategory] = useState('all')
  const [selectedLiveId, setSelectedLiveId] = useState<string | null>(null)

  useEffect(() => {
    if (!featured) {
      setSelectedLiveId(null)
      return
    }
    setSelectedLiveId((current) => {
      if (current && liveNow.some((live) => live.id === current)) return current
      return featured.id
    })
  }, [featured, liveNow])

  const activeLive = useMemo(() => {
    if (!selectedLiveId) return featured
    return liveNow.find((live) => live.id === selectedLiveId) || featured
  }, [featured, liveNow, selectedLiveId])

  // Filtrar lives pela categoria ativa
  const filteredOther = useMemo(() => {
    if (activeCategory === 'all') return otherLives
    const relatedTags = CATEGORY_TAG_MAP[activeCategory] || [activeCategory]
    return otherLives.filter((live) =>
      live.tags.some((t) => relatedTags.includes(t)),
    )
  }, [otherLives, activeCategory])

  // Coluna direita
  const aside = (
    <>
      {/* Canais ao vivo */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Radio className="size-4 text-[oklch(var(--flame))]" />
            <CardTitle className="text-base">Canais ao vivo</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {liveNow.length > 0 ? (
            liveNow.slice(0, 8).map((live) => {
              const profile = profiles[live.pubkey]
              const npub = live.pubkey ? nip19.npubEncode(live.pubkey) : ''
              return (
                <Link
                  key={live.id}
                  to="/u/$userId"
                  params={{ userId: npub }}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/50"
                >
                  <div className="relative shrink-0">
                    <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-bold">
                      {profile?.displayName?.[0] || profile?.name?.[0] || '?'}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 flex size-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex size-3 rounded-full bg-red-500" />
                    </span>
                  </div>
                  <span className="flex-1 truncate text-muted-foreground">
                    {profile?.displayName || profile?.name || 'anon'}
                  </span>
                </Link>
              )
            })
          ) : (
            <p className="text-muted-foreground">Nenhum canal ao vivo.</p>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas ao vivo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estatísticas ao vivo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Ao vivo agora</span>
            <span className="font-medium">{liveNow.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Agendados</span>
            <span className="font-medium">{planned.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total de viewers</span>
            <span className="font-medium">
              {liveNow.reduce((sum, l) => sum + (l.currentParticipants ?? 0), 0) || '—'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* CTA - Transmitir */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="py-5 text-center">
          <div className="mb-3 inline-flex size-12 items-center justify-center rounded-full bg-primary/20">
            <Radio className="size-6 text-primary" />
          </div>
          <h3 className="mb-1 font-semibold">Transmita ao vivo</h3>
          <p className="mb-4 text-xs text-muted-foreground">
            Compartilhe sua transmissão com a comunidade Nostr. Use OBS, Streamlabs ou qualquer software compatível com
            RTMP/HLS — publique o link no Nostr com kind 30311.
          </p>
          <a
            href="https://github.com/nostr-protocol/nips/blob/master/53.md"
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "gradient", size: "sm" })}
          >
            <ExternalLink className="mr-2 size-4" />
            Saiba mais (NIP-53)
          </a>
        </CardContent>
      </Card>

      {/* Dicas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-muted-foreground">
          <p className="flex items-center gap-2">
            <MessageCircle className="size-3 shrink-0" />
            Interaja com o chat ao vivo
          </p>
          <p className="flex items-center gap-2">
            <Zap className="size-3 shrink-0" />
            Use Zaps para apoiar criadores
          </p>
          <p className="flex items-center gap-2">
            <Bell className="size-3 shrink-0" />
            Divulgue sua live com antecedência
          </p>
        </CardContent>
      </Card>
    </>
  )

  // Loading
  if (isLoading && liveNow.length === 0 && planned.length === 0) {
    return (
      <AppShell activeKey="live" title="Ao vivo" description="Transmissões ao vivo da comunidade Nostr." icon={Radio} aside={aside}>
        <div className="space-y-6">
          {/* Skeleton player */}
          <div className="aspect-video w-full animate-pulse rounded-xl bg-muted" />
          {/* Skeleton grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-video w-full animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      </AppShell>
    )
  }

  const isEmpty = liveNow.length === 0 && planned.length === 0

  return (
    <AppShell activeKey="live" title="Ao vivo" description="Transmissões ao vivo da comunidade Nostr." icon={Radio} aside={aside}>
      {/* Featured Live */}
      {activeLive ? (
        <section>
          <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
            <div className="relative aspect-video w-full bg-black">
              {activeLive.streaming ? (
                <VideoPlayer
                  key={activeLive.id}
                  src={activeLive.streaming!}
                  sourceMimeType={activeLive.streaming?.endsWith('.m3u8') ? 'application/x-mpegurl' : undefined}
                  title={activeLive.title}
                  image={activeLive.image ?? ''}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-muted to-card p-8 text-center">
                  <Radio className="size-12 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">URL de transmissão não disponível</p>
                </div>
              )}
              {/* Overlay badge */}
              <div className="absolute left-4 top-4 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white shadow-lg">
                  <span className="flex size-2 rounded-full bg-white" />
                  AO VIVO
                </span>
                {activeLive.currentParticipants !== null && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white backdrop-blur-sm">
                    <Eye className="size-3" />
                    {activeLive.currentParticipants}
                  </span>
                )}
              </div>
            </div>
            <div className="p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-bold tracking-tight">{activeLive.title}</h2>
                  {activeLive.summary && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{activeLive.summary}</p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {activeLive.tags.slice(0, 4).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px]">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    to="/u/$userId"
                    params={{ userId: activeLive.pubkey ? nip19.npubEncode(activeLive.pubkey) : '' }}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <div className="flex size-7 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
                      {profiles[activeLive.pubkey]?.displayName?.[0] || profiles[activeLive.pubkey]?.name?.[0] || '?'}
                    </div>
                    {profiles[activeLive.pubkey]?.displayName || profiles[activeLive.pubkey]?.name || 'anon'}
                  </Link>
                  <a
                    href={activeLive.streaming || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({ variant: "glass", size: "sm" })}
                  >
                    <ExternalLink className="size-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-border/50 bg-card/70 p-4">
            <VideoCommentsContainer
              eventReference={`${LIVE_EVENT_KIND}:${activeLive.pubkey}:${activeLive.dTag}`}
              eventId={activeLive.id}
              pubkey={activeLive.pubkey}
            />
          </div>
        </section>
      ) : null}

      {/* Categorias */}
      {liveNow.length > 0 && (
        <section>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                className={cn(
                  'shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors',
                  activeCategory === cat.key
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border/50 bg-card/50 text-muted-foreground hover:border-primary/30 hover:text-foreground',
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Ao vivo agora — Grid */}
      {filteredOther.length > 0 || (activeLive && otherLives.length === 0) ? (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Radio className="size-5 text-[oklch(var(--flame))]" />
            <h2 className="text-lg font-semibold tracking-tight">Ao vivo agora</h2>
            <StatusBadge tone="live">{liveNow.length}</StatusBadge>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(filteredOther.length > 0 ? filteredOther : activeLive ? [activeLive] : []).map((live) => (
              <button
                key={live.id}
                type="button"
                onClick={() => setSelectedLiveId(live.id)}
                className={cn(
                  'group relative overflow-hidden rounded-xl border border-border/50 bg-card text-left transition-all hover:border-primary/30',
                  selectedLiveId === live.id && 'border-primary/50 ring-1 ring-primary/30',
                )}
              >
                <div className="relative aspect-video w-full bg-muted">
                  {live.image ? (
                    <img
                      src={live.image}
                      alt={live.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-card">
                      <Radio className="size-8 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute left-2 top-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
                      <span className="flex size-1.5 rounded-full bg-white" />
                      LIVE
                    </span>
                  </div>
                  {live.currentParticipants !== null && (
                    <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm">
                      <Eye className="size-3" />
                      {live.currentParticipants}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-medium">{live.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {profiles[live.pubkey]?.displayName || profiles[live.pubkey]?.name || 'anon'}
                  </p>
                  {live.tags.length > 0 && (
                    <div className="mt-1.5 flex gap-1">
                      <Badge variant="secondary" className="text-[9px]">
                        #{live.tags[0]}
                      </Badge>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {/* Programação — agendados */}
      {planned.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Calendar className="size-5 text-[oklch(var(--water))]" />
            <h2 className="text-lg font-semibold tracking-tight">Programação em destaque</h2>
          </div>
          <div className="space-y-3">
            {planned.slice(0, 6).map((live) => (
              <div
                key={live.id}
                className="flex items-center gap-4 rounded-xl border border-border/50 bg-card/50 p-4"
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                  {live.image ? (
                    <img src={live.image} alt="" className="h-full w-full rounded-lg object-cover" />
                  ) : (
                    <Calendar className="size-6 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{live.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {live.starts ? new Date(live.starts).toLocaleDateString('pt-BR', {
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit',
                    }) : 'Data a definir'}
                  </p>
                  {live.tags.length > 0 && (
                    <div className="mt-1 flex gap-1">
                      {live.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[9px]">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  Agendado
                </Badge>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 inline-flex size-16 items-center justify-center rounded-full bg-muted">
            <Radio className="size-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">Nenhuma transmissão ao vivo no momento</h3>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Não encontramos lives ativas nos relays consultados. As transmissões ao vivo da comunidade Nostr aparecerão
            aqui quando disponíveis.
          </p>
          <div className="flex gap-3">
            <Link to="/explore" className={buttonVariants({ variant: "gradient" })}>
              <Video className="mr-2 size-4" />
              Explorar vídeos
            </Link>
            <a
              href="https://github.com/nostr-protocol/nips/blob/master/53.md"
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "glass" })}
            >
              <ExternalLink className="mr-2 size-4" />
              NIP-53
            </a>
          </div>
        </div>
      )}
    </AppShell>
  )
}
