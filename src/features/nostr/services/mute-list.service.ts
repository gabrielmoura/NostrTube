import NDK, { NDKEvent } from '@nostr-dev-kit/ndk'
import { fetchEventCached } from '@/features/nostr/services/ndk-query.service'
import { nostrNow } from '@/helper/date'
import type { NostrTag } from '@/helper/nostrTags'

export const MUTE_LIST_KIND = 10000

export type MuteListItem =
  | { tagName: 'p'; value: string; relayHint?: string }
  | { tagName: 'e'; value: string; relayHint?: string }
  | { tagName: 't'; value: string }
  | { tagName: 'word'; value: string }

export interface AddMuteListItemParams {
  ndk: NDK
  pubkey: string
  item: MuteListItem
}

export interface AddMuteListItemResult {
  event: NDKEvent | null
  alreadyMuted: boolean
}

export interface ParsedMuteList {
  pubkeys: Set<string>
  events: Set<string>
  hashtags: Set<string>
  words: string[]
}

function buildMuteTag(item: MuteListItem): string[] {
  if ('relayHint' in item && item.relayHint) {
    return [item.tagName, item.value, item.relayHint]
  }

  return [item.tagName, item.value]
}

function hasMuteTag(tags: string[][], item: MuteListItem): boolean {
  return tags.some((tag) => tag[0] === item.tagName && tag[1] === item.value)
}

function normalizeTags(tags: string[][] | undefined): string[][] {
  return (tags ?? [])
    .filter((tag) => Array.isArray(tag) && typeof tag[0] === 'string' && typeof tag[1] === 'string')
    .map((tag) => [...tag])
}

export function parseMuteListTags(tags: NostrTag[] | string[][]): ParsedMuteList {
  const pubkeys = new Set<string>()
  const events = new Set<string>()
  const hashtags = new Set<string>()
  const words: string[] = []

  for (const tag of tags) {
    const [name, value] = tag
    if (!value) continue

    if (name === 'p') {
      pubkeys.add(value)
    } else if (name === 'e') {
      events.add(value)
    } else if (name === 't') {
      hashtags.add(value.toLowerCase())
    } else if (name === 'word') {
      words.push(value.toLowerCase())
    }
  }

  return { pubkeys, events, hashtags, words }
}

export async function addMuteListItem({ ndk, pubkey, item }: AddMuteListItemParams): Promise<AddMuteListItemResult> {
  const existing = await fetchEventCached(
    ndk,
    {
      kinds: [MUTE_LIST_KIND],
      authors: [pubkey],
      limit: 1,
    },
    {
      mode: 'parallel',
      closeOnEose: true,
    },
  )
  const tags = normalizeTags(existing?.tags)

  if (hasMuteTag(tags, item)) {
    return { event: existing, alreadyMuted: true }
  }

  const event = new NDKEvent(ndk)
  event.kind = MUTE_LIST_KIND
  event.pubkey = pubkey
  event.created_at = nostrNow()
  event.content = existing?.content ?? ''
  event.tags = [...tags, buildMuteTag(item)]

  await event.sign()
  await event.publish()

  return { event, alreadyMuted: false }
}
