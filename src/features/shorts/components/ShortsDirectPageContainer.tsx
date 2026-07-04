import type { NDKEvent } from "@nostr-dev-kit/ndk";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Film } from "lucide-react";
import { useCallback, useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ShortsFeed } from "@/features/shorts/components/ShortsFeed";
import { useShortsFeed } from "@/features/shorts/hooks/useShortsFeed";
import type { ShortVideoViewModel } from "@/features/shorts/services/shorts-media.service";
import { cn } from "@/lib/utils";

interface ShortsDirectPageContainerProps {
  author?: string;
  event: NDKEvent;
  eventId: string;
}

export function ShortsDirectPageContainer({ author, event, eventId }: ShortsDirectPageContainerProps) {
  const navigate = useNavigate();
  const {
    shorts,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useShortsFeed({ author, initialEvent: event });

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleExit = useCallback(() => {
    void navigate({ to: "/shorts" });
  }, [navigate]);

  const handleActiveShortChange = useCallback(
    (short: ShortVideoViewModel) => {
      if (short.id === event.id || short.routeReference === eventId) return;

      void navigate({
        to: "/short/$eventId",
        params: { eventId: short.routeReference },
        search: {
          author,
          video: short.id,
        } as never,
        replace: true,
      });
    },
    [author, event.id, eventId, navigate],
  );

  return (
    <div className="fixed inset-0 z-50 bg-black text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 bg-gradient-to-b from-black/78 via-black/36 to-transparent px-3 pb-8 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] sm:px-5">
        <div className="pointer-events-auto flex items-center justify-between gap-3">
          <Link to="/shorts" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-white hover:bg-white/12 hover:text-white")}>
            <ArrowLeft className="size-4" />
            Shorts
          </Link>
          <Button type="button" variant="ghost" size="icon" className="text-white hover:bg-white/12 hover:text-white" aria-label="Feed de Shorts" onClick={handleExit}>
            <Film className="size-4" />
          </Button>
        </div>
      </div>

      {shorts.length > 0 ? (
        <ShortsFeed
          immersive
          shorts={shorts}
          initialShortId={event.id}
          fetchNextPage={() => void fetchNextPage()}
          hasNextPage={Boolean(hasNextPage)}
          isFetchingNextPage={isFetchingNextPage}
          onActiveShortChange={handleActiveShortChange}
          onExit={handleExit}
        />
      ) : (
        <div className="flex h-svh items-center justify-center px-6 text-center">
          <div>
            <Film className="mx-auto mb-4 size-10 text-white/62" />
            <h1 className="text-xl font-semibold">Short indisponivel</h1>
            <p className="mt-2 max-w-sm text-sm text-white/70">O evento foi encontrado, mas nao ha uma midia de short reproduzivel.</p>
          </div>
        </div>
      )}
    </div>
  );
}
