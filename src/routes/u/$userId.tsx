import { createFileRoute, Link, useLoaderData, useParams } from "@tanstack/react-router";
import { NDKKind } from "@nostr-dev-kit/ndk";
import { NDKEvent, type NDKUserProfile, useNDK, useNDKCurrentUser } from "@nostr-dev-kit/ndk-hooks";
import { PageSpinner } from "@/components/PageSpinner";
import { getVideosFromUserData, type GetVideosFromUserDataParams } from "@/helper/loaders/getVideosFromUserData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Grid, Info, List, PlaySquare, Wrench } from "lucide-react";
import { useMemo } from "react";
import useUserStore from "@/store/useUserStore";
import { filterEventsByAge } from "@/features/video/services/age-filter.service";

import CreateProfile from "./@components/EditProfile.tsx";
import { Card } from "@/components/ui/card.tsx";
import { FollowButton } from "@/routes/u/@components/FollowButton.tsx";
import { VideoCard } from "@/routes/u/@components/VideoCard.tsx";
import { DropdownMenuProfile } from "@/routes/u/@components/DropdownMenuProfile.tsx";
import { PlaylistCard } from "@/routes/u/@components/PlaylistCard.tsx";
import { nip19 } from "nostr-tools";
import { z } from "zod"; // Extraído para arquivo separado
import { VIDEO_EVENT_KINDS } from "@/features/video/services/video-kinds";
import { useQuery } from "@tanstack/react-query";
import { TECHNICAL_REPORT_KIND } from "@/helper/actions/report";

export const ProfilePageSchema = z.object({
  tab: z.enum(["videos", "playlists", "about", "alerts"]).optional()

});
export const Route = createFileRoute("/u/$userId")({
  component: ProfilePage,
  loader: ({ params: { userId }, context: { ndk } }) => getVideosFromUserData({
    userId,
    ndk
  } as GetVideosFromUserDataParams),
  pendingComponent: PageSpinner,
  notFoundComponent: NotFoundPage,
  // aceita parametros search para tab
  validateSearch: ProfilePageSchema
});

function NotFoundPage() {
  const { userId } = useParams({ strict: false });
  const currentUser = useNDKCurrentUser();
  const npub = currentUser?.npub!;
  const pubkey = currentUser?.pubkey!;

  if (currentUser && npub == userId || pubkey == userId) {
    return <CreateProfile />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
      <h1 className="text-3xl font-bold mb-4">Perfil não encontrado</h1>
      <p className="text-muted-foreground">O usuário que você está procurando não existe ou não tem vídeos
        publicados.</p>
    </div>
  );
}

