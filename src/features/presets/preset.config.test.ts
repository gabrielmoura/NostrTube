import { describe, expect, it } from 'vitest'
import { DEFAULT_PRESET_PUBKEY_FALLBACK, normalizePresetPubkey } from '@/features/presets/preset.config'

describe('preset config', () => {
  it('accepts hex pubkeys', () => {
    expect(normalizePresetPubkey(DEFAULT_PRESET_PUBKEY_FALLBACK)).toBe(DEFAULT_PRESET_PUBKEY_FALLBACK)
  })

  it('accepts npub pubkeys', () => {
    expect(normalizePresetPubkey('npub1733g4vyyqjkan972u90zfysguc09vvcvkwhmesacpd73ljf4jqlsrz0sq8')).toBe(
      DEFAULT_PRESET_PUBKEY_FALLBACK,
    )
  })
})
