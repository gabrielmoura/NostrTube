import NDK__default from '@nostr-dev-kit/ndk'
import { notFound } from '@tanstack/react-router'
import { nip19 } from 'nostr-tools'
import { InvalidIdError, MissingFieldError } from '@/errors'
import { fetchVideoEventByReference } from '@/features/nostr/services/ndk-query.service'

const VIDEO_LOOKUP_TIMEOUT_MS = 12_000

export type GeVideoByEventIdDataParams = {
  ndk: NDK__default
  eventId: string
}

async function withVideoLookupTimeout<T>(promise: Promise<T>): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => {
      globalThis.setTimeout(() => resolve(null), VIDEO_LOOKUP_TIMEOUT_MS)
    }),
  ])
}

export async function geVideoByEventIdData({ ndk, eventId }: GeVideoByEventIdDataParams) {
  if (!eventId) throw new MissingFieldError('No ID provided', 'eventId')
  if (eventId.length <= 5) throw new InvalidIdError('ID invalid', { eventId })

  let event = await withVideoLookupTimeout(fetchVideoEventByReference(ndk, eventId, { mode: 'cache-first' }))

  if (!event && eventId.startsWith('n')) {
    try {
      const { type, data } = nip19.decode(eventId)
      const hexId = type === 'nevent' ? (data as nip19.EventPointer).id : type === 'note' ? (data as string) : null
      if (hexId) event = await withVideoLookupTimeout(fetchVideoEventByReference(ndk, hexId, { mode: 'cache-first' }))
    } catch {
      /* fallback failed */
    }
  }

  if (!event) throw notFound()
  return event
}
