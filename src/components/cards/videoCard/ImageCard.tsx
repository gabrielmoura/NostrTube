import { useState } from "react";
import { mapImetaTag, NDKEvent } from "@nostr-dev-kit/ndk";
import { extractTag } from "@/helper/extractTag.ts";
import { getTags } from "@welshman/util";
import { cn, ifHasString } from "@/helper/format.ts";
import { getOptimizedImageSrc } from "@/helper/http.ts";
import NostrNotFound from "@/components/logo/NostrNotFound.tsx";
import { AspectRatio } from "@radix-ui/themes";
import { IconNSFW } from "@/components/logo/IconNSFW.tsx";

// Mantenha suas importações (AspectRatio, cn, etc.)

export function ImageCard({ event }: { event: NDKEvent }) {
  const [imageError, setImageError] = useState(false);

  // Só começa carregando se tivermos uma URL de thumbnail potencial
  const { image, thumb, title, url } = extractTag(event.tags); // Extração movida para cima para usar no useState
  const initialUrlCheck = thumb || image || url || getTags("imeta", event.tags).length > 0;
  const [isLoading, setIsLoading] = useState(!!initialUrlCheck);

  // 1. Detecção de NSFW
  const isNSFW = event.tags.some((t) => t[0] === "content-warning");

  // 2. Lógica de URL (Mesma da versão anterior)
  let targetUrl = url;
  if (!targetUrl) {
    const imetaTags = getTags("imeta", event.tags);
    const validImeta = imetaTags
      .map((tag) => mapImetaTag(tag))
      .find((imeta) => imeta.url);
    if (validImeta) targetUrl = validImeta.url;
  }

  const thumbnail = ifHasString(thumb, image);
  const newThumbnail = thumbnail
    ? getOptimizedImageSrc(thumbnail, "400")
    : targetUrl
      ? getOptimizedImageSrc(targetUrl, "480", {
        resize: { resizing_type: "fit", width: 480, height: 480 },
        format: "webp"
      })
      : null;

  // Handlers de estado
  const handleLoad = () => setIsLoading(false);
  const handleError = () => {
    setIsLoading(false);
    setImageError(true);
  };

  // 3. Componentes visuais auxiliares
  const NotFoundFallback = (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ backgroundColor: "hsl(12 6.5% 15.1%)" }}
    >
      <NostrNotFound className="h-16 w-16 opacity-80" />
    </div>
  );

  const SkeletonLoader = (
    <div className="absolute inset-0 z-10 animate-pulse bg-neutral-800/50" />
  );

  return (
    <AspectRatio ratio={16 / 9} className="bg-muted relative overflow-hidden group">
      {/* Caso 1: Conteúdo Sensível (NSFW) - Exibe ícone fixo */}
      {isNSFW ? (
        <IconNSFW
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 grayscale-2" />
      ) : (
        <>
          {/* Caso 2: Skeleton (Exibe enquanto carrega e não deu erro) */}
          {isLoading && !imageError && SkeletonLoader}

          {/* Caso 3: A Imagem e o Fallback de Erro */}
          {newThumbnail && !imageError ? (
            <img
              src={newThumbnail}
              alt={title ? `Thumbnail do vídeo: ${title}` : "Thumbnail do vídeo"}
              onLoad={handleLoad}
              onError={handleError}
              className={cn(
                "h-full w-full object-cover transition-all duration-500 group-hover:scale-105 grayscale-2",
                // Truque: A imagem existe no DOM para carregar, mas fica invisível até terminar
                isLoading ? "opacity-0" : "opacity-100"
              )}
              width={"200"}
            />
          ) : (
            // Se não tiver thumbnail ou se deu erro no carregamento
            NotFoundFallback
          )}
        </>
      )}
    </AspectRatio>
  );
}