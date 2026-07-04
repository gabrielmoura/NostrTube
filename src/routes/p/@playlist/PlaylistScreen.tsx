import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { NDKEvent } from '@nostr-dev-kit/ndk'
import { useNDK, useNDKCurrentPubkey } from '@nostr-dev-kit/ndk-hooks'
import { useNavigate, useParams } from '@tanstack/react-router'
import { ListVideo, Loader2, Pencil, PlayCircle, Save, Trash } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AppShell } from '@/components/layout/AppShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { playlistApi } from './api'
import { EditPlaylistModal } from './EditPlaylistModal'
import { PlaylistItem } from './PlaylistItem'
import { type Playlist } from './types'

export default function PlaylistScreen() {
  const { listId } = useParams({ strict: false })
  const [loading, setLoading] = useState(true)
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [originalPlaylist, setOriginalPlaylist] = useState<Playlist | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [metaEvent, setMetaEvent] = useState<NDKEvent>()
  const { ndk } = useNDK()
  const navigate = useNavigate()
  const pubkey = useNDKCurrentPubkey()
  const isOwner = Boolean(pubkey && playlist?.ownerPubkey === pubkey)

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Initial Load
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await playlistApi.fetchPlaylist(ndk!, listId)
        setPlaylist(data.playlist)
        setOriginalPlaylist(JSON.parse(JSON.stringify(data.playlist))) // Deep copy for comparison
        setMetaEvent(data.metaEvent)
      } catch (error) {
        console.error('Erro ao carregar playlist', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [listId, ndk])

  // Computed: Is Dirty?
  const isDirty = JSON.stringify(playlist) !== JSON.stringify(originalPlaylist)

  // Handlers
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!playlist || !over || active.id === over.id) return

    setPlaylist((prev) => {
      if (!prev) return null
      const oldIndex = prev.items.findIndex((item) => item.id === active.id)
      const newIndex = prev.items.findIndex((item) => item.id === over.id)

      return {
        ...prev,
        items: arrayMove(prev.items, oldIndex, newIndex),
      }
    })
  }

  const handleRemoveItem = (itemId: string) => {
    if (!playlist || !isOwner) return
    setPlaylist({
      ...playlist,
      items: playlist.items.filter((i) => i.id !== itemId),
    })
  }

  const handleUpdateMeta = (meta: Partial<Playlist>) => {
    if (!playlist) return
    setPlaylist({ ...playlist, ...meta })
  }

  const handlePlayVideo = (id: string) => {
    navigate({
      to: '/v/$eventId',
      params: { eventId: id },
    })
  }

  const handleSaveChanges = async () => {
    if (!playlist || !metaEvent || !isOwner) return
    setIsSaving(true)
    try {
      const nextEvent = await playlistApi.savePlaylist(metaEvent, playlist)
      setMetaEvent(nextEvent)
      setOriginalPlaylist(JSON.parse(JSON.stringify(playlist)))
      toast.success('Playlist atualizada. A nova ordem ja esta refletida na interface.')
    } catch (error) {
      console.error('Erro ao salvar', error)
      toast.error('Nao foi possivel salvar a playlist.')
      setPlaylist(originalPlaylist ? JSON.parse(JSON.stringify(originalPlaylist)) : null)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteEvent = () =>
    toast.promise(playlistApi.deletePlaylist(metaEvent!), {
      success: () => {
        navigate({
          to: '/u/$userId',
          params: { userId: pubkey! },
        })
        return 'Deletado com sucesso'
      },
      error: (e) => {
        console.error('Deletion Fail', e)
        return 'Deletion Fail'
      },
    })

  if (loading) {
    return (
      <AppShell activeKey="playlists" title="Playlist" description="Carregando playlist." icon={ListVideo}>
        <div className="mx-auto max-w-4xl space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </AppShell>
    )
  }

  if (!playlist) {
    return (
      <AppShell
        activeKey="playlists"
        title="Playlist não encontrada"
        description="Não foi possível carregar esta playlist."
        icon={ListVideo}
      >
        <Card className="mx-auto max-w-3xl p-10 text-center text-muted-foreground">Playlist não encontrada.</Card>
      </AppShell>
    )
  }

  return (
    <AppShell
      activeKey="playlists"
      title="Playlist"
      description="Assista e organize vídeos em sequência."
      icon={ListVideo}
      className="pb-24"
    >
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-2xl border border-border/70 bg-card/70 p-5 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <div className="aspect-video w-full flex-shrink-0 overflow-hidden rounded-xl bg-muted shadow-sm md:aspect-square md:w-48">
              {playlist.coverImage ? (
                <img src={playlist.coverImage} alt={playlist.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-secondary/70">
                  <PlayCircle size={32} />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">Playlist</Badge>
                    {!isOwner ? <Badge variant="outline">Somente visualização</Badge> : null}
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight">{playlist.name}</h1>
                  {playlist.description ? (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{playlist.description}</p>
                  ) : null}
                </div>

                {isOwner ? (
                  <div className="flex shrink-0 gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteEvent()}>
                      <Trash className="w-4 h-4 mr-2" />
                      Deletar
                    </Button>
                  </div>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span>{playlist.items.length} vídeos</span>
                <span>Criado por {playlist.ownerPubkey.substring(0, 8)}...</span>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={playlist.items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              {playlist.items.map((item) => (
                <PlaylistItem
                  key={item.id}
                  item={item}
                  onRemove={handleRemoveItem}
                  onPlay={(id) => handlePlayVideo(id)}
                  canEdit={isOwner}
                />
              ))}
            </SortableContext>
          </DndContext>

          {playlist.items.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed py-10 text-center text-muted-foreground">
              {isOwner ? 'Playlist vazia. Adicione vídeos.' : 'Esta playlist ainda não tem vídeos.'}
            </div>
          )}
        </section>
      </div>

      {/* Floating Save Button - Left Fixed */}
      {isDirty && isOwner && (
        <div className="fixed bottom-6 left-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <Button
            size="lg"
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="shadow-xl rounded-full px-6 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      )}

      {/* Edit Modal */}
      <EditPlaylistModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        playlist={playlist}
        onSave={handleUpdateMeta}
      />
    </AppShell>
  )
}
