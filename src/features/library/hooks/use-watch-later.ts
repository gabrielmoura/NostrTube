import type { NDKEvent } from '@nostr-dev-kit/ndk'
import { useCallback, useSyncExternalStore } from 'react'
import {
  getWatchLaterItems,
  isInWatchLater,
  removeFromWatchLater,
  saveToWatchLater,
  subscribeWatchLater,
  toggleWatchLater,
  type WatchLaterItem,
} from '@/features/library/services/watch-later.service'

const EMPTY_WATCH_LATER_ITEMS: WatchLaterItem[] = []

export function useWatchLater() {
  const items = useSyncExternalStore(subscribeWatchLater, getWatchLaterItems, () => EMPTY_WATCH_LATER_ITEMS)

  const has = useCallback((eventId: string) => items.some((item) => item.eventId === eventId), [items])

  const toggle = useCallback((event: NDKEvent) => toggleWatchLater(event), [])
  const save = useCallback((event: NDKEvent) => saveToWatchLater(event), [])
  const remove = useCallback((eventId: string) => removeFromWatchLater(eventId), [])

  return {
    items,
    has,
    save,
    remove,
    toggle,
    isInWatchLater,
  }
}
