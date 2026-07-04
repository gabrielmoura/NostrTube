import { createSHA256 } from 'hash-wasm'
import { bytesToHex } from '@/helper/hex'
import type { HashedEvent } from '@/helper/nostrEvents'

interface PowWorkerRequest {
  type: 'start'
  event: Partial<HashedEvent>
  difficulty: number
}

type PowWorkerResponse =
  | { type: 'progress'; attempts: number }
  | { type: 'done'; event: Partial<HashedEvent>; attempts: number }
  | { type: 'error'; error: string }

function getPow(id: Uint8Array): number {
  let count = 0

  for (let index = 0; index < 32; index += 1) {
    const byte = id[index]
    if (byte === 0) {
      count += 8
      continue
    }

    count += Math.clz32(byte) - 24
    break
  }

  return count
}

self.addEventListener('message', async (message: MessageEvent<PowWorkerRequest>) => {
  if (message.data.type !== 'start') return

  const event = structuredClone(message.data.event)
  const difficulty = message.data.difficulty

  try {
    if (!event.tags) event.tags = []

    const nonceTag = ['nonce', '0', String(difficulty)]
    event.tags = event.tags.filter((tag) => tag[0] !== 'nonce')
    event.tags.push(nonceTag)

    const hasher = await createSHA256()
    const serializedBase = [0, event.pubkey, event.created_at, event.kind, event.tags, event.content]
    let attempts = 0

    while (true) {
      nonceTag[1] = String(attempts)

      hasher.init()
      hasher.update(JSON.stringify(serializedBase))

      const id = hasher.digest('binary')

      if (getPow(id) >= difficulty) {
        event.id = bytesToHex(id)
        const response: PowWorkerResponse = { type: 'done', event, attempts }
        self.postMessage(response)
        return
      }

      attempts += 1

      if (attempts % 5_000 === 0) {
        const response: PowWorkerResponse = { type: 'progress', attempts }
        self.postMessage(response)
      }
    }
  } catch (error) {
    const response: PowWorkerResponse = {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown POW worker failure',
    }
    self.postMessage(response)
  }
})
