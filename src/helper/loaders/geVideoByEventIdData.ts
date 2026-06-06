import NDK__default from "@nostr-dev-kit/ndk";
import { notFound } from "@tanstack/react-router";
import { fetchVideoEventByReference } from "@/features/nostr/services/ndk-query.service";

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

  const event = await fetchVideoEventByReference(ndk, eventId);
  if (!event) throw notFound();
  return event;
}
