import type NDK from "@nostr-dev-kit/ndk";
import type { NDKEvent } from "@nostr-dev-kit/ndk";

export type ZapTarget =
  | {
    type: "user";
    pubkey: string;
  }
  | {
    type: "event";
    event: NDKEvent;
  };

export interface StartZapParams {
  ndk: NDK;
  target: ZapTarget;
  amountSats: number;
  comment?: string;
}

export interface ZapOutcome {
  status: "paid" | "invoice-ready";
  invoice: string;
}

export type ZapErrorCode =
  | "unauthenticated"
  | "invalid-amount"
  | "recipient-metadata-failed"
  | "zap-unavailable"
  | "zap-invoice-failed"
  | "zap-payment-cancelled"
  | "zap-payment-failed";

export class ZapFlowError extends Error {
  code: ZapErrorCode;

  constructor(code: ZapErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ZapFlowError";
    this.code = code;
  }
}

export interface ZapFormValues {
  amount: string;
  comment: string;
}
