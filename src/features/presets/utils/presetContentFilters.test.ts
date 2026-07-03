import { describe, expect, it } from 'vitest'
import type { NostubePreset } from '@/features/presets/types/preset'
import {
  filterEventsByPreset,
  isEventBlockedByPreset,
  isPubkeyBlockedByPreset,
  isPubkeyMarkedNsfwByPreset,
} from '@/features/presets/utils/presetContentFilters'

const blockedPubkey = 'a'.repeat(64)
const nsfwPubkey = 'b'.repeat(64)
const blockedEvent = 'c'.repeat(64)

const preset: NostubePreset = {
  id: 'd'.repeat(64),
  pubkey: 'e'.repeat(64),
  name: 'Preset',
  description: '',
  createdAt: 1,
  content: {
    defaultRelays: [],
    blockedPubkeys: [blockedPubkey],
    nsfwPubkeys: [nsfwPubkey],
    blockedEvents: [blockedEvent],
  },
}

describe('presetContentFilters', () => {
  it('matches blocked pubkeys, nsfw pubkeys and blocked events', () => {
    expect(isPubkeyBlockedByPreset(blockedPubkey, preset)).toBe(true)
    expect(isPubkeyMarkedNsfwByPreset(nsfwPubkey, preset)).toBe(true)
    expect(isEventBlockedByPreset(blockedEvent, preset)).toBe(true)
  })

  it('filters events blocked by pubkey or event id', () => {
    const visible = { id: '1'.repeat(64), pubkey: '2'.repeat(64) }
    const blockedByPubkey = { id: '3'.repeat(64), pubkey: blockedPubkey }
    const blockedById = { id: blockedEvent, pubkey: '4'.repeat(64) }

    expect(filterEventsByPreset([visible, blockedByPubkey, blockedById], preset)).toEqual([visible])
  })
})
