import type { NDKEvent } from "@nostr-dev-kit/ndk";
import { getVideoRouteReference } from "@/features/video/services/video-reference.service";
import { getTagValues } from "@/helper/nostrTags";

const WATCH_HISTORY_KEY = "nostrtube-watch-history";
const MAX_HISTORY_ITEMS = 30;

export interface WatchHistoryEntry {
  eventId: string;
  eventRef: string;
  title: string;
  tags: string[];
  watchedAt: number;
}

function readHistory(): WatchHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(WATCH_HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as WatchHistoryEntry[];
  } catch {
    return [];
  }
}

function writeHistory(entries: WatchHistoryEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY_ITEMS)));
}

export function recordWatchHistory(event: NDKEvent) {
  const tags = getTagValues("t", event.tags).slice(0, 10);
  const nextEntry: WatchHistoryEntry = {
    eventId: event.id,
    eventRef: getVideoRouteReference(event),
    title: event.tagValue("title") || event.tagValue("name") || "Untitled",
    tags,
    watchedAt: Date.now()
  };

  const deduped = readHistory().filter((entry) => entry.eventId !== event.id);
  writeHistory([nextEntry, ...deduped]);
}

export function getWatchHistory(): WatchHistoryEntry[] {
  return readHistory();
}

export function getTopRecommendationTags(limit = 6): string[] {
  const counts = new Map<string, number>();

  readHistory().forEach((entry, index) => {
    const weight = Math.max(1, MAX_HISTORY_ITEMS - index);
    entry.tags.forEach((tag) => {
      counts.set(tag, (counts.get(tag) ?? 0) + weight);
    });
  });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag);
}

export function getLastWatchedEntry(): WatchHistoryEntry | undefined {
  return readHistory()[0];
}
