import { AspectRatio } from "@radix-ui/themes";
import { cn } from "@/helper/format.ts";
import NostrNotFound from "@/components/logo/NostrNotFound.tsx";
import useUserStore from "@/store/useUserStore.ts";
import { useNostrImage } from "@/hooks/useNostrImage.ts";
import type { NDKEvent } from "@nostr-dev-kit/ndk";
import { NSFWOverlay } from "@/components/NSFWOverlay.tsx";

interface ImageCardProps {
  event: NDKEvent;
  className?: string;
}

export function ImageCard({ event, className }: ImageCardProps) {
  const { optimized, title, isNSFW, loading, error, handlers } = useNostrImage(event);
  const nsfwEnabled = useUserStore((state) => state.config?.nsfw) ?? false;

  const shouldBlockNSFW = isNSFW && !nsfwEnabled;

  return (
    <AspectRatio
      ratio={16 / 9}
      className={cn("bg-muted relative overflow-hidden group rounded-md", className)}
    >
      {/* Camada de Imagem/Placeholder */}
      {shouldBlockNSFW ? (
        <NSFWOverlay />
      ) : !optimized || error ? (
        <NotFoundFallback />
      ) : (
        <>
          {loading && <SkeletonOverlay />}
          <img
            loading="lazy"
            src={optimized}
            alt={title || "Nostr media"}
            onLoad={handlers.onLoad}
            onError={handlers.onError}
            className={cn(
              "h-full w-full object-cover transition-all duration-500",
              "group-hover:scale-105",
              loading ? "opacity-0" : "opacity-100"
            )}
          />
        </>
      )}
    </AspectRatio>
  );
}

// --- Sub-componentes para melhor legibilidade (S de SOLID) ---

const SkeletonOverlay = () => (
  <div className="absolute inset-0 z-10 animate-pulse bg-neutral-800/60 backdrop-blur-sm" />
);


const NotFoundFallback = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-[#1a1514]">
    <NostrNotFound className="h-12 w-12 opacity-40 transition-opacity group-hover:opacity-60" />
  </div>
);