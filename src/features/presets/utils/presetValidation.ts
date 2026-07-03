import { z } from 'zod'
import type { NostubePresetContent, PresetValidationWarning } from '@/features/presets/types/preset'

export const HEX_64_REGEX = /^[0-9a-f]{64}$/i

export const PRESET_LIMITS = {
  contentMaxBytes: 64_000,
  relays: 30,
  pubkeys: 1_000,
  events: 1_000,
  dvmPubkeys: 100,
} as const

const rawPresetContentSchema = z.object({
  defaultRelays: z.array(z.unknown()).default([]),
  defaultBlossomProxy: z.unknown().optional(),
  defaultThumbResizeServer: z.unknown().optional(),
  blockedPubkeys: z.array(z.unknown()).default([]),
  nsfwPubkeys: z.array(z.unknown()).default([]),
  blockedEvents: z.array(z.unknown()).default([]),
  defaultTranscodeDvmPubkeys: z.array(z.unknown()).optional(),
  defaultFeedDvmPubkeys: z.array(z.unknown()).optional(),
})

export function isHex64(value: unknown): value is string {
  return typeof value === 'string' && HEX_64_REGEX.test(value)
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export function isValidWssRelayUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'wss:'
  } catch {
    return false
  }
}

function normalizeStringArray(values: unknown[], limit: number) {
  return values
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, limit)
}

function addIgnoredWarning(
  warnings: PresetValidationWarning[],
  field: PresetValidationWarning['field'],
  originalCount: number,
  acceptedCount: number,
  message: string,
) {
  const ignoredCount = Math.max(0, originalCount - acceptedCount)
  if (ignoredCount > 0) {
    warnings.push({ field, message, ignoredCount })
  }
}

export function parsePresetContent(content: string): {
  content: NostubePresetContent
  warnings: PresetValidationWarning[]
} {
  const contentBytes = new TextEncoder().encode(content).byteLength
  if (contentBytes > PRESET_LIMITS.contentMaxBytes) {
    throw new Error('Preset content is too large')
  }

  const parsedJson: unknown = JSON.parse(content)
  const parsed = rawPresetContentSchema.safeParse(parsedJson)

  if (!parsed.success) {
    throw new Error('Preset content shape is invalid')
  }

  const warnings: PresetValidationWarning[] = []
  const raw = parsed.data

  const relayCandidates = normalizeStringArray(raw.defaultRelays, PRESET_LIMITS.relays)
  const defaultRelays = Array.from(new Set(relayCandidates.filter(isValidWssRelayUrl)))
  addIgnoredWarning(
    warnings,
    'defaultRelays',
    raw.defaultRelays.length,
    defaultRelays.length,
    'Some relay URLs were ignored.',
  )

  const blockedPubkeys = Array.from(new Set(normalizeStringArray(raw.blockedPubkeys, PRESET_LIMITS.pubkeys).filter(isHex64)))
  addIgnoredWarning(
    warnings,
    'blockedPubkeys',
    raw.blockedPubkeys.length,
    blockedPubkeys.length,
    'Some blocked pubkeys were ignored.',
  )

  const nsfwPubkeys = Array.from(new Set(normalizeStringArray(raw.nsfwPubkeys, PRESET_LIMITS.pubkeys).filter(isHex64)))
  addIgnoredWarning(
    warnings,
    'nsfwPubkeys',
    raw.nsfwPubkeys.length,
    nsfwPubkeys.length,
    'Some NSFW pubkeys were ignored.',
  )

  const blockedEvents = Array.from(new Set(normalizeStringArray(raw.blockedEvents, PRESET_LIMITS.events).filter(isHex64)))
  addIgnoredWarning(
    warnings,
    'blockedEvents',
    raw.blockedEvents.length,
    blockedEvents.length,
    'Some blocked events were ignored.',
  )

  const defaultTranscodeDvmPubkeys = raw.defaultTranscodeDvmPubkeys
    ? Array.from(new Set(normalizeStringArray(raw.defaultTranscodeDvmPubkeys, PRESET_LIMITS.dvmPubkeys).filter(isHex64)))
    : undefined
  if (raw.defaultTranscodeDvmPubkeys) {
    addIgnoredWarning(
      warnings,
      'defaultTranscodeDvmPubkeys',
      raw.defaultTranscodeDvmPubkeys.length,
      defaultTranscodeDvmPubkeys?.length ?? 0,
      'Some transcode DVM pubkeys were ignored.',
    )
  }

  const defaultFeedDvmPubkeys = raw.defaultFeedDvmPubkeys
    ? Array.from(new Set(normalizeStringArray(raw.defaultFeedDvmPubkeys, PRESET_LIMITS.dvmPubkeys).filter(isHex64)))
    : undefined
  if (raw.defaultFeedDvmPubkeys) {
    addIgnoredWarning(
      warnings,
      'defaultFeedDvmPubkeys',
      raw.defaultFeedDvmPubkeys.length,
      defaultFeedDvmPubkeys?.length ?? 0,
      'Some feed DVM pubkeys were ignored.',
    )
  }

  const defaultBlossomProxy =
    typeof raw.defaultBlossomProxy === 'string' && isValidHttpUrl(raw.defaultBlossomProxy.trim())
      ? raw.defaultBlossomProxy.trim()
      : undefined
  if (raw.defaultBlossomProxy && !defaultBlossomProxy) {
    warnings.push({ field: 'defaultBlossomProxy', message: 'Blossom proxy URL was ignored.', ignoredCount: 1 })
  }

  const defaultThumbResizeServer =
    typeof raw.defaultThumbResizeServer === 'string' && isValidHttpUrl(raw.defaultThumbResizeServer.trim())
      ? raw.defaultThumbResizeServer.trim()
      : undefined
  if (raw.defaultThumbResizeServer && !defaultThumbResizeServer) {
    warnings.push({ field: 'defaultThumbResizeServer', message: 'Thumbnail server URL was ignored.', ignoredCount: 1 })
  }

  return {
    content: {
      defaultRelays,
      defaultBlossomProxy,
      defaultThumbResizeServer,
      blockedPubkeys,
      nsfwPubkeys,
      blockedEvents,
      defaultTranscodeDvmPubkeys,
      defaultFeedDvmPubkeys,
    },
    warnings,
  }
}
