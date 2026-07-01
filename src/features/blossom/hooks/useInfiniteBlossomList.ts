import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const INITIAL_VISIBLE_ITEMS = 40
const PAGE_SIZE = 40

export function useInfiniteBlossomList<T extends { id?: string }>(items: T[]) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_ITEMS)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const resetKey =
    items.length > 0 ? `${items.length}:${items[0]?.id ?? 'first'}:${items.at(-1)?.id ?? 'last'}` : 'empty'

  useEffect(() => {
    void resetKey
    setVisibleCount(INITIAL_VISIBLE_ITEMS)
  }, [resetKey])

  const loadMore = useCallback(() => {
    setVisibleCount((current) => Math.min(current + PAGE_SIZE, items.length))
  }, [items.length])

  useEffect(() => {
    const node = sentinelRef.current
    if (!node || visibleCount >= items.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore()
      },
      { rootMargin: '480px 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [items.length, loadMore, visibleCount])

  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount])

  return {
    visibleItems,
    visibleCount,
    totalCount: items.length,
    hasMore: visibleCount < items.length,
    sentinelRef,
    loadMore,
  }
}