function ProfilePage() {
  const events = useLoaderData({ from: "/u/$userId" }) as Set<NDKEvent>;
  const currentUser = useNDKCurrentUser();
  const { ndk } = useNDK();
  const { userId } = Route.useParams();
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();


  // Processamento de Dados
  const metaEvent = [...events].find(e => e.kind === NDKKind.Metadata);
  const userProfile = metaEvent ? JSON.parse(metaEvent.content) as NDKUserProfile : null;

  // Separação de eventos por tipo
  const rawVideos = [...events].filter(e => VIDEO_EVENT_KINDS.includes(e.kind as number));
  const agePref = useUserStore((state) => state.session?.age);
  const videos = useMemo(() => filterEventsByAge(rawVideos, agePref), [rawVideos, agePref]);
  // Mock de playlists (assumindo que o loader traria Kind 30001 também)
  const playlists = [...events].filter(e => e.kind === NDKKind.VideoCurationSet);
  const isOwner = Boolean(currentUser && (currentUser.npub === userId || currentUser.pubkey === userId));

  // if (!userProfile) throw notFound();

  // Função auxiliar para iniciais do avatar
  const getInitials = (name: string) => name?.slice(0, 2).toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* --- Header Section --- */}
      <div className="relative">
        {/* Banner */}
        <div className="w-full h-48 md:h-64 lg:h-80 bg-muted overflow-hidden relative">
          {userProfile?.banner ? (
            <img
              src={userProfile?.banner}
              alt="Banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-gray-800 to-gray-900" />
          )}
        </div>

        {/* Profile Info Bar */}
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start md:items-end -mt-16 md:-mt-10 mb-6 gap-6 relative z-10">

            {/* Avatar */}
            <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-background shadow-xl">
              <AvatarImage src={userProfile?.picture} alt={userProfile?.name} className="object-cover" />
              <AvatarFallback className="text-4xl font-bold bg-secondary">
                {getInitials(userProfile?.name || "")}
              </AvatarFallback>
            </Avatar>

            {/* Info Text */}
            <div className="flex-1 mt-2 md:mt-0 md:mb-4">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{userProfile?.name || "Unknown User"}</h1>
                {userProfile?.nip05 && (
                  <Badge variant="secondary" className="text-xs font-normal">
                    nip05 verified
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground font-mono text-sm mt-1">
                {userProfile?.nip05 || ""}
              </p>

              {/* Stats Row (Mocked numbers for demo) */}
              <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><strong className="text-foreground">{videos.length}</strong> Videos</span>
                {/* Nota: Seguidores reais requerem uma query complexa ou indexador */}
                <span className="flex items-center gap-1"><strong
                  className="text-foreground">--</strong> Seguidores</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 mb-4 w-full md:w-auto">
              <FollowButton pubkey={metaEvent?.pubkey!} currentUser={currentUser!} />
              <DropdownMenuProfile currentUser={currentUser!} events={Array.from(events)} />
            </div>
          </div>

          {/* Bio Mobile/Desktop */}
          {userProfile?.about && (
            <div className="mb-8 max-w-3xl">
              <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap text-muted-foreground">
                {userProfile?.about}
              </p>
            </div>
          )}
        </div>
      </div>

      <Separator className="mb-6" />

      {/* --- Content Tabs --- */}
      <div className="container mx-auto px-4">
        <Tabs defaultValue={tab || "videos"} className="w-full">
          <TabsList
            className="w-full justify-start h-auto p-0 bg-transparent border-b border-border mb-8 rounded-none gap-6">
            <TabsTrigger
              onClick={() => {
                navigate({
                  search: (old) => ({ ...old, tab: undefined })
                });
              }}
              value="videos"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 font-medium text-muted-foreground data-[state=active]:text-foreground transition-all"
            >
              <Grid className="w-4 h-4 mr-2" />
              Vídeos
            </TabsTrigger>
            <TabsTrigger
              value="playlists"
              onClick={() => {
                navigate({
                  search: (old) => ({ ...old, tab: "playlists" })
                });
              }}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 font-medium text-muted-foreground data-[state=active]:text-foreground transition-all"
            >
              <PlaySquare className="w-4 h-4 mr-2" />
              Playlists
            </TabsTrigger>
            <TabsTrigger
              value="about"
              onClick={() => {
                navigate({
                  search: (old) => ({ ...old, tab: "about" })
                });
              }}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 font-medium text-muted-foreground data-[state=active]:text-foreground transition-all"
            >
              <Info className="w-4 h-4 mr-2" />
              Sobre
            </TabsTrigger>
            {isOwner ? (
              <TabsTrigger
                value="alerts"
                onClick={() => {
                  navigate({
                    search: (old) => ({ ...old, tab: "alerts" })
                  });
                }}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 font-medium text-muted-foreground data-[state=active]:text-foreground transition-all"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Alertas
              </TabsTrigger>
            ) : null}
          </TabsList>

          {/* Videos Grid */}
          <TabsContent value="videos" className="mt-0">
            {videos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {videos.map(video => (
                  <VideoCard key={video.id} event={video} />
                ))}
              </div>
            ) : (
              <EmptyState label="Nenhum vídeo publicado ainda." />
            )}
          </TabsContent>

          {/* Playlists Grid */}
          <TabsContent value="playlists" className="mt-0">
            {/*// Uma faixa contendo a contagem de playlists a esquerda por extendo e a direita um botão de criar playlist se for o usuário atual*/}
            <div className="flex items-center justify-between mb-6 h-2">
              <h2 className="text-lg font-semibold">
                Playlists ({playlists.length})
              </h2>
              {currentUser && (currentUser.npub === userId || currentUser.pubkey === userId) && (
                <Link
                  to="/p/new"
                  className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Criar Nova Playlist
                </Link>
              )}


            </div>
            {playlists.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {playlists.map((playlistEvent) => (
                  <PlaylistCard key={playlistEvent.id} event={playlistEvent} />
                ))}
              </div>
            ) : (
              <EmptyState label="Nenhuma playlist criada por este usuário." />
            )}
          </TabsContent>

          {/* About Section */}
          <TabsContent value="about" className="mt-0">
            <Card>
              <div className="p-6 space-y-4">
                <h3 className="font-bold text-lg">Detalhes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block">Entrou em</span>
                    {/* Assumindo que o metadados tenha created_at, se não usar profile event created_at */}
                    <span>{new Date(metaEvent?.created_at! * 1000)?.toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Chave Pública (Hex)</span>
                    <span
                      className="font-mono text-xs break-all">{metaEvent?.pubkey || nip19.decode(userId!)?.data as string}</span>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
          {isOwner ? (
            <TabsContent value="alerts" className="mt-0">
              <AuthorAlertsPanel ndkReady={Boolean(ndk)} ownerPubkey={metaEvent?.pubkey || currentUser?.pubkey || ""} videos={videos} />
            </TabsContent>
          ) : null}
        </Tabs>
      </div>
    </div>
  );
}

