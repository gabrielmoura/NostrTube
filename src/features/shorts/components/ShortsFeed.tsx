import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useThrottledCallback } from "@tanstack/react-pacer";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useBatchProfiles } from "@/features/nostr/hooks/useBatchProfiles";
import { ShortsOverlay } from "@/features/shorts/components/ShortsOverlay";
import { ShortsPlayer } from "@/features/shorts/components/ShortsPlayer";
import type { ShortVideoViewModel } from "@/features/shorts/services/shorts-media.service";
import { cn } from "@/lib/utils";

interface ShortsFeedProps {
  shorts: ShortVideoViewModel[];
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}

export function ShortsFeed({ shorts, fetchNextPage, hasNextPage, isFetchingNextPage }: ShortsFeedProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const eventsForProfiles = useMemo(() => shorts.map((short) => short.event), [shorts]);
  const profiles = useBatchProfiles(eventsForProfiles);
  const shortsKey = useMemo(() => shorts.map((short) => short.id).join(":"), [shorts]);
  const loadMore = useThrottledCallback(fetchNextPage, { wait: 600 });

  const virtualizer = useVirtualizer({
    count: shorts.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => containerRef.current?.clientHeight || 720,
    overscan: 2,
  });

  const maybeLoadMore = useCallback(
    (index: number) => {
      if (!hasNextPage || isFetchingNextPage) return;
      if (index >= shorts.length - 4) {
        loadMore();
      }
    },
    [hasNextPage, isFetchingNextPage, loadMore, shorts.length],
  );

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const nextIndex = Math.round(container.scrollTop / Math.max(container.clientHeight, 1));
    const boundedIndex = Math.min(Math.max(nextIndex, 0), Math.max(shorts.length - 1, 0));
    setActiveIndex(boundedIndex);
    maybeLoadMore(boundedIndex);
    virtualizer.measure();
  }, [maybeLoadMore, shorts.length, virtualizer]);

  useEffect(() => {
    if (!shortsKey) return;
    setActiveIndex(0);
    containerRef.current?.scrollTo({ top: 0 });
  }, [shortsKey]);

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={containerRef}
      className="h-[calc(100svh-var(--header-height)-2rem)] min-h-[620px] overflow-y-auto overscroll-contain rounded-3xl border border-border/70 bg-black shadow-2xl snap-y snap-mandatory"
      onScroll={handleScroll}
    >
      <div className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualItems.map((virtualItem) => {
          const short = shorts[virtualItem.index];
          if (!short) return null;

          const active = virtualItem.index === activeIndex;
          const preload = virtualItem.index === activeIndex + 1;

          return (
            <article
              key={short.id}
              className={cn(
                "absolute left-0 top-0 flex w-full snap-start snap-always items-center justify-center overflow-hidden bg-black",
                active ? "opacity-100" : "opacity-90",
              )}
              style={{
                height: `${virtualItem.size}px`,
                minHeight: "620px",
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {short.source ? (
                <ShortsPlayer
                  active={active}
                  preload={preload}
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
    </div>
  );
}
