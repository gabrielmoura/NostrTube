import type { NDKEvent } from "@nostr-dev-kit/ndk";
import { nip19 } from "nostr-tools";

const HEX_EVENT_ID_REGEX = /^[0-9a-f]{64}$/i;

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
  const dTag = event.tagValue("d") || event.dTag;
  if (dTag && !HEX_EVENT_ID_REGEX.test(dTag)) return dTag;
  return HEX_EVENT_ID_REGEX.test(event.id) ? nip19.noteEncode(event.id) : event.encode();
}

export function getVideoRouteReferenceFromParts({ eventId, dTag }: { eventId: string; dTag?: string }): string {
  if (dTag && !HEX_EVENT_ID_REGEX.test(dTag)) return dTag;
  return HEX_EVENT_ID_REGEX.test(eventId) ? nip19.noteEncode(eventId) : eventId;
}

export function getVideoEventIdentifier(event: NDKEvent): string {
  return getVideoRouteReference(event) || event.id;
}

export function getVideoWatchUrl(event: NDKEvent): string {
  return `/v/${encodeURIComponent(getVideoRouteReference(event))}`;
}
