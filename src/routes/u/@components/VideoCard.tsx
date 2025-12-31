import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { PlayCircle } from "lucide-react";
import { NDKEvent } from "@nostr-dev-kit/ndk";
import { useNostrImage } from "@/hooks/useNostrImage";
import { extractTag } from "@/helper/extractTag";
import { cn } from "@/helper/format";
import useUserStore from "@/store/useUserStore";
import { formatDuration } from "@/helper/date.ts";
import { NSFWOverlay } from "@/components/NSFWOverlay.tsx";

interface VideoCardProps {
  event: NDKEvent;
}

export function VideoCard({ event }: VideoCardProps) {
  // 1. Lógica de Mídia (Hook Centralizado)
  const { optimized, title: imgTitle, isNSFW, loading, error, handlers } = useNostrImage(event);

  // 2. Lógica de Negócio Adicional
  const tagData = extractTag(event.tags);
  const nsfwEnabled = useUserStore((state) => state.config?.nsfw) ?? false;
  const title = tagData.title || imgTitle || "Vídeo sem título";
  const duration = formatDuration(tagData?.duration);
  const shouldBlur = isNSFW && !nsfwEnabled;

  return (
    <Link
      to={"/v/$eventId"}
      params={{ eventId: event.id }}
      className="group block transition-all focus:outline-none"
    >
      <Card
        className="h-full border-border/40 bg-card overflow-hidden hover:shadow-xl transition-all dark:hover:border-primary/30">

        {/* Container da Thumbnail com Aspect Ratio mantido */}
        <div className="relative aspect-video bg-muted overflow-hidden">
          {optimized && !error ? (
            <>
              {/* Skeleton de carregamento */}
              {loading && (
                <div className="absolute inset-0 z-10 animate-pulse bg-neutral-800" />
              )}

              <img
                src={optimized}
                alt={title}
                onLoad={handlers.onLoad}
                onError={handlers.onError}
                loading="lazy"
                className={cn(
                  "w-full h-full object-cover transition-transform duration-500 group-hover:scale-105",
                  loading ? "opacity-0" : "opacity-100",
                  shouldBlur && "blur-2xl scale-110 grayscale" // UX: Blur para NSFW
                )}
              />

              {/* Overlay para NSFW */}
              {shouldBlur && (
                <NSFWOverlay />
              )}
            </>
          ) : (
            /* Fallback quando não há imagem ou erro */
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/40 bg-[#1a1514]">
              <PlayCircle className="w-12 h-12" />
            </div>
          )}

          {/* Badge de Duração */}
          {duration && (
            <span
              className="absolute bottom-2 right-2 z-30 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded-sm font-mono font-bold backdrop-blur-sm">
              {duration}
            </span>
          )}
        </div>

        {/* Informações do Card */}
        <CardHeader className="p-3 pb-0">
          <h3
            className="font-semibold text-sm sm:text-base line-clamp-2 leading-tight group-hover:text-primary transition-colors min-h-[2.5rem]">
            {title}
          </h3>
        </CardHeader>

        <CardContent className="p-3 pt-1.5">
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {tagData.summary || "Sem descrição disponível."}
          </p>
        </CardContent>

        <CardFooter
          className="p-3 pt-0 text-[10px] uppercase tracking-wider text-muted-foreground/70 flex justify-between items-center">
          <span className="font-medium">
            {new Date(event.created_at! * 1000).toLocaleDateString(undefined, {
              day: "2-digit", month: "short", year: "numeric"
            })}
          </span>
          {isNSFW && (
            <span className="text-destructive font-bold border border-destructive/30 px-1 rounded-[2px]">
              NSFW
            </span>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}