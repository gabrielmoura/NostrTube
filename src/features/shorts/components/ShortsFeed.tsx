import { useThrottledCallback } from '@tanstack/react-pacer'
import { useVirtualizer } from '@tanstack/react-virtual'
import { type KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useBatchProfiles } from '@/features/nostr/hooks/useBatchProfiles'
import { ShortsOverlay } from '@/features/shorts/components/ShortsOverlay'
import { ShortsPlayer } from '@/features/shorts/components/ShortsPlayer'
import type { ShortVideoViewModel } from '@/features/shorts/services/shorts-media.service'
import { cn } from '@/lib/utils'

interface ShortsFeedProps {
  shorts: ShortVideoViewModel[]
  fetchNextPage: () => void
  hasNextPage: boolean
  immersive?: boolean
  initialShortId?: string
  isFetchingNextPage: boolean
  onActiveShortChange?: (short: ShortVideoViewModel) => void
  onExit?: () => void
}

export function ShortsFeed({
  shorts,
  fetchNextPage,
  hasNextPage,
  immersive,
  initialShortId,
  isFetchingNextPage,
  onActiveShortChange,
  onExit,
}: ShortsFeedProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const lastResetKeyRef = useRef<string | null>(null)
  const lastNotifiedShortIdRef = useRef<string | null>(null)
  const eventsForProfiles = useMemo(() => shorts.map((short) => short.event), [shorts])
  const profiles = useBatchProfiles(eventsForProfiles)
  const resetKey = initialShortId ?? shorts[0]?.id ?? ''
  const loadMore = useThrottledCallback(fetchNextPage, { wait: 600 })

  const virtualizer = useVirtualizer({
    count: shorts.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => containerRef.current?.clientHeight || 720,
    overscan: 2,
  })

  const maybeLoadMore = useCallback(
    (index: number) => {
      if (!hasNextPage || isFetchingNextPage) return
      if (index >= shorts.length - 4) {
        loadMore()
      }
    },
    [hasNextPage, isFetchingNextPage, loadMore, shorts.length],
  )

  const handleScroll = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const nextIndex = Math.round(container.scrollTop / Math.max(container.clientHeight, 1))
    const boundedIndex = Math.min(Math.max(nextIndex, 0), Math.max(shorts.length - 1, 0))
    setActiveIndex(boundedIndex)
    maybeLoadMore(boundedIndex)

    const activeShort = shorts[boundedIndex]
    if (activeShort && activeShort.id !== lastNotifiedShortIdRef.current) {
      lastNotifiedShortIdRef.current = activeShort.id
      onActiveShortChange?.(activeShort)
    }

    virtualizer.measure()
  }, [maybeLoadMore, onActiveShortChange, shorts, virtualizer])

  useEffect(() => {
    if (!resetKey || lastResetKeyRef.current === resetKey) return
    lastResetKeyRef.current = resetKey
    const nextIndex = initialShortId ? shorts.findIndex((short) => short.id === initialShortId) : -1
    const boundedIndex = Math.max(nextIndex, 0)
    setActiveIndex(boundedIndex)
    lastNotifiedShortIdRef.current = shorts[boundedIndex]?.id ?? null
    containerRef.current?.scrollTo({
      top: boundedIndex * (containerRef.current?.clientHeight || 0),
    })
  }, [initialShortId, resetKey, shorts])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const container = containerRef.current
      if (!container) return

      if (event.key === 'Escape') {
        onExit?.()
        return
      }

      if (event.key === 'ArrowDown' || event.key === 'PageDown') {
        event.preventDefault()
        container.scrollBy({ top: container.clientHeight, behavior: 'smooth' })
      }

      if (event.key === 'ArrowUp' || event.key === 'PageUp') {
        event.preventDefault()
        container.scrollBy({ top: -container.clientHeight, behavior: 'smooth' })
      }
    },
    [onExit],
  )

  const virtualItems = virtualizer.getVirtualItems()

  return (
    <div
      ref={containerRef}
      className={cn(
        'overflow-y-auto overscroll-contain bg-black snap-y snap-mandatory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70',
        immersive
          ? 'h-svh min-h-svh rounded-none'
          : 'h-[calc(100svh-var(--header-height)-2rem)] min-h-[620px] rounded-xl border border-border/70 shadow-2xl',
      )}
      onKeyDown={handleKeyDown}
      onScroll={handleScroll}
      tabIndex={0}
    >
      <div className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualItems.map((virtualItem) => {
          const short = shorts[virtualItem.index]
          if (!short) return null

          const active = virtualItem.index === activeIndex
          const preload = virtualItem.index === activeIndex + 1

          return (
            <article
              key={short.id}
              className={cn(
                'absolute left-0 top-0 flex w-full snap-start snap-always items-center justify-center overflow-hidden bg-black',
                active ? 'opacity-100' : 'opacity-90',
              )}
              style={{
                height: `${virtualItem.size}px`,
                minHeight: immersive ? '100svh' : '620px',
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
          )
        })}
      </div>
    </div>
  )
}
