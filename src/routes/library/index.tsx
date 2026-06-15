import { NDKKind, type NDKEvent } from '@nostr-dev-kit/ndk'
import { NDKSubscriptionCacheUsage, useNDK, useNDKCurrentUser, useSubscribe, type NDKFilter } from '@nostr-dev-kit/ndk-hooks'
import { createRoute, Link } from '@tanstack/react-router'
import {
  Bookmark,
  ChevronRight,
  Clock,
  Download,
  FolderOpen,
  Heart,
  History,
  ListVideo,
  PlaySquare,
  Plus,
  Trash2,
  Tv,
  UserRound,
} from 'lucide-react'
import { useMemo } from 'react'
import { z } from 'zod'
import VideoCard, { VideoCardLoading } from '@/components/cards/videoCard'
import { AppShell } from '@/components/layout/AppShell'
import type { SidebarKey } from '@/components/layout/AppSidebar'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useWatchLater } from '@/features/library/hooks/use-watch-later'
import { useBatchProfiles } from '@/features/nostr/hooks/useBatchProfiles'
import { VIDEO_EVENT_KINDS } from '@/features/video/services/video-kinds'
import { getWatchHistory } from '@/features/recommendations/services/watch-history.service'
import { Route as rootRoute } from '@/routes/__root'

// ─── Tipos ───────────────────────────────────────────────
type LibraryTab = 'all' | 'playlists' | 'liked' | 'watchlater' | 'history' | 'myvideos' | 'downloads'

const LibrarySearchSchema = z.object({
  tab: z.enum(['all', 'playlists', 'liked', 'watchlater', 'history', 'myvideos', 'downloads']).optional(),
})

function isResolvablePlaylistVideoTag(tag: string[]) {
  const [, value] = tag
  if (!value) return false

  if (tag[0] === 'e') {
    const parts = value.split(':')
    const eventId = parts.length === 2 ? parts[1] : value
    return eventId.length === 64
  }

  if (tag[0] === 'a') {
    const parts = value.split(':')
    return (parts.length === 3 && Boolean(parts[0] && parts[1] && parts[2])) || (parts.length === 2 && parts[1]?.length === 64)
  }

  return false
}

const TABS: { key: LibraryTab; label: string; icon: typeof FolderOpen }[] = [
  { key: 'all', label: 'Tudo', icon: FolderOpen },
  { key: 'playlists', label: 'Playlists', icon: ListVideo },
  { key: 'liked', label: 'Vídeos curtidos', icon: Heart },
  { key: 'watchlater', label: 'Assistir mais tarde', icon: Bookmark },
  { key: 'history', label: 'Histórico', icon: History },
  { key: 'myvideos', label: 'Seus vídeos', icon: UserRound },
  { key: 'downloads', label: 'Downloads', icon: Download },
]

// ─── Rota ────────────────────────────────────────────────
export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/library',
  component: LibraryPage,
  validateSearch: LibrarySearchSchema,
  head: () => ({
    meta: [
      { title: `Biblioteca - ${import.meta.env.VITE_APP_NAME}` },
      { name: 'description', content: 'Tudo o que você salvou, organizou e acompanhou.' },
      { property: 'og:title', content: `Biblioteca - ${import.meta.env.VITE_APP_NAME}` },
    ],
  }),
})

