import type { NDKEvent } from '@nostr-dev-kit/ndk'
import {
  NDKSubscriptionCacheUsage,
  useFollows,
  useProfileValue,
  useSubscribe,
  type NDKFilter,
} from '@nostr-dev-kit/ndk-hooks'
import { createRoute, Link } from '@tanstack/react-router'
import {
  BellRing,
  Bookmark,
  ChevronRight,
  ExternalLink,
  Hash,
  ListVideo,
  Play,
  Radio,
  Settings,
  Sparkles,
  Tv,
  Users,
  Video,
} from 'lucide-react'
import { nip19 } from 'nostr-tools'
import { useMemo, useState } from 'react'
import VideoCard, { VideoCardLoading } from '@/components/cards/videoCard'
import { AppShell } from '@/components/layout/AppShell'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { useBatchProfiles } from '@/features/nostr/hooks/useBatchProfiles'
import { LIVE_EVENT_KIND, VIDEO_EVENT_KINDS } from '@/features/video/services/video-kinds'
import { Route as rootRoute } from '@/routes/__root'

// ─── Rotas ───────────────────────────────────────────────
export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/subscriptions',
  component: SubscriptionsPage,
  head: () => ({
    meta: [
      { title: `Inscrições - ${import.meta.env.VITE_APP_NAME}` },
      {
        name: 'description',
        content: 'Acompanhe seus criadores favoritos e nunca perca um novo vídeo.',
      },
      { property: 'og:title', content: `Inscrições - ${import.meta.env.VITE_APP_NAME}` },
    ],
  }),
})

// ─── Tipos ────────────────────────────────────────────────
type SubTab = 'all' | 'videos' | 'live' | 'posts' | 'playlists'

// ─── Hook de dados ───────────────────────────────────────
function useSubscriptionsData() {
  const follows = useFollows()
  const followedPubkeys = useMemo(() => [...follows], [follows])

  // Vídeos dos autores seguidos
  const videoFilter: NDKFilter = {
    kinds: VIDEO_EVENT_KINDS,
    authors: followedPubkeys,
    limit: 100,
  }
  const {
    events: videoEvents,
    eose: videoEose,
  } = useSubscribe(followedPubkeys.length > 0 ? [videoFilter] : false, {
    closeOnEose: false,
    cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
  })

  // Lives dos seguidos (kind 30311)
  const liveFilter: NDKFilter = {
    kinds: [LIVE_EVENT_KIND as number],
    authors: followedPubkeys,
    limit: 50,
  }
  const { events: liveEvents } = useSubscribe(followedPubkeys.length > 0 ? [liveFilter] : false, {
    closeOnEose: false,
    cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
  })

  // Kind 1 posts dos seguidos
  const postsFilter: NDKFilter = {
    kinds: [1],
    authors: followedPubkeys,
    limit: 50,
  }
  const {
    events: postsEvents,
    eose: postsEose,
  } = useSubscribe(followedPubkeys.length > 0 ? [postsFilter] : false, {
    closeOnEose: false,
    cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
  })

  // Playlists (kind 30001) dos seguidos
  const playlistFilter: NDKFilter = {
    kinds: [30001],
    authors: followedPubkeys,
    limit: 30,
  }
  const { events: playlistEvents } = useSubscribe(followedPubkeys.length > 0 ? [playlistFilter] : false, {
    closeOnEose: false,
    cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
  })

  // Perfis dos autores de vídeos
  const profiles = useBatchProfiles(videoEvents)

  // Lives ativas
  const liveNow = useMemo(
    () => liveEvents.filter((e) => {
      const status = e.tagValue('status') || ''
      return status === 'live'
    }),
    [liveEvents],
  )

  // Playlists agrupadas por autor
  const playlistGroups = useMemo(() => {
    const groups = new Map<string, NDKEvent[]>()
    playlistEvents.forEach((ev) => {
      const existing = groups.get(ev.pubkey) || []
      existing.push(ev)
      groups.set(ev.pubkey, existing)
    })
    return groups
  }, [playlistEvents])

  const isLoading = videoEose === false
  const isEmpty = videoEose && videoEvents.length === 0 && postsEose && postsEvents.length === 0
  const notFollowing = followedPubkeys.length === 0

  return {
    videoEvents,
    liveEvents,
    liveNow,
    postsEvents,
    postsEose,
    playlistEvents,
    playlistGroups,
    profiles,
    followedPubkeys,
    notFollowing,
    isEmpty,
    isLoading,
  }
}

