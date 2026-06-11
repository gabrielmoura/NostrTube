import type NDK from "@nostr-dev-kit/ndk";
import { launchLightningInvoice, startZap } from "@/features/zap/services/zap.service";

interface FeedbackZapParams {
  ndk: NDK;
  recipientPubkey: string;
  amountSats: number;
  comment: string;
}

export interface FeedbackZapOutcome {
  status: "paid" | "invoice-ready";
  invoice: string;
}

export async function startFeedbackZap(params: FeedbackZapParams): Promise<FeedbackZapOutcome> {
  return startZap({
    ndk: params.ndk,
    target: {
      type: "user",
      pubkey: params.recipientPubkey
    },
    amountSats: params.amountSats,
    comment: params.comment
  });
}