// ─── Hook de dados ───────────────────────────────────────
function useLibraryData() {
  const currentUser = useNDKCurrentUser()
  const currentPubkey = currentUser?.pubkey

  // Histórico (localStorage)
  const watchHistory = useMemo(() => getWatchHistory(), [])

  // Vídeos do usuário
  const myVideosFilter: NDKFilter | null = currentPubkey
    ? { kinds: VIDEO_EVENT_KINDS, authors: [currentPubkey], limit: 50 }
    : null
  const { events: myVideos, eose: myVideosEose } = useSubscribe(
    myVideosFilter ? [myVideosFilter] : false,
    { closeOnEose: false, cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST },
  )

  // Playlists de vídeo do usuário (kind 30005 / NDKKind.VideoCurationSet)
  const playlistsFilter: NDKFilter | null = currentPubkey
    ? { kinds: [NDKKind.VideoCurationSet], authors: [currentPubkey], limit: 100 }
    : null
  const { events: playlists, eose: playlistsEose } = useSubscribe(
    playlistsFilter ? [playlistsFilter] : false,
    { closeOnEose: false, cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST },
  )

  // Vídeos curtidos (kind 7 do usuário)
  const likesFilter: NDKFilter | null = currentPubkey
    ? { kinds: [7], authors: [currentPubkey], limit: 100 }
    : null
  const { events: likeEvents } = useSubscribe(
    likesFilter ? [likesFilter] : false,
    { closeOnEose: false, cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST },
  )

  // Resolver IDs dos vídeos curtidos
  const likedVideoIds = useMemo(() => {
    const ids = new Set<string>()
    likeEvents.forEach((ev) => {
      if (ev.content === '+') {
        const eTag = ev.tags.find((t) => t[0] === 'e')
        if (eTag?.[1]) ids.add(eTag[1])
      }
    })
    return [...ids]
  }, [likeEvents])

  // Buscar eventos dos vídeos curtidos
  const likedVideoFilter: NDKFilter = likedVideoIds.length > 0
    ? { ids: likedVideoIds, limit: likedVideoIds.length }
    : { kinds: [], limit: 0 }
  const { events: likedVideos } = useSubscribe(
    likedVideoIds.length > 0 ? [likedVideoFilter] : false,
    { closeOnEose: false, cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST },
  )

  // Perfis
  const allVideoEvents = useMemo(() => [...myVideos, ...likedVideos], [myVideos, likedVideos])
  const profiles = useBatchProfiles(allVideoEvents)

  // Extrair dados de playlist para exibição
  const playlistCards = useMemo(() => {
    return playlists.map((ev) => {
      const title = ev.tagValue('title') || ev.tagValue('name') || 'Playlist sem título'
      const description = ev.tagValue('description') || ''
      const videoCount = ev.tags.filter(isResolvablePlaylistVideoTag).length
      const dTag = ev.tagValue('d') || ev.id
      const listId = ev.tagValue('d') || ev.id
      return { id: ev.id, dTag, listId, title, description, videoCount, event: ev }
    })
  }, [playlists])

  return {
    currentUser,
    currentPubkey,
    watchHistory,
    myVideos,
    myVideosEose,
    playlists: playlistCards,
    playlistsEose,
    likedVideos,
    likedVideoIds,
    profiles,
    isLoading: !myVideosEose || !playlistsEose,
  }
}

