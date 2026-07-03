// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { PresetCacheService } from '@/features/presets/services/PresetCacheService'
import type { NostubePreset } from '@/features/presets/types/preset'

const PUBKEY = 'a'.repeat(64)

const preset: NostubePreset = {
  id: 'b'.repeat(64),
  pubkey: PUBKEY,
  name: 'Cached',
  description: '',
  createdAt: 1,
  content: {
    defaultRelays: [],
    blockedPubkeys: [],
    nsfwPubkeys: [],
    blockedEvents: [],
  },
}

describe('PresetCacheService', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('persists selected preset pubkey', () => {
    PresetCacheService.setSelectedPresetPubkey(PUBKEY)
    expect(PresetCacheService.getSelectedPresetPubkey()).toBe(PUBKEY)
  })

  it('ignores invalid selected preset pubkey', () => {
    localStorage.setItem('nostube:selected-preset-pubkey:v1', 'invalid')
    expect(PresetCacheService.getSelectedPresetPubkey()).toBeNull()
  })

  it('persists cached preset payloads', () => {
    PresetCacheService.setCachedPreset(preset)
    expect(PresetCacheService.getCachedPreset(PUBKEY)?.preset).toEqual(preset)
  })
})
