import type { NDKKind } from '@nostr-dev-kit/ndk'
import { NDKEvent, useNDK, useNDKCurrentPubkey } from '@nostr-dev-kit/ndk-hooks'
import { useCallback, useEffect } from 'react'
import { nostrNow } from '@/helper/date.ts'
import { getTagValue } from '@/helper/nostrTags'
import { makeEvent } from '@/helper/pow/pow.ts'
import { NostrKind } from '@/helper/type.ts'

interface CountViewProps {
  eventIdentifier: string
}

export default function CountView({ eventIdentifier }: CountViewProps) {
  const { ndk } = useNDK()
  const currentPubkey = useNDKCurrentPubkey()

  const handleView = useCallback(async () => {
    if (!ndk || !currentPubkey) return
    let viewEvent: NDKEvent | null = await ndk.fetchEvent({
      authors: [currentPubkey],
      kinds: [NostrKind.VideoViewer as unknown as NDKKind],
      '#a': [eventIdentifier],
    })
    if (!viewEvent) {
      viewEvent = await makeEvent({
        ndk,
        event: {
          content: '',
          kind: NostrKind.VideoViewer as unknown as NDKKind,
          tags: [
            ['a', eventIdentifier],
            ['d', eventIdentifier],
            ['viewed', '0'],
          ],
          created_at: nostrNow(),
          pubkey: currentPubkey,
        },
        difficulty: 0,
      })
    } else {
      const viewed = getTagValue('viewed', viewEvent.tags)
      let n = 0
      if (typeof viewed === 'string') {
        n = parseInt(viewed)
      }
      const newValue = n + 1

      viewEvent = await makeEvent({
        ndk,
        event: {
          content: '',
          kind: NostrKind.VideoViewer as unknown as NDKKind,
          tags: [
            ['a', eventIdentifier],
            ['d', eventIdentifier],
            ['viewed', newValue.toString()],
          ],
          created_at: nostrNow(),
          pubkey: currentPubkey,
        },
        difficulty: 0,
      })
    }
    await viewEvent.publish()
  }, [currentPubkey, eventIdentifier, ndk])

  useEffect(() => {
    handleView().catch(console.error)
  }, [handleView])
  return ''
}
