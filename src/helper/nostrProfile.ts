import type { NDKEvent } from '@nostr-dev-kit/ndk'

export function getNip01PictureFromMetadataEvent(event: NDKEvent | null | undefined) {
  if (!event?.content) return undefined

  try {
    const metadata = JSON.parse(event.content) as { picture?: unknown }
    return typeof metadata.picture === 'string' && metadata.picture.trim() ? metadata.picture : undefined
  } catch {
    return undefined
  }
}