function AuthorAlertsPanel({ ownerPubkey, videos, ndkReady }: { ownerPubkey: string; videos: NDKEvent[]; ndkReady: boolean }) {
  const { ndk } = useNDK();
  const videoIds = videos.map((video) => video.id);
  const videoMap = new Map(videos.map((video) => [video.id, video]));

  const alertsQuery = useQuery({
    queryKey: ["author-alerts", ownerPubkey, videoIds],
    enabled: Boolean(ndkReady && ndk && ownerPubkey && videoIds.length > 0),
    queryFn: async () => {
      const reportEvents = await ndk!.fetchEvents([
        { kinds: [NDKKind.Report], "#e": videoIds },
        { kinds: [TECHNICAL_REPORT_KIND as never], "#p": [ownerPubkey] }
      ]);
      return Array.from(reportEvents);
    }
  });

  const technicalAlerts = alertsQuery.data?.filter((event) => event.kind === TECHNICAL_REPORT_KIND) ?? [];
  const communityAlerts = alertsQuery.data?.filter((event) => event.kind === NDKKind.Report) ?? [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="p-5">
            <div className="flex items-center gap-2 text-amber-600">
              <Wrench className="h-4 w-4" />
              <p className="text-sm font-medium">Problemas técnicos</p>
            </div>
            <p className="mt-2 text-2xl font-semibold">{technicalAlerts.length}</p>
          </div>
        </Card>
        <Card>
          <div className="p-5">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <p className="text-sm font-medium">Sinalizações da comunidade</p>
            </div>
            <p className="mt-2 text-2xl font-semibold">{communityAlerts.length}</p>
          </div>
        </Card>
      </div>

      {alertsQuery.isLoading ? <PageSpinner /> : null}

      {!alertsQuery.isLoading && alertsQuery.data?.length === 0 ? (
        <EmptyState label="Nenhum alerta encontrado para seus vídeos." />
      ) : null}

      <div className="space-y-4">
        {communityAlerts.map((alert) => {
          const targetId = alert.tags.find((tag) => tag[0] === "e")?.[1] || "";
          const targetVideo = videoMap.get(targetId);
          return (
            <Card key={alert.id}>
              <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-red-600">Sinalização da comunidade</p>
                  <p className="mt-1 font-medium">{targetVideo?.tagValue("title") || "Vídeo sem título"}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Categoria: {alert.tags.find((tag) => tag[0] === "l")?.[1] || alert.tags.find((tag) => tag[0] === "e")?.[2] || "other"}</p>
                </div>
                <Button asChild>
                  <Link to="/v/$eventId/edit" params={{ eventId: targetVideo?.encode() || targetId }}>Ajustar metadados</Link>
                </Button>
              </div>
            </Card>
          );
        })}

        {technicalAlerts.map((alert) => {
          const targetId = alert.tags.find((tag) => tag[0] === "e")?.[1] || "";
          const targetVideo = videoMap.get(targetId);
          return (
            <Card key={alert.id}>
              <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-amber-600">Problema técnico</p>
                  <p className="mt-1 font-medium">{targetVideo?.tagValue("title") || "Vídeo sem título"}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Tipo: {alert.tags.find((tag) => tag[0] === "type")?.[1] || "other"}</p>
                </div>
                <Button asChild>
                  <Link to="/v/$eventId/edit" params={{ eventId: targetVideo?.encode() || targetId }}>Corrigir link / URL</Link>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// Pequeno helper para estado vazio
function EmptyState({ label }: { label: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
      <List className="w-12 h-12 mb-4 opacity-20" />
      <p>{label}</p>
    </div>
  );
}
