import { nip19 } from 'nostr-tools'
import { PresetError } from '@/features/presets/types/preset'
import { isHex64 } from '@/features/presets/utils/presetValidation'

export const DEFAULT_PRESET_PUBKEY_FALLBACK = 'f4628ab08404add997cae15e249208e61e56330cb3afbcc3b80b7d1fc935903f'

function decodeNpub(value: string): string | null {
  if (!value.startsWith('npub1')) return null

  try {
    const decoded = nip19.decode(value)
    return decoded.type === 'npub' && isHex64(decoded.data) ? decoded.data.toLowerCase() : null
  } catch {
    return null
  }
}

export function normalizePresetPubkey(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()

  if (isHex64(trimmed)) return trimmed.toLowerCase()
  return decodeNpub(trimmed)
}

export function getDefaultPresetPubkey(): string {
  const envPubkey = import.meta.env.VITE_DEFAULT_PRESET_PUBKEY?.trim()
  const normalizedPubkey = normalizePresetPubkey(envPubkey)

  if (normalizedPubkey) {
    return normalizedPubkey
  }

  if (import.meta.env.DEV && envPubkey) {
    console.warn(
      new PresetError(
        'Invalid VITE_DEFAULT_PRESET_PUBKEY. Falling back to bundled default preset pubkey.',
        'INVALID_ENV_PUBKEY',
      ),
    )
  }

  if (import.meta.env.DEV && !envPubkey) {
    console.warn('VITE_DEFAULT_PRESET_PUBKEY is not set. Falling back to bundled default preset pubkey.')
  }

  return DEFAULT_PRESET_PUBKEY_FALLBACK
}
