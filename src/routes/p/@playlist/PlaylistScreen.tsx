import { useEffect, useState } from "react";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { Loader2, Pencil, PlayCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { type Playlist } from "./types";
import { playlistApi } from "./api";
import { PlaylistItem } from "./PlaylistItem";
import { EditPlaylistModal } from "./EditPlaylistModal";
import { useParams } from "@tanstack/react-router";
import { useNDK } from "@nostr-dev-kit/ndk-hooks";
import type { NDKEvent } from "@nostr-dev-kit/ndk";

export default function PlaylistScreen() {
  const { listId } = useParams({ strict: false });
  const [loading, setLoading] = useState(true);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [originalPlaylist, setOriginalPlaylist] = useState<Playlist | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [metaEvent, setMetaEvent] = useState<NDKEvent>();
  const { ndk } = useNDK();

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  // Initial Load
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await playlistApi.fetchPlaylist(ndk!, listId);
        setPlaylist(data.playlist);
        setOriginalPlaylist(JSON.parse(JSON.stringify(data.playlist))); // Deep copy for comparison
        setMetaEvent(data.metaEvent);
      } catch (error) {
        console.error("Erro ao carregar playlist", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [listId, ndk]);

  // Computed: Is Dirty?
  const isDirty = JSON.stringify(playlist) !== JSON.stringify(originalPlaylist);

  // Handlers
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!playlist || !over || active.id === over.id) return;

    setPlaylist((prev) => {
      if (!prev) return null;
      const oldIndex = prev.items.findIndex((item) => item.id === active.id);
      const newIndex = prev.items.findIndex((item) => item.id === over.id);

      return {
        ...prev,
        items: arrayMove(prev.items, oldIndex, newIndex)
      };
    });
  };

  const handleRemoveItem = (itemId: string) => {
    if (!playlist) return;
    setPlaylist({
      ...playlist,
      items: playlist.items.filter(i => i.id !== itemId)
    });
  };

  const handleUpdateMeta = (meta: Partial<Playlist>) => {
    if (!playlist) return;
    setPlaylist({ ...playlist, ...meta });
  };

  const handlePlayVideo = (id: string) => {
    console.log(`Navegar para player com ID: ${id}`);
    // router.push(`/watch/${id}`);
  };

  const handleSaveChanges = async () => {
    if (!playlist) return;
    setIsSaving(true);
    try {
      await playlistApi.savePlaylist(metaEvent!, playlist);
      setOriginalPlaylist(JSON.parse(JSON.stringify(playlist))); // Reset dirty state
    } catch (error) {
      console.error("Erro ao salvar", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container max-w-3xl mx-auto p-4 space-y-4">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!playlist) return <div className="p-10 text-center">Playlist não encontrada.</div>;

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Header Section */}
      <div className="bg-muted/30 border-b mb-6">
        <div className="container max-w-3xl mx-auto p-6 flex flex-col md:flex-row gap-6 items-start">
          {/* Cover Image */}
          <div
            className="w-full md:w-48 aspect-video md:aspect-square rounded-lg overflow-hidden shadow-md bg-muted flex-shrink-0">
            {playlist.coverImage ? (
              <img src={playlist.coverImage} alt={playlist.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-800"><PlayCircle size={32} /></div>
            )}
          </div>

          {/* Metadata */}
          <div className="flex-1 space-y-2 w-full">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold">{playlist.name}</h1>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {playlist.description}
                </p>
                <div className="mt-4 text-xs text-muted-foreground flex gap-4">
                  <span>{playlist.items.length} vídeos</span>
                  <span>Criado por {playlist.ownerPubkey.substring(0, 8)}...</span>
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
                <Pencil className="w-4 h-4 mr-2" />
                Editar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* List Section */}
      <div className="container max-w-3xl mx-auto px-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={playlist.items.map(i => i.id)}
            strategy={verticalListSortingStrategy}
          >
            {playlist.items.map((item) => (
              <PlaylistItem
                key={item.id}
                item={item}
                onRemove={handleRemoveItem}
                onPlay={handlePlayVideo}
              />
            ))}
          </SortableContext>
        </DndContext>

        {playlist.items.length === 0 && (
          <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
            Playlist vazia. Adicione vídeos.
          </div>
        )}
      </div>

      {/* Floating Save Button - Left Fixed */}
      {isDirty && (
        <div className="fixed bottom-6 left-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <Button
            size="lg"
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="shadow-xl rounded-full px-6 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isSaving ? "Salvando..." : "Salvar Alterações"}
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
    </div>
  );
}