// ─── Componente principal ────────────────────────────────
function LibraryPage() {
  const { tab } = Route.useSearch()
  const navigate = Route.useNavigate()
  const { items: watchLaterItems, remove: removeWatchLater } = useWatchLater()
  const {
    currentUser,
    watchHistory,
    myVideos,
    playlists,
    likedVideos,
    profiles,
    isLoading,
  } = useLibraryData()

  const isLoggedIn = !!currentUser
  const activeTab = tab || 'all'
  const activeSidebarKey: SidebarKey = activeTab === 'all' || activeTab === 'downloads' ? 'library' : activeTab

  const setActiveTab = (nextTab: string) => {
    navigate({
      search: (old: { tab?: LibraryTab }) => ({
        ...old,
        tab: nextTab === 'all' ? undefined : (nextTab as LibraryTab),
      }),
    })
  }

  // Coluna direita
  const aside = (
    <>
      {/* Resumo da biblioteca */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo da biblioteca</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Assistir mais tarde</span>
            <span className="font-medium">{watchLaterItems.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Vídeos curtidos</span>
            <span className="font-medium">{likedVideos.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Playlists</span>
            <span className="font-medium">{playlists.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Downloads</span>
            <span className="font-medium">—</span>
          </div>
        </CardContent>
      </Card>

      {/* Playlists */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Playlists</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {playlists.length > 0 ? (
            playlists.slice(0, 5).map((pl) => (
              <Link
                key={pl.id}
                to="/p/$listId"
                params={{ listId: pl.listId }}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              >
                <ListVideo className="size-4 shrink-0" />
                <span className="flex-1 truncate">{pl.title}</span>
                <Badge variant="secondary" className="text-[10px]">{pl.videoCount}</Badge>
              </Link>
            ))
          ) : (
            <p className="text-muted-foreground">Nenhuma playlist ainda.</p>
          )}
          <Link
            to="/p/new"
            className={buttonVariants({ variant: "glass", className: "mt-2 w-full" })}
          >
            <Plus className="mr-2 size-4" />
            Nova playlist
          </Link>
        </CardContent>
      </Card>

      {/* Armazenamento local */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Armazenamento local</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Histórico</span>
            <span className="font-medium text-foreground">{watchHistory.length} itens</span>
          </div>
          <p className="text-xs">
            Dados de navegação salvos localmente. Playlists e curtidas são armazenados na rede Nostr.
          </p>
        </CardContent>
      </Card>

      {/* CTA */}
      {!isLoggedIn && (
        <Card>
          <CardContent className="py-4 text-center text-sm text-muted-foreground">
            Conecte sua chave Nostr para ver seus vídeos, playlists e curtidas.
          </CardContent>
        </Card>
      )}
    </>
  )

  // Loading
  if (isLoading && myVideos.length === 0 && playlists.length === 0) {
    return (
      <AppShell activeKey={activeSidebarKey} title="Biblioteca" description="Tudo o que você salvou, organizou e acompanhou." icon={FolderOpen} aside={aside}>
        <div className="space-y-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {TABS.map((t) => (
              <div key={t.key} className="h-9 w-28 shrink-0 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <VideoCardLoading key={i} />
            ))}
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell activeKey={activeSidebarKey} title="Biblioteca" description="Tudo o que você salvou, organizou e acompanhou." icon={FolderOpen} aside={aside}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b border-border bg-transparent p-0 pb-px scrollbar-thin">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.key}
              value={tab.key}
              className="flex shrink-0 items-center gap-1.5 rounded-none border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground"
            >
              <tab.icon className="size-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Tudo ── */}
        <TabsContent value="all" className="mt-0 space-y-8">
          {/* Seus vídeos recentes */}
          {myVideos.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">Seus vídeos</h3>
                <span className="text-xs text-muted-foreground">{myVideos.length} vídeos</span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {myVideos.slice(0, 4).map((ev) => (
                  <VideoCard key={ev.id} event={ev} profile={profiles[ev.pubkey]} />
                ))}
              </div>
              {myVideos.length > 4 && (
                <button
                  type="button"
                  className="mt-2 inline-flex items-center text-xs font-medium text-primary hover:underline"
                  onClick={() => setActiveTab('myvideos')}
                >
                  Ver todos os {myVideos.length} vídeos <ChevronRight className="ml-1 size-3" />
                </button>
              )}
            </section>
          )}

          {/* Playlists recentes */}
          {playlists.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">Playlists</h3>
                <span className="text-xs text-muted-foreground">{playlists.length} playlists</span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {playlists.slice(0, 3).map((pl) => (
                  <Link
                    key={pl.id}
                    to="/p/$listId"
                    params={{ listId: pl.listId }}
                    className="flex items-center gap-4 rounded-xl border border-border/50 bg-card/50 p-4 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <ListVideo className="size-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{pl.title}</p>
                      <p className="text-xs text-muted-foreground">{pl.videoCount} vídeos</p>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Histórico recente */}
          {watchHistory.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">Histórico recente</h3>
                <span className="text-xs text-muted-foreground">{watchHistory.length} itens</span>
              </div>
              <div className="space-y-2">
                {watchHistory.slice(0, 5).map((entry) => (
                  <Link
                    key={entry.eventId}
                    to="/v/$eventId"
                    params={{ eventId: entry.eventRef }}
                    className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 px-4 py-3 text-sm transition-colors hover:bg-muted/30"
                  >
                    <Clock className="size-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate">{entry.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(entry.watchedAt).toLocaleDateString()}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Empty state */}
           {myVideos.length === 0 && playlists.length === 0 && watchHistory.length === 0 && watchLaterItems.length === 0 && (
             <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 inline-flex size-16 items-center justify-center rounded-full bg-muted">
                <FolderOpen className="size-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Sua biblioteca está vazia</h3>
              <p className="mb-6 max-w-md text-sm text-muted-foreground">
                Vídeos que você enviar, curtir, salvar para assistir mais tarde ou adicionar em playlists aparecerão aqui.
              </p>
              <Link to="/explore" className={buttonVariants({ variant: "gradient" })}>
                Explorar conteúdo
              </Link>
            </div>
          )}
        </TabsContent>

        {/* ── Playlists ── */}
        <TabsContent value="playlists" className="mt-0">
          {playlists.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {playlists.map((pl) => (
                <Link
                  key={pl.id}
                  to="/p/$listId"
                  params={{ listId: pl.listId }}
                  className="flex items-center gap-4 rounded-xl border border-border/50 bg-card/50 p-5 transition-colors hover:bg-muted/30"
                >
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <ListVideo className="size-7 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{pl.title}</p>
                    {pl.description && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{pl.description}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">{pl.videoCount} vídeos</p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={ListVideo}
              title="Nenhuma playlist"
              description="Crie playlists para organizar seus vídeos favoritos."
              cta="Criar playlist"
              ctaTo="/p/new"
            />
          )}
          <div className="mt-4">
            <Link to="/p/new" className={buttonVariants({ variant: "glass" })}>
              <Plus className="mr-2 size-4" />
              Nova playlist
            </Link>
          </div>
        </TabsContent>

        {/* ── Vídeos curtidos ── */}
        <TabsContent value="liked" className="mt-0">
          {likedVideos.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {likedVideos.map((ev) => (
                <VideoCard key={ev.id} event={ev} profile={profiles[ev.pubkey]} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Heart}
              title="Nenhum vídeo curtido"
              description="Curtidas aparecerão aqui quando você curtir vídeos."
              cta="Explorar vídeos"
              ctaTo="/explore"
            />
          )}
        </TabsContent>

         {/* ── Assistir mais tarde ── */}
        <TabsContent value="watchlater" className="mt-0">
          {watchLaterItems.length > 0 ? (
            <div className="space-y-3">
              {watchLaterItems.map((item) => (
                <div key={item.eventId} className="flex items-center gap-4 rounded-xl border border-border/50 bg-card/50 p-4 transition-colors hover:bg-muted/30">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.title} className="aspect-video w-36 rounded-lg border object-cover" />
                  ) : (
                    <div className="flex aspect-video w-36 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
                      Sem thumbnail
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <Link to="/v/$eventId" params={{ eventId: item.eventRef }} className="line-clamp-2 text-sm font-medium hover:text-primary">
                      {item.title}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">Salvo em {new Date(item.savedAt).toLocaleString()}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link to="/v/$eventId" params={{ eventId: item.eventRef }} className={buttonVariants({ variant: 'glass' })}>Assistir</Link>
                    <Button variant="ghost" size="icon" onClick={() => removeWatchLater(item.eventId)} aria-label="Remover de assistir mais tarde">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Bookmark}
              title="Assistir mais tarde"
              description="Salve vídeos pelo menu de ações para montar sua fila pessoal."
              cta="Explorar vídeos"
              ctaTo="/explore"
            />
          )}
        </TabsContent>

        {/* ── Histórico ── */}
        <TabsContent value="history" className="mt-0">
          {watchHistory.length > 0 ? (
            <div className="space-y-2">
              {watchHistory.map((entry) => (
                <Link
                  key={entry.eventId}
                  to="/v/$eventId"
                  params={{ eventId: entry.eventRef }}
                  className="flex items-center gap-4 rounded-xl border border-border/50 bg-card/50 px-4 py-3 transition-colors hover:bg-muted/30"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <PlaySquare className="size-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{entry.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.watchedAt).toLocaleString()}
                    </p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={History}
              title="Nenhum histórico"
              description="Vídeos que você assistir aparecerão aqui."
              cta="Explorar vídeos"
              ctaTo="/explore"
            />
          )}
        </TabsContent>

        {/* ── Seus vídeos ── */}
        <TabsContent value="myvideos" className="mt-0">
          {myVideos.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {myVideos.map((ev) => (
                <VideoCard key={ev.id} event={ev} profile={profiles[ev.pubkey]} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={UserRound}
              title={isLoggedIn ? 'Nenhum vídeo enviado' : 'Faça login para ver seus vídeos'}
              description={isLoggedIn ? 'Vídeos que você enviar aparecerão aqui.' : 'Conecte sua chave Nostr para gerenciar seus vídeos.'}
              cta={isLoggedIn ? 'Enviar vídeo' : undefined}
              ctaTo={isLoggedIn ? '/new' : undefined}
            />
          )}
        </TabsContent>

        {/* ── Downloads ── */}
        <TabsContent value="downloads" className="mt-0">
          <EmptyState
            icon={Download}
            title="Downloads"
            description="Downloads offline estarão disponíveis em breve. Por enquanto, você pode usar o menu de cada vídeo para baixar individualmente."
          />
        </TabsContent>
      </Tabs>
    </AppShell>
  )
}

// ─── Empty State ─────────────────────────────────────────
function EmptyState({
  icon: Icon,
  title,
  description,
  cta,
  ctaTo,
}: {
  icon: typeof FolderOpen
  title: string
  description: string
  cta?: string
  ctaTo?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 inline-flex size-16 items-center justify-center rounded-full bg-muted">
        <Icon className="size-8 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="mb-6 max-w-md text-sm text-muted-foreground">{description}</p>
      {cta && ctaTo && (
        <Link to={ctaTo} className={buttonVariants({ variant: "gradient" })}>
          {cta}
        </Link>
      )}
    </div>
  )
}
