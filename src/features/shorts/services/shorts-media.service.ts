import type { NDKEvent } from '@nostr-dev-kit/ndk'
import {
  getPreferredVariant,
  normalizeVideoEventAssets,
  type VideoVariant,
} from '@/features/video/services/video-imeta.service'
import { getVideoRouteReference } from '@/features/video/services/video-reference.service'
import { getVideoDetails } from '@/helper/format'
import { getTagValue } from '@/helper/nostrTags'

export interface ShortMediaSource {
  url: string
  mimeType?: string
  poster?: string
  variant?: VideoVariant
}

export interface ShortVideoViewModel {
  id: string
  event: NDKEvent
  title: string
  summary: string
  poster?: string
  routeReference: string
  source: ShortMediaSource | null
}

function getLegacySource(event: NDKEvent): ShortMediaSource | null {
  const url = getTagValue('url', event.tags) || getTagValue('src', event.tags)
  if (!url) return null

  return {
    url,
    mimeType: getTagValue('m', event.tags),
    poster: getTagValue('thumb', event.tags) || getTagValue('image', event.tags),
  }
}

export function toShortVideoViewModel(event: NDKEvent): ShortVideoViewModel {
  const details = getVideoDetails(event)
  const assets = normalizeVideoEventAssets(event.tags)
  const variant = getPreferredVariant(assets.variants)
  const candidate = variant?.candidates[0] ?? null
  const legacySource = candidate ? null : getLegacySource(event)
  const source: ShortMediaSource | null = candidate
    ? {
        url: candidate.url,
        mimeType: candidate.mimeType,
        poster: variant?.posterUrls[0] ?? details.thumbnail[0],
        variant: variant ?? undefined,
      }
    : legacySource

  return {
    id: event.id,
    event,
    title: Array.isArray(details.title) ? (details.title[0] ?? 'Untitled') : details.title,
    summary: Array.isArray(details.summary) ? details.summary.join(' ') : details.summary,
    poster: source?.poster ?? details.thumbnail[0],
    routeReference: getVideoRouteReference(event),
    source,
  }
}
