import NDK from '@nostr-dev-kit/ndk'
import { NDKEvent } from '@nostr-dev-kit/ndk-hooks'
import type { HashedEvent, OwnedEvent } from '@/helper/nostrEvents'
import { getTag } from '@/helper/nostrTags'
import { logger, powManager } from './pow-manager'

export interface MakeEventParams {
  event: OwnedEvent
  difficulty?: number
  ndk: NDK
}

export async function makeEvent({ ndk, event, difficulty }: MakeEventParams): Promise<NDKEvent> {
  const normalizedTags = event.tags.filter(([name]) => name !== 'client' && name !== 'nonce').map((tag) => [...tag])

  const baseEvent: OwnedEvent = {
    ...event,
    tags: [
      ...normalizedTags,
      [
        'client',
        import.meta.env.VITE_APP_NAME || 'NostrTube',
        '31990:acbf4bb4141163d7fa034b8d4fdcd5bd002916122739150fa1456511c1b4ff76',
      ],
    ],
  }

  let finalEvent: OwnedEvent = baseEvent

  if (difficulty && difficulty > 0) {
    try {
      logger.debug('Starting POW calculation', { difficulty })
      finalEvent = await powManager.calculate(baseEvent, difficulty)
      logger.info('POW generated', { difficulty })
    } catch (error) {
      logger.error('POW failed', error)
      throw error
    }
  }

  const evt = new NDKEvent(ndk, finalEvent)
  await evt.sign()
  return evt
}

export const getPow = (event: HashedEvent): number => {
  const tag = getTag(event.tags, 'nonce')
  if (!tag) return 0

  const targetDifficulty = parseInt(tag[2])
  if (isNaN(targetDifficulty)) return 0

  let count = 0
  for (let i = 0; i < event.id.length; i += 2) {
    const byte = parseInt(event.id.slice(i, i + 2), 16)
    if (byte === 0) count += 8
    else {
      count += Math.clz32(byte) - 24
      break
    }
  }

  return count >= targetDifficulty ? targetDifficulty : 0
}
