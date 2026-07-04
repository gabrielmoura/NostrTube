import { useNDKCurrentPubkey } from '@nostr-dev-kit/ndk-hooks'
import { createRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, ListVideo, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { AuthModal } from '@/components/AuthModal'
import { AppShell } from '@/components/layout/AppShell'
import { modal } from '@/components/modal_v2/modal-manager'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Route as rootRoute } from '@/routes/__root'
import { PlaylistForm } from './@playlist/playlist-form.tsx'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/p/new',
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const pubkey = useNDKCurrentPubkey()

  const handleSuccess = (listId: string) => {
    toast.success('Playlist criada com sucesso! (Redirecionando...)')
    navigate({
      to: '/p/$listId',
      params: { listId },
    })
  }

  if (!pubkey) {
    return (
      <AppShell
        activeKey="playlists"
        title="Nova playlist"
        description="Crie coleções públicas de vídeos no Nostr."
        icon={ListVideo}
      >
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <LogIn className="size-5 text-primary" />
              <CardTitle className="text-base">Entre para criar playlists</CardTitle>
            </div>
            <CardDescription>
              Playlists são publicadas como eventos Nostr e precisam de uma sessão ativa.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Button variant="gradient" onClick={() => modal.show(<AuthModal />, { id: 'auth' })}>
              Entrar
            </Button>
            <Button variant="glass" onClick={() => navigate({ to: '/library', search: { tab: 'playlists' } as never })}>
              Ver playlists
            </Button>
          </CardContent>
        </Card>
      </AppShell>
    )
  }

  return (
    <AppShell
      activeKey="playlists"
      title="Nova playlist"
      description="Organize vídeos em uma coleção pública da rede Nostr."
      icon={ListVideo}
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <Button variant="glass" onClick={() => window.history.back()}>
          <ArrowLeft className="size-4" />
          Voltar
        </Button>

        <PlaylistForm onSuccess={handleSuccess} />
      </div>
    </AppShell>
  )
}
