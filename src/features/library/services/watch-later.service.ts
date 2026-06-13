import type { NDKEvent } from '@nostr-dev-kit/ndk'
import { getTagValue } from '@welshman/util'

const WATCH_LATER_KEY = 'nostrtube:watch-later'
const WATCH_LATER_EVENT = 'nostrtube:watch-later-changed'
const EMPTY_WATCH_LATER_ITEMS: WatchLaterItem[] = []

let cachedRaw: string | null | undefined
let cachedItems: WatchLaterItem[] = EMPTY_WATCH_LATER_ITEMS

export interface WatchLaterItem {
  eventId: string
  eventRef: string
  title: string
  thumbnail?: string
  authorPubkey?: string
  savedAt: number
}

function isBrowser() {
  return typeof window !== 'undefined'
}

function emitChange() {
  if (!isBrowser()) return
  window.dispatchEvent(new CustomEvent(WATCH_LATER_EVENT))
}

function readItems(): WatchLaterItem[] {
  if (!isBrowser()) return EMPTY_WATCH_LATER_ITEMS

  const raw = window.localStorage.getItem(WATCH_LATER_KEY)
  if (raw === cachedRaw) return cachedItems

  cachedRaw = raw
  if (!raw) {
    cachedItems = EMPTY_WATCH_LATER_ITEMS
    return cachedItems
  }

  try {
    const parsed = JSON.parse(raw) as WatchLaterItem[]
    if (!Array.isArray(parsed)) {
      cachedItems = EMPTY_WATCH_LATER_ITEMS
      return cachedItems
    }

    cachedItems = parsed
      .filter((item) => item?.eventId && item?.eventRef)
      .sort((a, b) => b.savedAt - a.savedAt)
    return cachedItems
  } catch {
    cachedItems = EMPTY_WATCH_LATER_ITEMS
    return cachedItems
  }
}

function writeItems(items: WatchLaterItem[]) {
  if (!isBrowser()) return
  window.localStorage.setItem(WATCH_LATER_KEY, JSON.stringify(items))
  emitChange()
}

export function buildWatchLaterItem(event: NDKEvent): WatchLaterItem {
  return {
    eventId: event.id,
    eventRef: event.encode(),
    title: getTagValue('title', event.tags) || getTagValue('name', event.tags) || 'Untitled video',
    thumbnail: getTagValue('thumb', event.tags) || getTagValue('image', event.tags) || undefined,
    authorPubkey: event.pubkey,
    savedAt: Date.now(),
  }
}

export function getWatchLaterItems() {
  return readItems()
}

export function isInWatchLater(eventId: string) {
  return readItems().some((item) => item.eventId === eventId)
}

export function saveToWatchLater(event: NDKEvent) {
  const next = readItems().filter((item) => item.eventId !== event.id)
  next.unshift(buildWatchLaterItem(event))
  writeItems(next)
}

export function removeFromWatchLater(eventId: string) {
  writeItems(readItems().filter((item) => item.eventId !== eventId))
}

export function toggleWatchLater(event: NDKEvent) {
  const exists = isInWatchLater(event.id)
  if (exists) {
    removeFromWatchLater(event.id)
    return false
  }

  saveToWatchLater(event)
  return true
}

export function subscribeWatchLater(onStoreChange: () => void) {
  if (!isBrowser()) {
    return () => undefined
  }

  const handler = () => onStoreChange()
  window.addEventListener(WATCH_LATER_EVENT, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(WATCH_LATER_EVENT, handler)
    window.removeEventListener('storage', handler)
  }
}
