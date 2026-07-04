import { type NDKEvent, NDKKind } from '@nostr-dev-kit/ndk'
import { useNDK, useNDKCurrentUser } from '@nostr-dev-kit/ndk-hooks'
import { createRoute, useNavigate } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ButtonWithLoader } from '@/components/ButtonWithLoader'
import { Image } from '@/components/Image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { applyDraftToImeta, extractEditableVideoDraft } from '@/features/upload/services/editable-video-draft.service'
import { buildAddressableVideoEvent } from '@/features/upload/services/video-event-builder.service'
import { getVideoRouteReference } from '@/features/video/services/video-reference.service'
import { nostrNow } from '@/helper/date'
import { geVideoByEventIdData } from '@/helper/loaders/geVideoByEventIdData'
import { makeEvent } from '@/helper/pow/pow'
import { Route as rootRoute } from '@/routes/__root'
import { AddTagInput } from '@/routes/new/@components/BoxAddToModal'
import { ButtonUploadThumb } from '@/routes/new/@components/ButtonUploadThumb'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/v/$eventId/edit',
  loader: ({ params: { eventId }, context: { ndk } }) => geVideoByEventIdData({ eventId, ndk }),
  component: VideoEditRoute,
})

function VideoEditRoute() {
  const navigate = useNavigate()
  const { ndk } = useNDK()
  const currentUser = useNDKCurrentUser()
  const event = Route.useLoaderData() as NDKEvent
  const initialDraft = useMemo(() => extractEditableVideoDraft(event), [event])

  const [title, setTitle] = useState(initialDraft.title || '')
  const [summary, setSummary] = useState(initialDraft.summary || '')
  const [url, setUrl] = useState(initialDraft.url || '')
  const [thumbnail, setThumbnail] = useState(initialDraft.thumbnail || '')
  const [contentWarning, setContentWarning] = useState(initialDraft.contentWarning || '')
  const [hashtags, setHashtags] = useState(initialDraft.hashtags || [])
  const [indexers, setIndexers] = useState(initialDraft.indexers || [])
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  const isOwner = Boolean(currentUser && currentUser.pubkey === event.pubkey)

  if (!isOwner) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h1 className="text-xl font-semibold">Acesso restrito</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Somente o autor do evento pode editar ou excluir este vídeo.
          </p>
        </div>
      </div>
    )
  }

  const handleSave = async () => {
    if (!ndk || !currentUser) return
    setIsSaving(true)
    try {
      const draft = {
        ...initialDraft,
        title,
        summary,
        url,
        thumbnail,
        contentWarning,
        hashtags,
        indexers,
        imetaVariants: applyDraftToImeta({ ...initialDraft, url, thumbnail }) as never,
      }

      const nextEvent = buildAddressableVideoEvent({
        draft,
        currentPubkey: currentUser.pubkey,
        identifier: initialDraft.identifier,
      })

      const signedEvent = await makeEvent({
        ndk,
        difficulty: Number(import.meta.env.VITE_MIN_VIDEO_POW ?? 16),
        event: {
          ...nextEvent,
          created_at: nostrNow(),
        },
      })

      await signedEvent.publishReplaceable()
      toast.success('Vídeo atualizado com sucesso.')
      await navigate({ to: '/v/$eventId', params: { eventId: getVideoRouteReference(signedEvent) } })
    } catch (error) {
      console.error(error)
      toast.error('Falha ao atualizar o vídeo.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!ndk || !currentUser || deleteConfirmation !== 'DELETAR') return
    setIsDeleting(true)
    try {
      const deletionEvent = await makeEvent({
        ndk,
        difficulty: Number(import.meta.env.VITE_MIN_VIDEO_POW ?? 16),
        event: {
          kind: NDKKind.EventDeletion,
          created_at: nostrNow(),
          pubkey: currentUser.pubkey,
          content: 'Video removed by author',
          tags: [['e', event.id]],
        },
      })
      await deletionEvent.publish()
      toast.success('Vídeo excluído com sucesso.')
      await navigate({ to: '/u/$userId', params: { userId: currentUser.npub! } })
    } catch (error) {
      console.error(error)
      toast.error('Falha ao excluir o vídeo.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">Editando evento {event.id}</p>
        <h1 className="mt-1 text-2xl font-semibold">Editar vídeo</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="summary">Descrição</Label>
            <Textarea
              id="summary"
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              className="min-h-[140px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="url">URL do vídeo</Label>
            <Input id="url" value={url} onChange={(event) => setUrl(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content-warning">Content warning</Label>
            <Textarea
              id="content-warning"
              value={contentWarning}
              onChange={(event) => setContentWarning(event.target.value)}
              className="min-h-[80px]"
            />
          </div>
          <AddTagInput
            initialTags={hashtags}
            onTagsChange={setHashtags}
            label="Hashtags"
            placeholder="Ex: Nostr, Bitcoin"
          />
          <AddTagInput
            initialTags={indexers}
            onTagsChange={setIndexers}
            label="Indexers"
            placeholder="Ex: imdb:tt12345"
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => navigate({ to: '/v/$eventId', params: { eventId: getVideoRouteReference(event) } })}
            >
              Cancelar
            </Button>
            <ButtonWithLoader isLoading={isSaving} onClick={handleSave}>
              Salvar alterações
            </ButtonWithLoader>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <p className="mb-3 text-sm font-medium">Thumbnail</p>
            {thumbnail ? (
              <Image
                src={thumbnail}
                alt="Thumbnail"
                width={288}
                className="aspect-video w-full rounded-lg border object-cover"
              />
            ) : null}
            <div className="mt-4">
              <ButtonUploadThumb
                setUrl={(nextUrl) => nextUrl && setThumbnail(nextUrl)}
                url={thumbnail}
                accept={{ 'image/*': [] }}
              >
                <Button variant="outline" className="w-full">
                  Alterar thumbnail
                </Button>
              </ButtonUploadThumb>
            </div>
          </div>

          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-destructive">Remover vídeo da rede</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Digite <strong>DELETAR</strong> para confirmar que esta ação é irreversível.
            </p>
            <Input
              className="mt-4"
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
              placeholder="DELETAR"
            />
            <ButtonWithLoader
              className="mt-4 w-full"
              variant="destructive"
              isLoading={isDeleting}
              disabled={deleteConfirmation !== 'DELETAR'}
              onClick={handleDelete}
            >
              Excluir vídeo permanentemente
            </ButtonWithLoader>
          </div>
        </div>
      </div>
    </div>
  )
}
