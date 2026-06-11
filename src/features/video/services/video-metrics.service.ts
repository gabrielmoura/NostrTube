import { type NDKEvent, type NDKFilter, NDKKind } from "@nostr-dev-kit/ndk";
import { getTagValue } from "@welshman/util";
import { fetchEventsCached } from "@/features/nostr/services/ndk-query.service";
import { summarizeViewEvents } from "@/features/video/services/video-engagement.service";
import { getVideoReference } from "@/features/video/services/video-reference.service";
import type NDK from "@nostr-dev-kit/ndk";
import { NostrKind } from "@/helper/type";

export interface VideoZapMetrics {
  count: number;
  totalSats: number;
  zapEvents: NDKEvent[];
}

export interface VideoCommentMetrics {
  count: number;
  commentEvents: NDKEvent[];
}

export interface VideoMetricsData {
  views: number | null;
  comments: number | null;
  zapCount: number | null;
  zapTotalSats: number | null;
  zapEvents: NDKEvent[];
}

function deduplicateById(events: Iterable<NDKEvent>) {
  const deduplicated = new Map<string, NDKEvent>();

  for (const event of events) {
    deduplicated.set(event.id, event);
  }

  return Array.from(deduplicated.values());
}

function buildReferenceFilters(kind: number, event: NDKEvent): NDKFilter[] {
  const reference = getVideoReference(event);
  const filters: NDKFilter[] = [
    {
      kinds: [kind as never],
      "#e": [reference.eventId]
    }
  ];

  if (reference.eventAddress) {
    filters.push({
      kinds: [kind as never],
      "#a": [reference.eventAddress]
    });
  }

  return filters;
}

function extractZapSats(event: NDKEvent) {
  const directAmount = getTagValue("amount", event.tags);
  const parsedDirectAmount = directAmount ? Number.parseInt(directAmount, 10) : Number.NaN;
  if (!Number.isNaN(parsedDirectAmount) && parsedDirectAmount > 0) {
    return Math.floor(parsedDirectAmount / 1000);
  }

  const description = getTagValue("description", event.tags);
  if (!description) return 0;

  try {
    const parsedDescription = JSON.parse(description) as { tags?: string[][] };
    const amountTag = parsedDescription.tags?.find((tag) => tag[0] === "amount")?.[1];
    const parsedAmount = amountTag ? Number.parseInt(amountTag, 10) : Number.NaN;
    return !Number.isNaN(parsedAmount) && parsedAmount > 0 ? Math.floor(parsedAmount / 1000) : 0;
  } catch {
    return 0;
  }
}

export async function getVideoZapMetrics(ndk: NDK, event: NDKEvent): Promise<VideoZapMetrics> {
  const zapEvents = deduplicateById(await fetchEventsCached(ndk, buildReferenceFilters(9735, event), {
    mode: "parallel",
    closeOnEose: true
  }));

  return {
    count: zapEvents.length,
    totalSats: zapEvents.reduce((total, zapEvent) => total + extractZapSats(zapEvent), 0),
    zapEvents
  };
}

export async function getVideoCommentMetrics(ndk: NDK, event: NDKEvent): Promise<VideoCommentMetrics> {
  const commentEvents = deduplicateById(await fetchEventsCached(ndk, buildReferenceFilters(NDKKind.Text, event), {
    mode: "parallel",
    closeOnEose: true
  }));

  return {
    count: commentEvents.length,
    commentEvents
  };
}

export async function getVideoViewMetrics(ndk: NDK, event: NDKEvent) {
  const reference = getVideoReference(event);
  if (!reference.eventAddress) {
    return {
      totalViews: 0,
      viewEvents: []
    };
  }

  const viewEvents = Array.from(await fetchEventsCached(ndk, {
    kinds: [NostrKind.VideoViewer as never],
    "#a": [reference.eventAddress]
  }, {
    mode: "parallel",
    closeOnEose: true
  }));

  const summary = summarizeViewEvents(viewEvents);
  return {
    totalViews: summary.totalViews,
    viewEvents: summary.events
  };
}

export async function getVideoMetrics(ndk: NDK, event: NDKEvent): Promise<VideoMetricsData> {
  const [viewsResult, commentsResult, zapsResult] = await Promise.allSettled([
    getVideoViewMetrics(ndk, event),
    getVideoCommentMetrics(ndk, event),
    getVideoZapMetrics(ndk, event)
  ]);

  return {
    views: viewsResult.status === "fulfilled" ? viewsResult.value.totalViews : null,
    comments: commentsResult.status === "fulfilled" ? commentsResult.value.count : null,
    zapCount: zapsResult.status === "fulfilled" ? zapsResult.value.count : null,
    zapTotalSats: zapsResult.status === "fulfilled" ? zapsResult.value.totalSats : null,
    zapEvents: zapsResult.status === "fulfilled" ? zapsResult.value.zapEvents : []
  };
}
