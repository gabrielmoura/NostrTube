import type { NDKEvent } from '@nostr-dev-kit/ndk'
import { describe, expect, it } from 'vitest'
import { dedupePresetsByPubkey, parsePresetEvent } from '@/features/presets/services/PresetParser'
import { PRESET_D_TAG, PRESET_EVENT_KIND, PresetError } from '@/features/presets/types/preset'

const PUBKEY = 'a'.repeat(64)
const EVENT_ID = 'b'.repeat(64)

function makePresetEvent(overrides: Partial<NDKEvent> = {}): NDKEvent {
  return {
    id: EVENT_ID,
    pubkey: PUBKEY,
    kind: PRESET_EVENT_KIND,
    created_at: 123,
    tags: [
      ['d', PRESET_D_TAG],
      ['name', 'Official'],
      ['description', 'Curated defaults'],
    ],
    content: JSON.stringify({
      defaultRelays: ['wss://relay.example.com', 'ws://ignored.example.com'],
      defaultBlossomProxy: 'https://blossom.example.com',
      defaultThumbResizeServer: 'https://thumb.example.com',
      blockedPubkeys: ['c'.repeat(64), 'invalid'],
      nsfwPubkeys: ['d'.repeat(64)],
      blockedEvents: ['e'.repeat(64)],
      defaultTranscodeDvmPubkeys: ['f'.repeat(64)],
      defaultFeedDvmPubkeys: ['1'.repeat(64)],
    }),
    ...overrides,
  } as NDKEvent
}

describe('PresetParser', () => {
  it('parses a valid preset event and ignores invalid entries individually', () => {
    const preset = parsePresetEvent(makePresetEvent())

    expect(preset).toMatchObject({
      id: EVENT_ID,
      pubkey: PUBKEY,
      name: 'Official',
      description: 'Curated defaults',
      createdAt: 123,
    })
    expect(preset.content.defaultRelays).toEqual(['wss://relay.example.com'])
    expect(preset.content.blockedPubkeys).toEqual(['c'.repeat(64)])
    expect(preset.warnings?.length).toBeGreaterThan(0)
  })

  it('throws a typed error for invalid JSON', () => {
    expect(() => parsePresetEvent(makePresetEvent({ content: '{' }))).toThrow(PresetError)
  })

  it('throws a typed error for invalid pubkey', () => {
    expect(() => parsePresetEvent(makePresetEvent({ pubkey: 'invalid' }))).toThrow(PresetError)
  })

  it('deduplicates presets by pubkey using the newest created_at', () => {
    const older = parsePresetEvent(
      makePresetEvent({
        created_at: 1,
        content: JSON.stringify({
          defaultRelays: [],
          blockedPubkeys: [],
          nsfwPubkeys: [],
          blockedEvents: [],
        }),
      }),
    )
    const newer = parsePresetEvent(
      makePresetEvent({
        created_at: 2,
        content: JSON.stringify({
          defaultRelays: ['wss://new.example.com'],
          blockedPubkeys: [],
          nsfwPubkeys: [],
          blockedEvents: [],
        }),
      }),
    )

    expect(dedupePresetsByPubkey([older, newer])).toEqual([newer])
  })
})
