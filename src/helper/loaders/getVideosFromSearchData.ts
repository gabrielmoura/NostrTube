import NDK__default, { type NDKFilter, NDKKind } from "@nostr-dev-kit/ndk";
import { NDKSubscriptionCacheUsage } from "@nostr-dev-kit/ndk-hooks";
import { notFound } from "@tanstack/react-router";
import { z } from "zod";


export const eventSearchSchema = z.object({
  search: z.string().optional(),
  tag: z.union([z.string(), z.array(z.string())]).optional(),
  nsfw: z.boolean().optional(),
  lang: z.string().optional(),
  // Novos campos
  author: z.string().optional(), // Npub ou Hex
  timeRange: z.enum(["all", "today", "week", "month", "year"]).optional().default("all")
});

export type eventSearchType = z.infer<typeof eventSearchSchema>;

export async function getVideosFromSearchData({ ndk, search, nsfw, tag, lang }: eventSearchType & {
  ndk: NDK__default
}) {
  const tags = tag
    ? Array.isArray(tag) ? tag.map((t) => ({ "#t": [t] })) : { "#t": [tag] }
    : undefined;
  if (lang) {
    if (Array.isArray(tags)) {
      tags.push(["l", lang]);
    }
  }

  const filters: NDKFilter[] = [
    {
      kinds: [NDKKind.Video, NDKKind.HorizontalVideo],
      // limit: 25,
      ...(search ? { search } : {}),
      ...(tags ? tags : {}),
      ...(nsfw ? { "#content-warning": [""] } : {})
    }
  ];
  const events = await ndk.fetchEvents(filters, {
    // closeOnEose: true,
    cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST
  });
  if (!events || events.size === 0) {
    throw notFound();
  }

  return events;
}