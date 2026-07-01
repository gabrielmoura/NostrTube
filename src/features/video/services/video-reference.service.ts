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

export function getVideoRouteReference(event: NDKEvent): string {
  return event.tagValue("d") || event.dTag || event.encode();
}

export function getVideoEventIdentifier(event: NDKEvent): string {
  return event.tagValue("d") || event.dTag || event.encode() || event.id;
}

export function getVideoWatchUrl(event: NDKEvent): string {
  return `/v/${encodeURIComponent(getVideoRouteReference(event))}`;
}
