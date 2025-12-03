// --> Adiciona Evento a uma lista
import NDK__default, { NDKKind } from "@nostr-dev-kit/ndk";
import { NDKEvent, NDKSubscriptionCacheUsage } from "@nostr-dev-kit/ndk-hooks";
import { ulid } from "ulid";
import { nostrNow } from "@/helper/date.ts";
import type { StampedEvent } from "@welshman/util";

export type AddToPlayListDataParams = {
  ndk: NDK__default;
  playListId: string;
  eventIdTag: string
};

export async function addToPlayList({ ndk, playListId, eventIdTag }: AddToPlayListDataParams) {
  // Busca Lista, caso não exista cria uma e adicione o evento ao final da lista.
  if (!playListId) {
    throw new Error("No PlayList ID provided");
  }
  if (!eventIdTag) {
    throw new Error("No Event ID provided");
  }
  const eventX = await ndk.fetchEvent([{
    "#d": [playListId],
    kinds: [NDKKind.VideoCurationSet],
    limit: 1,
    ids: [playListId]
  }], {
    cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST
  });

  if (eventX) {
    eventX.tags.push(["e", eventIdTag]);
    await eventX.sign();
    await eventX.publish();
    return eventX;
  } else {
    throw new Error("PlayList not found");
  }
}

export interface CreatePlayListParams {
  title: string;
  description?: string;
  imageUrl?: string;
  events?: NDKEvent[];
}

export function createPlayList({ title, description, events, imageUrl }: CreatePlayListParams): StampedEvent {
  return {
    created_at: nostrNow(),
    kind: NDKKind.VideoCurationSet,
    content: description || "",
    tags: [
      ["title", title],
      ["d", `${import.meta.env.VITE_APP_NAME}-playlist-${ulid()}`],
      ["description", description || ""],
      ...(events ? events.map(e => ["e", `${e.kind}:${e.id}`]) : []),
      ...(imageUrl ? [["image", imageUrl]] : [])
    ]
  };
}

