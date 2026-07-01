import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

export function useBlossomVirtualWindow({
  count,
  estimateSize,
  getItemKey,
  hasMore,
  isLoadingMore,
  loadMoreIndex,
  onLoadMore,
  overscan,
}: {
  count: number
  estimateSize: () => number
  getItemKey: (index: number) => string
  hasMore?: boolean
  isLoadingMore?: boolean
  loadMoreIndex: number
  onLoadMore?: () => void
  overscan: number
}) {
  const parentRef = useRef<HTMLDivElement | null>(null)
  const [scrollMargin, setScrollMargin] = useState(0)

  useLayoutEffect(() => {
    const updateScrollMargin = () => {
      const node = parentRef.current
      if (!node) return
      const nextScrollMargin = node.getBoundingClientRect().top + window.scrollY
      setScrollMargin((current) => (current === nextScrollMargin ? current : nextScrollMargin))
    }

    updateScrollMargin()
    const resizeObserver = new ResizeObserver(updateScrollMargin)
    if (parentRef.current) resizeObserver.observe(parentRef.current)
    window.addEventListener('resize', updateScrollMargin)
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateScrollMargin)
    }
  })

  const virtualizer = useWindowVirtualizer({
    count,
    estimateSize,
    getItemKey,
    overscan,
    scrollMargin,
  })
  const virtualItems = virtualizer.getVirtualItems()

  useEffect(() => {
    const lastItem = virtualItems.at(-1)
    if (!lastItem || !hasMore || isLoadingMore || !onLoadMore) return
    if (lastItem.index >= loadMoreIndex) onLoadMore()
  }, [hasMore, isLoadingMore, loadMoreIndex, onLoadMore, virtualItems])

  return {
    parentRef,
    scrollMargin,
    totalSize: virtualizer.getTotalSize(),
    virtualItems,
  }
}
