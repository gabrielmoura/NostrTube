// components/video/VideoCard.tsx
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { PlayCircle } from "lucide-react";
import { extractTag } from "@/helper/extractTag";
import { NDKEvent } from "@nostr-dev-kit/ndk";
import { Image } from "@/components/Image.tsx";

interface VideoCardProps {
  event: NDKEvent;
}

export function VideoCard({ event }: VideoCardProps) {
  const tagData = extractTag(event.tags);
  const title = tagData.title || "Vídeo sem título";
  const image = tagData.image || tagData.thumb;

  // Exemplo de formatação de duração (mockada se não existir)
  const duration = tagData?.duration ? new Date(Number(tagData?.duration) * 1000).toISOString().substr(11, 8) : null;

  return (
    <Link
      to={"/v/$eventId"}
      params={{ eventId: event.id }}
      className="group block transition-transform hover:-translate-y-1 focus:outline-none"
    >
      <Card
        className="h-full border-border/40 bg-card overflow-hidden hover:shadow-lg transition-all dark:hover:border-primary/50">
        <div className="relative aspect-video bg-muted">
          {image ? (
            <Image
              src={image}
              alt={title}
              className="w-full h-full object-cover transition-transform group-hover:scale-105 aspect-3/2"
              loading="lazy"
              width={400}
              height={225}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <PlayCircle className="w-12 h-12 opacity-50" />
            </div>
          )}
          {duration && (
            <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-mono">
              {duration}
            </span>
          )}
        </div>

        <CardHeader className="p-3 pb-0">
          <h3 className="font-semibold text-base line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {title}
          </h3>
        </CardHeader>

        <CardContent className="p-3 pt-1">
          <p className="text-xs text-muted-foreground line-clamp-2">
            {tagData.summary || "Sem descrição disponível."}
          </p>
        </CardContent>

        <CardFooter className="p-3 pt-0 text-xs text-muted-foreground flex justify-between">
          <span>{new Date(event.created_at! * 1000).toLocaleDateString()}</span>
          {/* Adicionar views se disponível via NIP-stats */}
        </CardFooter>
      </Card>
    </Link>
  );
}