export const PRESET_EVENT_KIND = 30078
export const PRESET_D_TAG = 'nostrtube-presets'

export interface NostubePresetContent {
  defaultRelays: string[]
  defaultBlossomProxy?: string
  defaultThumbResizeServer?: string
  blockedPubkeys: string[]
  nsfwPubkeys: string[]
  blockedEvents: string[]
  defaultTranscodeDvmPubkeys?: string[]
  defaultFeedDvmPubkeys?: string[]
}

export interface NostubePreset {
  id: string
  pubkey: string
  name: string
  description: string
  createdAt: number
  content: NostubePresetContent
  warnings?: PresetValidationWarning[]
}

export interface PresetValidationWarning {
  field: keyof NostubePresetContent | 'content' | 'tags'
  message: string
  ignoredCount?: number
}

export type PresetErrorCode =
  | 'INVALID_ENV_PUBKEY'
  | 'INVALID_PRESET_EVENT'
  | 'INVALID_PRESET_CONTENT'
  | 'PRESET_NOT_FOUND'
  | 'PRESET_FETCH_FAILED'
  | 'PRESET_CACHE_FAILED'

export class PresetError extends Error {
  constructor(
    message: string,
    public readonly code: PresetErrorCode,
    public readonly cause?: unknown,
  ) {
    super(message)
    this.name = 'PresetError'
  }

  static fromUnknown(error: unknown, code: PresetErrorCode, fallbackMessage = 'Preset operation failed') {
    if (error instanceof PresetError) return error
    if (error instanceof Error) return new PresetError(error.message, code, error)
    return new PresetError(fallbackMessage, code, error)
  }
}

export type PresetStatus = 'idle' | 'loading' | 'loaded' | 'refreshing' | 'error'

export interface PresetState {
  selectedPresetPubkey: string
  activePreset: NostubePreset | null
  availablePresets: NostubePreset[]
  status: PresetStatus
  error: PresetError | null
  isUsingCachedPreset: boolean
}

export interface CachedPreset {
  preset: NostubePreset
  cachedAt: number
}
