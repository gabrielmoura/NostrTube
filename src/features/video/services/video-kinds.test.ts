import { describe, expect, it } from 'vitest'
import { buildAddressableVideoEvent } from '@/features/upload/services/video-event-builder.service'
import {
  isAutoShortVideo,
  NORMAL_VIDEO_KIND,
  parseVideoDimensions,
  resolvePublishVideoKind,
  SHORT_VIDEO_KIND,
} from '@/features/video/services/video-kinds'
import type { VideoMetadata } from '@/store/videoUpload/useVideoUploadStore'

function makeDraft(overrides: Partial<VideoMetadata> = {}): Partial<VideoMetadata> {
  return {
    title: 'Test video',
    summary: 'A test video',
    url: 'https://example.com/video.mp4',
    thumbnail: 'https://example.com/thumb.jpg',
    imetaVideo: {
      url: 'https://example.com/video.mp4',
      m: 'video/mp4',
      image: 'https://example.com/thumb.jpg',
    } as never,
    ...overrides,
  }
}

describe('video kind helpers', () => {
  it('parses valid video dimensions', () => {
    expect(parseVideoDimensions('720x1280')).toEqual({ width: 720, height: 1280 })
  })

  it('rejects invalid video dimensions', () => {
    expect(parseVideoDimensions('1280:720')).toBeNull()
    expect(parseVideoDimensions('0x720')).toBeNull()
    expect(parseVideoDimensions(undefined)).toBeNull()
  })

  it('classifies vertical short videos in auto mode', () => {
    const draft = makeDraft({ dim: '720x1280', duration: 90 })

    expect(isAutoShortVideo(draft)).toBe(true)
    expect(resolvePublishVideoKind(draft)).toBe(SHORT_VIDEO_KIND)
  })

  it('keeps long vertical videos as normal in auto mode', () => {
    expect(resolvePublishVideoKind(makeDraft({ dim: '720x1280', duration: 240 }))).toBe(NORMAL_VIDEO_KIND)
  })

  it('keeps short horizontal videos as normal in auto mode', () => {
    expect(resolvePublishVideoKind(makeDraft({ dim: '1280x720', duration: 30 }))).toBe(NORMAL_VIDEO_KIND)
  })

  it('keeps ambiguous videos as normal in auto mode', () => {
    expect(resolvePublishVideoKind(makeDraft({ duration: 30 }))).toBe(NORMAL_VIDEO_KIND)
  })

  it('manual short overrides missing dimensions', () => {
    expect(resolvePublishVideoKind(makeDraft({ contentType: 'short' }))).toBe(SHORT_VIDEO_KIND)
  })

  it('manual normal overrides vertical short metadata', () => {
    expect(resolvePublishVideoKind(makeDraft({ contentType: 'normal', dim: '720x1280', duration: 60 }))).toBe(
      NORMAL_VIDEO_KIND,
    )
  })

  it('builds addressable video events with the resolved kind', () => {
    const normalEvent = buildAddressableVideoEvent({
      draft: makeDraft({ contentType: 'normal', dim: '720x1280', duration: 60 }),
      currentPubkey: 'f'.repeat(64),
      identifier: 'normal-video',
    })

    const shortEvent = buildAddressableVideoEvent({
      draft: makeDraft({ contentType: 'short' }),
      currentPubkey: 'f'.repeat(64),
      identifier: 'short-video',
    })

    expect(normalEvent.kind).toBe(NORMAL_VIDEO_KIND)
    expect(shortEvent.kind).toBe(SHORT_VIDEO_KIND)
  })
})
