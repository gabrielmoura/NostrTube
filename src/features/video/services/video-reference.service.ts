import type { NDKEvent } from "@nostr-dev-kit/ndk";

export interface VideoReference {
  eventId: string;
  eventAddress?: string;
}

export function getVideoReference(event: NDKEvent): VideoReference {
  const identifier = event.dTag || event.tagValue("d") || undefined;

  return {
    eventId: event.id,
    eventAddress: identifier ? `${event.kind}:${event.pubkey}:${identifier}` : undefined
  };
}
