import NDK__default, { type NDKFilter, NDKKind } from "@nostr-dev-kit/ndk";
import { nip19 } from "nostr-tools";
import { NDKSubscriptionCacheUsage } from "@nostr-dev-kit/ndk-hooks";
import { notFound } from "@tanstack/react-router";

export type GeVideoByEventIdDataParams = {
  ndk: NDK__default;
  eventId: string;
};

export async function geVideoByEventIdData({ ndk, eventId }: GeVideoByEventIdDataParams) {
  if (!eventId) {
    throw new Error("No ID provided");
  }

  if (eventId.length <= 5) {
    throw new Error("ID invalid");
  }

  let filters: NDKFilter[] = [];

  if (eventId.startsWith("n")) {
    const { type, data } = nip19.decode(eventId);

    switch (type) {
      case "note":
        filters = [
          {
            ids: [data],
            limit: 1
          }
        ];
        break;
      case "naddr":
        filters = [
          {
            authors: [data.pubkey],
            kinds: [data.kind],
            "#d": [data.identifier],
            limit: 1
          }
        ];
        break;
      case "nevent":
        filters = [
          {
            ids: [data.id],
            authors: [data.author as string],
            limit: 1
          }
        ];
        break;
      default:
        throw new Error(`Invalid ID provided: ${type} ${JSON.stringify(data)}`);
    }

  } else if (eventId.length === 64) {
    filters = [
      {
        ids: [eventId],
        limit: 1
      }
    ];
  } else {
    filters = [
      {
        "#d": [eventId],
        kinds: [NDKKind.Video, NDKKind.HorizontalVideo],
        limit: 1
      }
    ];
  }

  const event = await ndk.fetchEvent(filters, {
    closeOnEose: true,
    cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST
  });
  if (!event) throw notFound();
  return event;
}