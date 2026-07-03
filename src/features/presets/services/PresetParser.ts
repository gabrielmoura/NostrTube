import type { NDKEvent } from '@nostr-dev-kit/ndk'
import {
  PRESET_D_TAG,
  PRESET_EVENT_KIND,
  PresetError,
  type NostubePreset,
} from '@/features/presets/types/preset'
import { isHex64, parsePresetContent } from '@/features/presets/utils/presetValidation'

function getTagValue(tags: string[][], name: string): string | undefined {
  return tags.find((tag) => tag[0] === name && typeof tag[1] === 'string')?.[1]
}

export function parsePresetEvent(event: NDKEvent): NostubePreset {
  if (event.kind !== PRESET_EVENT_KIND) {
    throw new PresetError('Event kind is not a preset event.', 'INVALID_PRESET_EVENT')
  }

  if (getTagValue(event.tags, 'd') !== PRESET_D_TAG) {
    throw new PresetError('Preset event has an invalid d tag.', 'INVALID_PRESET_EVENT')
  }

  if (!isHex64(event.pubkey)) {
    throw new PresetError('Preset event has an invalid author pubkey.', 'INVALID_PRESET_EVENT')
  }

  if (event.id && !isHex64(event.id)) {
    throw new PresetError('Preset event has an invalid id.', 'INVALID_PRESET_EVENT')
  }

  if (typeof event.content !== 'string' || !event.content.trim()) {
    throw new PresetError('Preset event content is empty.', 'INVALID_PRESET_CONTENT')
  }

  try {
    const parsedContent = parsePresetContent(event.content)
    return {
      id: event.id,
      pubkey: event.pubkey.toLowerCase(),
      name: getTagValue(event.tags, 'name')?.trim() || 'NosTube preset',
      description: getTagValue(event.tags, 'description')?.trim() || '',
      createdAt: event.created_at ?? 0,
      content: parsedContent.content,
      warnings: parsedContent.warnings,
    }
  } catch (error: unknown) {
    throw PresetError.fromUnknown(error, 'INVALID_PRESET_CONTENT', 'Preset content is invalid.')
  }
}

export function selectNewestPresetEvent(events: Iterable<NDKEvent>): NDKEvent | null {
  let newest: NDKEvent | null = null

  for (const event of events) {
    if (!newest || (event.created_at ?? 0) > (newest.created_at ?? 0)) {
      newest = event
    }
  }

  return newest
}

export function dedupePresetsByPubkey(presets: NostubePreset[]): NostubePreset[] {
  const newestByPubkey = new Map<string, NostubePreset>()

  for (const preset of presets) {
    const current = newestByPubkey.get(preset.pubkey)
    if (!current || preset.createdAt > current.createdAt) {
      newestByPubkey.set(preset.pubkey, preset)
    }
  }

  return Array.from(newestByPubkey.values()).sort((left, right) => right.createdAt - left.createdAt)
}
