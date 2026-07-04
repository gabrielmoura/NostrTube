import NDK, { NDKEvent, type NDKFilter } from '@nostr-dev-kit/ndk'
import { NDKSubscriptionCacheUsage } from '@nostr-dev-kit/ndk-hooks'
import { nip19 } from 'nostr-tools'
import { nostrNow } from '@/helper/date'

const DVM_NPUB = 'npub1q8cv87l47fql2xer2uyw509y5n5s9f53h76hvf9377efdptmsvusxf3n8s'

export interface DvmThumbnailResult {
  thumbnails: string[]
  dim?: string
  duration?: string
}

function getDvmPubkey() {
  const decoded = nip19.decode(DVM_NPUB)
  if (decoded.type !== 'npub') {
    throw new Error('Invalid DVM public key')
  }
  return decoded.data as string
}

async function encryptPayload(pubkey: string, payload: object): Promise<string> {
  const plaintext = JSON.stringify(payload)

  if (typeof window !== 'undefined' && window.nostr?.nip04?.encrypt) {
    return window.nostr.nip04.encrypt(pubkey, plaintext)
  }

  throw new Error('NIP-04 encryption is not available in this session')
}

export async function requestDvmThumbnails({
  ndk,
  videoUrl,
  requesterPubkey,
}: {
  ndk: NDK
  videoUrl: string
  requesterPubkey: string
}): Promise<DvmThumbnailResult | null> {
  const dvmPubkey = getDvmPubkey()
  const encryptedContent = await encryptPayload(dvmPubkey, {
    url: videoUrl,
    output: 'image/jpeg',
    count: 3,
  })

  const requestEvent = new NDKEvent(ndk, {
    kind: 5204,
    pubkey: requesterPubkey,
    created_at: nostrNow(),
    content: encryptedContent,
    tags: [
      ['p', dvmPubkey],
      ['alt', 'Thumbnail generation request'],
      ['format', 'image/jpeg'],
      ['count', '3'],
      ['r', videoUrl],
    ],
  })

  await requestEvent.sign()
  await requestEvent.publish()

  const filters: NDKFilter[] = [
    {
      kinds: [6204 as never],
      '#e': [requestEvent.id],
      authors: [dvmPubkey],
      limit: 1,
    },
  ]

  const response = await ndk.fetchEvent(filters, {
    cacheUsage: NDKSubscriptionCacheUsage.PARALLEL,
    closeOnEose: true,
  })

  if (!response) {
    return null
  }

  return {
    thumbnails: response.tags
      .filter((tag) => tag[0] === 'thumb')
      .map((tag) => tag[1])
      .filter(Boolean),
    dim: response.tags.find((tag) => tag[0] === 'dim')?.[1],
    duration: response.tags.find((tag) => tag[0] === 'duration')?.[1],
  }
}
