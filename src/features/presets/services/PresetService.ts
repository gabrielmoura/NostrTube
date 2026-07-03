import type NDK from '@nostr-dev-kit/ndk'
import type { NDKEvent, NDKFilter } from '@nostr-dev-kit/ndk'
import { PRESET_D_TAG, PRESET_EVENT_KIND, PresetError, type NostubePreset } from '@/features/presets/types/preset'
import { fetchEventsCached, getDefaultVideoLookupRelayUrls } from '@/features/nostr/services/ndk-query.service'
import { dedupePresetsByPubkey, parsePresetEvent, selectNewestPresetEvent } from '@/features/presets/services/PresetParser'

function getPresetRelayUrls(ndk: NDK): string[] | undefined {
  const poolRelays = Array.from(ndk.pool?.relays?.keys?.() ?? [])
  const defaults = getDefaultVideoLookupRelayUrls() ?? []
  const relays = Array.from(new Set([...poolRelays, ...defaults])).filter(Boolean)
  return relays.length ? relays : undefined
}

function parsePresetEvents(events: Iterable<NDKEvent>): NostubePreset[] {
  const presets: NostubePreset[] = []

  for (const event of events) {
    try {
      presets.push(parsePresetEvent(event))
    } catch (error: unknown) {
      if (import.meta.env.DEV) {
        console.warn('Ignoring invalid preset event', PresetError.fromUnknown(error, 'INVALID_PRESET_EVENT'))
      }
    }
  }

  return dedupePresetsByPubkey(presets)
}

export const PresetService = {
  async listPresets(ndk: NDK): Promise<NostubePreset[]> {
    const filter: NDKFilter = {
      kinds: [PRESET_EVENT_KIND],
      '#d': [PRESET_D_TAG],
      limit: 100,
    }

    try {
      const events = await fetchEventsCached(ndk, filter, {
        mode: 'cache-first',
        closeOnEose: true,
        relayUrls: getPresetRelayUrls(ndk),
      })
      return parsePresetEvents(events)
    } catch (error: unknown) {
      throw PresetError.fromUnknown(error, 'PRESET_FETCH_FAILED', 'Failed to fetch presets.')
    }
  },

  async fetchPresetByPubkey(ndk: NDK, pubkey: string): Promise<NostubePreset> {
    const filter: NDKFilter = {
      kinds: [PRESET_EVENT_KIND],
      authors: [pubkey],
      '#d': [PRESET_D_TAG],
      limit: 10,
    }

    try {
      const events = await fetchEventsCached(ndk, filter, {
        mode: 'cache-first',
        closeOnEose: true,
        relayUrls: getPresetRelayUrls(ndk),
      })
      const newest = selectNewestPresetEvent(events)

      if (!newest) {
        throw new PresetError('Preset not found.', 'PRESET_NOT_FOUND')
      }

      return parsePresetEvent(newest)
    } catch (error: unknown) {
      throw PresetError.fromUnknown(error, 'PRESET_FETCH_FAILED', 'Failed to fetch preset.')
    }
  },
}
