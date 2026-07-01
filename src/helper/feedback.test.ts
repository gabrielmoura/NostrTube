import { describe, expect, it } from 'vitest'
import { getFeedbackRecipientConfig, parseFeedbackRecipientPubkey } from '@/helper/feedback.ts'

describe('feedback config', () => {
  it('parses a hex pubkey recipient', () => {
    const pubkey = '17717ad4d20e2a425cda0a2195624a0a4a73c4f6975f16b1593fc87fa46f2d58'
    expect(parseFeedbackRecipientPubkey(pubkey)).toEqual({
      lookup: pubkey,
      pubkey,
    })
  })

  it('prefers explicit developer pubkey over npub', () => {
    const pubkey = '17717ad4d20e2a425cda0a2195624a0a4a73c4f6975f16b1593fc87fa46f2d58'
    const config = getFeedbackRecipientConfig(pubkey, 'npub1invalidfallback')
    expect(config.lookup).toBe(pubkey)
    expect(config.pubkey).toBe(pubkey)
    expect(config.npub).toBeUndefined()
  })
})
