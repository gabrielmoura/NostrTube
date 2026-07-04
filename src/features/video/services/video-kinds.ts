import { NDKKind } from '@nostr-dev-kit/ndk'
import type { VideoMetadata } from '@/store/videoUpload/useVideoUploadStore'

export type VideoContentType = 'auto' | 'normal' | 'short'

export const NORMAL_VIDEO_KIND = 34235
export const SHORT_VIDEO_KIND = 34236
export const LEGACY_NORMAL_VIDEO_KIND = 21
export const LEGACY_SHORT_VIDEO_KIND = 22
export const SHORT_MAX_DURATION_SECONDS = 180
export const SHORT_MAX_ASPECT_RATIO = 0.75

export const NORMAL_VIDEO_EVENT_KINDS = [
  NDKKind.Video,
  NDKKind.HorizontalVideo,
  LEGACY_NORMAL_VIDEO_KIND,
  NORMAL_VIDEO_KIND,
]

export const SHORT_VIDEO_EVENT_KINDS = [LEGACY_SHORT_VIDEO_KIND, SHORT_VIDEO_KIND]

export const ALL_VIDEO_EVENT_KINDS = [...NORMAL_VIDEO_EVENT_KINDS, ...SHORT_VIDEO_EVENT_KINDS]

/** @deprecated Use NORMAL_VIDEO_EVENT_KINDS, SHORT_VIDEO_EVENT_KINDS or ALL_VIDEO_EVENT_KINDS explicitly. */
export const VIDEO_EVENT_KINDS = ALL_VIDEO_EVENT_KINDS

/** NIP-53: Live Streaming Event */
export const LIVE_EVENT_KIND = 30311

function uniqueKinds(kinds: number[]): number[] {
  return Array.from(new Set(kinds))
}

export const UNIQUE_NORMAL_VIDEO_EVENT_KINDS = uniqueKinds(NORMAL_VIDEO_EVENT_KINDS)
export const UNIQUE_SHORT_VIDEO_EVENT_KINDS = uniqueKinds(SHORT_VIDEO_EVENT_KINDS)
export const UNIQUE_ALL_VIDEO_EVENT_KINDS = uniqueKinds(ALL_VIDEO_EVENT_KINDS)

export function isNormalVideoKind(kind?: number | null): boolean {
  return typeof kind === 'number' && UNIQUE_NORMAL_VIDEO_EVENT_KINDS.includes(kind)
}

export function isShortVideoKind(kind?: number | null): boolean {
  return typeof kind === 'number' && UNIQUE_SHORT_VIDEO_EVENT_KINDS.includes(kind)
}

export function parseVideoDimensions(dim?: string): { width: number; height: number } | null {
  const match = dim?.trim().match(/^(\d+)x(\d+)$/i)
  if (!match) return null

  const width = Number.parseInt(match[1], 10)
  const height = Number.parseInt(match[2], 10)
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null
  }

  return { width, height }
}

export function isAutoShortVideo(draft: Partial<VideoMetadata>): boolean {
  const dimensions = parseVideoDimensions(draft.dim ?? draft.imetaVariants?.[0]?.dim ?? draft.imetaVideo?.dim)
  const durationValue = draft.duration ?? Number(draft.imetaVariants?.[0]?.duration ?? draft.imetaVideo?.duration)

  if (!dimensions || !Number.isFinite(durationValue) || durationValue <= 0) {
    return false
  }

  const aspectRatio = dimensions.width / dimensions.height
  return (
    dimensions.height > dimensions.width &&
    aspectRatio <= SHORT_MAX_ASPECT_RATIO &&
    durationValue <= SHORT_MAX_DURATION_SECONDS
  )
}

export function resolvePublishVideoKind(draft: Partial<VideoMetadata>): number {
  if (draft.contentType === 'short') return SHORT_VIDEO_KIND
  if (draft.contentType === 'normal') return NORMAL_VIDEO_KIND
  return isAutoShortVideo(draft) ? SHORT_VIDEO_KIND : NORMAL_VIDEO_KIND
}
