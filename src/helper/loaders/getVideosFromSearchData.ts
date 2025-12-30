import NDK__default, { NDKEvent, type NDKFilter, NDKKind, NDKSubscriptionCacheUsage } from "@nostr-dev-kit/ndk";
import { z } from "zod";
import { nip19 } from "nostr-tools";
import { startOfDay, subMonths, subWeeks, subYears } from "date-fns";
import { sortEventsByImages } from "@/helper/format.ts";
import { notFound } from "@tanstack/react-router";
import { deduplicateEvents } from "@/helper/deduplicateEvents.ts";

// --- Erros Personalizados ---
export class VideoSearchError extends Error {
  // @ts-expect-error code is valid
  constructor(message: string, public code = "SEARCH_ERROR") {
    super(message);
    this.name = "VideoSearchError";
  }
}

export const eventSearchSchema = z.object({
  search: z.string().optional(),
  tag: z.union([z.string(), z.array(z.string())]).optional(),
  nsfw: z.boolean().optional(),
  lang: z.string().optional(),
  author: z.string().optional(),
  timeRange: z.enum(["all", "today", "week", "month", "year"]).optional().default("all")
});

export type eventSearchType = z.infer<typeof eventSearchSchema>;

/**
 * Converte npub ou valida hex para retornar um array de pubkeys
 */
function resolveAuthorPubkey(author?: string): string[] | undefined {
  if (!author) return undefined;
  try {
    if (author.startsWith("npub")) {
      const { data } = nip19.decode(author);
      return [data as string];
    }
    if (author.length === 64) return [author];
    return undefined;
  } catch (e) {
    console.error("Erro ao decodificar autor:", e);
    return undefined;
  }
}

/**
 * Calcula o timestamp 'since' baseado no range
 */
function calculateSince(timeRange: eventSearchType["timeRange"]): number | undefined {
  if (!timeRange || timeRange === "all") return undefined;

  const now = new Date();
  let date: Date;

  switch (timeRange) {
    case "today":
      date = startOfDay(now);
      break;
    case "week":
      date = subWeeks(now, 1);
      break;
    case "month":
      date = subMonths(now, 1);
      break;
    case "year":
      date = subYears(now, 1);
      break;
    default:
      return undefined;
  }
  return Math.floor(date.getTime() / 1000);
}

export async function getVideosFromSearchData({
                                                ndk, search, nsfw, tag, lang, author, timeRange, until
                                              }: eventSearchType & {
  ndk: NDK__default,
  until?: number
}): Promise<NDKEvent[]> {

  const filter: NDKFilter = {
    kinds: [NDKKind.Video, NDKKind.HorizontalVideo],
    limit: 40 // Aumentamos um pouco o limite para compensar as deduplicações
  };

  if (search) {
    filter.search = search;
    filter["#t"] = [search];
  }
  ;
  if (nsfw) filter["#content-warning"] = [""];
  if (tag) filter["#t"] = Array.isArray(tag) ? tag : [tag];
  if (lang && lang !== "all") filter["#l"] = [lang];

  filter.authors = resolveAuthorPubkey(author);
  filter.since = calculateSince(timeRange);
  if (until) filter.until = until;

  try {
    const eventsSet = await ndk.fetchEvents(filter, {
      closeOnEose: false,
      cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
      relayUrls: import.meta.env.VITE_NOSTR_SEARCH_RELAYS
    });

    const rawEvents = Array.from(eventsSet);

    // 1. Aplicar Deduplicação via função isolada
    const uniqueEvents = deduplicateEvents(rawEvents);

    // 2. Validação de existência
    if (uniqueEvents.length === 0 && !until) {
      throw notFound();
    }

    // 3. Processamento Final (Ordenação)
    return uniqueEvents.sort(sortEventsByImages);

  } catch (error) {
    if (error instanceof Error && error.name === "NotFoundError") throw error;

    throw new VideoSearchError(
      "Erro ao processar busca de vídeos",
      "FETCH_ERROR"
    );
  }
}