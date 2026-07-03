import { PresetError, type CachedPreset, type NostubePreset } from '@/features/presets/types/preset'
import { isHex64 } from '@/features/presets/utils/presetValidation'

export const SELECTED_PRESET_KEY = 'nostube:selected-preset-pubkey:v1'
export const PRESET_CACHE_PREFIX = 'nostube:preset-cache:v1:'

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function parseCachedPreset(raw: string | null): CachedPreset | null {
  if (!raw) return null
  const parsed: unknown = JSON.parse(raw)

  if (
    typeof parsed === 'object' &&
    parsed !== null &&
    'preset' in parsed &&
    'cachedAt' in parsed &&
    typeof parsed.cachedAt === 'number'
  ) {
    return parsed as CachedPreset
  }

  return null
}

export const PresetCacheService = {
  getSelectedPresetPubkey(): string | null {
    try {
      if (!canUseLocalStorage()) return null
      const pubkey = localStorage.getItem(SELECTED_PRESET_KEY)
      return isHex64(pubkey) ? pubkey.toLowerCase() : null
    } catch (error: unknown) {
      throw PresetError.fromUnknown(error, 'PRESET_CACHE_FAILED', 'Failed to read selected preset.')
    }
  },

  setSelectedPresetPubkey(pubkey: string): void {
    try {
      if (!canUseLocalStorage()) return
      localStorage.setItem(SELECTED_PRESET_KEY, pubkey)
    } catch (error: unknown) {
      throw PresetError.fromUnknown(error, 'PRESET_CACHE_FAILED', 'Failed to save selected preset.')
    }
  },

  clearSelectedPresetPubkey(): void {
    try {
      if (!canUseLocalStorage()) return
      localStorage.removeItem(SELECTED_PRESET_KEY)
    } catch (error: unknown) {
      throw PresetError.fromUnknown(error, 'PRESET_CACHE_FAILED', 'Failed to clear selected preset.')
    }
  },

  getCachedPreset(pubkey: string): CachedPreset | null {
    try {
      if (!canUseLocalStorage()) return null
      return parseCachedPreset(localStorage.getItem(`${PRESET_CACHE_PREFIX}${pubkey}`))
    } catch (error: unknown) {
      throw PresetError.fromUnknown(error, 'PRESET_CACHE_FAILED', 'Failed to read preset cache.')
    }
  },

  setCachedPreset(preset: NostubePreset): void {
    try {
      if (!canUseLocalStorage()) return
      const cachedPreset: CachedPreset = { preset, cachedAt: Date.now() }
      localStorage.setItem(`${PRESET_CACHE_PREFIX}${preset.pubkey}`, JSON.stringify(cachedPreset))
    } catch (error: unknown) {
      throw PresetError.fromUnknown(error, 'PRESET_CACHE_FAILED', 'Failed to save preset cache.')
    }
  },
}
