import { nip19 } from 'nostr-tools'
import { DEFAULT_FEEDBACK_RECIPIENT_NPUB } from '@/config/feedback.const.ts'

export interface FeedbackRecipientConfig {
  lookup: string
  npub?: string
  pubkey: string
}

export function parseFeedbackRecipientPubkey(pubkey: string): FeedbackRecipientConfig {
  const normalizedPubkey = pubkey.trim().toLowerCase()

  if (!/^[a-f0-9]{64}$/.test(normalizedPubkey)) {
    throw new Error('Feedback recipient pubkey must be a valid hex pubkey.')
  }

  return {
    lookup: normalizedPubkey,
    pubkey: normalizedPubkey,
  }
}

export function parseFeedbackRecipientNpub(npub: string): FeedbackRecipientConfig {
  try {
    const decoded = nip19.decode(npub.trim())

    if (decoded.type !== 'npub' || typeof decoded.data !== 'string' || decoded.data.length !== 64) {
      throw new Error('Feedback recipient must be a valid npub.')
    }

    return {
      lookup: npub.trim(),
      npub: npub.trim(),
      pubkey: decoded.data,
    }
  } catch (error) {
    throw new Error('Invalid feedback recipient npub.', { cause: error })
  }
}

export function getFeedbackRecipientConfig(
  rawPubkey = import.meta.env.VITE_NOSTR_DEVELOPER_PUBKEY,
  rawNpub = import.meta.env.VITE_NOSTR_FEEDBACK_RECIPIENT_NPUB,
): FeedbackRecipientConfig {
  if (rawPubkey?.trim()) {
    return parseFeedbackRecipientPubkey(rawPubkey)
  }

  const npub = rawNpub?.trim() || DEFAULT_FEEDBACK_RECIPIENT_NPUB
  return parseFeedbackRecipientNpub(npub)
}
