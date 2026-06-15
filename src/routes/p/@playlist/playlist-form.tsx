import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type PlaylistFormData, playlistSchema } from "./types";
import { useCreatePlaylist } from "./use-create-playlist";
import { Image, ListVideo, Loader2, Music, Save } from "lucide-react";
import { useNDK, useNDKCurrentPubkey } from "@nostr-dev-kit/ndk-hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  // Watch para o Preview em tempo real
  const formValues = watch();

  return (
    <div className={`grid gap-6 ${inModal ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-[minmax(0,1fr)_336px]"} ${className}`}>

      {/* Coluna do Formulário (Ocupa 2/3 se não for modal) */}
      <Card className={inModal ? "" : "lg:col-span-1"}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ListVideo className="size-5 text-primary" />
            <CardTitle>Detalhes da playlist</CardTitle>
          </div>
          <CardDescription>Crie uma coleção curada de vídeos para seus seguidores no Nostr.</CardDescription>
        </CardHeader>
        <CardContent>
        <form onSubmit={handleSubmit(submit)} className="space-y-5">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nome da Playlist
            </Label>
            <Input
              {...register("name")}
              id="name"
              placeholder="Ex: Melhores Tutoriais de React"
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name && <span className="text-destructive text-xs">{errors.name.message}</span>}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Descrição
            </Label>
            <Textarea
              {...register("description")}
              id="description"
              rows={4}
              placeholder="Sobre o que é esta coleção?"
              maxLength={500}
              className="min-h-32 resize-y"
            />

            {formValues?.description && <p className="text-xs text-right text-muted-foreground">
              {formValues?.description.length}/500
            </p>}
          </div>

          {/* URL da Capa */}
          <div className="space-y-2">
            <Label htmlFor="coverImage">
              URL da Capa (Opcional)
            </Label>
            <div className="relative">
              <Input
                {...register("coverImage")}
                id="coverImage"
                placeholder="https://..."
                className="pl-10"
                aria-invalid={Boolean(errors.coverImage)}
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
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive">
              {error}
            </div>
          )}

          {/* Ações */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="submit"
              disabled={isPending}
              variant="gradient"
              className="w-full sm:w-auto"
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
            </Button>
          </div>
        </form>
        </CardContent>
      </Card>

      {/* Coluna de Preview (Visualização de como ficará o card) */}
      <div className="hidden lg:block space-y-6">
        <Card className="overflow-hidden py-0">
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
        </Card>

        <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-sm text-muted-foreground">
          <strong>Dica Pro:</strong> Após criar a playlist, você poderá adicionar vídeos clicando no botão "Salvar em"
          enquanto assiste a qualquer conteúdo.
        </div>
      </div>
    </div>
  );
}
