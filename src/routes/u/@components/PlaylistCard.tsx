// components/playlist/PlaylistCard.tsx
import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { ListVideo, Play } from "lucide-react";
import { NDKEvent } from "@nostr-dev-kit/ndk";
import { extractPlaylistData } from "./extractPlaylistData";

interface PlaylistCardProps {
  event: NDKEvent;
}

export function PlaylistCard({ event }: PlaylistCardProps) {
  const { title, description, image, videoCount } = extractPlaylistData(event);

  return (
    <Link
      to={"/p/$listId"} // Rota hipotética para visualizar a playlist
      params={{ listId: event.dTag! }} // Ou usar o ID, dependendo da sua rota
      className="group block focus:outline-none"
    >
      <Card
        className="h-full border-border/40 bg-card overflow-hidden hover:shadow-lg transition-all dark:hover:border-primary/50 flex flex-col">
        {/* Thumbnail Wrapper */}
        <div className="relative aspect-video bg-muted group-hover:opacity-90 transition-opacity">
          {image ? (
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary/50">
              <ListVideo className="w-12 h-12 text-muted-foreground/50" />
            </div>
          )}

          {/* Overlay de "Playlist" (Barra lateral direita sobre a imagem) */}
          <div
            className="absolute top-0 right-0 bottom-0 w-2/5 max-w-[120px] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-white z-10">
            <span className="text-lg font-bold">{videoCount}</span>
            <ListVideo className="w-6 h-6 mt-1 mb-2" />
            <span className="text-[10px] uppercase tracking-wider font-medium">Vídeos</span>
          </div>

          {/* Overlay de Hover "Reproduzir tudo" */}
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-20">
             <span className="flex items-center gap-2 text-white font-medium uppercase tracking-wide text-sm">
                <Play className="fill-white w-4 h-4" /> Reproduzir
             </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-grow p-3">
          <h3
            className="font-semibold text-base line-clamp-2 leading-tight group-hover:text-primary transition-colors mb-1">
            {title}
          </h3>

          {description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {description}
            </p>
          )}

          <div className="mt-auto pt-2">
             <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
               Ver Playlist Completa
             </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}