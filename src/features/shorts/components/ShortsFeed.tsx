import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBatchProfiles } from "@/features/nostr/hooks/useBatchProfiles";
import { ShortsOverlay } from "@/features/shorts/components/ShortsOverlay";
import { ShortsPlayer } from "@/features/shorts/components/ShortsPlayer";
import type { ShortVideoViewModel } from "@/features/shorts/services/shorts-media.service";
import { cn } from "@/lib/utils";

interface ShortsFeedProps {
  shorts: ShortVideoViewModel[];
}

export function ShortsFeed({ shorts }: ShortsFeedProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const profiles = useBatchProfiles(shorts.map((short) => short.event));
  const shortsKey = useMemo(() => shorts.map((short) => short.id).join(":"), [shorts]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const nextIndex = Math.round(container.scrollTop / Math.max(container.clientHeight, 1));
    setActiveIndex(Math.min(Math.max(nextIndex, 0), Math.max(shorts.length - 1, 0)));
  }, [shorts.length]);

  useEffect(() => {
    if (!shortsKey) return;
    setActiveIndex(0);
    containerRef.current?.scrollTo({ top: 0 });
  }, [shortsKey]);

  return (
    <div
      ref={containerRef}
      className="h-[calc(100svh-var(--header-height)-2rem)] min-h-[620px] overflow-y-auto overscroll-contain rounded-3xl border border-border/70 bg-black shadow-2xl snap-y snap-mandatory"
      onScroll={handleScroll}
    >
      {shorts.map((short, index) => {
        const active = index === activeIndex;
        return (
          <article
            key={short.id}
            className={cn(
              "relative flex h-full min-h-[620px] snap-start snap-always items-center justify-center overflow-hidden bg-black",
              active ? "opacity-100" : "opacity-90",
            )}
          >
            {short.source ? (
              <ShortsPlayer
                active={active}
                src={short.source.url}
                mimeType={short.source.mimeType}
                poster={short.poster}
                title={short.title}
              />
            ) : null}
            <ShortsOverlay short={short} profile={profiles[short.event.pubkey]} />
          </article>
        );
      })}
    </div>
  );
}
