import type { NDKEvent } from '@nostr-dev-kit/ndk'
import type { NostubePreset } from '@/features/presets/types/preset'

export function isPubkeyBlockedByPreset(pubkey: string | undefined, preset: NostubePreset | null): boolean {
  return Boolean(pubkey && preset?.content.blockedPubkeys.includes(pubkey))
}

export function isPubkeyMarkedNsfwByPreset(pubkey: string | undefined, preset: NostubePreset | null): boolean {
  return Boolean(pubkey && preset?.content.nsfwPubkeys.includes(pubkey))
}

export function isEventBlockedByPreset(eventId: string | undefined, preset: NostubePreset | null): boolean {
  return Boolean(eventId && preset?.content.blockedEvents.includes(eventId))
}

export function isEventHiddenByPreset(event: Pick<NDKEvent, 'id' | 'pubkey'>, preset: NostubePreset | null): boolean {
  return isEventBlockedByPreset(event.id, preset) || isPubkeyBlockedByPreset(event.pubkey, preset)
}

export function filterEventsByPreset<T extends Pick<NDKEvent, 'id' | 'pubkey'>>(
  events: T[],
  preset: NostubePreset | null,
): T[] {
  if (!preset) return events
  return events.filter((event) => !isEventHiddenByPreset(event, preset))
}
