import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type PlaylistFormData, playlistSchema } from "./types";
import { useCreatePlaylist } from "./use-create-playlist";
import { Image, Loader2, Music, Save } from "lucide-react";
import { useNDK, useNDKCurrentPubkey } from "@nostr-dev-kit/ndk-hooks";
import { Textarea } from "@/components/ui/textarea.tsx";

interface PlaylistFormProps {
  className?: string;
  onSuccess?: (dTag: string) => void;
  inModal?: boolean; // Ajusta o layout se estiver em um modal
}

export function PlaylistForm({ className = "", onSuccess, inModal = false }: PlaylistFormProps) {
  const { ndk } = useNDK();
  const pubkey = useNDKCurrentPubkey();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<PlaylistFormData>({
    resolver: zodResolver(playlistSchema),
    defaultValues: {
      name: "",
      description: "",
      coverImage: ""
    }
  });

  const { submit, isPending, error } = useCreatePlaylist({ onSuccess, ndk: ndk!, pubkey: pubkey! });
  console.log(errors);

  // Watch para o Preview em tempo real
  const formValues = watch();

  return (
    <div className={`grid gap-8 ${inModal ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3"} ${className}`}>

      {/* Coluna do Formulário (Ocupa 2/3 se não for modal) */}
      <div className={`${inModal ? "" : "lg:col-span-2"} space-y-6`}>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Nova Playlist</h2>
          <p className="text-muted-foreground text-sm">
            Crie uma coleção curada de vídeos para seus seguidores no Nostr.
          </p>
        </div>

        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <label htmlFor="name"
                   className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Nome da Playlist
            </label>
            <input
              {...register("name")}
              id="name"
              placeholder="Ex: Melhores Tutoriais de React"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {errors.name && <span className="text-destructive text-xs">{errors.name.message}</span>}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium leading-none">
              Descrição
            </label>
            <Textarea
              {...register("description")}
              id="description"
              rows={4}
              placeholder="Sobre o que é esta coleção?"
              maxLength={500}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />

            {formValues?.description && <p className="text-xs text-right text-muted-foreground">
              {formValues?.description.length}/500
            </p>}
          </div>

          {/* URL da Capa */}
          <div className="space-y-2">
            <label htmlFor="coverImage" className="text-sm font-medium leading-none">
              URL da Capa (Opcional)
            </label>
            <div className="relative">
              <input
                {...register("coverImage")}
                id="coverImage"
                placeholder="https://..."
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm pl-10 focus-visible:ring-2"
              />
              <Image className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-[0.8rem] text-muted-foreground">
              Recomendado: 1280x720px (16:9).
            </p>
            {errors.coverImage && <span className="text-destructive text-xs">{errors.coverImage.message}</span>}
          </div>

          {/* Erros de API */}
          {error && (
            <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm font-medium">
              {error}
            </div>
          )}

          {/* Ações */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full sm:w-auto"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Publicar Playlist
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Coluna de Preview (Visualização de como ficará o card) */}
      <div className="hidden lg:block space-y-6">
        <h3 className="text-lg font-medium">Pré-visualização</h3>
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
          {/* Mock do Card de Playlist */}
          <div className="aspect-video w-full bg-muted relative group flex items-center justify-center overflow-hidden">
            {formValues.coverImage ? (
              <img
                src={formValues.coverImage}
                alt="Preview"
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                onError={(e) => {
                  // Fallback simples se a imagem quebrar
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="flex flex-col items-center text-muted-foreground">
                <Music className="h-12 w-12 mb-2 opacity-20" />
                <span className="text-xs uppercase tracking-widest opacity-40">Sem Capa</span>
              </div>
            )}
            {/* Overlay de contagem de vídeos (Mock) */}
            <div
              className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded flex items-center">
              <Music className="w-3 h-3 mr-1" />
              <span>0 vídeos</span>
            </div>
          </div>

          <div className="p-4 space-y-2">
            <h4 className="font-semibold leading-none tracking-tight line-clamp-1">
              {formValues.name || "Título da Playlist"}
            </h4>
            <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
              {formValues.description || "A descrição da sua playlist aparecerá aqui..."}
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-5 h-5 rounded-full bg-primary/20" />
              {/* Avatar Mock */}
              <span>Você</span>
              <span>•</span>
              <span>Agora</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 text-sm">
          <strong>Dica Pro:</strong> Após criar a playlist, você poderá adicionar vídeos clicando no botão "Salvar em"
          enquanto assiste a qualquer conteúdo.
        </div>
      </div>
    </div>
  );
}