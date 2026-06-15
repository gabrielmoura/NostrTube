import { mapImetaTag } from '@nostr-dev-kit/ndk'
import type { NDKEvent } from '@nostr-dev-kit/ndk-hooks'
import type { StateCreator } from 'zustand/index'
import type { VideoAssetSet } from '@/features/video/services/video-imeta.service'
import { normalizeVideoEventAssets } from '@/features/video/services/video-imeta.service'
import { extractTag } from '@/helper/extractTag.ts'
import { getTags, getTagValue } from '@/helper/nostrTags'
import { AgeEnum } from '@/store/store/sessionTypes.ts'

interface VideoSessionAction {
  clanSession: () => void
  setVideo: (vet: NDKEvent) => void
}

export interface VideoMetaTypes {
  event: NDKEvent
  likes?: NDKEvent[]
  comments?: NDKEvent[]
  views?: NDKEvent[]
  title: string
  summary: string
  content: string
  url: string
  fallbacks?: string[]
  nsfw: boolean
  age?: AgeEnum
  identification: string
  image?: string
  assets?: VideoAssetSet
}

export interface VideoSession {
  session?: Partial<VideoMetaTypes>
}

export type VideoStore = VideoSession & VideoSessionAction

export const createVideoSlice: StateCreator<VideoStore, [['zustand/devtools', never], ['zustand/persist', unknown]]> = (
  set,
) => {
  return {
    session: undefined,
    clanSession: () => set(() => ({ session: undefined }), false, 'clanSession'),
    setVideo: (e) => {
      const tEvent = extractTag(e.tags)
      const assets = normalizeVideoEventAssets(e.tags)
      const primaryVariant = assets.variants[0]
      let url: string
      if (getTags('imeta', e.tags).length > 0) {
        getTags('imeta', e.tags).forEach((imetaTag) => {
          const imeta = mapImetaTag(imetaTag)
          if (imeta.url) {
            url = imeta.url
          }
        })
      } else {
        url = tEvent.url ?? getTagValue('src', e.tags)!
      }

      return set(
        ({ session }) => ({
          session: {
            ...session,
            event: e,
            title: tEvent.title,
            summary: tEvent.summary,
            url: primaryVariant?.candidates[0]?.url ?? url,
            identification: e.dTag,
            image: primaryVariant?.posterUrls[0] ?? tEvent.image,
            assets,
          },
        }),
        false,
        'SetVideo',
      )
    },
  }
}
