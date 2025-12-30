import { useRef, useEffect, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { NDKEvent } from "@nostr-dev-kit/ndk";
import { Link } from "@tanstack/react-router";
import VideoCard from "@/components/cards/videoCard";
import { useGridColumns } from "@/hooks/useGridColumns";

interface VirtualizedVideoGridProps {
  events: NDKEvent[];
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}

export function VirtualizedVideoGrid({ events, fetchNextPage, hasNextPage, isFetchingNextPage }: VirtualizedVideoGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const columns = useGridColumns();

  const rows = useMemo(() => {
    const chunked: NDKEvent[][] = [];
    for (let i = 0; i < events.length; i += columns) {
      chunked.push(events.slice(i, i + columns));
    }
    return chunked;
  }, [events, columns]);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 350,
    overscan: 5
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1];
    if (!lastItem) return;

    const isNearEnd = lastItem.index >= rows.length - 1;

    // IMPORTANTE: O check de isFetchingNextPage deve vir ANTES da chamada
    if (isNearEnd && hasNextPage && !isFetchingNextPage) {
      // Usar um pequeno debounce ou flag de proteção se necessário
      fetchNextPage();
    }
  }, [virtualItems, rows.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div ref={parentRef} className="h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: "100%", position: "relative" }}>
        {virtualItems.map((virtualRow) => (
          <div
            key={virtualRow.key}
            className="absolute top-0 left-0 w-full"
            style={{ height: `${virtualRow.size}px`, transform: `translateY(${virtualRow.start}px)` }}
          >
            <ul className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rows[virtualRow.index].map((e) => (
                <li key={e.id} className="flex">
                  <Link to="/v/$eventId" params={{ eventId: e.encode() }} className="block w-full hover:scale-[1.02] transition-transform">
                    <VideoCard event={e} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}