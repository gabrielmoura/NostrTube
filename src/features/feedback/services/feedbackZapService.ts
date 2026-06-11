import NDK, { NDKZapper, type NDKPaymentConfirmationLN } from "@nostr-dev-kit/ndk";
import { t } from "i18next";
import { FeedbackFlowError } from "@/features/feedback/types/feedback";
import { resolveMessageRecipient } from "@/lib/ndk-messages";

interface FeedbackZapParams {
  ndk: NDK;
  recipientNpub: string;
  recipientPubkey: string;
  amountSats: number;
  comment: string;
}

interface WebLNProvider {
  enable: () => Promise<void>;
  sendPayment: (invoice: string) => Promise<unknown>;
}

declare global {
  interface Window {
    webln?: WebLNProvider;
  }
}

export interface FeedbackZapOutcome {
  status: "paid" | "invoice-ready";
  invoice: string;
}

class FeedbackZapInvoiceReadyError extends Error {
  invoice: string;

  constructor(invoice: string) {
    super("Lightning invoice generated but payment still pending.");
    this.name = "FeedbackZapInvoiceReadyError";
    this.invoice = invoice;
  }
}

export async function launchLightningInvoice(invoice: string) {
  if (typeof window === "undefined") return;
  window.open(`lightning:${invoice}`, "_blank", "noopener,noreferrer");
}

export async function startFeedbackZap(params: FeedbackZapParams): Promise<FeedbackZapOutcome> {
  const recipient = await resolveMessageRecipient(params.ndk, params.recipientNpub, params.recipientPubkey).catch((error) => {
    throw new FeedbackFlowError("recipient-metadata-failed", "Could not resolve recipient metadata for ZAP.", { cause: error });
  });

  const captured = { invoice: "" };
  const zapper = new NDKZapper(recipient, params.amountSats * 1000, "msat", {
    comment: params.comment,
    ndk: params.ndk,
    lnPay: async ({ pr }): Promise<NDKPaymentConfirmationLN | undefined> => {
      captured.invoice = pr;

      if (typeof window !== "undefined" && window.webln) {
        try {
          await window.webln.enable();
          const result = await window.webln.sendPayment(pr) as { preimage?: string } | undefined;
          return { preimage: result?.preimage || t("feedback.success.webln_preimage_fallback") };
        } catch (error) {
          throw new FeedbackFlowError("zap-payment-failed", "The Lightning payment was cancelled or failed.", { cause: error });
        }
      }

      await launchLightningInvoice(pr);
      throw new FeedbackZapInvoiceReadyError(pr);
    }
  });

  zapper.on("ln_invoice", ({ pr }) => {
    captured.invoice = pr;
  });

  try {
    await zapper.zap(["nip57"]);

    if (!captured.invoice) {
      throw new FeedbackFlowError("zap-invoice-failed", "Lightning invoice missing from ZAP flow.");
    }

    return {
      status: "paid",
      invoice: captured.invoice
    };
  } catch (error) {
    if (error instanceof FeedbackZapInvoiceReadyError) {
      return {
        status: "invoice-ready",
        invoice: error.invoice
      };
    }

    const message = error instanceof Error ? error.message.toLowerCase() : "";

    if (message.includes("no zap method") || message.includes("no zap endpoint") || message.includes("no zap spec")) {
      throw new FeedbackFlowError("zap-unavailable", "This recipient does not have a valid Lightning address for ZAP.", { cause: error instanceof Error ? error : undefined });
    }

    if (message.includes("invoice") || message.includes("lnurl") || message.includes("payment request")) {
      throw new FeedbackFlowError("zap-invoice-failed", "Could not generate the Lightning invoice.", { cause: error instanceof Error ? error : undefined });
    }

    if (error instanceof FeedbackFlowError) throw error;

    throw new FeedbackFlowError("zap-payment-failed", "The Lightning payment was cancelled or failed.", { cause: error instanceof Error ? error : undefined });
  }
}
