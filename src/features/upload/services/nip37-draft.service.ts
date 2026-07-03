import NDK, { NDKEvent, type NDKUser } from '@nostr-dev-kit/ndk'
import { NORMAL_VIDEO_KIND, resolvePublishVideoKind } from '@/features/video/services/video-kinds'
import { nostrNow } from '@/helper/date'
import type { VideoMetadata } from '@/store/videoUpload/useVideoUploadStore'

export const UPLOAD_DRAFT_IDENTIFIER = 'nostrtube:new-video'
const DRAFT_WRAP_KIND = 31234
const VIDEO_KIND = NORMAL_VIDEO_KIND

export interface UploadDraftSnapshot {
  videoData: Partial<VideoMetadata>
  currentStep: 1 | 2 | 3
  updatedAt: number
  /** @deprecated Thumbnail processing is now a global upload preference. */
  preferCompression?: boolean
  thumbnailPreviewUrl?: string
}

function buildPartialVideoEvent(draft: UploadDraftSnapshot) {
  const tags: string[][] = []
  if (draft.videoData.title) tags.push(['title', draft.videoData.title])
  if (draft.videoData.thumbnail) tags.push(['thumb', draft.videoData.thumbnail])
  if (draft.videoData.language) tags.push(['l', draft.videoData.language, 'ISO-639-1'])
  if (draft.videoData.duration) tags.push(['duration', String(draft.videoData.duration)])
  draft.videoData.hashtags?.filter(Boolean).forEach((tag) => tags.push(['t', tag]))

  return {
    kind: resolvePublishVideoKind(draft.videoData),
    content: draft.videoData.summary ?? '',
    created_at: Math.floor(draft.updatedAt / 1000),
    tags,
  }
}

export async function canUseNip44Drafts(ndk?: NDK | null) {
  if (!ndk?.signer?.encryptionEnabled) return false
  try {
    const result = await ndk.signer.encryptionEnabled('nip44')
    return Array.isArray(result) ? result.includes('nip44') : Boolean(result)
  } catch {
    return false
  }
}

export async function saveVideoUploadDraft({ ndk, currentUser, snapshot }: { ndk: NDK; currentUser: NDKUser; snapshot: UploadDraftSnapshot }) {
  const draftEvent = new NDKEvent(ndk, buildPartialVideoEvent(snapshot))
  const videoKind = resolvePublishVideoKind(snapshot.videoData)
  const wrapper = new NDKEvent(ndk, {
    kind: DRAFT_WRAP_KIND,
    pubkey: currentUser.pubkey,
    created_at: nostrNow(),
    content: JSON.stringify({
      ...snapshot,
      wrappedEvent: draftEvent.rawEvent(),
    }),
    tags: [
      ['d', UPLOAD_DRAFT_IDENTIFIER],
      ['k', String(videoKind)],
      ['step', String(snapshot.currentStep)],
      ['expiration', String(nostrNow() + 60 * 60 * 24 * 90)],
    ],
  })

  wrapper.dTag = UPLOAD_DRAFT_IDENTIFIER
  await wrapper.encrypt(ndk.getUser({ pubkey: currentUser.pubkey }))
  await wrapper.publishReplaceable()
  return wrapper
}

export async function loadVideoUploadDraft({ ndk, currentUser }: { ndk: NDK; currentUser: NDKUser }) {
  const events = await ndk.fetchEvents([
    {
      kinds: [DRAFT_WRAP_KIND],
      authors: [currentUser.pubkey],
      '#d': [UPLOAD_DRAFT_IDENTIFIER],
      limit: 5,
    },
  ])

  const sorted = [...events].sort((a, b) => (b.created_at || 0) - (a.created_at || 0))

  for (const event of sorted) {
    if (!event.content) continue
    try {
      await event.decrypt(ndk.getUser({ pubkey: currentUser.pubkey }))
      const parsed = JSON.parse(event.content) as UploadDraftSnapshot
      if (parsed?.videoData) {
        return parsed
      }
    } catch {
      continue
    }
  }

  return null
}

export async function clearVideoUploadDraft({ ndk, currentUser }: { ndk: NDK; currentUser: NDKUser }) {
  const wrapper = new NDKEvent(ndk, {
    kind: DRAFT_WRAP_KIND,
    pubkey: currentUser.pubkey,
    created_at: nostrNow(),
    content: '',
      tags: [
        ['d', UPLOAD_DRAFT_IDENTIFIER],
        ['k', String(VIDEO_KIND)],
    ],
  })
  wrapper.dTag = UPLOAD_DRAFT_IDENTIFIER
  await wrapper.publishReplaceable()
}
