import { useNDK, useNDKCurrentUser } from '@nostr-dev-kit/ndk-hooks'
import { createFileRoute } from '@tanstack/react-router'
import { Mail, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { AuthModal } from '@/components/AuthModal.tsx'
import { modal } from '@/components/modal_v2/modal-manager.ts'
import { publishDmRelayList } from '@/lib/ndk-messages'
import { BlossomSettings } from '@/routes/configuration/@components/BlossomSettings.tsx'
import { Button, Card, CardContent, CardHeader } from '@/routes/configuration/@components/CommonComponents.tsx'
import { PermissionSettings } from '@/routes/configuration/@components/PermissionSettings.tsx'
import { RelaySettings } from '@/routes/configuration/@components/RelaySettings.tsx'
import { VisibilitySettings } from '@/routes/configuration/@components/VisibilitySettings.tsx'
import useUserStore from '@/store/useUserStore.ts'

export const Route = createFileRoute('/configuration/')({
  component: RouteComponent,
})

function RouteComponent() {
  const currentUser = useNDKCurrentUser()
  const { ndk } = useNDK()
  const selectedRelays = useUserStore((state) => state.session?.relays) ?? import.meta.env.VITE_NOSTR_RELAYS ?? []

  if (!currentUser) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Card>
          <CardHeader
            title="Configurações"
            description="Entre primeiro para gerenciar relays, mídia e permissões locais."
            icon={Settings2}
          />
          <CardContent className="space-y-4">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Esta área depende da sua sessão Nostr ativa para publicar preferências de DM e aplicar ajustes no cliente.
            </p>
            <Button onClick={() => modal.show(<AuthModal />, { id: 'auth' })}>Fazer login</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handlePublishDmRelays = async () => {
    if (!ndk) {
      toast.error('NDK ainda não está pronto.')
      return
    }

    try {
      await publishDmRelayList(ndk, selectedRelays)
      toast.success('Lista de relays de DM publicada com sucesso.')
    } catch (error) {
      console.error(error)
      toast.error('Falha ao publicar a lista de relays de DM.')
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 text-zinc-900 dark:text-zinc-100 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
          Gerencie relays, mídia e preferências locais. As seleções abaixo são aplicadas imediatamente no cliente.
        </p>
      </div>

      <div className="space-y-6">
        <BlossomSettings />
        <PermissionSettings />
        <RelaySettings />
        <VisibilitySettings />
      </div>

      <Card>
        <CardHeader
          title="Mensagens privadas Nostr"
          description="Publique a sua lista de relays preferidos para DM usando @nostr-dev-kit/messages e NIP-17."
          icon={Mail}
        />
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Isso ajuda outros clientes a descobrir onde entregar mensagens privadas para a sua conta.
          </p>
          <Button onClick={handlePublishDmRelays}>Publicar relays de DM</Button>
        </CardContent>
      </Card>
    </div>
  )
}