// ─── Página Principal ────────────────────────────────────
function SubscriptionsPage() {
  const {
    videoEvents,
    liveNow,
    postsEose,
    profiles,
    followedPubkeys,
    notFollowing,
    isEmpty,
    isLoading,
  } = useSubscriptionsData()

  const isEmptyPosts = postsEose

  const [activeTab, setActiveTab] = useState<SubTab>('all')

  // Coluna direita
  const aside = (
    <>
      {/* Resumo das inscrições */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="size-4 text-[oklch(var(--primary))]" />
            <CardTitle className="text-base">Resumo das inscrições</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Canais inscritos</span>
            <span className="font-medium">{followedPubkeys.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Vídeos novos</span>
            <span className="font-medium">{videoEvents.length > 0 ? videoEvents.length : '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Ao vivo agora</span>
            <span className="font-medium">{liveNow.length > 0 ? liveNow.length : '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Ativos</span>
            <span className="font-medium">{followedPubkeys.slice(0, 5).length > 0 ? followedPubkeys.length : '—'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Ao vivo agora */}
      {liveNow.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Radio className="size-4 text-[oklch(var(--flame))]" />
              <CardTitle className="text-base">Ao vivo agora</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {liveNow.slice(0, 5).map((ev) => {
              const profile = profiles[ev.pubkey]
              const npub = ev.pubkey ? nip19.npubEncode(ev.pubkey) : ''
              return (
                <Link
                  key={ev.id}
                  to={`/u/$userId`}
                  params={{ userId: npub }}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/50"
                >
                  <span className="relative flex size-2 shrink-0">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-red-500" />
                  </span>
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
                    {profile?.displayName?.[0] || profile?.name?.[0] || '?'}
                  </div>
                  <span className="flex-1 truncate text-muted-foreground">
                    {ev.tagValue('title') || 'Live'}
                  </span>
                </Link>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Playlists das inscrições */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ListVideo className="size-4 text-[oklch(var(--water))]" />
            <CardTitle className="text-base">Playlists das inscrições</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            Playlists dos canais que você segue aparecerão aqui.
          </p>
        </CardContent>
      </Card>

      {/* Gerencie suas inscrições */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gerencie suas inscrições</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Descubra novos criadores e gerencie quem você acompanha.
          </p>
          <Link
            to="/search"
            className={buttonVariants({ variant: "glass", size: "sm", className: "w-full" })}
          >
            <Users className="mr-2 size-4" />
            Descobrir criadores
          </Link>
        </CardContent>
      </Card>
    </>
  )

  // Loading
  if (isLoading && !notFollowing) {
    return (
      <AppShell
        activeKey="subscriptions"
        title="Inscrições"
        description="Acompanhe seus criadores favoritos e nunca perca um novo vídeo."
        icon={BellRing}
        aside={aside}
      >
        {/* Skeleton carrossel */}
        <div className="flex gap-4 overflow-x-auto pb-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex h-28 w-28 shrink-0 animate-pulse flex-col items-center justify-center gap-2 rounded-xl bg-muted"
            />
          ))}
        </div>
        {/* Skeleton grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <VideoCardLoading key={i} />
          ))}
        </div>
      </AppShell>
    )
  }

  // Empty: não segue ninguém
  if (notFollowing) {
    return (
      <AppShell
        activeKey="subscriptions"
        title="Inscrições"
        description="Acompanhe seus criadores favoritos e nunca perca um novo vídeo."
        icon={BellRing}
        aside={aside}
      >
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 inline-flex size-16 items-center justify-center rounded-full bg-muted">
            <BellRing className="size-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">Você não segue ninguém</h3>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Siga criadores para acompanhar novos vídeos, lives e postagens no seu feed
            personalizado.
          </p>
          <Link to="/explore" className={buttonVariants({ variant: "gradient" })}>
            <Sparkles className="mr-2 size-4" />
            Explorar criadores
          </Link>
        </div>
      </AppShell>
    )
  }

  // Empty: sem conteúdo recente
  if (isEmpty) {
    return (
      <AppShell
        activeKey="subscriptions"
        title="Inscrições"
        description="Acompanhe seus criadores favoritos e nunca perca um novo vídeo."
        icon={BellRing}
        aside={aside}
      >
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 inline-flex size-16 items-center justify-center rounded-full bg-muted">
            <Video className="size-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">Nenhum conteúdo recente</h3>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Os criadores que você segue ainda não publicaram nada recentemente. Os novos vídeos
            aparecerão aqui automaticamente.
          </p>
          <Link to="/trending" className={buttonVariants({ variant: "glass" })}>
            <Tv className="mr-2 size-4" />
            Ver trending
          </Link>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell
      activeKey="subscriptions"
      title="Inscrições"
      description="Acompanhe seus criadores favoritos e nunca perca um novo vídeo."
      icon={BellRing}
      aside={aside}
    >
      {/* Botão gerenciar inscrições */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {followedPubkeys.length} {followedPubkeys.length === 1 ? 'canal' : 'canais'}
          </span>
        </div>
        <Link
          to="/search"
          className={buttonVariants({ variant: "glass", size: "sm" })}
        >
          <Settings className="mr-2 size-4" />
          Gerenciar inscrições
        </Link>
      </div>

      {/* Carrossel de canais inscritos */}
      {followedPubkeys.length > 0 && (
        <section className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <Users className="size-5 text-[oklch(var(--primary))]" />
            <h2 className="text-lg font-semibold tracking-tight">Canais inscritos</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {followedPubkeys.slice(0, 15).map((pubkey) => (
              <ChannelCard key={pubkey} pubkey={pubkey} />
            ))}
          </div>
        </section>
      )}

      {/* Tabs do feed */}
      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as SubTab)}
        className="mb-6"
      >
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="all">
            Todos
            {videoEvents.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {videoEvents.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="videos">
            Vídeos
            {videoEvents.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {videoEvents.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="live">
            Ao vivo
            {liveNow.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {liveNow.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="posts">
            Postagens
            {isEmptyPosts && (
              <Badge variant="secondary" className="ml-2">
                {0}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="playlists">
            Playlists
          </TabsTrigger>
        </TabsList>

        {/* Tab: Todos */}
        <TabsContent value="all" className="mt-6">
          {videoEvents.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {videoEvents.slice(0, 24).map((ev) => (
                <VideoCard key={ev.id} event={ev} profile={profiles[ev.pubkey]} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Video className="mb-3 size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Nenhum vídeo dos seguidos ainda.</p>
            </div>
          )}
        </TabsContent>

        {/* Tab: Vídeos */}
        <TabsContent value="videos" className="mt-6">
          {videoEvents.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {videoEvents.map((ev) => (
                <VideoCard key={ev.id} event={ev} profile={profiles[ev.pubkey]} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Video className="mb-3 size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Os criadores que você segue ainda não publicaram vídeos.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Tab: Ao vivo */}
        <TabsContent value="live" className="mt-6">
          {liveNow.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {liveNow.map((ev) => {
                const profile = profiles[ev.pubkey]
                const npub = ev.pubkey ? nip19.npubEncode(ev.pubkey) : ''
                return (
                  <Link
                    key={ev.id}
                    to={`/u/$userId`}
                    params={{ userId: npub }}
                    className="group relative overflow-hidden rounded-xl border border-border/50 bg-card transition-all hover:border-primary/30"
                  >
                    <div className="relative aspect-video w-full bg-muted">
                      <div className="flex h-full items-center justify-center">
                        <Radio className="size-10 text-muted-foreground/40" />
                      </div>
                      <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-md bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                        <span className="relative flex size-2">
                          <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
                          <span className="relative inline-flex size-2 rounded-full bg-white" />
                        </span>
                        AO VIVO
                      </div>
                    </div>
                    <div className="p-3">
                      <h4 className="line-clamp-1 text-sm font-medium">
                        {ev.tagValue('title') || 'Live sem título'}
                      </h4>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {profile?.displayName || profile?.name || 'anon'}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Radio className="mb-3 size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Nenhum dos seus canais está ao vivo no momento.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Tab: Postagens */}
        <TabsContent value="posts" className="mt-6">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Hash className="mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Postagens dos seus canais aparecerão aqui em breve.
            </p>
          </div>
        </TabsContent>

        {/* Tab: Playlists */}
        <TabsContent value="playlists" className="mt-6">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ListVideo className="mb-3 size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Playlists dos seus canais aparecerão aqui quando disponíveis.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Rodapé CTA */}
      <section className="mt-4 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-6 text-center">
        <h3 className="mb-2 text-lg font-semibold">Quer descobrir mais criadores?</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Explore novos canais, hashtags e conteúdos no ecossistema Nostr.
        </p>
        <div className="flex justify-center gap-3">
          <Link to="/explore" className={buttonVariants({ variant: "gradient" })}>
            <Sparkles className="mr-2 size-4" />
            Explorar
          </Link>
          <Link to="/trending" className={buttonVariants({ variant: "glass" })}>
            <Tv className="mr-2 size-4" />
            Trending
          </Link>
        </div>
      </section>
    </AppShell>
  )
}

// ─── Channel Card ─────────────────────────────────────────
function ChannelCard({ pubkey }: { pubkey: string }) {
  const profile = useProfileValue(pubkey)
  const npub = pubkey ? nip19.npubEncode(pubkey) : ''

  return (
    <Link
      to="/u/$userId"
      params={{ userId: npub }}
      className="flex shrink-0 flex-col items-center gap-2 rounded-xl border border-border/50 bg-card/50 px-5 py-4 transition-all hover:border-primary/30 hover:bg-primary/5"
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-base font-bold text-foreground shadow-sm">
        {profile?.displayName?.[0] || profile?.name?.[0] || '?'}
      </div>
      <span className="max-w-20 truncate text-center text-xs font-medium">
        {profile?.displayName || profile?.name || 'anon'}
      </span>
      {profile?.nip05 && (
        <Badge variant="secondary" className="text-[9px]">
          ✓
        </Badge>
      )}
    </Link>
  )
}
