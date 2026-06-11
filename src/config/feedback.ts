import { nip19 } from "nostr-tools";
import { DEFAULT_FEEDBACK_RECIPIENT_NPUB } from "@/config/feedback.constants";

export interface FeedbackRecipientConfig {
  npub: string;
  pubkey: string;
}

export function parseFeedbackRecipientNpub(npub: string): FeedbackRecipientConfig {
  try {
    const decoded = nip19.decode(npub.trim());

    if (decoded.type !== "npub" || typeof decoded.data !== "string" || decoded.data.length !== 64) {
      throw new Error("Feedback recipient must be a valid npub.");
    }

    return {
      npub: npub.trim(),
      pubkey: decoded.data
    };
  } catch (error) {
    throw new Error("Invalid feedback recipient npub.", { cause: error });
  }
}

export function getFeedbackRecipientConfig(rawValue = import.meta.env.VITE_NOSTR_FEEDBACK_RECIPIENT_NPUB): FeedbackRecipientConfig {
  const npub = rawValue?.trim() || DEFAULT_FEEDBACK_RECIPIENT_NPUB;
  return parseFeedbackRecipientNpub(npub);
}
